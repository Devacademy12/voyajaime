"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  Search, MapPin, Clock, Star, Heart, Lock,
  Loader2, Mountain, SlidersHorizontal, ArrowUpDown,
  UserPlus, LogIn,
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
  <div style={{ borderRadius:18, overflow:"hidden", background:"white", border:"1px solid #EEF2FF" }}>
    <div style={{ height:210, background:"linear-gradient(90deg,#EEF2FF 25%,#DCE5FF 50%,#EEF2FF 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }}/>
    <div style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ height:16, width:"70%", borderRadius:6, background:"#EEF2FF" }}/>
      <div style={{ height:12, width:"40%", borderRadius:6, background:"#EEF2FF" }}/>
      <div style={{ height:12, width:"55%", borderRadius:6, background:"#EEF2FF" }}/>
    </div>
  </div>
);

export default function ExcursionsPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [filtered,   setFiltered]   = useState<Excursion[]>([]);
  const [villes,     setVilles]     = useState<string[]>([]);
  const [cats,       setCats]       = useState<string[]>([]);
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
      .then(({ data }) => { setExcursions((data as Excursion[]) || []); setLoading(false); });
    supabase.from("villes").select("nom").eq("active", true).order("nom")
      .then(({ data }) => { if (data) setVilles(data.map((v: { nom: string }) => v.nom)); });
    supabase.from("categories").select("nom").order("nom")
      .then(({ data }) => { if (data) setCats(data.map((c: { nom: string }) => c.nom)); });
  }, []);

  useEffect(() => {
    let list = [...excursions];
    if (city !== "Toutes")     list = list.filter(e => e.city === city);
    if (category !== "Toutes") list = list.filter(e => e.categories?.includes(category));
    // ✅ XSS : nettoie la recherche avant de filtrer
    const cleanSearch = sanitizeText(search);
    if (cleanSearch) list = list.filter(e =>
      e.title.toLowerCase().includes(cleanSearch.toLowerCase()) ||
      e.city.toLowerCase().includes(cleanSearch.toLowerCase())
    );
    if      (sort === "price_asc")  list.sort((a, b) => a.price_per_person - b.price_per_person);
    else if (sort === "price_desc") list.sort((a, b) => b.price_per_person - a.price_per_person);
    else if (sort === "rating")     list.sort((a, b) => b.rating - a.rating);
    else                            list.sort((a, b) => b.reviews_count - a.reviews_count);
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

  const CITY_LIST = ["Toutes", ...villes];
  const CAT_LIST  = ["Toutes", ...cats];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .exc-card { border-radius:18px; overflow:hidden; background:white; border:1px solid #EEF2FF; transition:all 0.25s; cursor:pointer; box-shadow:0 2px 8px rgba(5,51,102,.05); animation:fadeUp .35s ease both; }
        .exc-card:hover { transform:translateY(-4px); box-shadow:0 14px 40px rgba(5,51,102,.12); border-color:#DCE5FF; }
        .exc-card img { transition:transform .4s ease; display:block; width:100%; height:100%; object-fit:cover; }
        .exc-card:hover img { transform:scale(1.05); }
        .heart-btn { position:absolute; top:12px; right:12px; width:34px; height:34px; border-radius:50%; background:rgba(255,255,255,0.92); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform .2s; box-shadow:0 2px 8px rgba(0,0,0,.15); z-index:2; }
        .heart-btn:hover { transform:scale(1.15); }
        .filter-pill { padding:7px 14px; border-radius:20px; border:1.5px solid #DCE5FF; background:white; font-size:12px; font-weight:600; cursor:pointer; transition:all .18s; color:#053366; font-family:inherit; white-space:nowrap; }
        .filter-pill.on { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; border-color:transparent; box-shadow:0 3px 10px rgba(2,175,207,.3); }
        .filter-pill:not(.on):hover { border-color:#02AFCF; color:#02AFCF; }
        .exc-search { width:100%; padding:12px 18px 12px 44px; border:1.5px solid #DCE5FF; border-radius:14px; font-size:14px; background:white; outline:none; color:#053366; font-family:inherit; transition:border .2s; box-shadow:0 2px 8px rgba(5,51,102,.05); }
        .exc-search:focus { border-color:#02AFCF; box-shadow:0 0 0 3px rgba(2,175,207,.1); }
        .exc-select { padding:10px 16px; border:1.5px solid #DCE5FF; border-radius:12px; font-size:13px; font-family:inherit; color:#053366; background:white; cursor:pointer; outline:none; }
        .reserve-btn { padding:7px 14px; border-radius:9px; border:none; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all .15s; font-family:inherit; }
        .reserve-btn.active { background:linear-gradient(135deg,#02AFCF,#259FFC); color:white; box-shadow:0 2px 8px rgba(2,175,207,.3); }
        .reserve-btn.active:hover { box-shadow:0 4px 14px rgba(2,175,207,.45); transform:translateY(-1px); }
        .reserve-btn.locked { background:#EEF2FF; color:#9CA3AF; }
        .exc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .guest-cta { display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; }
        .guest-cta-btns { display:flex; gap:10px; flex-shrink:0; }
        @media(max-width:1024px){ .exc-grid { grid-template-columns:repeat(2,1fr); gap:14px; } }
        @media(max-width:600px){
          .exc-grid { grid-template-columns:1fr; gap:14px; }
          .guest-cta { flex-direction:column; }
          .guest-cta-btns { width:100%; }
          .guest-cta-btns a { flex:1; text-align:center; justify-content:center; }
        }
      `}</style>

      <TouristeNav favCount={favorites.size} />

      <div style={{ background:"#F8FAFF", minHeight:"100vh", padding:"36px 28px", fontFamily:"'DM Sans',system-ui,sans-serif" }}>
        <div style={{ maxWidth:1160, margin:"0 auto" }}>

          <div style={{ marginBottom:28, animation:"fadeUp .3s ease" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:6 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:"linear-gradient(135deg,#02AFCF,#053366)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(2,175,207,.35)" }}>
                <Mountain size={22} color="white" strokeWidth={1.8}/>
              </div>
              <div>
                <h1 style={{ fontSize:24, fontWeight:800, color:"#053366", margin:0, letterSpacing:"-0.5px" }}>Toutes les excursions</h1>
                <p style={{ color:"#6B7280", fontSize:14, margin:0 }}>
                  {loading ? "Chargement..." : `${filtered.length} excursion${filtered.length > 1 ? "s" : ""} disponible${filtered.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
          </div>

          {/* Search + Sort */}
          <div style={{ background:"white", borderRadius:16, border:"1px solid #EEF2FF", padding:"14px 16px", marginBottom:20, boxShadow:"0 2px 8px rgba(5,51,102,.04)" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:220 }}>
                <Search size={16} color="#9CA3AF" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                <input className="exc-search" type="text" placeholder="Rechercher une excursion, une ville..." value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <ArrowUpDown size={15} color="#9CA3AF"/>
                <select className="exc-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="popular">Plus populaires</option>
                  <option value="rating">Meilleures notes</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filtres Ville */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <MapPin size={13} color="#02AFCF"/>
              <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase" }}>Ville</span>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {CITY_LIST.map(c => (
                <button key={c} className={`filter-pill ${city === c ? "on" : ""}`} onClick={() => setCity(c)}>{c}</button>
              ))}
            </div>
          </div>

          {/* Filtres Catégorie */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <SlidersHorizontal size={13} color="#02AFCF"/>
              <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase" }}>Catégorie</span>
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {CAT_LIST.map(c => (
                <button key={c} className={`filter-pill ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="exc-grid">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i}/>)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"72px 20px", background:"white", borderRadius:20, border:"1px solid #EEF2FF" }}>
              <div style={{ width:64, height:64, borderRadius:20, background:"rgba(2,175,207,.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Mountain size={30} color="#02AFCF" strokeWidth={1.5}/>
              </div>
              <p style={{ fontSize:16, fontWeight:700, color:"#053366", marginBottom:8 }}>
                {excursions.length === 0 ? "Aucune excursion disponible" : "Aucune excursion trouvée"}
              </p>
              <p style={{ fontSize:14, color:"#9CA3AF", marginBottom:20 }}>
                {excursions.length === 0 ? "Revenez bientôt, de nouvelles aventures arrivent !" : "Essayez d'autres filtres"}
              </p>
              {(search || city !== "Toutes" || category !== "Toutes") && (
                <button onClick={() => { setSearch(""); setCity("Toutes"); setCategory("Toutes"); }}
                  style={{ padding:"9px 20px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", border:"none", borderRadius:10, fontSize:13, fontWeight:700, color:"white", cursor:"pointer", fontFamily:"inherit" }}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="exc-grid">
              {filtered.map((exc, i) => (
                <div key={exc.id} className="exc-card" style={{ animationDelay:`${i * .04}s` }}
                  onClick={() => { window.location.href = `/excursions/${exc.id}`; }}>

                  <div style={{ position:"relative", height:210, overflow:"hidden" }}>
                    {/* ✅ XSS : sanitize alt de l'image */}
                    <img src={exc.photos?.[0] || FALLBACK} alt={sanitizeText(exc.title)}
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}/>

                    {/* ✅ XSS : sanitize badge catégorie */}
                    {exc.categories?.[0] && (
                      <div style={{ position:"absolute", top:12, left:12, padding:"4px 10px", background:"rgba(5,51,102,0.65)", backdropFilter:"blur(8px)", borderRadius:20, fontSize:11, fontWeight:700, color:"white" }}>
                        {sanitizeText(exc.categories[0])}
                      </div>
                    )}

                    <div style={{ position:"absolute", bottom:12, left:12, padding:"5px 12px", background:"rgba(5,51,102,0.72)", backdropFilter:"blur(8px)", borderRadius:20, fontSize:14, fontWeight:800, color:"white" }}>
                      {exc.price_per_person} TND
                    </div>

                    <button className="heart-btn" onClick={e => { e.stopPropagation(); toggleFav(exc.id); }}>
                      {loadingFav === exc.id
                        ? <Loader2 size={15} color="#9CA3AF" style={{ animation:"spin .65s linear infinite" }}/>
                        : user
                          ? <Heart size={15} fill={favorites.has(exc.id) ? "#EF4444" : "none"} color={favorites.has(exc.id) ? "#EF4444" : "#374151"} strokeWidth={2.5}/>
                          : <Lock size={13} color="#9CA3AF"/>
                      }
                    </button>
                  </div>

                  <div style={{ padding:16 }}>
                    <div style={{ marginBottom:10 }}>
                      {/* ✅ XSS : sanitize titre et ville */}
                      <h3 style={{ fontSize:15, fontWeight:800, color:"#053366", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {sanitizeText(exc.title)}
                      </h3>
                      <p style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                        <MapPin size={11} color="#02AFCF"/> {sanitizeText(exc.city)}
                      </p>
                    </div>

                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid #EEF2FF" }}>
                      <div style={{ display:"flex", gap:10 }}>
                        <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:3 }}>
                          <Clock size={12} color="#9CA3AF"/> {exc.duration_hours}h
                        </span>
                        {exc.rating > 0 && (
                          <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:3 }}>
                            <Star size={12} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>
                            {exc.rating}
                            <span style={{ color:"#D1D5DB" }}>({exc.reviews_count})</span>
                          </span>
                        )}
                      </div>
                      <button className={`reserve-btn ${user ? "active" : "locked"}`}
                        onClick={e => {
                          e.stopPropagation();
                          if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; }
                          else window.location.href = `/excursions/${exc.id}`;
                        }}>
                        {!user && <Lock size={11}/>}
                        Réserver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!user && !loading && (
            <div style={{ marginTop:48, padding:"28px 32px", background:"linear-gradient(135deg,rgba(2,175,207,.07),rgba(37,159,252,.04))", border:"1.5px solid rgba(2,175,207,.22)", borderRadius:20 }}>
              <div className="guest-cta">
                <div>
                  <h3 style={{ fontSize:17, fontWeight:700, color:"#053366", marginBottom:6 }}>Sauvegardez vos excursions préférées</h3>
                  <p style={{ fontSize:14, color:"#6B7280" }}>Favoris, réservations et paiements nécessitent un compte gratuit</p>
                </div>
                <div className="guest-cta-btns">
                  <Link href="/auth" style={{ padding:"11px 22px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(2,175,207,.38)", display:"inline-flex", alignItems:"center", gap:7, whiteSpace:"nowrap" }}>
                    <UserPlus size={15}/> Créer un compte
                  </Link>
                  <Link href="/auth" style={{ padding:"11px 20px", background:"white", border:"1.5px solid #DCE5FF", color:"#053366", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:600, display:"inline-flex", alignItems:"center", gap:7, whiteSpace:"nowrap" }}>
                    <LogIn size={15}/> Se connecter
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}