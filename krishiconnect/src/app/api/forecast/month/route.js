import { NextResponse } from "next/server";
import forecastsData from "@/data/forecasts.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get("year");
    const monthStr = searchParams.get("month");

    if (!yearStr || !monthStr) {
      return NextResponse.json(
        { error: "Year and month are required" },
        { status: 400 }
      );
    }

    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const key = `${year}-${month}`;

    // 1. Instant lookup from embedded precomputed dataset (0ms latency)
    if (forecastsData?.monthly && forecastsData.monthly[key]) {
      return NextResponse.json(forecastsData.monthly[key]);
    }

    // 2. Extrapolate if beyond 2030 using seasonal model baseline with gentle inflation trend
    if (year > 2030) {
      const baseline = forecastsData?.monthly?.[`2030-${month}`];
      if (baseline) {
        const factor = Math.pow(1.03, year - 2030);
        return NextResponse.json({
          month: baseline.month,
          year: year,
          month_number: month,
          average_price: Math.round(baseline.average_price * factor * 100) / 100,
          average_arrivals: baseline.average_arrivals,
          average_demand: baseline.average_demand,
          confidence: "Very Low"
        });
      }
    }

    // 3. Fallback to live microservice if configured
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
        // Fallback failed
      }
    }

    return NextResponse.json(
      { error: `No monthly forecast available for ${year}-${month}.` },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to get monthly forecast" },
      { status: 500 }
    );
  }
}
