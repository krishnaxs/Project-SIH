import { NextResponse } from "next/server";

export const maxDuration = 60;

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

        const rawUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
        const AI_BASE_URL = rawUrl.replace(/\/+$/, "");

        const response = await fetch(
            `${AI_BASE_URL}/forecast?date=${date}`
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

        dailyCache.set(date, data);

        return NextResponse.json(data);

    } catch (error) {
        return NextResponse.json(
            {
                error: error.message || "Unable to get forecast"
            },
            {
                status: 500
            }
        );
    }
}