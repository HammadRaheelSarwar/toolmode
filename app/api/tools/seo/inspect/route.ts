import { NextResponse, type NextRequest } from "next/server";
import { safeInspectUrl } from "../../../../../lib/seo/url-inspector";

// In-memory rate limiting map: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = (searchParams.get("url") || "").trim();
  return handleInspection(request, targetUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const targetUrl = (body?.url || "").trim();
    return handleInspection(request, targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
}

async function handleInspection(request: NextRequest, targetUrl: string) {
  if (!targetUrl) {
    return NextResponse.json({ error: "Website URL parameter is required." }, { status: 400 });
  }

  // Rate limiting check
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp, 25, 60000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a minute before inspecting more URLs." },
      { status: 429 }
    );
  }

  try {
    const result = await safeInspectUrl(targetUrl);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to inspect target URL.",
      },
      { status: 500 }
    );
  }
}
