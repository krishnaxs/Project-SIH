import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required." },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates provided." },
        { status: 400 }
      );
    }

    // Call OpenStreetMap Nominatim with timeout and descriptive User-Agent
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "KrishiConnect-App/1.0 (krishiconnect@example.com)",
        "Accept-Language": "en",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Nominatim responded with status ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    // Build a clean, readable Indian / Global address
    const parts = [
      addr.suburb || addr.neighbourhood || addr.road,
      addr.city || addr.town || addr.village || addr.county,
      addr.state_district,
      addr.state,
      addr.postcode,
      addr.country,
    ].filter(Boolean);

    // Remove duplicates while preserving order
    const cleanParts = parts.filter((item, index) => parts.indexOf(item) === index);
    const formattedAddress = cleanParts.length > 0 ? cleanParts.join(", ") : data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    return NextResponse.json({
      address: formattedAddress,
      city: addr.city || addr.town || addr.village || "",
      state: addr.state || "",
      postcode: addr.postcode || "",
      country: addr.country || "",
      latitude,
      longitude,
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    // Graceful fallback to formatted coordinate representation
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || 0);
    const lng = parseFloat(searchParams.get("lng") || 0);

    return NextResponse.json({
      address: `Near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
      latitude: lat,
      longitude: lng,
      fallback: true,
    });
  }
}
