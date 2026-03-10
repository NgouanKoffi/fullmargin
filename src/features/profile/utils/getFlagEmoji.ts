// src/utils/getFlagEmoji.ts
// Transforme "CI" en 🇨🇮 (emoji flag, hyper rapide)
export default function getFlagEmoji(isoCode: string): string {
    if (!isoCode) return "";
    const code = isoCode.toUpperCase();
    // A -> 127462 (0x1F1E6). Regional Indicator trick.
    return [...code].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join("");
  }  