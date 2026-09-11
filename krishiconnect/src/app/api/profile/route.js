import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

function getUserIdFromRequest(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location || {},
  };
}

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(userId).select(
      "name email phone role location"
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Get profile error:", error);

    return NextResponse.json(
      { message: "Failed to load profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";

    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: "Name, email and phone are required." },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Phone validation: +91 prefix and 10 digits starting with 6, 7, 8, 9
    let cleanedPhone = phone.replace(/[\s\-()]+/g, "");
    if (!cleanedPhone.startsWith("+91")) {
      cleanedPhone = `+91${cleanedPhone.replace(/^\+?91/, "")}`;
    }

    const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        {
          message:
            "Mobile number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const duplicateUser = await User.findOne({
      $or: [{ email }, { phone: cleanedPhone }],
      _id: { $ne: userId },
    }).select("email phone");

    if (duplicateUser) {
      if (duplicateUser.email === email) {
        return NextResponse.json(
          { message: "This email is already in use." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "This phone number is already in use." },
        { status: 400 }
      );
    }

    const updateData = {
      name,
      email,
      phone: cleanedPhone,
      "location.address": address,
    };

    if (
      body.latitude !== undefined &&
      body.latitude !== null &&
      !isNaN(Number(body.latitude))
    ) {
      updateData["location.latitude"] = Number(body.latitude);
    }

    if (
      body.longitude !== undefined &&
      body.longitude !== null &&
      !isNaN(Number(body.longitude))
    ) {
      updateData["location.longitude"] = Number(body.longitude);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("name email phone role location");

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Email or phone number is already in use." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to update profile." },
      { status: 500 }
    );
  }
}
export async function PATCH(request) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "All password fields are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "New passwords do not match." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: "New password must be different from the current password." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId).select("password");

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return NextResponse.json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return NextResponse.json(
      { message: "Failed to change password." },
      { status: 500 }
    );
  }
}