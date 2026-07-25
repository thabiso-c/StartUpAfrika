export interface CountryInfo {
  code: string; // ISO 2-letter code e.g. "ZA"
  name: string; // "South Africa"
  flag: string; // Emoji e.g. "🇿🇦"
}

export function countryCodeToEmoji(code: string): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  const first = 127397 + upper.charCodeAt(0);
  const second = 127397 + upper.charCodeAt(1);
  return String.fromCodePoint(first, second);
}

export function getFlagImageUrl(code: string): string {
  if (!code || code.length !== 2) return "";
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CD", name: "DR Congo", flag: "🇨🇩" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
];

const CITY_TO_COUNTRY: Record<string, string> = {
  "johannesburg": "ZA",
  "cape town": "ZA",
  "durban": "ZA",
  "pretoria": "ZA",
  "stellenbosch": "ZA",
  "soweto": "ZA",
  "sandton": "ZA",
  "gqeberha": "ZA",
  "port elizabeth": "ZA",
  "bloemfontein": "ZA",
  "polokwane": "ZA",
  "nelspruit": "ZA",
  "mbombela": "ZA",
  "centurion": "ZA",
  "midrand": "ZA",
  "roodepoort": "ZA",
  "benoni": "ZA",
  "george": "ZA",
  "paarl": "ZA",
  "nairobi": "KE",
  "mombasa": "KE",
  "kisumu": "KE",
  "nakuru": "KE",
  "lagos": "NG",
  "abuja": "NG",
  "port harcourt": "NG",
  "ibadan": "NG",
  "kano": "NG",
  "enugu": "NG",
  "kigali": "RW",
  "accra": "GH",
  "kumasi": "GH",
  "cairo": "EG",
  "alexandria": "EG",
  "giza": "EG",
  "casablanca": "MA",
  "rabat": "MA",
  "marrakesh": "MA",
  "kampala": "UG",
  "entebbe": "UG",
  "dar es salaam": "TZ",
  "dodoma": "TZ",
  "arusha": "TZ",
  "addis ababa": "ET",
  "dakar": "SN",
  "harare": "ZW",
  "bulawayo": "ZW",
  "gaborone": "BW",
  "windhoek": "NA",
  "lusaka": "ZM",
  "ndola": "ZM",
  "tunis": "TN",
  "algiers": "DZ",
  "abidjan": "CI",
  "luanda": "AO",
  "maputo": "MZ",
  "port louis": "MU",
  "yaounde": "CM",
  "douala": "CM",
  "blantyre": "MW",
  "lilongwe": "MW",
  "kinshasa": "CD",
  "lubumbashi": "CD",
  "brazzaville": "CG",
  "maseru": "LS",
  "mbabane": "SZ",
  "manzini": "SZ",
  "london": "GB",
  "manchester": "GB",
  "birmingham": "GB",
  "edinburgh": "GB",
  "new york": "US",
  "san francisco": "US",
  "silicon valley": "US",
  "los angeles": "US",
  "seattle": "US",
  "austin": "US",
  "chicago": "US",
  "boston": "US",
  "miami": "US",
  "berlin": "DE",
  "munich": "DE",
  "frankfurt": "DE",
  "paris": "FR",
  "amsterdam": "NL",
  "dubai": "AE",
  "abu dhabi": "AE",
  "toronto": "CA",
  "vancouver": "CA",
  "montreal": "CA",
  "sydney": "AU",
  "melbourne": "AU",
  "tokyo": "JP",
  "seoul": "KR",
  "mumbai": "IN",
  "bengaluru": "IN",
  "bangalore": "IN",
  "delhi": "IN",
  "singapore": "SG",
  "beijing": "CN",
  "shanghai": "CN",
  "shenzhen": "CN",
  "stockholm": "SE",
  "zurich": "CH",
  "tel aviv": "IL",
  "dublin": "IE",
  "madrid": "ES",
  "barcelona": "ES",
  "lisbon": "PT",
};

export function detectCountryFromLocation(locationStr: string): CountryInfo | null {
  if (!locationStr || !locationStr.trim()) return null;
  const normalized = locationStr.toLowerCase().trim();

  // 1. Emoji flag detection (parse Regional Indicator Symbols \u{1F1E6} to \u{1F1FA})
  for (let i = 0; i < locationStr.length; i++) {
    const cp = locationStr.codePointAt(i);
    if (cp && cp >= 127462 && cp <= 127481) {
      // Find second regional indicator
      const nextIdx = i + (cp > 0xffff ? 2 : 1);
      if (nextIdx < locationStr.length) {
        const cp2 = locationStr.codePointAt(nextIdx);
        if (cp2 && cp2 >= 127462 && cp2 <= 127481) {
          const char1 = String.fromCharCode(65 + (cp - 127462));
          const char2 = String.fromCharCode(65 + (cp2 - 127462));
          const code = char1 + char2;
          const match = COUNTRIES.find((c) => c.code === code);
          if (match) return match;
          return { code, name: code, flag: countryCodeToEmoji(code) };
        }
      }
    }
  }

  // 2. Direct city lookup
  for (const [city, code] of Object.entries(CITY_TO_COUNTRY)) {
    if (normalized.includes(city)) {
      const match = COUNTRIES.find((c) => c.code === code);
      if (match) return match;
      return { code, name: code, flag: countryCodeToEmoji(code) };
    }
  }

  // 3. Direct country name check
  for (const country of COUNTRIES) {
    if (normalized.includes(country.name.toLowerCase())) {
      return country;
    }
  }

  // 4. Common country aliases and abbreviations
  if (/\b(sa|rsa|south africa|south-africa|s\. africa|s africa)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "ZA")!;
  }
  if (/\b(usa|us|united states|u\.s\.a\.|u\.s\.)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "US")!;
  }
  if (/\b(uk|gb|britain|great britain|united kingdom)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "GB")!;
  }
  if (/\b(ng|nigeria)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "NG")!;
  }
  if (/\b(ke|kenya)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "KE")!;
  }
  if (/\b(eg|egypt)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "EG")!;
  }
  if (/\b(gh|ghana)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "GH")!;
  }
  if (/\b(rw|rwanda)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "RW")!;
  }
  if (/\b(tz|tanzania)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "TZ")!;
  }
  if (/\b(ug|uganda)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "UG")!;
  }
  if (/\b(zw|zimbabwe)\b/i.test(normalized)) {
    return COUNTRIES.find((c) => c.code === "ZW")!;
  }

  // 5. Match 2-letter ISO country codes in words or comma separators (e.g., "Cape Town, ZA")
  const parts = normalized.split(/[\s,().\/|-]+/);
  for (const part of parts) {
    if (part.length === 2) {
      const upper = part.toUpperCase();
      const match = COUNTRIES.find((c) => c.code === upper);
      if (match) return match;
    }
  }

  return null;
}
