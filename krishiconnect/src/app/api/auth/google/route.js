import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const body = await request.json();
    const { idToken, role, phone, location } = body;

    if (!idToken) {
      return NextResponse.json(
        { message: "Google ID token is required." },
        { status: 400 }
      );
    }

    // Verify token with Google
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { message: "Invalid or expired Google authentication token." },
        { status: 401 }
      );
    }

    const googleUser = await googleRes.json();
    const email = googleUser.email?.toLowerCase().trim();
    const name = googleUser.name?.trim() || email.split("@")[0];

    if (!email) {
      return NextResponse.json(
        { message: "Google account does not have an email address." },
        { status: 400 }
      );
    }

    await connectDB();

    let user = await User.findOne({ email });

    if (user) {
      // User already exists, log them in directly
      const token = jwt.sign(
        {
          id: user._id.toString(),
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return NextResponse.json({
        message: "Login successful with Google.",
        token,
        isNewUser: false,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
        },
      });
    }

    // If new user, create account
    const userRole = role || "farmer";
    const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
    const userPhone = phone || `+91google_${googleUser.sub?.slice(-8) || Date.now().toString().slice(-8)}`;

    user = await User.create({
      name,
      email,
      phone: userPhone,
      password: randomPassword,
      role: userRole,
      location: location || {},
    });

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json(
      {
        message: "Account created successfully with Google.",
        token,
        isNewUser: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          location: user.location,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Google Auth error:", error);
    return NextResponse.json(
      { message: "Google authentication failed.", error: error.message },
      { status: 500 }
    );
  }
}
