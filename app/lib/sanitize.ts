"use client";

function getSanitizer() {
  if (typeof window === "undefined") return null;
  try {
    const DOMPurify = require("dompurify");
    const purify = DOMPurify.default || DOMPurify;
    if (typeof purify.sanitize === "function") return purify;
  } catch {
    // fallback
  }
  return null;
}

export function sanitizeText(value: string): string {
  if (!value || typeof value !== "string") return "";
  const purify = getSanitizer();
  if (purify) {
    return purify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  // Côté serveur : React échappe déjà le HTML automatiquement
  // On retire juste les balises script/html sans modifier les caractères
  return value.replace(/<[^>]*>/g, "");
}

export function sanitizeHtml(value: string): string {
  if (!value || typeof value !== "string") return "";
  const purify = getSanitizer();
  if (purify) {
    return purify.sanitize(value, {
      ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "p", "br", "ul", "ol", "li"],
      ALLOWED_ATTR: [],
    });
  }
  return value.replace(/<[^>]*>/g, "");
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const cleaned = { ...obj };
  for (const key in cleaned) {
    if (typeof cleaned[key] === "string") {
      (cleaned as Record<string, unknown>)[key] = sanitizeText(cleaned[key] as string);
    }
  }
  return cleaned;
}
