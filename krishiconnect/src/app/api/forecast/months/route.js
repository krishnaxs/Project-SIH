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

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // 1. Assemble range with precomputed data and seamless extrapolation for distant years
    const results = [];
    let currentYear = startYear;
    let currentMonth = startMonth;

    for (let i = 0; i < numMonths; i++) {
      const key = `${currentYear}-${currentMonth}`;
      if (forecastsData?.monthly && forecastsData.monthly[key]) {
        results.push(forecastsData.monthly[key]);
      } else {
        // Extrapolate using seasonal baseline
        const baseline = forecastsData?.monthly?.[`2030-${currentMonth}`] || forecastsData?.monthly?.[`2026-${currentMonth}`];
        if (baseline) {
          const factor = Math.pow(1.03, Math.max(currentYear - 2030, 0));
          results.push({
            month: monthNames[currentMonth - 1],
            year: currentYear,
            month_number: currentMonth,
            average_price: Math.round(baseline.average_price * factor * 100) / 100,
            average_arrivals: baseline.average_arrivals,
            average_demand: baseline.average_demand,
            confidence: "Very Low"
          });
        }
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
