// Groq LLM Product Validation
// Uses Groq's fast LLM to validate if a product listing matches the search query

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ProductValidationResult {
    isValid: boolean;
    reason: string;
    confidence: number;
}

interface ProductToValidate {
    title: string;
    price: number;
    currency: string;
}

/**
 * Validate a batch of products against the search query using Groq LLM
 * Returns which products are valid (actually match the search query)
 */
export async function validateProductsWithLLM(
    searchQuery: string,
    products: ProductToValidate[]
): Promise<Map<number, ProductValidationResult>> {
    if (!GROQ_API_KEY || products.length === 0) {
        // If no API key, return all as valid (no filtering)
        const results = new Map<number, ProductValidationResult>();
        products.forEach((_, idx) => {
            results.set(idx, { isValid: true, reason: "No LLM validation", confidence: 0.5 });
        });
        return results;
    }

    // Create a concise prompt for batch validation
    const productList = products
        .map((p, idx) => `${idx + 1}. "${p.title}" - ${p.currency} ${p.price}`)
        .join("\n");

    const prompt = `You are a product validation assistant. Given a search query and product listings, determine which products are ACTUALLY the searched product (not accessories, cases, or different items).

SEARCH QUERY: "${searchQuery}"

PRODUCTS:
${productList}

For each product, respond with ONLY a JSON array like:
[
  {"idx": 1, "valid": true, "reason": "exact match"},
  {"idx": 2, "valid": false, "reason": "this is a phone case, not the phone"},
  ...
]

Rules:
- valid=true ONLY if it's the actual product being searched (not accessories, cases, chargers, etc.)
- valid=false for screen protectors, cases, covers, cables, unrelated items
- valid=false if the title clearly indicates a different product
- valid=true for different storage variants (128GB, 256GB, etc.) of the same product
- valid=true for different color variants
- Be strict - when in doubt, mark as invalid

Respond with ONLY the JSON array, no other text.`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            console.error("Groq API error:", response.status);
            // Return all as valid on error
            const results = new Map<number, ProductValidationResult>();
            products.forEach((_, idx) => {
                results.set(idx, { isValid: true, reason: "API error", confidence: 0.5 });
            });
            return results;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "[]";

        // Parse the JSON response
        let validations: Array<{ idx: number; valid: boolean; reason: string }> = [];
        try {
            // Clean up the response - remove markdown code blocks if present
            const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
            validations = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error("Failed to parse Groq response:", content);
            // Return all as valid on parse error
            const results = new Map<number, ProductValidationResult>();
            products.forEach((_, idx) => {
                results.set(idx, { isValid: true, reason: "Parse error", confidence: 0.5 });
            });
            return results;
        }

        // Build results map
        const results = new Map<number, ProductValidationResult>();
        validations.forEach((v) => {
            const productIdx = v.idx - 1; // Convert 1-indexed to 0-indexed
            results.set(productIdx, {
                isValid: v.valid,
                reason: v.reason,
                confidence: 0.9,
            });
        });

        // Fill in any missing indices as valid
        products.forEach((_, idx) => {
            if (!results.has(idx)) {
                results.set(idx, { isValid: true, reason: "Not validated", confidence: 0.5 });
            }
        });

        return results;
    } catch (error) {
        console.error("Groq validation error:", error);
        // Return all as valid on error
        const results = new Map<number, ProductValidationResult>();
        products.forEach((_, idx) => {
            results.set(idx, { isValid: true, reason: "Error", confidence: 0.5 });
        });
        return results;
    }
}

/**
 * Quick validation for a single product without LLM (uses heuristics)
 */
export function quickValidateProduct(searchQuery: string, productTitle: string, price: number): boolean {
    const query = searchQuery.toLowerCase();
    const title = productTitle.toLowerCase();

    // Extract key product identifiers from search query
    const queryWords = query.split(/\s+/);

    // Check if title contains the main product identifiers
    let matchScore = 0;
    for (const word of queryWords) {
        if (word.length > 2 && title.includes(word)) {
            matchScore++;
        }
    }

    // Need at least 50% word match
    const matchRatio = matchScore / queryWords.length;
    if (matchRatio < 0.5) {
        return false;
    }

    // Check for accessory keywords that indicate it's NOT the main product
    const accessoryKeywords = [
        "case", "cover", "screen protector", "film", "charger", "cable",
        "adapter", "holder", "stand", "skin", "sleeve", "pouch", "strap",
        "coque", "hülle", "schutzhülle", "tasche", "étui", "protection",
        "pellicule", "tempered glass", "wallet", "folio", "bumper", "shell",
        "mount", "tripod", "lens", "grip", "ring", "band", "ケース", "カバー",
        "フィルム", "充電器"
    ];

    for (const keyword of accessoryKeywords) {
        if (title.includes(keyword)) {
            return false;
        }
    }

    return true;
}
