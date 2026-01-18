// Trusted retailer configuration for each country
// Only results from these retailers will be shown to ensure accurate pricing

export interface TrustedRetailer {
    name: string;
    domain: string;
    aliases: string[]; // Alternative names that may appear in search results
}

// Comprehensive list of trusted retailers per country
export const TRUSTED_RETAILERS: Record<string, TrustedRetailer[]> = {
    // India
    in: [
        { name: "Amazon India", domain: "amazon.in", aliases: ["amazon", "amazon.in"] },
        { name: "Flipkart", domain: "flipkart.com", aliases: ["flipkart"] },
        { name: "Reliance Digital", domain: "reliancedigital.in", aliases: ["reliance digital", "reliance"] },
        { name: "Croma", domain: "croma.com", aliases: ["croma"] },
        { name: "Vijay Sales", domain: "vijaysales.com", aliases: ["vijay sales"] },
        { name: "Tata Cliq", domain: "tatacliq.com", aliases: ["tata cliq", "tatacliq"] },
    ],

    // United States
    us: [
        { name: "Amazon", domain: "amazon.com", aliases: ["amazon", "amazon.com"] },
        { name: "Walmart", domain: "walmart.com", aliases: ["walmart"] },
        { name: "Best Buy", domain: "bestbuy.com", aliases: ["best buy", "bestbuy"] },
        { name: "eBay", domain: "ebay.com", aliases: ["ebay"] },
        { name: "B&H Photo Video", domain: "bhphotovideo.com", aliases: ["b&h", "b&h photo", "bhphotovideo"] },
        { name: "Target", domain: "target.com", aliases: ["target"] },
        { name: "Costco", domain: "costco.com", aliases: ["costco"] },
        { name: "Newegg", domain: "newegg.com", aliases: ["newegg"] },
        { name: "Apple", domain: "apple.com", aliases: ["apple"] },
    ],

    // United Kingdom
    gb: [
        { name: "Amazon UK", domain: "amazon.co.uk", aliases: ["amazon", "amazon.co.uk", "amazon uk"] },
        { name: "Argos", domain: "argos.co.uk", aliases: ["argos"] },
        { name: "Currys", domain: "currys.co.uk", aliases: ["currys", "curry's"] },
        { name: "John Lewis", domain: "johnlewis.com", aliases: ["john lewis"] },
        { name: "Very", domain: "very.co.uk", aliases: ["very"] },
        { name: "AO", domain: "ao.com", aliases: ["ao", "ao.com"] },
    ],

    // Germany
    de: [
        { name: "Amazon Germany", domain: "amazon.de", aliases: ["amazon", "amazon.de", "amazon germany"] },
        { name: "MediaMarkt", domain: "mediamarkt.de", aliases: ["mediamarkt", "media markt"] },
        { name: "Saturn", domain: "saturn.de", aliases: ["saturn"] },
        { name: "Otto", domain: "otto.de", aliases: ["otto"] },
        { name: "Cyberport", domain: "cyberport.de", aliases: ["cyberport"] },
        { name: "Notebooksbilliger", domain: "notebooksbilliger.de", aliases: ["notebooksbilliger"] },
        { name: "Alternate", domain: "alternate.de", aliases: ["alternate"] },
        { name: "Conrad", domain: "conrad.de", aliases: ["conrad"] },
    ],

    // France
    fr: [
        { name: "Amazon France", domain: "amazon.fr", aliases: ["amazon", "amazon.fr", "amazon france"] },
        { name: "Fnac", domain: "fnac.com", aliases: ["fnac"] },
        { name: "Darty", domain: "darty.com", aliases: ["darty"] },
        { name: "Boulanger", domain: "boulanger.com", aliases: ["boulanger"] },
        { name: "Cdiscount", domain: "cdiscount.com", aliases: ["cdiscount"] },
        { name: "Rue du Commerce", domain: "rueducommerce.fr", aliases: ["rue du commerce", "rueducommerce"] },
    ],

    // Australia
    au: [
        { name: "Amazon Australia", domain: "amazon.com.au", aliases: ["amazon", "amazon.com.au", "amazon australia"] },
        { name: "JB Hi-Fi", domain: "jbhifi.com.au", aliases: ["jb hi-fi", "jb hifi", "jbhifi"] },
        { name: "Harvey Norman", domain: "harveynorman.com.au", aliases: ["harvey norman"] },
        { name: "The Good Guys", domain: "thegoodguys.com.au", aliases: ["the good guys", "good guys"] },
        { name: "Kogan", domain: "kogan.com", aliases: ["kogan"] },
        { name: "Officeworks", domain: "officeworks.com.au", aliases: ["officeworks"] },
        { name: "Big W", domain: "bigw.com.au", aliases: ["big w", "bigw"] },
    ],

    // Canada
    ca: [
        { name: "Amazon Canada", domain: "amazon.ca", aliases: ["amazon", "amazon.ca", "amazon canada"] },
        { name: "Best Buy Canada", domain: "bestbuy.ca", aliases: ["best buy", "bestbuy"] },
        { name: "Canada Computers", domain: "canadacomputers.com", aliases: ["canada computers"] },
        { name: "Staples", domain: "staples.ca", aliases: ["staples"] },
        { name: "The Source", domain: "thesource.ca", aliases: ["the source"] },
        { name: "Walmart Canada", domain: "walmart.ca", aliases: ["walmart"] },
    ],

    // Japan
    jp: [
        { name: "Amazon Japan", domain: "amazon.co.jp", aliases: ["amazon", "amazon.co.jp", "amazon japan", "amazon公式サイト"] },
        { name: "Rakuten", domain: "rakuten.co.jp", aliases: ["rakuten", "楽天"] },
        { name: "Bic Camera", domain: "biccamera.com", aliases: ["bic camera", "biccamera", "ビックカメラ"] },
        { name: "Yodobashi", domain: "yodobashi.com", aliases: ["yodobashi", "ヨドバシ"] },
        { name: "Yamada Denki", domain: "yamada-denkiweb.com", aliases: ["yamada denki", "yamada", "ヤマダ電機"] },
        { name: "Joshin", domain: "joshinweb.jp", aliases: ["joshin", "ジョーシン"] },
        { name: "Nojima", domain: "nojima.co.jp", aliases: ["nojima", "ノジマ"] },
    ],

    // Singapore
    sg: [
        { name: "Amazon Singapore", domain: "amazon.sg", aliases: ["amazon", "amazon.sg", "amazon singapore"] },
        { name: "Shopee Singapore", domain: "shopee.sg", aliases: ["shopee"] },
        { name: "Lazada Singapore", domain: "lazada.sg", aliases: ["lazada"] },
        { name: "Courts", domain: "courts.com.sg", aliases: ["courts"] },
        { name: "Challenger", domain: "challenger.sg", aliases: ["challenger"] },
        { name: "Harvey Norman Singapore", domain: "harveynorman.com.sg", aliases: ["harvey norman"] },
    ],

    // UAE
    ae: [
        { name: "Amazon UAE", domain: "amazon.ae", aliases: ["amazon", "amazon.ae", "amazon uae"] },
        { name: "Noon", domain: "noon.com", aliases: ["noon"] },
        { name: "Sharaf DG", domain: "sharafdg.com", aliases: ["sharaf dg", "sharaf"] },
        { name: "Jumbo Electronics", domain: "jumbo.ae", aliases: ["jumbo", "jumbo electronics"] },
        { name: "Carrefour UAE", domain: "carrefouruae.com", aliases: ["carrefour"] },
        { name: "Virgin Megastore", domain: "virginmegastore.ae", aliases: ["virgin", "virgin megastore"] },
    ],
};

/**
 * Check if a store name matches any trusted retailer for the given country
 */
export function isTrustedRetailer(storeName: string, countryCode: string): boolean {
    const retailers = TRUSTED_RETAILERS[countryCode.toLowerCase()];
    if (!retailers) return false;

    const normalizedStore = storeName.toLowerCase().trim();

    for (const retailer of retailers) {
        // Check exact domain match
        if (normalizedStore.includes(retailer.domain)) return true;

        // Check retailer name
        if (normalizedStore.includes(retailer.name.toLowerCase())) return true;

        // Check aliases
        for (const alias of retailer.aliases) {
            if (normalizedStore.includes(alias.toLowerCase())) return true;
            // Also check if the alias is contained in the store name
            if (alias.toLowerCase().includes(normalizedStore) && normalizedStore.length > 3) return true;
        }
    }

    return false;
}

/**
 * Get list of trusted retailer names for a country (for display)
 */
export function getTrustedRetailerNames(countryCode: string): string[] {
    const retailers = TRUSTED_RETAILERS[countryCode.toLowerCase()];
    if (!retailers) return [];
    return retailers.map(r => r.name);
}

/**
 * Get all trusted domains for a country
 */
export function getTrustedDomains(countryCode: string): string[] {
    const retailers = TRUSTED_RETAILERS[countryCode.toLowerCase()];
    if (!retailers) return [];
    return retailers.map(r => r.domain);
}
