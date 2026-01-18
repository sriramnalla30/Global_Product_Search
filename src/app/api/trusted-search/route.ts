import { NextRequest, NextResponse } from "next/server";
import { extractPriceNumber } from "@/lib/utils";
import { isTrustedRetailer } from "@/config/trusted-retailers";
import { validateProductsWithLLM } from "@/lib/product-validation";

const SERP_API_KEY = process.env.SERP_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Currency symbols per country
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

interface TrustedOffer {
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

// PRIMARY: Fetch from SerpAPI Google Shopping - Most reliable source
async function fetchFromSerpAPI(query: string, country: string): Promise<TrustedOffer[]> {
  if (!SERP_API_KEY) {
    console.log("No SerpAPI key configured");
    return [];
  }

  const config = SERPAPI_COUNTRY_CONFIG[country] || SERPAPI_COUNTRY_CONFIG.us;
  const currency = CURRENCY_MAP[country] || CURRENCY_MAP.us;

  try {
    const serpApiUrl = new URL("https://serpapi.com/search.json");
    serpApiUrl.searchParams.set("engine", "google_shopping");
    serpApiUrl.searchParams.set("q", query);
    serpApiUrl.searchParams.set("gl", config.gl);
    serpApiUrl.searchParams.set("hl", config.hl);
    if (config.location) {
      serpApiUrl.searchParams.set("location", config.location);
    }
    serpApiUrl.searchParams.set("api_key", SERP_API_KEY);

    console.log(`Fetching SerpAPI Google Shopping for ${country.toUpperCase()}`);

    const response = await fetch(serpApiUrl.toString());

    if (!response.ok) {
      console.error(`SerpAPI error for ${country}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (data.error) {
      console.error(`SerpAPI returned error: ${data.error}`);
      return [];
    }

    const shoppingResults = data.shopping_results || [];

    console.log(`SerpAPI ${country}: ${shoppingResults.length} raw results`);

    // Minimum price thresholds in local currency to filter accessories
    const MIN_PRICE_THRESHOLDS: Record<string, number> = {
      in: 5000,    // ₹5,000 minimum
      us: 100,     // $100 minimum
      gb: 80,      // £80 minimum
      de: 100,     // €100 minimum
      fr: 100,     // €100 minimum
      au: 150,     // A$150 minimum
      ca: 150,     // C$150 minimum
      jp: 15000,   // ¥15,000 minimum
      sg: 150,     // S$150 minimum
      ae: 400,     // AED 400 minimum
    };

    const minPrice = MIN_PRICE_THRESHOLDS[country.toLowerCase()] || 100;

    // Filter and map shopping results - only include trusted retailers
    const mappedResults = shoppingResults
      .filter((item: any) => {
        const storeName = item.source || item.merchant?.name || "";
        const link = item.link || item.product_link || "";
        const title = (item.title || "").toLowerCase();
        const priceValue = item.extracted_price || extractPriceNumber(item.price || "0");

        // Check if from a trusted retailer
        const isTrusted = isTrustedRetailer(storeName, country) ||
          isTrustedRetailer(link, country);

        if (!isTrusted) {
          console.log(`[${country}] Skipping untrusted: ${storeName}`);
          return false;
        }

        // Skip accessories - products below minimum price threshold
        if (priceValue < minPrice) {
          console.log(`[${country}] Skipping low-price item (${priceValue} < ${minPrice}): ${item.title?.substring(0, 50)}`);
          return false;
        }

        // Skip obvious accessories by title keywords
        const accessoryKeywords = ["case", "cover", "screen protector", "film", "charger", "cable",
          "adapter", "holder", "stand", "skin", "sleeve", "pouch", "strap", "coque", "hülle",
          "schutzhülle", "tasche", "étui", "protection", "pellicule"];
        const isAccessory = accessoryKeywords.some(kw => title.includes(kw));
        if (isAccessory) {
          console.log(`[${country}] Skipping accessory: ${item.title?.substring(0, 50)}`);
          return false;
        }

        // Skip monthly/subscription pricing
        const priceStr = (item.price || "").toLowerCase();
        if (priceStr.includes("/mo") || priceStr.includes(" mo ") ||
          priceStr.includes("monat") || priceStr.includes("mois") ||
          priceStr.includes("month") || priceStr.includes("/m ") ||
          priceStr.includes("x 24") || priceStr.includes("x 12") ||
          priceStr.includes("now") || priceStr.includes("/wk")) {
          console.log(`[${country}] Skipping subscription price: ${item.price}`);
          return false;
        }

        return true;
      })
      .slice(0, 10)
      .map((item: any, idx: number) => {
        // Use SerpAPI's extracted_price if available, otherwise parse the price string
        const priceRaw = item.extracted_price || extractPriceNumber(item.price || "0");
        const priceStr = item.price || `${currency.symbol}${priceRaw}`;
        const storeName = item.source || item.merchant?.name || "Online Store";

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
          source: storeName,
          product_image: item.thumbnail,
        };
      });

    return mappedResults;
  } catch (error) {
    console.error(`SerpAPI fetch error for ${country}:`, error);
    return [];
  }
}

// FALLBACK: Amazon via RapidAPI (if SerpAPI unavailable)
async function fetchFromAmazonRapidAPI(query: string, country: string): Promise<TrustedOffer[]> {
  if (!RAPIDAPI_KEY) return [];

  const amazonCountryMap: Record<string, string> = {
    in: "IN", us: "US", gb: "UK", de: "DE", au: "AU",
    ca: "CA", jp: "JP", sg: "SG", ae: "AE", fr: "FR",
  };

  const amazonCountry = amazonCountryMap[country] || "US";
  const currency = CURRENCY_MAP[country] || CURRENCY_MAP.us;

  try {
    const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(
      query
    )}&page=1&country=${amazonCountry}&sort_by=RELEVANCE&product_condition=NEW`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      console.error(`RapidAPI Amazon error for ${country}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.data?.products) {
      return [];
    }

    return data.data.products.slice(0, 5).map((item: any) => {
      const priceStr = item.product_price || "";
      const priceRaw = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;

      return {
        offer_id: `amazon-${item.asin}-${country}`,
        offer_title: item.product_title,
        offer_page_url: item.product_url,
        price: item.product_price || "Price unavailable",
        price_raw: priceRaw,
        currency: currency.code,
        original_price: item.product_original_price || null,
        on_sale: !!item.product_original_price,
        percent_off: item.product_original_price
          ? calculateDiscount(priceStr, item.product_original_price)
          : undefined,
        shipping: item.is_prime ? "🚀 Prime FREE Delivery" : "Standard Shipping",
        returns: "Amazon Easy Returns",
        product_condition: "NEW",
        store_name: `Amazon ${amazonCountry}`,
        store_rating: item.product_star_rating ? `${item.product_star_rating}/5` : null,
        store_review_count: item.product_num_ratings || 0,
        store_favicon: "https://www.amazon.com/favicon.ico",
        source: "Amazon",
        is_prime: item.is_prime || false,
        product_image: item.product_photo,
      };
    });
  } catch (error) {
    console.error(`RapidAPI Amazon fetch error for ${country}:`, error);
    return [];
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
  if (store.includes("costco")) return "https://www.costco.com/favicon.ico";
  if (store.includes("newegg")) return "https://www.newegg.com/favicon.ico";
  return "https://www.google.com/favicon.ico";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const country = searchParams.get("country") || "us";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  console.log(`\n=== Trusted Search: "${query}" for ${country.toUpperCase()} ===`);

  try {
    let allOffers: TrustedOffer[] = [];
    const sourcesUsed: string[] = [];

    // PRIMARY: Try SerpAPI first (reliable, rate-limited to 250/month free)
    const serpApiOffers = await fetchFromSerpAPI(query, country);
    if (serpApiOffers.length > 0) {
      allOffers.push(...serpApiOffers);
      sourcesUsed.push("Google Shopping");
      console.log(`SerpAPI ${country}: ${serpApiOffers.length} products`);
    }

    // FALLBACK: If SerpAPI returns nothing, try RapidAPI Amazon
    if (allOffers.length === 0) {
      console.log("SerpAPI returned no results, trying RapidAPI fallback...");
      const amazonOffers = await fetchFromAmazonRapidAPI(query, country);
      if (amazonOffers.length > 0) {
        allOffers.push(...amazonOffers);
        sourcesUsed.push("Amazon");
        console.log(`RapidAPI Amazon ${country}: ${amazonOffers.length} products`);
      }
    }

    // Filter out offers with invalid prices
    const validOffers = allOffers.filter(
      (offer) => offer.price_raw > 0 && offer.price !== "Price unavailable"
    );

    // Sort by price (lowest first)
    validOffers.sort((a, b) => a.price_raw - b.price_raw);

    // LLM VALIDATION: Use Groq to filter out products that don't match the search query
    let finalOffers = validOffers;
    if (validOffers.length > 0 && process.env.GROQ_API_KEY) {
      console.log(`[${country}] Running LLM validation on ${validOffers.length} products...`);

      const productsToValidate = validOffers.map(offer => ({
        title: offer.offer_title || "",
        price: offer.price_raw,
        currency: offer.currency,
      }));

      const validationResults = await validateProductsWithLLM(query, productsToValidate);

      finalOffers = validOffers.filter((_, idx) => {
        const result = validationResults.get(idx);
        if (!result?.isValid) {
          console.log(`[${country}] LLM rejected: "${validOffers[idx].offer_title?.substring(0, 50)}" - ${result?.reason}`);
        }
        return result?.isValid ?? true;
      });

      console.log(`[${country}] LLM validation: ${validOffers.length} -> ${finalOffers.length} products`);
    }

    console.log(`Total valid offers for ${country}: ${finalOffers.length}`);

    return NextResponse.json({
      status: "OK",
      country: country,
      currency: CURRENCY_MAP[country]?.code || "USD",
      sources_used: sourcesUsed,
      total_offers: finalOffers.length,
      data: {
        products: finalOffers.map((offer) => ({
          product_id: offer.offer_id,
          title: offer.offer_title,
          offer: offer,
        })),
      },
    });
  } catch (error) {
    console.error("Trusted search error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from trusted sources" },
      { status: 500 }
    );
  }
}
