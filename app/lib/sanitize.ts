"use client";

/**
 * sanitize.ts — Nettoyage des données contre les attaques XSS
 *
 * XSS = Cross-Site Scripting
 * Quelqu'un envoie du code malveillant dans un formulaire :
 *   Ex: <script>document.cookie</script>
 * Ce fichier nettoie le texte avant de l'afficher.
 */

import DOMPurify from "dompurify";

/**
 * Nettoie un texte simple (noms, titres, descriptions...)
 * Supprime tout le HTML et les scripts malveillants
 *
 * Exemple :
 *   sanitizeText("<script>hack()</script>Bonjour")
 *   → "Bonjour"
 */
export function sanitizeText(value: string): string {
  if (!value) return "";
  // Supprime TOUT le HTML — texte pur uniquement
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Nettoie du HTML riche (descriptions avec mise en forme)
 * Garde uniquement les balises sûres : gras, italique, listes...
 * Supprime les scripts, iframes, onclick, etc.
 *
 * Exemple :
 *   sanitizeHtml("<b>Bonjour</b><script>hack()</script>")
 *   → "<b>Bonjour</b>"
 */
export function sanitizeHtml(value: string): string {
  if (!value) return "";
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ["b", "i", "u", "strong", "em", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

/**
 * Nettoie un objet entier (ex: données d'un formulaire)
 * Pratique pour nettoyer d'un coup tous les champs
 *
 * Exemple :
 *   sanitizeObject({ nom: "<script>hack</script>Ahmed", ville: "Tunis" })
 *   → { nom: "Ahmed", ville: "Tunis" }
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const cleaned = { ...obj };
  for (const key in cleaned) {
    if (typeof cleaned[key] === "string") {
      (cleaned as Record<string, unknown>)[key] = sanitizeText(cleaned[key] as string);
    }
  }
  return cleaned;
}