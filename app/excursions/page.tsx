"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const CITIES = ["Toutes", "Tunis", "Sfax", "Sousse", "Djerba", "Tozeur", "Kairouan", "Hammamet", "Douz", "Tataouine", "Gafsa"];
const CATEGORIES = ["Toutes", "Culture", "Archéologie", "Nature", "Gastronomie", "Aventure", "Relaxation"];

type Excursion = {
  id: string;
  title: string;
  city: string;
  price_per_person: number;
  duration_hours: number;
  rating: number;
  reviews_count: number;
  categories: string[];
  photos: string[];
  is_active: boolean;
};

export default function ExcursionsPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [filtered,   setFiltered]   = useState<Excursion[]>([]);
  const [city,       setCity]       = useState("Toutes");
  const [category,   setCategory]   = useState("Toutes");
  const [search,     setSearch]     = useState("");
  const [sort,       setSort]       = useState("popular");
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState<{ id: string } | null>(null);
  const [favorites,  setFavorites]  = useState<Set<string>>(new Set());
  const [loadingFav, setLoadingFav] = useState<string | null>(null);
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
      .then(({ data }) => {
        setExcursions((data as Excursion[]) || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let list = [...excursions];
    if (city !== "Toutes") list = list.filter(e => e.city === city);
    if (category !== "Toutes") list = list.filter(e => e.categories?.includes(category));
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    if (sort === "price_asc")  list.sort((a, b) => a.price_per_person - b.price_per_person);
    else if (sort === "price_desc") list.sort((a, b) => b.price_per_person - a.price_per_person);
    else if (sort === "rating")     list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => b.reviews_count - a.reviews_count);
    setFiltered(list);
  }, [excursions, city, category, search, sort]);

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'DM Sans',sans-serif}
        .exc-card{border-radius:18px;overflow:hidden;background:white;border:1px solid #F3F4F6;transition:all 0.25s;cursor:pointer}
        .exc-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,0.1)}
        .filter-btn{padding:8px 16px;border-radius:30px;border:1.5px solid #E5E7EB;background:white;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;font-family:'DM Sans',sans-serif;color:#374151}
        .filter-btn.active{background:#111827;color:white;border-color:#111827}
        .filter-btn:hover:not(.active){border-color:#2B96A8;color:#2B96A8}
        .heart{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.92);border:none;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
        .heart:hover{transform:scale(1.2)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .skeleton{animation:pulse 1.5s ease infinite;background:#F3F4F6;border-radius:18px}
      `}</style>

      {/* Navbar */}
      <header style={{ position:"sticky", top:0, zIndex:100, background:"white", borderBottom:"1px solid #F3F4F6", padding:"0 52px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#2B96A8"/>
            <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
          </svg>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:"#111" }}>voyajaime</span>
        </Link>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          {user && (
            <Link href="/touriste/favoris" style={{ fontSize:14, color:"#374151", textDecoration:"none", fontWeight:500 }}>
              Mes favoris {favorites.size > 0 && `(${favorites.size})`}
            </Link>
          )}
          {user
            ? <Link href="/touriste/reservations" style={{ padding:"9px 18px", background:"#2B96A8", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700 }}>Mon espace</Link>
            : <Link href="/auth" style={{ padding:"9px 18px", background:"#2B96A8", color:"white", borderRadius:30, textDecoration:"none", fontSize:13, fontWeight:700 }}>Connexion</Link>
          }
        </div>
      </header>

      <div style={{ background:"#FAFAF9", minHeight:"100vh", padding:"40px 52px" }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, color:"#111827", marginBottom:8 }}>
              Toutes les excursions
            </h1>
            <p style={{ color:"#6B7280", fontSize:15 }}>
              {loading ? "Chargement..." : `${filtered.length} excursion${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Search */}
          <div style={{ position:"relative", marginBottom:24 }}>
            <input type="text" placeholder="🔍  Rechercher une excursion..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", padding:"14px 20px 14px 48px", borderRadius:14, border:"1.5px solid #E5E7EB", fontSize:14, background:"white", outline:"none", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }} />
          </div>

          {/* Filters */}
          <div style={{ display:"flex", gap:24, marginBottom:28, flexWrap:"wrap" }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>VILLE</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {CITIES.map(c => (
                  <button key={c} className={`filter-btn ${city === c ? "active" : ""}`} onClick={() => setCity(c)}>{c}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:24, marginBottom:36, flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-end" }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>CATÉGORIE</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {CATEGORIES.map(c => (
                  <button key={c} className={`filter-btn ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding:"10px 16px", borderRadius:10, border:"1.5px solid #E5E7EB", fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#374151", background:"white", cursor:"pointer", outline:"none" }}>
              <option value="popular">Plus populaires</option>
              <option value="rating">Meilleures notes</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height:320 }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"80px 20px" }}>
              <p style={{ fontSize:48 }}>🔍</p>
              <p style={{ fontSize:18, fontWeight:600, color:"#374151", marginTop:16 }}>
                {excursions.length === 0 ? "Aucune excursion disponible" : "Aucune excursion trouvée"}
              </p>
              <p style={{ color:"#9CA3AF", marginTop:8 }}>
                {excursions.length === 0 ? "Revenez bientôt, de nouvelles excursions arrivent !" : "Essayez d'autres filtres"}
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && filtered.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {filtered.map((exc) => (
                <div key={exc.id} className="exc-card" onClick={() => window.location.href = `/excursions/${exc.id}`}>
                  <div style={{ position:"relative", height:210, overflow:"hidden" }}>
                    <img
                      src={exc.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80"}
                      alt={exc.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}
                    />
                    <button className="heart" onClick={(e) => { e.stopPropagation(); toggleFav(exc.id); }}
                      title={user ? (favorites.has(exc.id) ? "Retirer des favoris" : "Ajouter aux favoris") : "Connectez-vous"}>
                      {loadingFav === exc.id ? "⏳" : favorites.has(exc.id) ? "❤️" : "🤍"}
                    </button>
                    {exc.categories?.[0] && (
                      <div style={{ position:"absolute", top:12, left:12, padding:"4px 10px", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(8px)", borderRadius:20, fontSize:11, fontWeight:600, color:"white" }}>
                        {exc.categories[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <h3 style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:2 }}>{exc.title}</h3>
                        <p style={{ fontSize:12, color:"#9CA3AF" }}>📍 {exc.city}</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{exc.price_per_person} <span style={{ fontSize:11, fontWeight:500 }}>TND</span></p>
                        <p style={{ fontSize:11, color:"#9CA3AF" }}>/ pers.</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
                      <div style={{ display:"flex", gap:10 }}>
                        <span style={{ fontSize:12, color:"#6B7280" }}>⏱️ {exc.duration_hours}h</span>
                        {exc.rating > 0 && <span style={{ fontSize:12, color:"#6B7280" }}>⭐ {exc.rating} ({exc.reviews_count})</span>}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!user) { sessionStorage.setItem("redirect_after_login", "/excursions"); window.location.href = "/auth"; } else { window.location.href = `/excursions/${exc.id}`; } }}
                        style={{ padding:"7px 14px", background:user?"#2B96A8":"#F3F4F6", color:user?"white":"#9CA3AF", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                        {user ? "Réserver" : "🔒 Réserver"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guest banner */}
          {!user && !loading && (
            <div style={{ marginTop:48, padding:"28px 36px", background:"linear-gradient(135deg,#EFF9FB,#F0FFFE)", border:"1.5px solid #B2E3EB", borderRadius:18, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ fontSize:18, fontWeight:700, color:"#111827", marginBottom:4 }}>Sauvegardez vos excursions préférées</h3>
                <p style={{ fontSize:14, color:"#6B7280" }}>Les favoris, réservations et paiements nécessitent un compte gratuit</p>
              </div>
              <Link href="/auth" style={{ padding:"12px 24px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, whiteSpace:"nowrap", boxShadow:"0 4px 14px rgba(43,150,168,0.35)" }}>
                Créer un compte gratuit
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}