import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "geocode") {
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
      const res = await fetch(geoUrl, { next: { revalidate: 86400 } });
      if (!res.ok) {
        return NextResponse.json({ results: [] });
      }
      const data = await res.json();
      return NextResponse.json({ results: data.results || [] }, { headers: { "Cache-Control": "public, s-maxage=86400" } });
    } catch {
      return NextResponse.json({ results: [] });
    }
  }

  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  if (!latStr || !lngStr) {
    return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Invalid coordinates provided." }, { status: 400 });
  }

  const timezone = searchParams.get("timezone") || "auto";

  try {
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${encodeURIComponent(timezone)}`;
    const res = await fetch(forecastUrl, { next: { revalidate: 900 } });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Weather service error: ${err}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(
      {
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        timezone_abbreviation: data.timezone_abbreviation,
        elevation: data.elevation,
        current_units: data.current_units,
        current: data.current,
        hourly: {
          time: (data.hourly?.time || []).slice(0, 24),
          temperature_2m: (data.hourly?.temperature_2m || []).slice(0, 24),
          weather_code: (data.hourly?.weather_code || []).slice(0, 24),
        },
        daily: data.daily,
        attribution: "Weather data by Open-Meteo.com (CC BY 4.0). Forecasts are indicative.",
      },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch weather forecast.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

