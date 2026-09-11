import { NextResponse } from "next/server";

export const maxDuration = 60;

const monthsCache = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const months = searchParams.get("months");

    if (!year || !month || !months) {
      return NextResponse.json(
        {
          error: "Year, month and number of months are required"
        },
        {
          status: 400
        }
      );
    }

    const cacheKey = `${year}-${month}-${months}`;
    if (monthsCache.has(cacheKey)) {
      return NextResponse.json(monthsCache.get(cacheKey));
    }

    const rawUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    const AI_BASE_URL = rawUrl.replace(/\/+$/, "");

    const response = await fetch(
      `${AI_BASE_URL}/forecast/months?year=${year}&month=${month}&months=${months}`
    );

    let data;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        { error: `AI service returned status ${response.status} (non-JSON response)` },
        { status: response.status || 502 }
      );
    }

    if (!response.ok) {
      const errorMessage =
        typeof data?.detail === "string"
          ? data.detail
          : Array.isArray(data?.detail)
          ? data.detail.map((d) => d.msg).join(", ")
          : data?.error || data?.message || `AI service error (${response.status})`;

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    monthsCache.set(cacheKey, data);
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Unable to get multiple month forecast"
      },
      {
        status: 500
      }
    );
  }
}