import { NextResponse } from "next/server";

const FREE_CURRENCY_API_KEY = process.env.FREE_CURRENCY_API_KEY;

// Cache exchange rates for 24 hours
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET() {
  try {
    // Check if we have valid cached rates
    if (cachedRates && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: cachedRates,
        cached: true,
        timestamp: cacheTimestamp,
      });
    }

    if (!FREE_CURRENCY_API_KEY) {
      // Fallback rates if API key is not configured
      const fallbackRates = {
        INR: 1,
        USD: 0.012,
        GBP: 0.0095,
        EUR: 0.011,
        AUD: 0.018,
        CAD: 0.016,
        JPY: 1.78,
        SGD: 0.016,
        AED: 0.044,
      };
      return NextResponse.json({ data: fallbackRates, fallback: true });
    }

    const response = await fetch(
      `https://api.freecurrencyapi.com/v1/latest?apikey=${FREE_CURRENCY_API_KEY}&base_currency=INR`
    );

    if (!response.ok) {
      throw new Error(`Currency API responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    // Cache the rates
    cachedRates = result.data;
    cacheTimestamp = Date.now();

    return NextResponse.json({
      data: result.data,
      cached: false,
      timestamp: cacheTimestamp,
    });
  } catch (error) {
    console.error("Currency API Error:", error);
    
    // Return fallback rates on error
    const fallbackRates = {
      INR: 1,
      USD: 0.012,
      GBP: 0.0095,
      EUR: 0.011,
      AUD: 0.018,
      CAD: 0.016,
      JPY: 1.78,
      SGD: 0.016,
      AED: 0.044,
    };
    return NextResponse.json({ data: fallbackRates, fallback: true });
  }
}
