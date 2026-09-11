import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import TransportRequest from "@/models/TransportRequest";
import CropRequest from "@/models/CropRequest";

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

    if (decoded.role !== "logistics") {
        return NextResponse.json(
            { message: "Access denied. Logistics role required." },
            { status: 403 }
        );
        }

    const requests = await TransportRequest.find()
  .populate({
    path: "vehicle",
    match: { owner: decoded.id },
    select: "vehicleType vehicleNumber capacity capacityUnit ratePerKm",
  })
  .populate("requester", "name phone email role location")
  .populate({
    path: "cropRequest",
    select: "quantityRequested status farmer",
    populate: {
      path: "farmer",
      select: "name phone email location",
    },
  })
  .sort({ createdAt: -1 });

    const ownerRequests = requests.filter(
      (request) => request.vehicle !== null
    );

    // Repair older buyer transport requests that were created before
    // pickup/delivery were derived from the farmer crop and buyer profile.

    for (const transportRequest of ownerRequests) {
  const farmerLocation =
    transportRequest.cropRequest?.farmer?.location;

  const buyerLocation =
    transportRequest.requester?.location;

  if (
    farmerLocation?.latitude == null ||
    farmerLocation?.longitude == null ||
    buyerLocation?.latitude == null ||
    buyerLocation?.longitude == null
  ) {
    continue;
  }

  transportRequest.pickupLocation = {
    latitude: farmerLocation.latitude,
    longitude: farmerLocation.longitude,
    address:
      farmerLocation.address || "Farmer location",
  };

  transportRequest.deliveryLocation = {
    latitude: buyerLocation.latitude,
    longitude: buyerLocation.longitude,
    address:
      buyerLocation.address || "Buyer location",
  };

  await transportRequest.save();
}
    return NextResponse.json(ownerRequests);
  } catch (error) {
    console.error("Logistics requests error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch transport requests.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}