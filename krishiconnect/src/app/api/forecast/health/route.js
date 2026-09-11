import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET() {
  const rawUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
  const AI_BASE_URL = rawUrl.replace(/\/+$/, "");
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(`${AI_BASE_URL}/`, {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    let data;
    try {
      data = await response.json();
    } catch {
      data = { rawText: await response.text().catch(() => "") };
    }

    return NextResponse.json({
      status: response.ok ? "healthy" : "unhealthy",
      httpStatus: response.status,
      aiBaseUrl: AI_BASE_URL.replace(/:\/\/[^@]+@/, "://***@"),
      latencyMs,
      response: data,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "unreachable",
        error: error.message || "Failed to reach AI service",
        aiBaseUrl: AI_BASE_URL.replace(/:\/\/[^@]+@/, "://***@"),
        latencyMs,
        hint:
          error.name === "AbortError"
            ? "Request timed out after 55s. The AI service on Render may still be spinning up from cold start."
            : "Ensure the Render Web Service is active, the URL is correct, and not blocked.",
      },
      { status: 502 }
    );
  }
}
