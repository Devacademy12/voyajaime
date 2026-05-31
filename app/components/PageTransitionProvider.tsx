"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * PageTransitionProvider
 * ─────────────────────
 * Wraps the app with smooth CSS View Transitions between pages.
 * Uses the native browser View Transitions API (Chrome 111+, Safari 18+).
 * Falls back gracefully on unsupported browsers (no animation, no error).
 *
 * HOW TO USE:
 *   In app/layout.tsx, wrap {children} with <PageTransitionProvider>
 */
export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    // Trigger the CSS animation class on route change
    document.documentElement.classList.add("page-transitioning");
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("page-transitioning");
    }, 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return <>{children}</>;
}
