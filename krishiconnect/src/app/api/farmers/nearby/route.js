import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { calculateDistance } from "@/lib/distance";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    let userLat = parseFloat(searchParams.get("lat"));
    let userLng = parseFloat(searchParams.get("lng"));
    let currentUserId = null;

    // Check auth header if available to identify user or fallback to saved profile location
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;

        if (
          (!Number.isFinite(userLat) || !Number.isFinite(userLng)) &&
          currentUserId
        ) {
          const dbUser = await User.findById(currentUserId).select("location role");
          if (
            dbUser?.location?.latitude != null &&
            dbUser?.location?.longitude != null
          ) {
            userLat = dbUser.location.latitude;
            userLng = dbUser.location.longitude;
          }
        }
      } catch (tokenErr) {
        // Token verification failed or expired; proceed if coordinates were passed in query
      }
    }

    if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
      return NextResponse.json({
        count: 0,
        message: "Valid coordinates required to calculate distance.",
      });
    }

    // Find all farmers who have valid coordinates
    const query = {
      role: "farmer",
      "location.latitude": { $exists: true, $ne: null },
      "location.longitude": { $exists: true, $ne: null },
    };

    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    const farmers = await User.find(query).select("name location role");

    // Filter by distance < 10 km
    const MAX_DISTANCE_KM = 10;
    const nearbyFarmers = farmers.filter((farmer) => {
      const fLat = farmer.location?.latitude;
      const fLng = farmer.location?.longitude;
      if (!Number.isFinite(fLat) || !Number.isFinite(fLng)) return false;

      const dist = calculateDistance(userLat, userLng, fLat, fLng);
      return dist < MAX_DISTANCE_KM;
    });

    return NextResponse.json({
      count: nearbyFarmers.length,
      distanceLimitKm: MAX_DISTANCE_KM,
    });
  } catch (error) {
    console.error("Nearby farmers error:", error);
    return NextResponse.json(
      { message: "Failed to fetch nearby farmers.", error: error.message, count: 0 },
      { status: 500 }
    );
  }
}

