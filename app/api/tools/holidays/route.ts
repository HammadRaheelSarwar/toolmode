import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "countries") {
    try {
      const res = await fetch("https://date.nager.at/api/v3/AvailableCountries", { next: { revalidate: 604800 } });
      if (!res.ok) throw new Error("Could not fetch countries list.");
      const data = await res.json();
      return NextResponse.json({ countries: data }, { headers: { "Cache-Control": "public, s-maxage=604800" } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error loading countries.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const country = (searchParams.get("country") || "US").toUpperCase();
  const yearStr = searchParams.get("year") || String(new Date().getFullYear());
  const year = parseInt(yearStr, 10);

  if (!/^[A-Z]{2}$/.test(country)) {
    return NextResponse.json({ error: "Invalid two-letter ISO country code." }, { status: 400 });
  }

  if (isNaN(year) || year < 1970 || year > 2080) {
    return NextResponse.json({ error: "Please enter a valid year between 1970 and 2080." }, { status: 400 });
  }

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ holidays: [], country, year, message: "No official public holidays found for this country and year in Nager.Date database." });
      }
      return NextResponse.json({ error: `Holiday service error (${res.status}).` }, { status: res.status });
    }
    const holidays = await res.json();
    return NextResponse.json(
      {
        holidays,
        country,
        year,
        total: Array.isArray(holidays) ? holidays.length : 0,
        attribution: "Public holiday data provided by Nager.Date. May exclude regional or municipal observances.",
      },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load public holidays.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

