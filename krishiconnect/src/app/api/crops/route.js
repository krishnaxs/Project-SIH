import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Crop from "@/models/Crop";
import User from "@/models/User";

export async function POST(request) {
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
        { message: "Only farmers can add crops." },
        { status: 403 }
      );
    }

    const {
      cropName,
      quantity,
      unit,
      price,
      description,
    } = await request.json();

    if (!cropName || !quantity || !unit || !price) {
      return NextResponse.json(
        { message: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const farmerLocation = user.location;
    if (
      !farmerLocation ||
      !Number.isFinite(Number(farmerLocation.latitude)) ||
      !Number.isFinite(Number(farmerLocation.longitude)) ||
      !String(farmerLocation.address || "").trim()
    ) {
      return NextResponse.json(
        { message: "Please add your location before registering a crop." },
        { status: 400 }
      );
    }

    const crop = await Crop.create({
      farmer: user._id,
      cropName,
      quantity,
      unit,
      price,
      description: description || "",
      location: {
        ...farmerLocation.toObject?.() || farmerLocation,
        latitude: Number(farmerLocation.latitude),
        longitude: Number(farmerLocation.longitude),
        address: String(farmerLocation.address).trim(),
      },
    });

    return NextResponse.json(
      {
        message: "Crop added successfully.",
        crop,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add crop error:", error);

    return NextResponse.json(
      {
        message: "Failed to add crop.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}