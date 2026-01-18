import { CountryConfig } from "@/types";

export const COUNTRIES: CountryConfig[] = [
  // India
  {
    code: "in",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    flag: "🇮🇳",
    lat: 20.5937,
    lng: 78.9629,
    rapidApiGl: "in",
  },
  // USA
  {
    code: "us",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    flag: "🇺🇸",
    lat: 37.0902,
    lng: -95.7129,
    rapidApiGl: "us",
  },
  // UK
  {
    code: "gb",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    flag: "🇬🇧",
    lat: 55.3781,
    lng: -3.436,
    rapidApiGl: "gb",
  },
  // Germany
  {
    code: "de",
    name: "Germany",
    currency: "EUR",
    currencySymbol: "€",
    flag: "🇩🇪",
    lat: 51.1657,
    lng: 10.4515,
    rapidApiGl: "de",
  },
  // Australia
  {
    code: "au",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    flag: "🇦🇺",
    lat: -25.2744,
    lng: 133.7751,
    rapidApiGl: "au",
  },
  // Canada
  {
    code: "ca",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "C$",
    flag: "🇨🇦",
    lat: 56.1304,
    lng: -106.3468,
    rapidApiGl: "ca",
  },
  // Japan
  {
    code: "jp",
    name: "Japan",
    currency: "JPY",
    currencySymbol: "¥",
    flag: "🇯🇵",
    lat: 36.2048,
    lng: 138.2529,
    rapidApiGl: "jp",
  },
  // Singapore
  {
    code: "sg",
    name: "Singapore",
    currency: "SGD",
    currencySymbol: "S$",
    flag: "🇸🇬",
    lat: 1.3521,
    lng: 103.8198,
    rapidApiGl: "sg",
  },
  // UAE
  {
    code: "ae",
    name: "UAE",
    currency: "AED",
    currencySymbol: "د.إ",
    flag: "🇦🇪",
    lat: 23.4241,
    lng: 53.8478,
    rapidApiGl: "ae",
  },
  // France
  {
    code: "fr",
    name: "France",
    currency: "EUR",
    currencySymbol: "€",
    flag: "🇫🇷",
    lat: 46.2276,
    lng: 2.2137,
    rapidApiGl: "fr",
  },
];

// India is our reference point for the map connections
export const INDIA_LOCATION = {
  lat: 20.5937,
  lng: 78.9629,
  label: "India",
};

// Generate map connections from India to other countries
export function generateMapConnections(countries: CountryConfig[]) {
  return countries
    .filter((c) => c.code !== "in")
    .map((country) => ({
      start: INDIA_LOCATION,
      end: {
        lat: country.lat,
        lng: country.lng,
        label: country.name,
      },
    }));
}
