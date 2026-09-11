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

    // 2. Extrapolate if outside range (e.g. year > 2030) using matching month-day baseline
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      const yr = parsed.getFullYear();
      const mo = String(parsed.getMonth() + 1).padStart(2, "0");
      const da = String(parsed.getDate()).padStart(2, "0");
      const baselineKey = `2030-${mo}-${da}`;
      const baseline = forecastsData?.daily?.[baselineKey];

      if (baseline) {
        const factor = Math.pow(1.03, Math.max(yr - 2030, 0));
        const lastHistDate = new Date("2025-12-31");
        const daysAhead = Math.max(Math.floor((parsed - lastHistDate) / (1000 * 60 * 60 * 24)), 0);

        return NextResponse.json({
          date: date,
          predicted_price: Math.round(baseline.predicted_price * factor * 100) / 100,
          predicted_arrivals: baseline.predicted_arrivals,
          demand_score: baseline.demand_score,
          days_ahead: daysAhead,
          confidence: "Very Low"
        });
      }
    }

    return NextResponse.json(
      { error: `No forecast available for date ${date}.` },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to get forecast" },
      { status: 500 }
    );
  }
}
