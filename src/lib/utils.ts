import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
}

/**
 * Extracts numeric price from price string, handling different formats:
 * - US format: $1,234.56 (comma as thousand separator, dot as decimal)
 * - European format: 1.234,56 € (dot as thousand separator, comma as decimal)
 * - Simple format: ₹1234
 * - Japanese Yen: ¥123,456 (comma as thousand separator, no decimals)
 * 
 * Also handles edge cases like:
 * - Price ranges: "$899 - $1199" → takes first price
 * - "From $999" → extracts 999
 */
export function extractPriceNumber(priceString: string): number {
  if (!priceString) return 0;

  // First, extract just the first price if there's a range (e.g., "$899 - $1199")
  let workingString = priceString.split(/\s*[-–—]\s*|\s*to\s*/i)[0].trim();

  // Remove "From", "Starting at", etc.
  workingString = workingString.replace(/^(from|starting\s+at|ab|à\s+partir\s+de)\s*/i, "");

  // Remove currency symbols and non-numeric characters except dots and commas
  let cleaned = workingString.replace(/[^0-9.,]/g, "").trim();

  if (!cleaned) return 0;

  // Count dots and commas to determine format
  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  // Get last positions
  const lastDotPos = cleaned.lastIndexOf('.');
  const lastCommaPos = cleaned.lastIndexOf(',');

  // Determine format:
  // 1. If last separator is comma with 1-2 digits after → European (comma as decimal)
  // 2. If last separator is dot with 1-2 digits after → US format (dot as decimal)
  // 3. If comma has 3 digits after → comma is thousand separator (US format)
  // 4. If only one type of separator with 3 digits → thousand separator

  let isEuropeanFormat = false;

  if (lastCommaPos > lastDotPos) {
    // Comma is last separator
    const afterComma = cleaned.substring(lastCommaPos + 1);
    if (afterComma.length <= 2) {
      // Comma is decimal separator (European)
      isEuropeanFormat = true;
    }
    // Otherwise comma is thousand separator (e.g., "1,234,567")
  } else if (lastDotPos > lastCommaPos) {
    // Dot is last separator
    const afterDot = cleaned.substring(lastDotPos + 1);
    if (afterDot.length === 3 && dotCount === 1 && commaCount === 0) {
      // Could be European thousand separator (e.g., "1.234" meaning 1234)
      // But more likely US format with 3 decimals which is unusual
      // Treat as thousand separator if it's the only separator
      isEuropeanFormat = true;
    }
    // Otherwise dot is decimal (US format - default)
  }

  // Also check for explicit European patterns
  if (!isEuropeanFormat) {
    // Pattern: digits.3digits,2digits → European (1.234,56)
    if (/^\d+\.\d{3},\d{1,2}$/.test(cleaned)) {
      isEuropeanFormat = true;
    }
    // Pattern: just digits,2digits without any dot → European (682,49)
    else if (/^\d+,\d{1,2}$/.test(cleaned) && !cleaned.includes('.')) {
      isEuropeanFormat = true;
    }
  }

  if (isEuropeanFormat) {
    // European format: remove dots (thousand separators), replace comma with dot
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // US/Standard format: remove commas (thousand separators)
    cleaned = cleaned.replace(/,/g, "");
  }

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

/**
 * Convert price from source currency to INR
 * Uses accurate exchange rates with fallback values
 * 
 * @param price - The price in source currency
 * @param sourceCurrency - The source currency code (USD, EUR, etc.)
 * @param exchangeRates - Object with rates relative to INR base from API
 * @returns Price in INR
 */
export function convertToINR(
  price: number,
  sourceCurrency: string,
  exchangeRates: Record<string, number>
): number {
  if (sourceCurrency === "INR") return price;
  if (price <= 0) return 0;

  // FreeCurrencyAPI returns rates with INR as base
  // So rate for USD means: 1 INR = 0.012 USD
  // To convert USD to INR: USD_amount / USD_rate
  const rate = exchangeRates[sourceCurrency];

  // Accurate fallback rates (as of Jan 2026 approximately)
  // These are 1 INR = X foreign currency
  const fallbackRates: Record<string, number> = {
    USD: 0.0119,   // 1 INR ≈ 0.0119 USD (1 USD ≈ 84 INR)
    GBP: 0.0095,   // 1 INR ≈ 0.0095 GBP (1 GBP ≈ 105 INR)
    EUR: 0.0110,   // 1 INR ≈ 0.0110 EUR (1 EUR ≈ 91 INR)
    AUD: 0.0183,   // 1 INR ≈ 0.0183 AUD (1 AUD ≈ 55 INR)
    CAD: 0.0165,   // 1 INR ≈ 0.0165 CAD (1 CAD ≈ 61 INR)
    JPY: 1.8500,   // 1 INR ≈ 1.85 JPY (1 JPY ≈ 0.54 INR)
    SGD: 0.0160,   // 1 INR ≈ 0.016 SGD (1 SGD ≈ 62.5 INR)
    AED: 0.0437,   // 1 INR ≈ 0.0437 AED (1 AED ≈ 22.9 INR)
  };

  const effectiveRate = (rate && rate > 0) ? rate : fallbackRates[sourceCurrency];

  if (!effectiveRate || effectiveRate === 0) {
    console.warn(`No exchange rate found for ${sourceCurrency}, returning original price`);
    return price; // Can't convert, return as-is
  }

  return price / effectiveRate;
}

/**
 * Format INR price with proper Indian numbering system (lakhs, crores)
 */
export function formatINR(amount: number): string {
  if (amount < 0) return "₹0";
  return "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
