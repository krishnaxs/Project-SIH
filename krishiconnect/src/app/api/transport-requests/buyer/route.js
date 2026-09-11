import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import TransportRequest from "@/models/TransportRequest";

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

    if (decoded.role !== "buyer") {
        return NextResponse.json(
            { message: "Access denied. Buyer role required." },
            { status: 403 }
        );
    }

    const requests = await TransportRequest.find({
      requester: decoded.id,
      requesterRole: "buyer",
    })
      .populate(
        "vehicle",
        "vehicleType vehicleNumber capacity capacityUnit ratePerKm owner"
      )
      .populate("cropRequest")
      .sort({ createdAt: -1 });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Buyer transport requests error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch transport requests.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}