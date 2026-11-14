import { NextResponse, type NextRequest } from "next/server";

function isIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

function isIpv6(ip: string): boolean {
  return /^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":") && ip.length >= 2;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let ip = (searchParams.get("ip") || "").trim();

  // If no IP supplied, detect caller's public IP from headers
  if (!ip) {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    } else if (realIp) {
      ip = realIp.trim();
    }
  }

  // If still empty or localhost/private, fetch from ipify
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    try {
      const ipifyRes = await fetch("https://api.ipify.org?format=json", { next: { revalidate: 60 } });
      if (ipifyRes.ok) {
        const ipifyData = (await ipifyRes.json()) as { ip?: string };
        if (ipifyData.ip) ip = ipifyData.ip;
      }
    } catch {
      // Keep whatever we had
    }
  }

  if (!ip || (!isIpv4(ip) && !isIpv6(ip))) {
    return NextResponse.json({ error: "Please provide a valid IPv4 or IPv6 address." }, { status: 400 });
  }

  const version = isIpv6(ip) ? "IPv6" : "IPv4";

  try {
    const apiUrl = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
    const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Geolocation provider request failed." }, { status: res.status });
    }
    const data = await res.json();
    if (data.status === "fail") {
      return NextResponse.json({ error: data.message || "IP lookup failed for this address." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ip: data.query || ip,
        version,
        country: data.country || "Unknown",
        countryCode: data.countryCode || "",
        region: data.regionName || data.region || "",
        city: data.city || "",
        postal: data.zip || "",
        latitude: typeof data.lat === "number" ? data.lat : null,
        longitude: typeof data.lon === "number" ? data.lon : null,
        timezone: data.timezone || "",
        isp: data.isp || "",
        organization: data.org || "",
        asn: data.as || "",
        disclaimer: "Geolocation information is approximate and based on ISP routing registries. It does not reflect an exact physical or street address.",
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error contacting IP lookup provider.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

