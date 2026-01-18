"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const suggestions = [
    "Samsung Galaxy S25",
    "iPhone 16 Pro",
    "MacBook Pro M3",
    "Sony WH-1000XM5",
    "PlayStation 5",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any product..."
              className="w-full px-4 py-4 pl-12 text-base md:text-lg bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 shadow-lg text-gray-900 dark:text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full md:w-auto px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Search Globally"
            )}
          </button>
        </div>
      </form>

      {/* Quick suggestions - scrollable on mobile */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Try:
        </span>
        <div className="flex gap-2">
          {suggestions.map((suggestion) => (
            <motion.button
              key={suggestion}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion);
              }}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full transition-colors whitespace-nowrap"
              disabled={isLoading}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

