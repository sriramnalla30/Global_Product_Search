"use client";

import { motion } from "framer-motion";
import { ExternalLink, Star, Tag, Truck, RotateCcw } from "lucide-react";
import { CountryConfig, ProductOffer } from "@/types";
import { extractPriceNumber, convertToINR as convertToINRUtil } from "@/lib/utils";

interface CountryPriceCardProps {
  country: CountryConfig;
  offers: ProductOffer[];
  exchangeRates: Record<string, number>;
  isLoading: boolean;
  isCheapest?: boolean;
}

export function CountryPriceCard({
  country,
  offers,
  exchangeRates,
  isLoading,
  isCheapest,
}: CountryPriceCardProps) {
  const convertToINR = (priceStr: string, currency: string): number => {
    const price = extractPriceNumber(priceStr);
    return convertToINRUtil(price, currency, exchangeRates);
  };

  const cheapestOffer = offers.length > 0
    ? offers.reduce((min, offer) => {
      const minPrice = extractPriceNumber(min.price);
      const offerPrice = extractPriceNumber(offer.price);
      return offerPrice < minPrice ? offer : min;
    }, offers[0])
    : null;

  const cheapestINR = cheapestOffer
    ? convertToINR(cheapestOffer.price, country.currency)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${isCheapest
        ? "border-green-500 ring-4 ring-green-500/20 dark:shadow-green-500/10"
        : "border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500"
        }`}
    >
      {/* Country Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{country.flag}</span>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {country.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {country.currency}
            </p>
          </div>
        </div>
        {isCheapest && (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
            🏆 Best Price
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && offers.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p>No offers found in this region</p>
        </div>
      )}

      {/* Offers List */}
      {!isLoading && offers.length > 0 && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {/* Sources Summary */}
          <div className="flex flex-wrap gap-1 mb-2">
            {Array.from(new Set(offers.map(o => o.source).filter(Boolean))).map(source => (
              <span key={source} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                {source}
              </span>
            ))}
          </div>
          {offers.slice(0, 8).map((offer, idx) => {
            const inrPrice = convertToINR(offer.price, country.currency);
            return (
              <motion.a
                key={offer.offer_id || idx}
                href={offer.offer_page_url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="block p-4 bg-gray-50 dark:bg-gray-800/80 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group border border-transparent dark:border-gray-700/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {offer.store_favicon && (
                        <img
                          src={offer.store_favicon}
                          alt={offer.store_name}
                          className="w-4 h-4 rounded"
                        />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {offer.store_name}
                      </span>
                      {offer.store_rating && (
                        <span className="flex items-center gap-1 text-xs text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          {offer.store_rating}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {offer.price}
                      </span>
                      {offer.original_price && (
                        <span className="text-sm text-gray-400 line-through">
                          {offer.original_price}
                        </span>
                      )}
                      {offer.percent_off && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {offer.percent_off}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                      ≈ ₹{inrPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })} INR
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {offer.shipping && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {offer.shipping.substring(0, 30)}
                        </span>
                      )}
                      {offer.returns && (
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          {offer.returns.substring(0, 25)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {offer.offer_badge && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                          <Tag className="w-3 h-3" />
                          {offer.offer_badge}
                        </span>
                      )}
                      {offer.source && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                          via {offer.source}
                        </span>
                      )}
                      {offer.is_prime && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
                          🚀 Prime
                        </span>
                      )}
                    </div>
                  </div>

                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </div>
              </motion.a>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {!isLoading && offers.length > 0 && cheapestOffer && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Best price in {country.name}:
            </span>
            <div className="text-right">
              <p className="font-bold text-lg text-gray-900 dark:text-white">
                {cheapestOffer.price}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ≈ ₹{cheapestINR.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
