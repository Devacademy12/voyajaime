"use client";

/**
 * app/excursions/page.tsx — VERSION OPTIMISÉE
 *
 * ✅ Changements de performance :
 *  1. Promise.all() → toutes les requêtes en parallèle (au lieu de séquentiel)
 *  2. Skeleton amélioré avec animation shimmer
 *  3. Images lazy + fade-in natif
 *  4. Suppression du double createClient() à chaque render (useMemo)
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  Search, MapPin, Clock, Star, Heart,
  Loader2, Mountain, UserPlus, LogIn, Calendar, XCircle,
} from "lucide-react";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import styles from "@/public/style/excursions.module.css";

type Excursion = {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number;
  categories: string[]; photos: string[]; is_active: boolean;
  max_people: number; available_dates: string[] | null;
};

type ReservationsMap = Record<string, Record<string, number>>;

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";
const TODAY    = new Date().toISOString().split("T")[0];
const DEFAULT_LIMIT = 12;

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className={styles.skeleton}>
    <div className={`${styles.skeletonImg} skeleton-box`} />
    <div className={styles.skeletonBody}>
      <div className={`${styles.skeletonLine} ${styles.skeletonLine1} skeleton-box`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLine2} skeleton-box`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLine3} skeleton-box`} />
    </div>
  </div>
);

function isFullyBooked(exc: Excursion, reservations: ReservationsMap): boolean {
  if (!exc.is_active) return true;
  const allDates    = exc.available_dates || [];
  const futureDates = allDates.filter(d => d >= TODAY);
  if (futureDates.length === 0) return true;
  const excReservations = reservations[exc.id] || {};
  return futureDates.every(date => {
    const booked = excReservations[date] || 0;
    return booked >= (exc.max_people || Infinity);
  });
}

// ── Lazy image avec fade-in ──────────────────────────────────────────────────
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onLoad={e => (e.currentTarget as HTMLImageElement).classList.add("loaded")}
      onError={e => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
      style={{ opacity: 0, transition: "opacity 0.4s ease" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ExcursionsPage() {
  // ✅ useMemo → une seule instance de supabase par render cycle
  const supabase = useMemo(() => createClient(), []);

  const [user,         setUser]         = useState<{ id: string } | null>(null);
  const [excursions,   setExcursions]   = useState<Excursion[]>([]);
  const [reservations, setReservations] = useState<ReservationsMap>({});
  const [favorites,    setFavorites]    = useState<Set<string>>(new Set());
  const [villes,       setVilles]       = useState<string[]>([]);
  const [cats,         setCats]         = useState<string[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [loadingFav,   setLoadingFav]   = useState<string | null>(null);

  const [search,             setSearch]             = useState("");
  const [selectedCities,     setSelectedCities]     = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterJournee,      setFilterJournee]      = useState(false);
  const [filterHeure,        setFilterHeure]        = useState(false);
  const [showAll,            setShowAll]            = useState(false);

  // ✅ OPTIMISATION PRINCIPALE : toutes les requêtes en parallèle
  useEffect(() => {
    (async () => {
      try {
        // ── Étape 1 : auth + excursions + filtres en parallèle ──────────────
        const [authResult, excsResult, villesResult, catsResult] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("excursions")
            .select("id, title, city, price_per_person, duration_hours, rating, reviews_count, categories, photos, is_active, max_people, available_dates")
            .eq("is_active", true),
          supabase.from("villes").select("nom").eq("active", true).order("nom"),
          supabase.from("categories").select("nom").order("nom"),
        ]);

        const authUser = authResult.data.user;
        const excs: Excursion[] = (excsResult.data as Excursion[]) || [];

        setExcursions(excs);
        if (villesResult.data) setVilles(villesResult.data.map((v: { nom: string }) => v.nom));
        if (catsResult.data)   setCats(catsResult.data.map((c: { nom: string }) => c.nom));

        // ── Étape 2 : favoris + réservations en parallèle (si user connecté) ─
        if (authUser) {
          setUser({ id: authUser.id });

          const ids = excs.map(e => e.id);
          const [favsResult, resResult] = await Promise.all([
            supabase.from("favoris").select("excursion_id").eq("touriste_id", authUser.id),
            ids.length > 0
              ? supabase.from("reservations").select("excursion_id, date, people_count").in("excursion_id", ids)
              : Promise.resolve({ data: [] }),
          ]);

          if (favsResult.data)
            setFavorites(new Set(favsResult.data.map((f: { excursion_id: string }) => f.excursion_id)));

          if (resResult.data) {
            const resMap: ReservationsMap = {};
            (resResult.data as { excursion_id: string; date: string; people_count: number }[])
              .forEach(r => {
                if (!resMap[r.excursion_id]) resMap[r.excursion_id] = {};
                resMap[r.excursion_id][r.date] = (resMap[r.excursion_id][r.date] || 0) + (r.people_count || 0);
              });
            setReservations(resMap);
          }
        } else {
          // Pas connecté : réservations quand même (pour afficher dispo)
          if (excs.length > 0) {
            const ids = excs.map(e => e.id);
            const { data: resData } = await supabase
              .from("reservations")
              .select("excursion_id, date, people_count")
              .in("excursion_id", ids);
            if (resData) {
              const resMap: ReservationsMap = {};
              (resData as { excursion_id: string; date: string; people_count: number }[])
                .forEach(r => {
                  if (!resMap[r.excursion_id]) resMap[r.excursion_id] = {};
                  resMap[r.excursion_id][r.date] = (resMap[r.excursion_id][r.date] || 0) + (r.people_count || 0);
                });
              setReservations(resMap);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase]);

  // ── Filtrage (inchangé, logique métier conservée) ────────────────────────
  const filtered = useMemo(() => {
    let list = [...excursions];
    if (selectedCities.length > 0)     list = list.filter(e => selectedCities.includes(e.city));
    if (selectedCategories.length > 0) list = list.filter(e => e.categories?.some(c => selectedCategories.includes(c)));
    const cleanSearch = sanitizeText(search);
    if (cleanSearch) list = list.filter(e =>
      e.title.toLowerCase().includes(cleanSearch.toLowerCase()) ||
      e.city.toLowerCase().includes(cleanSearch.toLowerCase())
    );
    if (filterJournee && !filterHeure) list = list.filter(e => e.duration_hours >= 8);
    if (filterHeure   && !filterJournee) list = list.filter(e => e.duration_hours < 4);
    return list;
  }, [excursions, selectedCities, selectedCategories, search, filterJournee, filterHeure]);

  const isFiltering = search || selectedCities.length > 0 || selectedCategories.length > 0 || filterJournee || filterHeure;
  const displayed   = isFiltering || showAll ? filtered : filtered.slice(0, DEFAULT_LIMIT);

  // ── Toggle favoris (inchangé) ────────────────────────────────────────────
  const toggleFav = async (excId: string) => {
    if (!user) return;
    setLoadingFav(excId);
    if (favorites.has(excId)) {
      await supabase.from("favoris").delete().eq("touriste_id", user.id).eq("excursion_id", excId);
      setFavorites(prev => { const s = new Set(prev); s.delete(excId); return s; });
    } else {
      await supabase.from("favoris").insert({ touriste_id: user.id, excursion_id: excId });
      setFavorites(prev => new Set([...prev, excId]));
    }
    setLoadingFav(null);
  };

  if (loading) return (
    <div className={styles.container}>
      <TouristeNav />
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    </div>
  );

  // NOTE: Le JSX de rendu des cards est identique à l'original.
  // Seules les images utilisent maintenant <LazyImage> au lieu de <img> direct.
  // Remplacez vos <img src={...}> dans les cards par <LazyImage src={...} alt={...} />.

  return (
    <div className={styles.container}>
      <TouristeNav isLoggedIn={!!user} />
      {/* … votre JSX existant, identique … */}
      {/* Remplacer les <img> des cards par <LazyImage> */}
    </div>
  );
}
