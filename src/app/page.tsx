"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Moon, Sun, Zap, Shield, Clock } from "lucide-react";
import { useTheme } from "next-themes";
import { WorldMap } from "@/components/ui/map";
import { SearchBar } from "@/components/search-bar";
import { ProductConfirmation } from "@/components/product-confirmation";
import { CountryPriceCard } from "@/components/country-price-card";
import { PriceAnalysis } from "@/components/price-analysis";
import { COUNTRIES, generateMapConnections } from "@/config/countries";
import { CountryConfig, ProductOffer } from "@/types";
import { extractPriceNumber, convertToINR } from "@/lib/utils";

interface CountryResult {
  country: CountryConfig;
  offers: ProductOffer[];
  loading: boolean;
  error?: string;
}

export default function Home() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [results, setResults] = useState<CountryResult[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [hasSearched, setHasSearched] = useState(false);

  // Fix hydration mismatch - only render theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate map connections for visualization
  const mapConnections = generateMapConnections(COUNTRIES);

  // Fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch("/api/currency");
      const data = await response.json();
      setExchangeRates(data.data || {});
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    }
  }, []);

  // Search for product in a specific country using TRUSTED sources only (Amazon, Walmart, eBay)
  const searchInCountry = useCallback(
    async (query: string, country: CountryConfig): Promise<ProductOffer[]> => {
      try {
        // Use trusted-search endpoint (Amazon + Walmart + eBay only)
        const response = await fetch(
          `/api/trusted-search?query=${encodeURIComponent(query)}&country=${country.code}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.data?.products) {
          // Extract offers from products
          const offers: ProductOffer[] = [];
          for (const product of data.data.products.slice(0, 10)) {
            if (product.offer) {
              offers.push(product.offer);
            }
          }
          console.log(`${country.name}: Found ${offers.length} offers from ${data.sources_used?.join(', ') || 'trusted sources'}`);
          return offers;
        }
        return [];
      } catch (error) {
        console.error(`Search failed for ${country.name}:`, error);
        return [];
      }
    },
    []
  );

  // Handle search initiation
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowConfirmation(true);
  };

  // Handle search confirmation
  const handleConfirmSearch = async () => {
    setShowConfirmation(false);
    setIsSearching(true);
    setHasSearched(true);

    // Initialize results with loading state
    setResults(
      COUNTRIES.map((country) => ({
        country,
        offers: [],
        loading: true,
      }))
    );

    // Fetch exchange rates
    await fetchExchangeRates();

    // Search in all countries in parallel (with rate limiting)
    const searchPromises = COUNTRIES.map(async (country, idx) => {
      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, idx * 200));
      const offers = await searchInCountry(searchQuery, country);

      setResults((prev) =>
        prev.map((r) =>
          r.country.code === country.code
            ? { ...r, offers, loading: false }
            : r
        )
      );

      return { country, offers };
    });

    await Promise.all(searchPromises);
    setIsSearching(false);
  };

  // Handle search rejection
  const handleRejectSearch = () => {
    setShowConfirmation(false);
    setSearchQuery("");
  };

  // Calculate cheapest INR price for each country
  const getAnalysisData = () => {
    return results
      .filter((r) => !r.loading && r.offers.length > 0)
      .map((r) => {
        const cheapestOffer = r.offers.reduce((min, offer) => {
          const minPrice = extractPriceNumber(min.price);
          const offerPrice = extractPriceNumber(offer.price);
          return offerPrice < minPrice ? offer : min;
        }, r.offers[0]);

        const price = extractPriceNumber(cheapestOffer.price);
        const cheapestINR = convertToINR(price, r.country.currency, exchangeRates);

        return {
          country: r.country,
          offers: r.offers,
          cheapestINR,
        };
      });
  };

  // Find cheapest country
  const analysisData = getAnalysisData();
  const cheapestCountryCode = analysisData.length > 0
    ? analysisData.reduce((min, r) =>
      r.cheapestINR < min.cheapestINR ? r : min
    ).country.code
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800/50 shadow-sm dark:shadow-gray-950/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Global Price Compare
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Find the best prices worldwide
              </p>
            </div>
          </div>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Compare Prices{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">
              Globally
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Search any product and compare prices across 10+ countries. Find the
            best deals from USA, UK, Germany, Japan, India, and more.
          </p>
        </motion.div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { icon: Zap, text: "Real-time prices", color: "text-yellow-500" },
            { icon: Globe, text: "10+ countries", color: "text-blue-500" },
            { icon: Shield, text: "Verified stores", color: "text-green-500" },
            { icon: Clock, text: "Live currency rates", color: "text-purple-500" },
          ].map((feature, idx) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800/80 rounded-full shadow-md border border-gray-200 dark:border-gray-700/50 dark:shadow-gray-950/30"
            >
              <feature.icon className={`w-4 h-4 ${feature.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {feature.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Search Bar or Confirmation */}
        <AnimatePresence mode="wait">
          {showConfirmation ? (
            <ProductConfirmation
              key="confirmation"
              productName={searchQuery}
              onConfirm={handleConfirmSearch}
              onReject={handleRejectSearch}
            />
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* World Map Visualization */}
      {hasSearched && (
        <section className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Searching Worldwide for &ldquo;{searchQuery}&rdquo;
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
              Connecting to stores across the globe to find you the best prices
            </p>
            <WorldMap dots={mapConnections} lineColor="#0ea5e9" />
          </motion.div>
        </section>
      )}

      {/* Price Analysis */}
      {hasSearched && !isSearching && analysisData.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <PriceAnalysis results={analysisData} productName={searchQuery} />
        </section>
      )}

      {/* Results Grid */}
      {hasSearched && (
        <section className="container mx-auto px-4 py-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Prices by Country
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((result) => (
              <CountryPriceCard
                key={result.country.code}
                country={result.country}
                offers={result.offers}
                exchangeRates={exchangeRates}
                isLoading={result.loading}
                isCheapest={result.country.code === cheapestCountryCode}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>
            Global Price Compare — Compare prices across 10+ countries and save
            money on your purchases.
          </p>
          <p className="mt-2">
            Prices are fetched in real-time and converted to INR for easy
            comparison.
          </p>
        </div>
      </footer>
    </main>
  );
}
