import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";

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

    const vehicles = await Vehicle.find({
      owner: decoded.id,
    }).sort({ createdAt: -1 });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Fetch vehicles error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch vehicles.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}