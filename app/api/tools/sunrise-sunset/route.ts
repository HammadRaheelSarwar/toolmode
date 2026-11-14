import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Please enter valid coordinates (-90 to +90 for latitude, -180 to +180 for longitude)." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date must be in YYYY-MM-DD format." }, { status: 400 });
  }

  try {
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${encodeURIComponent(date)}&formatted=0`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Sunrise-sunset service returned ${res.status}.` }, { status: res.status });
    }
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "INVALID_DATE") {
      // Polar regions or edge cases
      return NextResponse.json({
        status: data.status,
        date,
        latitude: lat,
        longitude: lng,
        isPolar: true,
        message: data.status === "POLAR_NIGHT" ? "Polar Night (The sun remains below the horizon all day)." : "Midnight Sun / Polar Day (The sun remains above the horizon all day).",
      });
    }

    const r = data.results || {};
    const dayLengthSec = typeof r.day_length === "number" ? r.day_length : 0;
    const hours = Math.floor(dayLengthSec / 3600);
    const mins = Math.floor((dayLengthSec % 3600) / 60);
    const secs = dayLengthSec % 60;
    const formattedDuration = `${hours}h ${mins}m ${secs}s`;

    return NextResponse.json(
      {
        date,
        latitude: lat,
        longitude: lng,
        sunrise: r.sunrise || null,
        sunset: r.sunset || null,
        solarNoon: r.solar_noon || null,
        dayLengthSeconds: dayLengthSec,
        daylightDuration: formattedDuration,
        civilTwilightBegin: r.civil_twilight_begin || null,
        civilTwilightEnd: r.civil_twilight_end || null,
        nauticalTwilightBegin: r.nautical_twilight_begin || null,
        nauticalTwilightEnd: r.nautical_twilight_end || null,
        astronomicalTwilightBegin: r.astronomical_twilight_begin || null,
        astronomicalTwilightEnd: r.astronomical_twilight_end || null,
        attribution: "Calculated via Sunrise-Sunset.org API. Times are in UTC (converted to local in browser).",
      },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error contacting sunrise/sunset provider.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

