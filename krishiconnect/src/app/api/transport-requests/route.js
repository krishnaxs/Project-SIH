import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import TransportRequest from "@/models/TransportRequest";
import CropRequest from "@/models/CropRequest";
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

    const requester = await User.findById(decoded.id);

    if (
      !requester ||
      !["farmer", "buyer"].includes(requester.role)
    ) {
      return NextResponse.json(
        {
          message:
            "Only farmers and buyers can request transport.",
        },
        { status: 403 }
      );
    }

    const {
      vehicleId,
      cropRequestId,
      notes,
    } = await request.json();

    if (!vehicleId || !cropRequestId) {
      return NextResponse.json(
        {
          message: "Vehicle and crop request are required.",
        },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found." },
        { status: 404 }
      );
    }

    if (vehicle.availability !== "available") {
      return NextResponse.json(
        { message: "This vehicle is currently unavailable." },
        { status: 400 }
      );
    }

    const existingRequest = await TransportRequest.findOne({
        vehicle: vehicleId,
        cropRequest: cropRequestId,
        requester: decoded.id,
        status: { $in: ["pending", "accepted", "in_transit"] },
        });

        if (existingRequest) {
        return NextResponse.json(
            {
            message:
                "You already have an active transport request for this vehicle.",
            },
            { status: 400 }
        );
        }

    const cropRequest = await CropRequest.findOne({
      _id: cropRequestId,
      buyer: decoded.id,
    }).populate("crop", "location cropName");

    if (!cropRequest) {
      return NextResponse.json(
        { message: "Crop request not found or unauthorized." },
        { status: 404 }
      );
    }

    if (cropRequest.status !== "accepted") {
      return NextResponse.json(
        {
          message:
            "Transport can only be requested for an accepted crop request.",
        },
        { status: 400 }
      );
    }

    // For a buyer transport request, the actual trip is:
    // Farmer's crop/farm location -> Buyer's current registered location.
    // Do not trust locations supplied by the browser for these two endpoints.
    const farmerLocation = cropRequest.crop?.location;
    const buyerLocation = requester.location;

    if (
      !farmerLocation ||
      typeof farmerLocation.latitude !== "number" ||
      typeof farmerLocation.longitude !== "number"
    ) {
      return NextResponse.json(
        {
          message:
            "Farmer location is missing for this crop. Ask the farmer to update the crop location.",
        },
        { status: 400 }
      );
    }

    if (
      !buyerLocation ||
      typeof buyerLocation.latitude !== "number" ||
      typeof buyerLocation.longitude !== "number"
    ) {
      return NextResponse.json(
        {
          message:
            "Buyer location is missing. Please update your profile/location before requesting transport.",
        },
        { status: 400 }
      );
    }

    const finalPickupLocation = {
      latitude: farmerLocation.latitude,
      longitude: farmerLocation.longitude,
      address: farmerLocation.address || "Farmer / crop location",
    };

    const finalDeliveryLocation = {
      latitude: buyerLocation.latitude,
      longitude: buyerLocation.longitude,
      address: buyerLocation.address || "Buyer delivery location",
    };

    const transportRequest = await TransportRequest.create({
      requester: requester._id,
      requesterRole: requester.role,
      vehicle: vehicle._id,
      cropRequest: cropRequestId || null,
      pickupLocation: finalPickupLocation,
      deliveryLocation: finalDeliveryLocation,
      notes: notes || "",
    });

    return NextResponse.json(
      {
        message: "Transport request sent successfully.",
        request: transportRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transport request error:", error);

    return NextResponse.json(
      {
        message: "Failed to create transport request.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}