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
  "nairobi": "KE",
  "mombasa": "KE",
  "kisumu": "KE",
  "lagos": "NG",
  "abuja": "NG",
  "port harcourt": "NG",
  "ibadan": "NG",
  "kigali": "RW",
  "accra": "GH",
  "kumasi": "GH",
  "cairo": "EG",
  "alexandria": "EG",
  "casablanca": "MA",
  "rabat": "MA",
  "kampala": "UG",
  "dar es salaam": "TZ",
  "dodoma": "TZ",
  "addis ababa": "ET",
  "dakar": "SN",
  "harare": "ZW",
  "bulawayo": "ZW",
  "gaborone": "BW",
  "windhoek": "NA",
  "lusaka": "ZM",
  "tunis": "TN",
  "algiers": "DZ",
  "abidjan": "CI",
  "luanda": "AO",
  "maputo": "MZ",
  "port louis": "MU",
  "yaounde": "CM",
  "douala": "CM",
  "london": "GB",
  "new york": "US",
  "san francisco": "US",
  "los angeles": "US",
  "seattle": "US",
  "austin": "US",
  "chicago": "US",
  "boston": "US",
  "berlin": "DE",
  "paris": "FR",
  "amsterdam": "NL",
  "dubai": "AE",
  "toronto": "CA",
  "vancouver": "CA",
  "sydney": "AU",
  "tokyo": "JP",
  "mumbai": "IN",
  "bengaluru": "IN",
  "bangalore": "IN",
  "singapore": "SG",
  "beijing": "CN",
  "shanghai": "CN",
};

export function detectCountryFromLocation(locationStr: string): CountryInfo | null {
  if (!locationStr || !locationStr.trim()) return null;
  const normalized = locationStr.toLowerCase().trim();

  // 1. Direct city check
  for (const [city, code] of Object.entries(CITY_TO_COUNTRY)) {
    if (normalized.includes(city)) {
      const match = COUNTRIES.find((c) => c.code === code);
      if (match) return match;
      return { code, name: code, flag: countryCodeToEmoji(code) };
    }
  }

  // 2. Direct country name check
  for (const country of COUNTRIES) {
    if (normalized.includes(country.name.toLowerCase())) {
      return country;
    }
  }

  // 3. Common abbreviations
  if (/\b(sa|rsa|south africa)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "ZA")!;
  if (/\b(usa|us|united states)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "US")!;
  if (/\b(uk|gb|britain)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "GB")!;
  if (/\b(ng|nigeria)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "NG")!;
  if (/\b(ke|kenya)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "KE")!;
  if (/\b(eg|egypt)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "EG")!;
  if (/\b(gh|ghana)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "GH")!;
  if (/\b(rw|rwanda)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "RW")!;
  if (/\b(tz|tanzania)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "TZ")!;
  if (/\b(ug|uganda)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "UG")!;
  if (/\b(zw|zimbabwe)\b/i.test(normalized)) return COUNTRIES.find((c) => c.code === "ZW")!;

  // 4. Match 2-letter codes in parts
  const parts = normalized.split(/[\s,]+/);
  for (const part of parts) {
    if (part.length === 2) {
      const upper = part.toUpperCase();
      const match = COUNTRIES.find((c) => c.code === upper);
      if (match) return match;
    }
  }

  return null;
}
