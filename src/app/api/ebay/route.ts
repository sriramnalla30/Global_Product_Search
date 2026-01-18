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
    // eBay search API
    const url = `https://real-time-ebay-data.p.rapidapi.com/search?query=${encodeURIComponent(
      query
    )}&page=1&country=us`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "real-time-ebay-data.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("eBay API Error:", errorText);
      throw new Error(`eBay API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform eBay response to our standard format
    const items = data.data?.products || data.products || [];
    
    const transformedData = {
      status: "OK",
      source: "ebay",
      country: "us", // eBay US as primary
      data: {
        products: items.slice(0, 10).map((item: any) => ({
          product_id: item.item_id || item.epid,
          title: item.title,
          product_photos: item.image ? [item.image] : [],
          product_page_url: item.url || item.item_web_url,
          offer: {
            offer_id: `ebay-${item.item_id || item.epid}`,
            offer_title: item.title,
            offer_page_url: item.url || item.item_web_url,
            price: item.price?.value 
              ? `$${item.price.value}` 
              : item.price || "Price unavailable",
            original_price: item.original_price || null,
            on_sale: !!item.original_price,
            percent_off: item.discount || undefined,
            shipping: item.shipping?.cost 
              ? `Shipping: $${item.shipping.cost}` 
              : "See shipping options",
            returns: item.returns || "eBay Money Back Guarantee",
            product_condition: item.condition || "See listing",
            store_name: item.seller?.username || "eBay Seller",
            store_rating: item.seller?.feedback_score 
              ? `${item.seller.feedback_percentage}%` 
              : null,
            store_review_count: item.seller?.feedback_score || 0,
            store_reviews_page_url: item.seller?.url || "",
            store_favicon: "https://www.ebay.com/favicon.ico",
          },
        })),
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("eBay Search Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from eBay", details: String(error) },
      { status: 500 }
    );
  }
}
