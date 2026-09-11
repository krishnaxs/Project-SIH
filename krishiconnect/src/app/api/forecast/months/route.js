import { NextResponse } from "next/server";

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

    const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

    const response = await fetch(
      `${AI_BASE_URL}/forecast/months?year=${year}&month=${month}&months=${months}`
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        data,
        {
          status: response.status
        }
      );
    }

    monthsCache.set(cacheKey, data);
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to get multiple month forecast"
      },
      {
        status: 500
      }
    );
  }
}