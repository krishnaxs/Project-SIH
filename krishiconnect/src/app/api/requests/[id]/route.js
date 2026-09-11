import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import CropRequest from "@/models/CropRequest";
import User from "@/models/User";

export async function PATCH(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

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

    const farmer = await User.findById(decoded.id);

    if (!farmer || farmer.role !== "farmer") {
      return NextResponse.json(
        { message: "Only farmers can update requests." },
        { status: 403 }
      );
    }

    const { status } = await request.json();

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid request status." },
        { status: 400 }
      );
    }

    const cropRequest = await CropRequest.findById(id);

    if (!cropRequest) {
      return NextResponse.json(
        { message: "Request not found." },
        { status: 404 }
      );
    }

    if (
      cropRequest.farmer.toString() !==
      farmer._id.toString()
    ) {
      return NextResponse.json(
        { message: "You cannot modify this request." },
        { status: 403 }
      );
    }

    if (cropRequest.status !== "pending") {
      return NextResponse.json(
        {
          message: "This request has already been processed.",
        },
        { status: 400 }
      );
    }

    cropRequest.status = status;

    await cropRequest.save();

    return NextResponse.json({
      message: `Request ${status} successfully.`,
      request: cropRequest,
    });

  } catch (error) {
    console.error("Update request error:", error);

    return NextResponse.json(
      {
        message: "Failed to update request.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}