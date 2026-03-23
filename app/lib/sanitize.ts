"use client";

import createDOMPurify from "dompurify";

export function sanitizeText(value: string) {
  if (!value) return "";

  const DOMPurify = createDOMPurify(window);

  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
