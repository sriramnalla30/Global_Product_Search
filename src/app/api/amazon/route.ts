import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// Amazon domain mapping per country
const AMAZON_COUNTRY_MAP: Record<string, string> = {
  in: "IN",
  us: "US",
  gb: "UK",
  de: "DE",
  au: "AU",
  ca: "CA",
  jp: "JP",
  sg: "SG",
  ae: "AE",
  fr: "FR",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const country = searchParams.get("country") || "us";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (!RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: "RapidAPI key not configured" },
      { status: 500 }
    );
  }

  try {
    const amazonCountry = AMAZON_COUNTRY_MAP[country] || "US";
    
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
      const errorText = await response.text();
      console.error("Amazon API Error:", errorText);
      throw new Error(`Amazon API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Amazon response to our standard format
    const transformedData = {
      status: data.status || "OK",
      source: "amazon",
      country: country,
      data: {
        products: (data.data?.products || []).slice(0, 10).map((item: any) => ({
          product_id: item.asin,
          title: item.product_title,
          product_photos: item.product_photo ? [item.product_photo] : [],
          product_page_url: item.product_url,
          offer: {
            offer_id: `amazon-${item.asin}`,
            offer_title: item.product_title,
            offer_page_url: item.product_url,
            price: item.product_price || "Price unavailable",
            original_price: item.product_original_price || null,
            on_sale: !!item.product_original_price,
            percent_off: item.product_original_price 
              ? `${item.discount || ''}` 
              : undefined,
            shipping: item.delivery || item.is_prime ? "Prime Delivery" : "Standard Shipping",
            returns: "Amazon Returns Policy",
            product_condition: "NEW",
            store_name: "Amazon",
            store_rating: item.product_star_rating ? `${item.product_star_rating}/5` : null,
            store_review_count: item.product_num_ratings || 0,
            store_reviews_page_url: item.product_url,
            store_favicon: "https://www.amazon.com/favicon.ico",
            is_prime: item.is_prime,
          },
        })),
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Amazon Search Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Amazon", details: String(error) },
      { status: 500 }
    );
  }
}
