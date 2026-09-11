import { NextResponse } from "next/server";
import forecastsData from "@/data/forecasts.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startYear = parseInt(searchParams.get("year"), 10);
    const startMonth = parseInt(searchParams.get("month"), 10);
    const numMonths = parseInt(searchParams.get("months"), 10);

    if (!startYear || !startMonth || !numMonths) {
      return NextResponse.json(
        { error: "Year, month and number of months are required" },
        { status: 400 }
      );
    }

    // 1. Instant assembly from embedded precomputed dataset (0ms latency)
    const results = [];
    let currentYear = startYear;
    let currentMonth = startMonth;

    for (let i = 0; i < numMonths; i++) {
      const key = `${currentYear}-${currentMonth}`;
      if (forecastsData?.monthly && forecastsData.monthly[key]) {
        results.push(forecastsData.monthly[key]);
      }

      currentMonth += 1;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear += 1;
      }
    }

    if (results.length > 0) {
      return NextResponse.json(results);
    }

    // 2. Fallback to live microservice if configured
    const rawUrl = process.env.AI_SERVICE_URL;
    if (rawUrl) {
      const AI_BASE_URL = rawUrl.replace(/\/+$/, "");
      try {
        const response = await fetch(
          `${AI_BASE_URL}/forecast/months?year=${startYear}&month=${startMonth}&months=${numMonths}`
        );
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fallback failed, continue to 404
      }
    }

    return NextResponse.json(
      { error: "No forecast data available for selected period." },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to get multiple month forecast" },
      { status: 500 }
    );
  }
}
