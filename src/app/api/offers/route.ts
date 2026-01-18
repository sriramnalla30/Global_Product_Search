import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "real-time-product-search.p.rapidapi.com";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("product_id");
  const country = searchParams.get("country") || "us";

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  if (!RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const url = `https://${RAPIDAPI_HOST}/product-offers?product_id=${encodeURIComponent(
      productId
    )}&country=${country}&language=en`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Offers API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product offers" },
      { status: 500 }
    );
  }
}
