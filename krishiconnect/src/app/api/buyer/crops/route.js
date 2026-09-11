import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Crop from "@/models/Crop";
import { calculateDistance } from "@/lib/distance";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const buyerLat = Number(searchParams.get("lat"));
    const buyerLng = Number(searchParams.get("lng"));

    if (
      !Number.isFinite(buyerLat) ||
      !Number.isFinite(buyerLng)
    ) {
      return NextResponse.json(
        {
          message: "Valid buyer latitude and longitude are required.",
        },
        { status: 400 }
      );
    }

    const crops = await Crop.find()
      .populate("farmer", "name phone location")
      .sort({ createdAt: -1 });

    const cropsWithDistance = crops
      .map((crop) => {
        const farmerLat = crop.farmer?.location?.latitude;
        const farmerLng = crop.farmer?.location?.longitude;

        let distance = null;

        if (
          Number.isFinite(farmerLat) &&
          Number.isFinite(farmerLng)
        ) {
          distance = calculateDistance(
            buyerLat,
            buyerLng,
            farmerLat,
            farmerLng
          );
        }

        return {
          ...crop.toObject(),
          distance,
        };
      })
      .sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;

        return a.distance - b.distance;
      });

    return NextResponse.json(cropsWithDistance);
  } catch (error) {
    console.error("Buyer crop API error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch nearby crops.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}