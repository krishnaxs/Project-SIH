import { NextResponse } from "next/server";
import forecastsData from "@/data/forecasts.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    // 1. Instant lookup from embedded precomputed dataset (0ms latency)
    if (forecastsData?.daily && forecastsData.daily[date]) {
      return NextResponse.json(forecastsData.daily[date]);
    }

    // 2. Fallback to live microservice if configured (for dates outside precomputed range)
    const rawUrl = process.env.AI_SERVICE_URL;
    if (rawUrl) {
      const AI_BASE_URL = rawUrl.replace(/\/+$/, "");
      try {
        const response = await fetch(`${AI_BASE_URL}/forecast?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fallback failed, continue to 404
      }
    }

    return NextResponse.json(
      { error: `No forecast available for date ${date}. Available range is 2025 to 2027.` },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to get forecast" },
      { status: 500 }
    );
  }
}
