import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import TransportRequest from "@/models/TransportRequest";
import Vehicle from "@/models/Vehicle";

export async function PATCH(request, { params }) {
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

    if (decoded.role !== "logistics") {
      return NextResponse.json(
        { message: "Access denied. Logistics role required." },
        { status: 403 }
      );
    }

    const { status } = await request.json();

    if (!["accepted", "rejected", "in_transit", "delivered"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status." },
        { status: 400 }
      );
    }

    const { id } = await params;

    const transportRequest =
      await TransportRequest.findById(id);

    if (!transportRequest) {
      return NextResponse.json(
        { message: "Transport request not found." },
        { status: 404 }
      );
    }

    const vehicle = await Vehicle.findById(
      transportRequest.vehicle
    );

    if (!vehicle || vehicle.owner.toString() !== decoded.id) {
      return NextResponse.json(
        { message: "You are not authorized to manage this request." },
        { status: 403 }
      );
    }

    const validTransitions = {
      pending: ["accepted", "rejected"],
      accepted: ["in_transit"],
      in_transit: ["delivered"],
      rejected: [],
      delivered: [],
    };

    if (!validTransitions[transportRequest.status]?.includes(status)) {
      return NextResponse.json(
        {
          message: `Cannot change status from ${transportRequest.status} to ${status}.`,
        },
        { status: 400 }
      );
    }

    transportRequest.status = status;

    if (status === "in_transit") {
      vehicle.availability = "busy";

      if (transportRequest.pickupLocation?.latitude != null &&
        transportRequest.pickupLocation?.longitude != null) {
        transportRequest.liveLocation = {
          latitude: transportRequest.pickupLocation.latitude,
          longitude: transportRequest.pickupLocation.longitude,
          updatedAt: new Date(),
        };
      }
    }

    if (status === "delivered") {
      vehicle.availability = "available";
    }

    await Promise.all([transportRequest.save(), vehicle.save()]);

    return NextResponse.json({
      message: `Transport request ${status} successfully.`,
      request: transportRequest,
    });
  } catch (error) {
    console.error("Update transport request error:", error);

    return NextResponse.json(
      {
        message: "Failed to update transport request.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}