import { NextResponse } from "next/server";

const monthCache = new Map();

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

    const cacheKey = `${year}-${month}`;
    if (monthCache.has(cacheKey)) {
      return NextResponse.json(monthCache.get(cacheKey));
    }

    const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

    const response = await fetch(
      `${AI_BASE_URL}/forecast/month?year=${year}&month=${month}`
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    monthCache.set(cacheKey, data);
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json(
      { error: "Unable to get monthly forecast" },
      { status: 500 }
    );
  }
}