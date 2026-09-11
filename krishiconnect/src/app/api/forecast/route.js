import { NextResponse } from "next/server";

const dailyCache = new Map();

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const date = searchParams.get("date");

        if (!date) {
            return NextResponse.json(
                {
                    error: "Date is required"
                },
                {
                    status: 400
                }
            );
        }

        if (dailyCache.has(date)) {
            return NextResponse.json(dailyCache.get(date));
        }

        const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

        const response = await fetch(
            `${AI_BASE_URL}/forecast?date=${date}`
        );

        if (!response.ok) {
            throw new Error(
                "AI API request failed"
            );
        }

        const data = await response.json();
        dailyCache.set(date, data);

        return NextResponse.json(data);

    } catch (error) {

        return NextResponse.json(
            {
                error: "Unable to get forecast"
            },
            {
                status: 500
            }
        );
    }
}