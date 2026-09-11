import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Crop from "@/models/Crop";
import User from "@/models/User";

export async function GET(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user || user.role !== "farmer") {
      return NextResponse.json(
        { message: "Only farmers can access this page." },
        { status: 403 }
      );
    }

    const crops = await Crop.find({
      farmer: user._id,
    }).sort({ createdAt: -1 });

    return NextResponse.json(crops);
  } catch (error) {
    console.error("Fetch my crops error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch crops.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}