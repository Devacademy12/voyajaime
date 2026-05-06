"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/lib/routes";

// Components
import TouristeNav from "@/app/components/touriste/TouristeNav";
import AuthModal    from "@/app/components/auth/AuthModal";
import HomeStyles        from "@/app/components/home/HomeStyles";
import HeroSlider        from "@/app/components/home/HeroSlider";
import PathsSection      from "@/app/components/home/PathsSection";
import PopularExcursions from "@/app/components/home/PopularExcursions";
import HomeFooter        from "@/app/components/home/HomeFooter";

// Shared types & utils
import { SlideExcursion, Excursion, SLIDE_COLORS, FALLBACK_IMG } from "@/lib/homeUtils";

export default function HomePage() {
  /* ── Slider state ── */
  const [slides,        setSlides]        = useState<SlideExcursion[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(true);
  const [current,       setCurrent]       = useState(0);
  const [fading,        setFading]        = useState(false);
  const [progress,      setProgress]      = useState(0);

  /* ── Auth / user state ── */
  const [user,      setUser]      = useState<{ email?: string; id?: string } | null>(null);
  const [favCount,  setFavCount]  = useState(0);
  const [userName,  setUserName]  = useState<string | undefined>(undefined);

  /* ── Excursions state ── */
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [excLoading, setExcLoading] = useState(true);

  /* ── Auth modal state ── */
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | "prestataire">("login");

  const router   = useRouter();
  const supabase = useMemo(() => createClient(), []);

  /* ── Fetch current user ── */
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUser({ email: data.user.email, id: uid });
      const [favRes, profileRes] = await Promise.all([
        supabase.from("favoris").select("id", { count: "exact", head: true }).eq("touriste_id", uid),
        supabase.from("profiles").select("full_name").eq("user_id", uid).single(),
      ]);
      setFavCount(favRes.count || 0);
      if (profileRes.data?.full_name) setUserName(profileRes.data.full_name);
    });
  }, [supabase]);

  /* ── Fetch popular excursions ── */
  useEffect(() => {
    supabase
      .from("excursions")
      .select("id, title, city, price_per_person, duration_hours, rating, reviews_count, photos, categories")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!error && data) setExcursions(data);
        setExcLoading(false);
      });
  }, [supabase]);

  /* ── Fetch slides ── */
  useEffect(() => {
    supabase
      .from("excursions")
      .select("id, title, city, description, photos, categories")
      .eq("is_active", true)
      .order("rating", { ascending: false })
      .limit(7)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: SlideExcursion[] = data.map((exc, i) => ({
            id:         exc.id,
            url:        exc.photos?.find(Boolean) || FALLBACK_IMG,
            city:       exc.title,
            region:     exc.city,
            categories: exc.categories || [],
            color:      SLIDE_COLORS[i % SLIDE_COLORS.length],
          }));
          setSlides(mapped);
        }
        setSlidesLoading(false);
      });
  }, [supabase]);

  /* ── Slider auto-advance ── */
  useEffect(() => {
    const DURATION = 6000;
    const TICK     = 60;
    let elapsed    = 0;
    const timer = setInterval(() => {
      elapsed += TICK;
      setProgress((elapsed / DURATION) * 100);
      if (elapsed >= DURATION) {
        elapsed = 0;
        setFading(true);
        setTimeout(() => {
          setCurrent(p => slides.length > 0 ? (p + 1) % slides.length : 0);
          setFading(false);
          setProgress(0);
        }, 500);
      }
    }, TICK);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  /* ── Manual slide navigation ── */
  const goTo = useCallback((idx: number) => {
    if (idx === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); setProgress(0); }, 500);
  }, [current]);

  /* ── Auth modal helper ── */
  const openAuth = (mode: "login" | "register" | "prestataire", redirect?: string) => {
    if (redirect) sessionStorage.setItem("redirect_after_login", redirect);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <HomeStyles />

      <TouristeNav
        userName={userName}
        favCount={favCount}
        isLoggedIn={!!user}
      />
      

      <HeroSlider/>

      <PathsSection
        slides={slides}
        user={user}
        openAuth={openAuth}
      />

      <PopularExcursions
        excursions={excursions}
        excLoading={excLoading}
        user={user}
        openAuth={openAuth}
      />

      <HomeFooter
        user={user}
        openAuth={openAuth}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
}