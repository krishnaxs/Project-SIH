import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      name,
      email,
      phone,
      password,
      role,
      location,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        {
          message: "Please provide all required fields.",
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailPattern.test(cleanEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Phone validation: +91 prefix and 10 digits starting with 6, 7, 8, 9
    let cleanedPhone = String(phone).trim().replace(/[\s\-()]+/g, "");
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

    // Check whether email or phone already exists
    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { phone: cleanedPhone }],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            "User already exists with this email or phone number.",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanedPhone,
      password: hashedPassword,
      role,
      location,
    });

    // Create JWT
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return NextResponse.json(
      {
        message: "User registered successfully.",
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        message: "Registration failed.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}