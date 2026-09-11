import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import TransportRequest from "@/models/TransportRequest";
import Vehicle from "@/models/Vehicle";

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    if (decoded.role !== "logistics") return NextResponse.json({ message: "Access denied." }, { status: 403 });

    const { id } = await params;
    const { latitude, longitude } = await request.json();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ message: "Invalid coordinates." }, { status: 400 });
    }

    const transportRequest = await TransportRequest.findById(id);
    if (!transportRequest) return NextResponse.json({ message: "Transport request not found." }, { status: 404 });
    if (transportRequest.status !== "in_transit") return NextResponse.json({ message: "Transport is not in transit." }, { status: 400 });

    const vehicle = await Vehicle.findById(transportRequest.vehicle);
    if (!vehicle || vehicle.owner.toString() !== decoded.id) return NextResponse.json({ message: "You are not authorized." }, { status: 403 });

    transportRequest.liveLocation = { latitude, longitude, updatedAt: new Date() };
    await transportRequest.save();

    return NextResponse.json({ message: "Live location updated.", liveLocation: transportRequest.liveLocation });
  } catch (error) {
    console.error("Live location error:", error);
    return NextResponse.json({ message: "Failed to update live location." }, { status: 500 });
  }
}
