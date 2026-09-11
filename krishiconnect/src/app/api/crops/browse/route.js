import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Crop from "@/models/Crop";

export async function GET() {
  try {
    await connectDB();

    const crops = await Crop.find()
      .populate("farmer", "name phone location")
      .sort({ createdAt: -1 });

    return NextResponse.json(crops);
  } catch (error) {
    console.error("Browse crops error:", error);

    return NextResponse.json(
      {
        message: "Failed to fetch crops.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}