import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import CropRequest from "@/models/CropRequest";
import Crop from "@/models/Crop";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();

    // Check authentication
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

    // Find buyer
    const buyer = await User.findById(decoded.id);

    if (!buyer || buyer.role !== "buyer") {
      return NextResponse.json(
        { message: "Only buyers can send crop requests." },
        { status: 403 }
      );
    }

    const {
      cropId,
      quantityRequested,
      message,
    } = await request.json();

    // Validate request
    if (!cropId || !quantityRequested) {
      return NextResponse.json(
        {
          message:
            "Crop and requested quantity are required.",
        },
        { status: 400 }
      );
    }

    // Find crop
    const crop = await Crop.findById(cropId);

    if (!crop) {
      return NextResponse.json(
        { message: "Crop not found." },
        { status: 404 }
      );
    }

    // Don't allow a farmer to be contacted for their own crop
    if (crop.farmer.toString() === buyer._id.toString()) {
      return NextResponse.json(
        {
          message: "You cannot request your own crop.",
        },
        { status: 400 }
      );
    }

    // Make sure requested quantity is available
    if (quantityRequested > crop.quantity) {
      return NextResponse.json(
        {
          message: "Requested quantity exceeds available quantity.",
        },
        { status: 400 }
      );
    }

    // Find farmer
    const farmer = await User.findById(crop.farmer);

    if (!farmer || farmer.role !== "farmer") {
      return NextResponse.json(
        { message: "Farmer not found." },
        { status: 404 }
      );
    }

    const existingRequest = await CropRequest.findOne({
      crop: crop._id,
      buyer: buyer._id,
      status: { $in: ["pending", "accepted"] },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          message: "You already have an active request for this crop.",
        },
        { status: 400 }
      );
    }

    // Create request
    const cropRequest = await CropRequest.create({
      buyer: buyer._id,
      farmer: farmer._id,
      crop: crop._id,
      quantityRequested,
      message: message || "",
    });

    return NextResponse.json(
      {
        message: "Crop request sent successfully.",
        request: cropRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Crop request error:", error);

    return NextResponse.json(
      {
        message: "Failed to send crop request.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}