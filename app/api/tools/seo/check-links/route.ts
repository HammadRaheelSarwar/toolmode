import { NextResponse, type NextRequest } from "next/server";
import { safeInspectUrl } from "../../../../../lib/seo/url-inspector";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
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

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp, 10, 60000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a minute before running another link check." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const rawUrls: string[] = Array.isArray(body?.urls) ? body.urls : [];

    // Deduplicate and cap at max 30 links per scan
    const validUrls = Array.from(
      new Set(
        rawUrls
          .map((u) => (typeof u === "string" ? u.trim() : ""))
          .filter((u) => u.startsWith("http://") || u.startsWith("https://"))
      )
    ).slice(0, 30);

    if (validUrls.length === 0) {
      return NextResponse.json({ error: "No valid HTTP or HTTPS URLs provided to check." }, { status: 400 });
    }

    // Process with concurrency limit (5 concurrent fetches)
    const results: Array<{
      url: string;
      statusCode: number;
      statusText: string;
      category: "working" | "redirected" | "client_error" | "server_error" | "timeout" | "inaccessible";
      responseTimeMs: number;
      error?: string;
    }> = [];

    const concurrency = 5;
    for (let i = 0; i < validUrls.length; i += concurrency) {
      const chunk = validUrls.slice(i, i + concurrency);
      const chunkPromises = chunk.map(async (url) => {
        try {
          const res = await safeInspectUrl(url, { maxHops: 3, timeoutMs: 5000, extractHtml: false });
          let category: "working" | "redirected" | "client_error" | "server_error" | "timeout" | "inaccessible" =
            "working";

          if (!res.success) {
            category = res.statusCode === 408 ? "timeout" : "inaccessible";
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            category = "working";
          } else if (res.statusCode >= 300 && res.statusCode < 400) {
            category = "redirected";
          } else if (res.statusCode >= 400 && res.statusCode < 500) {
            category = "client_error";
          } else if (res.statusCode >= 500) {
            category = "server_error";
          } else {
            category = "inaccessible";
          }

          return {
            url,
            statusCode: res.statusCode,
            statusText: res.statusText || (res.success ? "OK" : "Error"),
            category,
            responseTimeMs: res.totalTimeMs,
            error: res.error,
          };
        } catch (err: any) {
          return {
            url,
            statusCode: 0,
            statusText: "Error",
            category: "inaccessible" as const,
            responseTimeMs: 0,
            error: err?.message || "Failed to test URL",
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return NextResponse.json({
      total: results.length,
      working: results.filter((r) => r.category === "working").length,
      broken: results.filter((r) => ["client_error", "server_error", "timeout", "inaccessible"].includes(r.category)).length,
      redirected: results.filter((r) => r.category === "redirected").length,
      results,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process broken link scan." }, { status: 500 });
  }
}
