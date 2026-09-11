import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Vehicle from "@/models/Vehicle";
import { calculateDistance } from "@/lib/distance";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        {
          message: "Valid latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    const vehicles = await Vehicle.find({
      availability: "available",
    }).populate("owner", "name phone email");

    const vehiclesWithDistance = vehicles
      .map((vehicle) => {
        const vehicleLat = vehicle.location?.latitude;
        const vehicleLng = vehicle.location?.longitude;

        let distance = null;

        if (
          Number.isFinite(vehicleLat) &&
          Number.isFinite(vehicleLng)
        ) {
          distance = calculateDistance(
            lat,
            lng,
            vehicleLat,
            vehicleLng
          );
        }

        return {
          ...vehicle.toObject(),
          distance,
        };
      })
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;

        return a.distance - b.distance;
      });

    return NextResponse.json(vehiclesWithDistance);
  } catch (error) {
    console.error("Nearby vehicles error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch nearby vehicles.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}