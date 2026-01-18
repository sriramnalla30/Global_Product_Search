"use client";

import { motion } from "framer-motion";
import { TrendingDown, Globe, Award, ArrowRight } from "lucide-react";
import { CountryConfig, ProductOffer } from "@/types";
import { extractPriceNumber } from "@/lib/utils";

interface PriceAnalysisProps {
  results: Array<{
    country: CountryConfig;
    offers: ProductOffer[];
    cheapestINR: number;
  }>;
  productName: string;
}

export function PriceAnalysis({ results, productName }: PriceAnalysisProps) {
  // Filter out countries with no offers
  const validResults = results.filter((r) => r.offers.length > 0 && r.cheapestINR > 0);

  if (validResults.length === 0) {
    return null;
  }

  // Sort by cheapest INR price
  const sortedResults = [...validResults].sort((a, b) => a.cheapestINR - b.cheapestINR);
  const cheapest = sortedResults[0];
  const mostExpensive = sortedResults[sortedResults.length - 1];
  const savings = mostExpensive.cheapestINR - cheapest.cheapestINR;
  const savingsPercent = ((savings / mostExpensive.cheapestINR) * 100).toFixed(1);

  // India's price for comparison
  const indiaResult = validResults.find((r) => r.country.code === "in");
  const indiaSavings = indiaResult
    ? indiaResult.cheapestINR - cheapest.cheapestINR
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 md:p-8 shadow-xl border border-emerald-100 dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
          <TrendingDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Global Price Analysis
        </h2>
      </div>

      {/* Best Deal Highlight */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 border-2 border-emerald-500">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
            <Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">
              🏆 BEST GLOBAL PRICE
            </p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{cheapest.country.flag}</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {cheapest.country.name}
              </span>
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              ₹{cheapest.cheapestINR.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            {cheapest.offers[0] && (
              <a
                href={cheapest.offers[0].offer_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Buy from {cheapest.offers[0].store_name}
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {savings > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">
              Save up to{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ₹{savings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>{" "}
              ({savingsPercent}%) compared to {mostExpensive.country.name}!
            </p>
          </div>
        )}
      </div>

      {/* Comparison with India */}
      {indiaResult && cheapest.country.code !== "in" && indiaSavings > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Globe className="w-5 h-5" />
            <p>
              Buying from <strong>{cheapest.country.name}</strong> instead of{" "}
              <strong>India</strong> saves you{" "}
              <span className="font-bold">
                ₹{indiaSavings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Price Ranking */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Price Ranking (Cheapest to Highest)
        </h3>
        {sortedResults.map((result, idx) => {
          const priceDiff = result.cheapestINR - cheapest.cheapestINR;
          const percentMore = ((priceDiff / cheapest.cheapestINR) * 100).toFixed(1);

          return (
            <motion.div
              key={result.country.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-lg ${
                idx === 0
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-white dark:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">
                  #{idx + 1}
                </span>
                <span className="text-xl">{result.country.flag}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.country.name}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">
                  ₹{result.cheapestINR.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
                {idx > 0 && (
                  <p className="text-xs text-red-500">
                    +{percentMore}% more
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
