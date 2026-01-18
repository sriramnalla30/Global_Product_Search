import { NextRequest, NextResponse } from "next/server";

const SERP_API_KEY = process.env.SERP_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Data source configurations
const DATA_SOURCES = {
  serpapi: {
    name: "Google Shopping",
    enabled: true,
    priority: 1,
  },
  rapidapi_products: {
    name: "Real-Time Product Search",
    enabled: true,
    priority: 2,
  },
  amazon: {
    name: "Amazon",
    enabled: true,
    priority: 3,
  },
};

// Country mappings for different APIs
const COUNTRY_MAPPINGS = {
  serpapi: {
    in: "in", us: "us", gb: "uk", de: "de", au: "au", 
    ca: "ca", jp: "jp", sg: "sg", ae: "ae", fr: "fr"
  },
  amazon: {
    in: "IN", us: "US", gb: "UK", de: "DE", au: "AU",
    ca: "CA", jp: "JP", sg: "SG", ae: "AE", fr: "FR"
  },
  rapidapi: {
    in: "in", us: "us", gb: "gb", de: "de", au: "au",
    ca: "ca", jp: "jp", sg: "sg", ae: "ae", fr: "fr"
  }
};

// Fetch from SerpAPI (Google Shopping)
async function fetchFromSerpAPI(query: string, country: string) {
  if (!SERP_API_KEY) return null;
  
  try {
    const gl = COUNTRY_MAPPINGS.serpapi[country as keyof typeof COUNTRY_MAPPINGS.serpapi] || country;
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=${gl}&hl=en&api_key=${SERP_API_KEY}`;
    
    const response = await fetch(url, { 
      method: "GET",
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return (data.shopping_results || []).slice(0, 8).map((item: any) => ({
      offer_id: `serp-${item.product_id || item.position}`,
      offer_title: item.title,
      offer_page_url: item.link,
      price: item.extracted_price ? `${item.currency || '$'}${item.extracted_price}` : item.price,
      original_price: item.old_price || null,
      on_sale: !!item.old_price,
      percent_off: item.old_price ? calculateDiscount(item.extracted_price, item.old_price) : undefined,
      shipping: item.delivery || "Check website",
      returns: item.returns || "Check policy",
      product_condition: "NEW",
      store_name: item.source || "Unknown Store",
      store_rating: item.rating ? `${item.rating}/5` : null,
      store_review_count: item.reviews || 0,
      store_favicon: item.source_icon || "",
      source: "Google Shopping",
    }));
  } catch (error) {
    console.error("SerpAPI Error:", error);
    return null;
  }
}

// Fetch from RapidAPI Real-Time Product Search
async function fetchFromRapidAPIProducts(query: string, country: string) {
  if (!RAPIDAPI_KEY) return null;
  
  try {
    const url = `https://real-time-product-search.p.rapidapi.com/search-v2?q=${encodeURIComponent(query)}&country=${country}&language=en&limit=8&sort_by=BEST_MATCH&product_condition=NEW`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "real-time-product-search.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return (data.data?.products || []).slice(0, 8).map((item: any) => ({
      offer_id: `rapid-${item.product_id}`,
      offer_title: item.product_title,
      offer_page_url: item.product_page_url,
      price: item.offer?.price || item.typical_price_range?.[0] || "N/A",
      original_price: item.offer?.original_price || null,
      on_sale: item.offer?.on_sale || false,
      percent_off: item.offer?.percent_off,
      shipping: item.offer?.shipping || "Check website",
      returns: item.offer?.returns || "Check policy",
      product_condition: item.offer?.product_condition || "NEW",
      store_name: item.offer?.store_name || "Unknown Store",
      store_rating: item.offer?.store_rating || null,
      store_review_count: item.offer?.store_review_count || 0,
      store_favicon: item.offer?.store_favicon || "",
      source: "Product Search",
    }));
  } catch (error) {
    console.error("RapidAPI Products Error:", error);
    return null;
  }
}

// Fetch from Amazon
async function fetchFromAmazon(query: string, country: string) {
  if (!RAPIDAPI_KEY) return null;
  
  try {
    const amazonCountry = COUNTRY_MAPPINGS.amazon[country as keyof typeof COUNTRY_MAPPINGS.amazon] || "US";
    const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&country=${amazonCountry}&sort_by=RELEVANCE&product_condition=NEW`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return (data.data?.products || []).slice(0, 5).map((item: any) => ({
      offer_id: `amazon-${item.asin}`,
      offer_title: item.product_title,
      offer_page_url: item.product_url,
      price: item.product_price || "N/A",
      original_price: item.product_original_price || null,
      on_sale: !!item.product_original_price,
      percent_off: item.discount || undefined,
      shipping: item.is_prime ? "🚀 Prime Delivery" : "Standard Shipping",
      returns: "Amazon Returns",
      product_condition: "NEW",
      store_name: "Amazon",
      store_rating: item.product_star_rating ? `${item.product_star_rating}/5` : null,
      store_review_count: item.product_num_ratings || 0,
      store_favicon: "https://www.amazon.com/favicon.ico",
      source: "Amazon",
      is_prime: item.is_prime,
    }));
  } catch (error) {
    console.error("Amazon API Error:", error);
    return null;
  }
}

// Helper to calculate discount percentage
function calculateDiscount(current: number, original: string): string | undefined {
  try {
    const origPrice = parseFloat(original.replace(/[^0-9.]/g, ''));
    if (origPrice > current) {
      return `${Math.round((1 - current / origPrice) * 100)}% off`;
    }
  } catch {}
  return undefined;
}

// De-duplicate offers by store name
function deduplicateOffers(offers: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const offer of offers) {
    const key = `${offer.store_name.toLowerCase()}-${offer.price}`;
    if (!seen.has(key)) {
      seen.set(key, offer);
    }
  }
  
  return Array.from(seen.values());
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const country = searchParams.get("country") || "us";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    // Fetch from all sources in parallel
    const [serpResults, rapidResults, amazonResults] = await Promise.all([
      fetchFromSerpAPI(query, country),
      fetchFromRapidAPIProducts(query, country),
      fetchFromAmazon(query, country),
    ]);

    // Combine all results
    const allOffers: any[] = [];
    
    if (serpResults) allOffers.push(...serpResults);
    if (rapidResults) allOffers.push(...rapidResults);
    if (amazonResults) allOffers.push(...amazonResults);

    // De-duplicate by store + price
    const uniqueOffers = deduplicateOffers(allOffers);

    // Count sources that returned data
    const sourcesUsed = [
      serpResults ? "Google Shopping" : null,
      rapidResults ? "Product Search" : null,
      amazonResults ? "Amazon" : null,
    ].filter(Boolean);

    return NextResponse.json({
      status: "OK",
      country: country,
      sources_used: sourcesUsed,
      total_offers: uniqueOffers.length,
      data: {
        products: uniqueOffers.map(offer => ({
          product_id: offer.offer_id,
          title: offer.offer_title,
          offer: offer
        }))
      }
    });
  } catch (error) {
    console.error("Multi-source search error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from data sources" },
      { status: 500 }
    );
  }
}
