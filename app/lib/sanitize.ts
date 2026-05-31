// ✅ Pas de "use client" — ce fichier s'utilise côté client ET serveur

function getSanitizer() {
  if (typeof window === "undefined") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("dompurify");
    const purify = DOMPurify.default || DOMPurify;
    if (typeof purify.sanitize === "function") return purify;
  } catch {
    // fallback silencieux
  }
  return null;
}

export function sanitizeText(value: string): string {
  if (!value || typeof value !== "string") return "";
  const purify = getSanitizer();
  if (purify) {
    return purify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
  }
  // Côté serveur : on strip les balises HTML uniquement
  return value.replace(/<[^>]*>/g, "").trim();
}

export function sanitizeHtml(value: string): string {
  if (!value || typeof value !== "string") return "";
  const purify = getSanitizer();
  if (purify) {
    return purify.sanitize(value, {
      ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "p", "br", "ul", "ol", "li"],
      ALLOWED_ATTR: [],
    }).trim();
  }
  return value.replace(/<[^>]*>/g, "").trim();
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
