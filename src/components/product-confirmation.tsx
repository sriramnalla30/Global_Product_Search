"use client";

import { motion } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";

interface ProductConfirmationProps {
  productName: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function ProductConfirmation({
  productName,
  onConfirm,
  onReject,
}: ProductConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-xl border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Confirm Your Search
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Is this the product you want to search for?
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {productName}
          </p>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          We&apos;ll search for the best prices across 10 countries including India,
          USA, UK, Germany, Australia, Canada, Japan, Singapore, UAE, and France.
        </p>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Check className="w-5 h-5" />
            Yes, Search This
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
            No, Modify Search
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
