import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongodb";
import TransportRequest from "@/models/TransportRequest";
import Vehicle from "@/models/Vehicle";

function auth(request) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("AUTH_REQUIRED");
  return jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
}

export async function POST(request, { params }) {
  try {
    await connectDB();
    const decoded = auth(request);

    if (decoded.role !== "logistics") {
      return NextResponse.json({ message: "Access denied. Logistics role required." }, { status: 403 });
    }

    const { id } = await params;
    const transportRequest = await TransportRequest.findById(id);
    if (!transportRequest) {
      return NextResponse.json({ message: "Transport request not found." }, { status: 404 });
    }

    const vehicle = await Vehicle.findById(transportRequest.vehicle);
    if (!vehicle || vehicle.owner.toString() !== decoded.id) {
      return NextResponse.json({ message: "You are not authorized to manage this request." }, { status: 403 });
    }

    const pickup = transportRequest.pickupLocation;
    const delivery = transportRequest.deliveryLocation;
    if ([pickup?.latitude, pickup?.longitude, delivery?.latitude, delivery?.longitude].some((v) => typeof v !== "number")) {
      return NextResponse.json({ message: "Pickup and delivery coordinates are required." }, { status: 400 });
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickup.longitude},${pickup.latitude};${delivery.longitude},${delivery.latitude}?overview=full&geometries=geojson&steps=true`;
    const osrmResponse = await fetch(osrmUrl, { headers: { Accept: "application/json" } });
    if (!osrmResponse.ok) throw new Error("OSRM route service failed");

    const osrm = await osrmResponse.json();
    const route = osrm.routes?.[0];
    if (!route) throw new Error("No road route found");

    const distanceKm = Number((route.distance / 1000).toFixed(2));
    const durationMinutes = Math.ceil(route.duration / 60);
    let optimizationReason = "OSRM selected the fastest available driving route.";

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are optimizing a farm-to-market transport trip.\n\nRoad routing service result:\n- Distance: ${distanceKm} km\n- ETA: ${durationMinutes} minutes\n- Vehicle: ${vehicle.vehicleType}, capacity ${vehicle.capacity} ${vehicle.capacityUnit}\n- Pickup: ${pickup.address || `${pickup.latitude}, ${pickup.longitude}`}\n- Delivery: ${delivery.address || `${delivery.latitude}, ${delivery.longitude}`}\n\nReturn ONLY JSON with keys: recommendation, priority. Do not invent roads or coordinates. Recommend practical actions such as avoiding unnecessary detours, leaving enough capacity, or planning for traffic/weather. Keep recommendation under 180 characters. priority must be one of low, medium, high.`;
        const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        });

        if (geminiResponse.ok) {
          const gemini = await geminiResponse.json();
          const text = gemini.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.recommendation) optimizationReason = parsed.recommendation;
          }
        }
      } catch (geminiError) {
        console.warn("Gemini optimization skipped:", geminiError.message);
      }
    }

    transportRequest.route = {
      coordinates: route.geometry.coordinates,
      distance: distanceKm,
      duration: durationMinutes,
      optimizationReason,
      generatedAt: new Date(),
    };
    await transportRequest.save();

    return NextResponse.json({
      message: "Route optimized successfully.",
      route: transportRequest.route,
    });
  } catch (error) {
    console.error("Route optimization error:", error);
    const status = error.message === "AUTH_REQUIRED" ? 401 : 500;
    return NextResponse.json({ message: status === 401 ? "Authentication required." : "Failed to optimize route.", error: error.message }, { status });
  }
}
