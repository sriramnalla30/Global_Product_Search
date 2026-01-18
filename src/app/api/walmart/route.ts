import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

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
    // Walmart search API
    const url = `https://walmart-data.p.rapidapi.com/walmart-search.php?query=${encodeURIComponent(
      query
    )}&page=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "walmart-data.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Walmart API Error:", errorText);
      throw new Error(`Walmart API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Walmart response to our standard format
    const items = data.products || data.items || [];
    
    const transformedData = {
      status: "OK",
      source: "walmart",
      country: "us", // Walmart is US only
      data: {
        products: items.slice(0, 10).map((item: any) => ({
          product_id: item.id || item.usItemId,
          title: item.title || item.name,
          product_photos: item.image ? [item.image] : [],
          product_page_url: item.url || item.productPageUrl,
          offer: {
            offer_id: `walmart-${item.id || item.usItemId}`,
            offer_title: item.title || item.name,
            offer_page_url: item.url || item.productPageUrl || `https://www.walmart.com/ip/${item.usItemId}`,
            price: item.price ? `$${item.price}` : item.priceInfo?.currentPrice || "Price unavailable",
            original_price: item.wasPrice || item.priceInfo?.wasPrice || null,
            on_sale: !!(item.wasPrice || item.priceInfo?.wasPrice),
            percent_off: item.savings || undefined,
            shipping: item.shipping || "Free Shipping on orders $35+",
            returns: "Free 90-day returns",
            product_condition: "NEW",
            store_name: "Walmart",
            store_rating: item.rating ? `${item.rating}/5` : null,
            store_review_count: item.numReviews || item.numberOfReviews || 0,
            store_reviews_page_url: item.url || "",
            store_favicon: "https://www.walmart.com/favicon.ico",
          },
        })),
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Walmart Search Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Walmart", details: String(error) },
      { status: 500 }
    );
  }
}
