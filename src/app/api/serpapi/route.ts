import { NextRequest, NextResponse } from "next/server";

const SERP_API_KEY = process.env.SERP_API_KEY;

// SerpAPI Google Shopping country/language mapping
const SERPAPI_COUNTRY_CONFIG: Record<string, { gl: string; hl: string; location?: string }> = {
  in: { gl: "in", hl: "en", location: "India" },
  us: { gl: "us", hl: "en", location: "United States" },
  gb: { gl: "uk", hl: "en", location: "United Kingdom" },
  de: { gl: "de", hl: "de", location: "Germany" },
  au: { gl: "au", hl: "en", location: "Australia" },
  ca: { gl: "ca", hl: "en", location: "Canada" },
  jp: { gl: "jp", hl: "ja", location: "Japan" },
  sg: { gl: "sg", hl: "en", location: "Singapore" },
  ae: { gl: "ae", hl: "en", location: "United Arab Emirates" },
  fr: { gl: "fr", hl: "fr", location: "France" },
};

// Currency mapping per country
const CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  in: { code: "INR", symbol: "₹" },
  us: { code: "USD", symbol: "$" },
  gb: { code: "GBP", symbol: "£" },
  de: { code: "EUR", symbol: "€" },
  au: { code: "AUD", symbol: "A$" },
  ca: { code: "CAD", symbol: "C$" },
  jp: { code: "JPY", symbol: "¥" },
  sg: { code: "SGD", symbol: "S$" },
  ae: { code: "AED", symbol: "AED " },
  fr: { code: "EUR", symbol: "€" },
};

interface SerpApiOffer {
  offer_id: string;
  offer_title: string | null;
  offer_page_url: string;
  price: string;
  price_raw: number;
  currency: string;
  original_price: string | null;
  on_sale: boolean;
  percent_off?: string;
  shipping: string;
  returns: string;
  product_condition: string;
  store_name: string;
  store_rating: string | null;
  store_review_count: number;
  store_favicon: string;
  source: string;
  is_prime?: boolean;
  product_image?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const country = searchParams.get("country") || "us";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (!SERP_API_KEY) {
    console.log("No SerpAPI key configured, returning demo data");
    return NextResponse.json({
      status: "OK",
      country: country,
      currency: CURRENCY_MAP[country]?.code || "USD",
      sources_used: ["Demo Data"],
      total_offers: 0,
      data: { products: [] },
      note: "SerpAPI key not configured. Please add SERP_API_KEY to .env.local",
    });
  }

  const config = SERPAPI_COUNTRY_CONFIG[country] || SERPAPI_COUNTRY_CONFIG.us;
  const currency = CURRENCY_MAP[country] || CURRENCY_MAP.us;

  try {
    // Use Google Shopping via SerpAPI
    const serpApiUrl = new URL("https://serpapi.com/search.json");
    serpApiUrl.searchParams.set("engine", "google_shopping");
    serpApiUrl.searchParams.set("q", query);
    serpApiUrl.searchParams.set("gl", config.gl);
    serpApiUrl.searchParams.set("hl", config.hl);
    if (config.location) {
      serpApiUrl.searchParams.set("location", config.location);
    }
    serpApiUrl.searchParams.set("api_key", SERP_API_KEY);

    console.log(`SerpAPI Google Shopping ${country.toUpperCase()}: ${query}`);

    const response = await fetch(serpApiUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SerpAPI error for ${country}: ${response.status} - ${errorText}`);
      return NextResponse.json({
        status: "ERROR",
        country: country,
        error: `SerpAPI error: ${response.status}`,
        data: { products: [] },
      });
    }

    const data = await response.json();

    // Check for API errors
    if (data.error) {
      console.error(`SerpAPI returned error: ${data.error}`);
      return NextResponse.json({
        status: "ERROR",
        country: country,
        error: data.error,
        data: { products: [] },
      });
    }

    // Parse shopping results
    const shoppingResults = data.shopping_results || [];
    const offers: SerpApiOffer[] = shoppingResults.slice(0, 10).map((item: any, idx: number) => {
      // Extract price - SerpAPI returns "extracted_price" as number and "price" as string
      const priceRaw = item.extracted_price || parseFloat(String(item.price || "0").replace(/[^0-9.]/g, "")) || 0;
      const priceStr = item.price || `${currency.symbol}${priceRaw}`;

      // Determine the store name from the source
      const storeName = item.source || item.merchant?.name || "Online Store";

      // Check if it's from a trusted retailer
      const trustedStores = ["Amazon", "Walmart", "eBay", "Flipkart", "Best Buy", "Target", "Costco"];
      const isTrusted = trustedStores.some(store =>
        storeName.toLowerCase().includes(store.toLowerCase())
      );

      return {
        offer_id: `serpapi-${country}-${idx}-${Date.now()}`,
        offer_title: item.title,
        offer_page_url: item.link || item.product_link || "#",
        price: priceStr,
        price_raw: priceRaw,
        currency: currency.code,
        original_price: item.old_price || null,
        on_sale: !!item.old_price,
        percent_off: item.old_price ? calculateDiscount(priceStr, item.old_price) : undefined,
        shipping: item.delivery || item.shipping || "See website for shipping",
        returns: "See store policy",
        product_condition: "NEW",
        store_name: storeName,
        store_rating: item.rating ? `${item.rating}/5` : null,
        store_review_count: item.reviews || 0,
        store_favicon: getFavicon(storeName),
        source: isTrusted ? storeName : "Google Shopping",
        product_image: item.thumbnail,
      };
    });

    // Filter out offers with invalid prices and sort by price
    const validOffers = offers.filter(offer => offer.price_raw > 0);
    validOffers.sort((a, b) => a.price_raw - b.price_raw);

    console.log(`SerpAPI ${country}: Found ${validOffers.length} valid offers`);

    return NextResponse.json({
      status: "OK",
      country: country,
      currency: currency.code,
      sources_used: ["Google Shopping"],
      total_offers: validOffers.length,
      data: {
        products: validOffers.map(offer => ({
          product_id: offer.offer_id,
          title: offer.offer_title,
          offer: offer,
        })),
      },
    });
  } catch (error) {
    console.error(`SerpAPI fetch error for ${country}:`, error);
    return NextResponse.json({
      status: "ERROR",
      country: country,
      error: String(error),
      data: { products: [] },
    });
  }
}

function calculateDiscount(currentPrice: string, originalPrice: string): string | undefined {
  try {
    const current = parseFloat(currentPrice.replace(/[^0-9.]/g, ""));
    const original = parseFloat(originalPrice.replace(/[^0-9.]/g, ""));
    if (original > current) {
      return `${Math.round((1 - current / original) * 100)}% off`;
    }
  } catch { }
  return undefined;
}

function getFavicon(storeName: string): string {
  const store = storeName.toLowerCase();
  if (store.includes("amazon")) return "https://www.amazon.com/favicon.ico";
  if (store.includes("walmart")) return "https://www.walmart.com/favicon.ico";
  if (store.includes("ebay")) return "https://www.ebay.com/favicon.ico";
  if (store.includes("flipkart")) return "https://www.flipkart.com/favicon.ico";
  if (store.includes("best buy")) return "https://www.bestbuy.com/favicon.ico";
  if (store.includes("target")) return "https://www.target.com/favicon.ico";
  return "https://www.google.com/favicon.ico";
}
