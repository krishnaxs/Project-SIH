import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
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

    if (!user || user.role !== "logistics") {
      return NextResponse.json(
        { message: "Only logistics providers can add vehicles." },
        { status: 403 }
      );
    }

    const {
      vehicleType,
      vehicleNumber,
      capacity,
      capacityUnit,
      ratePerKm,
      location,
    } = await request.json();

    if (
      !vehicleType ||
      !vehicleNumber ||
      !capacity ||
      !ratePerKm
    ) {
      return NextResponse.json(
        { message: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const existingVehicle = await Vehicle.findOne({
      vehicleNumber: vehicleNumber.toUpperCase(),
    });

    if (existingVehicle) {
      return NextResponse.json(
        { message: "A vehicle with this number already exists." },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.create({
      owner: user._id,
      vehicleType,
      vehicleNumber,
      capacity,
      capacityUnit: capacityUnit || "kg",
      ratePerKm,
      location: location || user.location,
    });

    return NextResponse.json(
      {
        message: "Vehicle listed successfully.",
        vehicle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add vehicle error:", error);

    return NextResponse.json(
      {
        message: "Failed to list vehicle.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}