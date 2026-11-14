import { NextResponse, type NextRequest } from "next/server";

// Fallback supported currencies for Frankfurter (ECB rates)
const DEFAULT_CURRENCIES: Record<string, string> = {
  AUD: "Australian Dollar",
  BGN: "Bulgarian Lev",
  BRL: "Brazilian Real",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  CNY: "Chinese Renminbi Yuan",
  CZK: "Czech Koruna",
  DKK: "Danish Krone",
  EUR: "Euro",
  GBP: "British Pound",
  HKD: "Hong Kong Dollar",
  HUF: "Hungarian Forint",
  IDR: "Indonesian Rupiah",
  ILS: "Israeli New Shekel",
  INR: "Indian Rupee",
  ISK: "Icelandic Króna",
  JPY: "Japanese Yen",
  KRW: "South Korean Won",
  MXN: "Mexican Peso",
  MYR: "Malaysian Ringgit",
  NOK: "Norwegian Krone",
  NZD: "New Zealand Dollar",
  PHP: "Philippine Peso",
  PLN: "Polish Złoty",
  RON: "Romanian Leu",
  SEK: "Swedish Krona",
  SGD: "Singapore Dollar",
  THB: "Thai Baht",
  TRY: "Turkish Lira",
  USD: "United States Dollar",
  ZAR: "South African Rand",
};

let cachedCurrencies: Record<string, string> | null = null;
let lastCurrenciesFetch = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const from = (searchParams.get("from") || "USD").toUpperCase();
  const to = (searchParams.get("to") || "EUR").toUpperCase();
  const amountStr = searchParams.get("amount") || "1";
  const amount = parseFloat(amountStr);

  if (action === "currencies") {
    if (cachedCurrencies && Date.now() - lastCurrenciesFetch < 86400000) {
      return NextResponse.json({ currencies: cachedCurrencies });
    }
    try {
      const res = await fetch("https://api.frankfurter.app/currencies", { next: { revalidate: 86400 } });
      if (res.ok) {
        const data = await res.json();
        cachedCurrencies = data;
        lastCurrenciesFetch = Date.now();
        return NextResponse.json({ currencies: data }, { headers: { "Cache-Control": "public, s-maxage=86400" } });
      }
    } catch {
      // Fallback
    }
    return NextResponse.json({ currencies: DEFAULT_CURRENCIES });
  }

  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Please provide a valid positive amount." }, { status: 400 });
  }

  if (from === to) {
    return NextResponse.json({
      amount,
      base: from,
      target: to,
      rate: 1,
      result: amount,
      date: new Date().toISOString().split("T")[0],
      disclaimer: "Exchange rates are indicative and sourced from the European Central Bank via Frankfurter.dev.",
    });
  }

  try {
    const url = `https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Currency conversion failed for ${from} to ${to}. ${errText || ""}`.trim() }, { status: res.status });
    }
    const data = await res.json();
    const rateVal = data.rates?.[to];
    if (typeof rateVal !== "number") {
      return NextResponse.json({ error: `Could not retrieve exchange rate for ${to}.` }, { status: 404 });
    }
    const unitRate = rateVal / amount;

    return NextResponse.json(
      {
        amount: data.amount,
        base: data.base,
        target: to,
        rate: unitRate,
        result: rateVal,
        inverseRate: unitRate > 0 ? 1 / unitRate : 0,
        date: data.date,
        disclaimer: "Rates are indicative reference rates from the European Central Bank. Commercial or bank rates may differ.",
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error contacting exchange rate provider.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

