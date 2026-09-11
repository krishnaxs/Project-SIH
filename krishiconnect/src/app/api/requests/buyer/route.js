import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import CropRequest from "@/models/CropRequest";
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

    const buyer = await User.findById(decoded.id);

    if (!buyer || buyer.role !== "buyer") {
      return NextResponse.json(
        { message: "Only buyers can access these requests." },
        { status: 403 }
      );
    }

    const requests = await CropRequest.find({
      buyer: buyer._id,
    })
      .populate("farmer", "name phone email")
      .populate("crop", "cropName quantity unit price")
      .sort({ createdAt: -1 });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Buyer requests error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch your requests.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}