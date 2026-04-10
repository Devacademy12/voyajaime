"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  Search, MapPin, Clock, Star, Heart, Lock,
  Loader2, Mountain, UserPlus, LogIn, Calendar,
} from "lucide-react";
import TouristeNav from "@/app/components/touriste/TouristeNav";

type Excursion = {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number;
  categories: string[]; photos: string[]; is_active: boolean;
};

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

const Skeleton = () => (
  <div style={{ borderRadius: 20, overflow: "hidden", background: "white", border: "1px solid #EEF2FF", boxShadow: "0 2px 8px rgba(5,51,102,.05)" }}>
    <div style={{ height: 220, background: "linear-gradient(90deg,#EEF2FF 25%,#DCE5FF 50%,#EEF2FF 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
    <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ height: 16, width: "70%", borderRadius: 6, background: "#EEF2FF" }} />
      <div style={{ height: 13, width: "35%", borderRadius: 6, background: "#EEF2FF" }} />
      <div style={{ height: 13, width: "50%", borderRadius: 6, background: "#EEF2FF" }} />
    </div>
  </div>
);

export default function ExcursionsPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [filtered,   setFiltered]   = useState<Excursion[]>([]);
  const [villes,     setVilles]     = useState<string[]>([]);
  const [cats,       setCats]       = useState<string[]>([]);

  // Multi-select for city and category
  const [selectedCities,      setSelectedCities]      = useState<string[]>([]);
  const [selectedCategories,  setSelectedCategories]  = useState<string[]>([]);

  const [search,     setSearch]     = useState("");
  const [sort,       setSort]       = useState("popular");
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState<{ id: string } | null>(null);
  const [favorites,  setFavorites]  = useState<Set<string>>(new Set());
  const [loadingFav, setLoadingFav] = useState<string | null>(null);

  // Active dropdown tab: "ville" | "categorie" | "journee" | "heure"
  const [activeTab, setActiveTab] = useState<"ville" | "categorie" | "journee" | "heure" | null>(null);
  // Duration filters (can both be active)
  const [filterJournee, setFilterJournee] = useState(false);
  const [filterHeure,   setFilterHeure]   = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id });
        supabase.from("favoris").select("excursion_id").eq("touriste_id", data.user.id)
          .then(({ data: favs }) => {
            if (favs) setFavorites(new Set(favs.map((f: { excursion_id: string }) => f.excursion_id)));
          });
      }
    });
    supabase.from("excursions").select("*").eq("is_active", true)
      .then(({ data }) => { setExcursions((data as Excursion[]) || []); setLoading(false); });
    supabase.from("villes").select("nom").eq("active", true).order("nom")
      .then(({ data }) => { if (data) setVilles(data.map((v: { nom: string }) => v.nom)); });
    supabase.from("categories").select("nom").order("nom")
      .then(({ data }) => { if (data) setCats(data.map((c: { nom: string }) => c.nom)); });
  }, []);

  useEffect(() => {
    let list = [...excursions];
    if (selectedCities.length > 0)      list = list.filter(e => selectedCities.includes(e.city));
    if (selectedCategories.length > 0)  list = list.filter(e => e.categories?.some(c => selectedCategories.includes(c)));
    const cleanSearch = sanitizeText(search);
    if (cleanSearch) list = list.filter(e =>
      e.title.toLowerCase().includes(cleanSearch.toLowerCase()) ||
      e.city.toLowerCase().includes(cleanSearch.toLowerCase())
    );
    if (filterJournee && !filterHeure) list = list.filter(e => e.duration_hours >= 8);
    if (filterHeure   && !filterJournee) list = list.filter(e => e.duration_hours < 4);

    if      (sort === "price_asc")  list.sort((a, b) => a.price_per_person - b.price_per_person);
    else if (sort === "price_desc") list.sort((a, b) => b.price_per_person - a.price_per_person);
    else if (sort === "rating")     list.sort((a, b) => b.rating - a.rating);
    else                            list.sort((a, b) => b.reviews_count - a.reviews_count);
    setFiltered(list);
  }, [excursions, selectedCities, selectedCategories, search, sort, filterJournee, filterHeure]);

  const toggleFav = async (excId: string) => {
    if (!user) { sessionStorage.setItem("redirect_after_login", "/excursions"); window.location.href = "/auth"; return; }
    setLoadingFav(excId);
    if (favorites.has(excId)) {
      await supabase.from("favoris").delete().eq("touriste_id", user.id).eq("excursion_id", excId);
      setFavorites(prev => { const n = new Set(prev); n.delete(excId); return n; });
    } else {
      await supabase.from("favoris").insert({ touriste_id: user.id, excursion_id: excId });
      setFavorites(prev => new Set([...prev, excId]));
    }
    setLoadingFav(null);
  };

  const toggleCity = (v: string) =>
    setSelectedCities(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const toggleCategory = (c: string) =>
    setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const resetAll = () => {
    setSelectedCities([]); setSelectedCategories([]);
    setFilterJournee(false); setFilterHeure(false);
    setSearch(""); setActiveTab(null);
  };

  const hasFilters = selectedCities.length > 0 || selectedCategories.length > 0 || filterJournee || filterHeure;

  // Dropdown for multi-select
  const renderDropdown = () => {
    if (!activeTab || (activeTab !== "ville" && activeTab !== "categorie")) return null;
    const items   = activeTab === "ville" ? villes : cats;
    const selected = activeTab === "ville" ? selectedCities : selectedCategories;
    const toggle   = activeTab === "ville" ? toggleCity : toggleCategory;

    return (
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
        background: "white", borderRadius: 16, boxShadow: "0 8px 32px rgba(5,51,102,.18)",
        border: "1px solid #EEF2FF", zIndex: 100, minWidth: 230, padding: "10px 0", overflow: "hidden",
      }}>
        {items.length === 0 && (
          <p style={{ padding: "12px 18px", fontSize: 13, color: "#9CA3AF", margin: 0 }}>Aucun élément</p>
        )}
        {items.map(item => {
          const checked = selected.includes(item);
          return (
            <button key={item}
              onClick={e => { e.stopPropagation(); toggle(item); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left",
                padding: "10px 18px", border: "none",
                background: checked ? "rgba(2,175,207,.07)" : "transparent",
                color: checked ? "#02AFCF" : "#053366",
                fontSize: 13, fontWeight: checked ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit", transition: "background .12s",
              }}
            >
              {/* Custom checkbox */}
              <span style={{
                width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                border: checked ? "2px solid #02AFCF" : "2px solid #CBD5E1",
                background: checked ? "#02AFCF" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .12s",
              }}>
                {checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              {item}
            </button>
          );
        })}

        {/* Footer apply btn */}
        {selected.length > 0 && (
          <div style={{ borderTop: "1px solid #F0F2F8", padding: "8px 12px 4px" }}>
            <button
              onClick={() => setActiveTab(null)}
              style={{
                width: "100%", padding: "9px", border: "none",
                borderRadius: 10, background: "linear-gradient(135deg,#02AFCF,#259FFC)",
                color: "white", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Appliquer ({selected.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  const villeLabel = selectedCities.length === 0
    ? "Ville"
    : selectedCities.length === 1
      ? selectedCities[0]
      : `${selectedCities.length} villes`;

  const catLabel = selectedCategories.length === 0
    ? "Catégorie"
    : selectedCategories.length === 1
      ? selectedCategories[0]
      : `${selectedCategories.length} catégories`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes heroIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        /* ── Card ── */
        .exc-card {
          border-radius: 20px; overflow: hidden; background: #fff;
          border: 1px solid #e8eaf0; transition: all 0.25s; cursor: pointer;
          box-shadow: 0 2px 10px rgba(5,51,102,.06); animation: fadeUp .35s ease both;
        }
        .exc-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(5,51,102,.13); border-color: #c8d8ff; }
        .exc-card img   { transition: transform .45s ease; display: block; width: 100%; height: 100%; object-fit: cover; }
        .exc-card:hover img { transform: scale(1.06); }

        /* ── Heart / Fav ── */
        .heart-btn {
          position: absolute; top: 12px; right: 12px; width: 38px; height: 38px;
          border-radius: 50%; background: rgba(255,255,255,0.96); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform .2s; box-shadow: 0 2px 10px rgba(0,0,0,.15); z-index: 2;
        }
        .heart-btn:hover { transform: scale(1.18); }

        /* ── Filter tabs ── */
        .tab-btn {
          padding: 9px 18px; border-radius: 24px; border: 1.5px solid #d2d4d8;
          background: white; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all .18s; color: #053366; font-family: inherit; white-space: nowrap;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .tab-btn.active {
          background: #053366; color: white; border-color: #053366;
          box-shadow: 0 3px 12px rgba(5,51,102,.25);
        }
        .tab-btn:not(.active):hover { border-color: #02AFCF; color: #02AFCF; }

        /* ── Reserve btn ── */
        .reserve-btn {
          padding: 9px 16px; border-radius: 11px; border: none;
          font-size: 13px; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px;
          transition: all .15s; font-family: inherit;
        }
        .reserve-btn.active {
          background: linear-gradient(135deg,#02AFCF,#259FFC);
          color: white; box-shadow: 0 3px 10px rgba(2,175,207,.3);
        }
        .reserve-btn.active:hover { box-shadow: 0 5px 16px rgba(2,175,207,.45); transform: translateY(-1px); }
        .reserve-btn.locked { background: #EEF2FF; color: #9CA3AF; }

        /* ── Search ── */
        .exc-search {
          width: 100%; padding: 13px 18px 13px 44px;
          border: 1.5px solid #e2e5f0; border-radius: 14px;
          font-size: 14px; background: white; outline: none;
          color: #053366; font-family: inherit; transition: border .2s;
          box-shadow: 0 2px 8px rgba(5,51,102,.04); box-sizing: border-box;
        }
        .exc-search:focus { border-color: #02AFCF; box-shadow: 0 0 0 3px rgba(2,175,207,.1); }

        /* ── Grid ── */
        .exc-grid {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 22px;
        }

        .guest-cta { display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; }
        .guest-cta-btns { display:flex; gap:10px; flex-shrink:0; }

        @media(max-width:1024px){ .exc-grid { grid-template-columns: repeat(2,1fr); gap:16px; } }
        @media(max-width:600px){
          .exc-grid { grid-template-columns: 1fr; gap:14px; }
          .guest-cta { flex-direction:column; }
          .guest-cta-btns { width:100%; }
          .guest-cta-btns a { flex:1; text-align:center; justify-content:center; }
        }
      `}</style>

      <TouristeNav />
      <div style={{ paddingTop: 64 }} />

      <div style={{ background: "#f7f8fc", minHeight: "100vh", fontFamily: "'DM Sans',system-ui,sans-serif" }}>

        {/* ── HERO ── */}
        <div style={{
          background: "white", paddingTop: 56, paddingBottom: 40,
          borderBottom: "1px solid #eef0f6", animation: "heroIn .5s ease",
        }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", padding: "0 24px" }}>
            <h1 style={{
              fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
              color: "#053366", margin: "0 0 32px", lineHeight: 1.2, letterSpacing: "-0.5px",
            }}>
              Découvrez des destinations<br />que vous adorerez
            </h1>

            {/* Search */}
            <div style={{ position: "relative", maxWidth: 540, margin: "0 auto 28px" }}>
              <Search size={17} color="#9CA3AF" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input className="exc-search" type="text"
                placeholder="Rechercher une excursion, une ville…"
                value={search} onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", position: "relative", zIndex: 10 }}>

              {/* Ville */}
              <div style={{ position: "relative" }}>
                <button
                  className={`tab-btn ${selectedCities.length > 0 || activeTab === "ville" ? "active" : ""}`}
                  onClick={() => setActiveTab(prev => prev === "ville" ? null : "ville")}
                >
                  <MapPin size={13} />
                  {villeLabel}
                  {selectedCities.length > 0 && (
                    <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                      {selectedCities.length}
                    </span>
                  )}
                </button>
                {activeTab === "ville" && renderDropdown()}
              </div>

              {/* Catégorie */}
              <div style={{ position: "relative" }}>
                <button
                  className={`tab-btn ${selectedCategories.length > 0 || activeTab === "categorie" ? "active" : ""}`}
                  onClick={() => setActiveTab(prev => prev === "categorie" ? null : "categorie")}
                >
                  {catLabel}
                  {selectedCategories.length > 0 && (
                    <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                      {selectedCategories.length}
                    </span>
                  )}
                </button>
                {activeTab === "categorie" && renderDropdown()}
              </div>

              {/* Journée */}
              <button
                className={`tab-btn ${filterJournee ? "active" : ""}`}
                onClick={() => setFilterJournee(prev => !prev)}
              >
                Excursion d'une journée
              </button>

              {/* Par heure */}
              <button
                className={`tab-btn ${filterHeure ? "active" : ""}`}
                onClick={() => setFilterHeure(prev => !prev)}
              >
                Par heure
              </button>

              {/* Reset */}
              {hasFilters && (
                <button className="tab-btn" onClick={resetAll}
                  style={{ color: "#EF4444", borderColor: "#FCA5A5" }}>
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 60px" }}>

          {/* Count + Sort */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
              {loading ? "Chargement…" : (
                <><span style={{ fontWeight: 700, color: "#053366" }}>{filtered.length}</span> excursion{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</>
              )}
            </p>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{
                padding: "9px 16px", border: "1.5px solid #e2e5f0", borderRadius: 12,
                fontSize: 13, fontFamily: "inherit", color: "#053366",
                background: "white", cursor: "pointer", outline: "none",
              }}>
              <option value="popular">Plus populaires</option>
              <option value="rating">Meilleures notes</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

          {/* Skeletons */}
          {loading && (
            <div className="exc-grid">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "72px 20px", background: "white", borderRadius: 20, border: "1px solid #EEF2FF" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(2,175,207,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Mountain size={30} color="#02AFCF" strokeWidth={1.5} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#053366", marginBottom: 8 }}>
                {excursions.length === 0 ? "Aucune excursion disponible" : "Aucune excursion trouvée"}
              </p>
              <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 20 }}>
                {excursions.length === 0 ? "Revenez bientôt, de nouvelles aventures arrivent !" : "Essayez d'autres filtres"}
              </p>
              {hasFilters && (
                <button onClick={resetAll}
                  style={{ padding: "9px 20px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: "inherit" }}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {/* Cards grid — NEW LAYOUT matching the image */}
          {!loading && filtered.length > 0 && (
            <div className="exc-grid">
              {filtered.map((exc, i) => (
                <div key={exc.id} className="exc-card" style={{ animationDelay: `${i * .04}s` }}
                  onClick={() => { window.location.href = `/excursions/${exc.id}`; }}>

                  {/* ── Image zone ── */}
                  <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                    <img
                      src={exc.photos?.[0] || FALLBACK}
                      alt={sanitizeText(exc.title)}
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                    />
                    {/* Category badge */}
                    {exc.categories?.[0] && (
                      <div style={{
                        position: "absolute", top: 12, left: 12,
                        padding: "5px 12px",
                        background: "rgba(5,51,102,0.65)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 20,
                        fontSize: 12, fontWeight: 700, color: "white",
                      }}>
                        {sanitizeText(exc.categories[0])}
                      </div>
                    )}
                    {/* Heart */}
                    <button className="heart-btn" onClick={e => { e.stopPropagation(); toggleFav(exc.id); }}>
                      {loadingFav === exc.id
                        ? <Loader2 size={15} color="#9CA3AF" style={{ animation: "spin .65s linear infinite" }} />
                        : user
                          ? <Heart size={16} fill={favorites.has(exc.id) ? "#EF4444" : "none"} color={favorites.has(exc.id) ? "#EF4444" : "#374151"} strokeWidth={2.2} />
                          : <Lock size={13} color="#9CA3AF" />
                      }
                    </button>
                  </div>

                  {/* ── Info zone ── */}
                  <div style={{ padding: "16px 18px 18px" }}>

                    {/* Row 1: title + price side by side */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <h3 style={{
                        fontSize: 15, fontWeight: 800, color: "#053366",
                        margin: 0, flex: 1,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {sanitizeText(exc.title)}
                      </h3>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "#053366" }}>
                          {exc.price_per_person}
                        </span>
                        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 3 }}>TND</span>
                        <div style={{ fontSize: 11, color: "#9CA3AF" }}>/ personne</div>
                      </div>
                    </div>

                    {/* Row 2: city */}
                    <p style={{ fontSize: 13, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4, margin: "0 0 14px" }}>
                      <MapPin size={12} color="#02AFCF" />
                      {sanitizeText(exc.city)}
                    </p>

                    {/* Row 3: duration + rating + reserve btn */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      paddingTop: 12, borderTop: "1px solid #f0f2f8",
                    }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        {/* Duration */}
                        <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={13} color="#9CA3AF" /> {exc.duration_hours}h
                        </span>
                        {/* Single star + numeric rating */}
                        <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={14} fill="#F59E0B" color="#F59E0B" strokeWidth={1.5} />
                          {exc.rating > 0
                            ? <>{exc.rating.toFixed(1)} <span style={{ color: "#9CA3AF" }}>({exc.reviews_count})</span></>
                            : <span style={{ color: "#9CA3AF" }}>Nouveau</span>
                          }
                        </span>
                      </div>

                      {/* Reserve button — teal pill matching image */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; }
                          else window.location.href = `/excursions/${exc.id}`;
                        }}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "9px 18px", border: "none", borderRadius: 12,
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                          fontFamily: "inherit", transition: "all .15s",
                          background: user ? "linear-gradient(135deg,#02AFCF,#0BBFB0)" : "#EEF2FF",
                          color: user ? "white" : "#9CA3AF",
                          boxShadow: user ? "0 3px 12px rgba(2,175,207,.35)" : "none",
                        }}
                        onMouseEnter={e => { if (user) (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(2,175,207,.5)"; }}
                        onMouseLeave={e => { if (user) (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 12px rgba(2,175,207,.35)"; }}
                      >
                        {user
                          ? <><Calendar size={13} /> Réserver</>
                          : <><Lock size={11} /> Réserver</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guest CTA */}
          {!user && !loading && (
            <div style={{
              marginTop: 48, padding: "28px 32px",
              background: "linear-gradient(135deg,rgba(2,175,207,.07),rgba(37,159,252,.04))",
              border: "1.5px solid rgba(2,175,207,.22)", borderRadius: 20,
            }}>
              <div className="guest-cta">
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#053366", marginBottom: 6 }}>Sauvegardez vos excursions préférées</h3>
                  <p style={{ fontSize: 14, color: "#6B7280" }}>Favoris, réservations et paiements nécessitent un compte gratuit</p>
                </div>
                <div className="guest-cta-btns">
                  <Link href="/auth" style={{ padding: "11px 22px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(2,175,207,.38)", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                    <UserPlus size={15} /> Créer un compte
                  </Link>
                  <Link href="/auth" style={{ padding: "11px 20px", background: "white", border: "1.5px solid #DCE5FF", color: "#053366", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                    <LogIn size={15} /> Se connecter
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdowns on outside click */}
      {activeTab && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9 }}
          onClick={() => setActiveTab(null)}
        />
      )}
    </>
  );
}