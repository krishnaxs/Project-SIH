import { NextResponse } from "next/server";
import forecastsData from "@/data/forecasts.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year || !month) {
      return NextResponse.json(
        { error: "Year and month are required" },
        { status: 400 }
      );
    }

    const key = `${year}-${parseInt(month, 10)}`;

    // 1. Instant lookup from embedded precomputed dataset (0ms latency)
    if (forecastsData?.monthly && forecastsData.monthly[key]) {
      return NextResponse.json(forecastsData.monthly[key]);
    }

    // 2. Fallback to live microservice if configured
    const rawUrl = process.env.AI_SERVICE_URL;
    if (rawUrl) {
      const AI_BASE_URL = rawUrl.replace(/\/+$/, "");
      try {
        const response = await fetch(`${AI_BASE_URL}/forecast/month?year=${year}&month=${month}`);
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fallback failed, continue to 404
      }
    }

    return NextResponse.json(
      { error: `No monthly forecast available for ${year}-${month}. Available range is 2025 to 2027.` },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to get monthly forecast" },
      { status: 500 }
    );
  }
}
