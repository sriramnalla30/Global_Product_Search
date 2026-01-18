// Product offer from API
export interface ProductOffer {
  offer_id: string;
  offer_title: string | null;
  offer_page_url: string;
  price: string;
  original_price: string | null;
  on_sale: boolean;
  percent_off?: string;
  shipping: string;
  returns: string;
  offer_badge?: string;
  product_condition: string;
  store_name: string;
  store_rating: string;
  store_review_count: number;
  store_reviews_page_url: string;
  store_favicon: string;
  payment_methods?: string;
  source?: string; // Data source: Google Shopping, Amazon, eBay, etc.
  is_prime?: boolean; // Amazon Prime indicator
}

// Product search result
export interface ProductResult {
  product_id: string;
  title: string;
  product_photos?: string[];
  product_page_url?: string;
  typical_price_range?: string[];
  offer?: ProductOffer;
}

// Country configuration
export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  lat: number;
  lng: number;
  rapidApiGl?: string;
}

// Price result per country
export interface CountryPriceResult {
  country: CountryConfig;
  offers: ProductOffer[];
  priceInLocalCurrency: number;
  priceInINR: number;
  cheapestOffer?: ProductOffer;
  loading: boolean;
  error?: string;
}

// Search state
export interface SearchState {
  query: string;
  isSearching: boolean;
  confirmedProduct: string | null;
  results: CountryPriceResult[];
  exchangeRates: Record<string, number>;
  cheapestGlobal?: {
    country: CountryConfig;
    offer: ProductOffer;
    priceInINR: number;
  };
}

// API Response
export interface SearchApiResponse {
  status: string;
  data: {
    products?: ProductResult[];
    offers?: ProductOffer[];
  };
}
