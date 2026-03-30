"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import Link from "next/link";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";
import {
  Heart, Star, Clock, MapPin, ArrowRight,
  SlidersHorizontal, Loader, Plus, Compass,
  X,
} from "lucide-react";

interface Excursion {
  id: string; title: string; city: string; price_per_person: number;
  duration_hours: number; rating: number; reviews_count: number;
  max_people: number; photos: string[]; categories: string[];
}

interface Favori {
  id: string;
  excursion: Excursion | Excursion[] | null;
}

function getExc(f: Favori): Excursion | null {
  if (!f.excursion) return null;
  if (Array.isArray(f.excursion)) return f.excursion[0] ?? null;
  return f.excursion;
}

export default function FavorisClient({ favoris: init, userId }: { favoris: Favori[]; userId: string }) {
  const supabase = createClient();
  const [favoris, setFavoris] = useState(init);
  const [removing, setRemoving] = useState<string | null>(null);
  const [sort, setSort] = useState<"default" | "price_asc" | "price_desc" | "rating">("default");
  const [selectedExc, setSelectedExc] = useState<Excursion | null>(null);

  const handleRemove = async (favId: string) => {
    setRemoving(favId);
    await supabase.from("favoris").delete().eq("id", favId).eq("touriste_id", userId);
    setFavoris(p => p.filter(f => f.id !== favId));
    setRemoving(null);
  };

  const sorted = [...favoris].sort((a, b) => {
    const ea = getExc(a), eb = getExc(b);
    if (!ea || !eb) return 0;
    if (sort === "price_asc")  return ea.price_per_person - eb.price_per_person;
    if (sort === "price_desc") return eb.price_per_person - ea.price_per_person;
    if (sort === "rating")     return eb.rating - ea.rating;
    return 0;
  });

  /* ── EMPTY STATE ── */
  if (!favoris.length) return (
    <div style={{ textAlign:"center", padding:"72px 24px", background:"white", borderRadius:24, border:"1px solid #EEF2FF", boxShadow:"0 4px 24px rgba(5,51,102,0.04)" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#FEF2F2,#FFF0F3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 8px 24px rgba(244,63,94,0.15)" }}>
        <Heart size={36} color="#FDA4AF" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize:20, fontWeight:800, color:"#053366", marginBottom:8, letterSpacing:"-0.3px" }}>Aucun favori pour l&apos;instant</h3>
      <p style={{ fontSize:14, color:"#6B7280", marginBottom:28, lineHeight:1.7, maxWidth:340, margin:"0 auto 28px" }}>
        Parcourez les excursions et cliquez sur l&apos;icône cœur pour sauvegarder vos préférées
      </p>
      <Link href="/excursions" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 26px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", color:"white", borderRadius:14, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 8px 24px rgba(2,175,207,0.35)" }}>
        <Compass size={16} /> Découvrir les excursions <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }

        .fav-card {
          background:white; border-radius:20px; overflow:hidden;
          border:1px solid #EEF2FF; box-shadow:0 2px 12px rgba(5,51,102,0.05);
          transition:all 0.28s cubic-bezier(0.34,1.56,0.64,1);
          animation:cardIn 0.4s ease both;
        }
        .fav-card:hover { transform:translateY(-6px) scale(1.01); box-shadow:0 20px 48px rgba(5,51,102,0.13); border-color:#DCE5FF; }
        .fav-card:hover .card-img { transform:scale(1.07); }
        .card-img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s ease; display:block; }

        .remove-btn {
          position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%;
          background:rgba(255,255,255,0.95); border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 12px rgba(0,0,0,0.15); transition:all 0.2s;
        }
        .remove-btn:hover { transform:scale(1.15); box-shadow:0 4px 16px rgba(239,68,68,0.25); }

        .plan-btn {
          flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
          padding:10px 0; background:#F8FAFF; color:#053366;
          border-radius:12px; text-decoration:none; font-size:12px; font-weight:600;
          border:1px solid #DCE5FF; transition:all 0.18s;
        }
        .plan-btn:hover { background:#EEF2FF; border-color:#02AFCF; color:#02AFCF; }

        .reserve-btn {
          flex:1; padding:10px 0; background:linear-gradient(135deg,#02AFCF,#259FFC);
          color:white; border-radius:12px; border:none; font-size:12px; font-weight:700;
          cursor:pointer; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:6px;
          transition:all 0.18s; box-shadow:0 4px 12px rgba(2,175,207,0.3);
        }
        .reserve-btn:hover { box-shadow:0 6px 20px rgba(2,175,207,0.45); transform:translateY(-1px); }

        .sort-select {
          padding:9px 14px 9px 32px; border:1.5px solid #DCE5FF; border-radius:12px;
          font-size:13px; font-family:inherit; color:#053366;
          background:white; cursor:pointer; outline:none; appearance:none; transition:border 0.18s;
        }
        .sort-select:focus { border-color:#02AFCF; }
      `}</style>

      {/* ── TOOLBAR ── */}
      <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#FEF2F2,#FFF0F3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Heart size={15} color="#F43F5E" fill="#F43F5E" />
          </div>
          <p style={{ fontSize:14, color:"#6B7280" }}>
            <span style={{ fontWeight:800, color:"#053366" }}>{favoris.length}</span>
            {" "}excursion{favoris.length > 1 ? "s" : ""} sauvegardée{favoris.length > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
          <SlidersHorizontal size={13} color="#9CA3AF" style={{ position:"absolute", left:11, pointerEvents:"none" }} />
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="sort-select">
            <option value="default">Ordre d&apos;ajout</option>
            <option value="rating">Meilleures notes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:20 }}>
        {sorted.map((f, i) => {
          const exc = getExc(f);
          if (!exc) return null;
          return (
            <div key={f.id} className="fav-card" style={{ animationDelay:`${i * 0.06}s` }}>
              <div style={{ position:"relative", height:210, overflow:"hidden", background:"#EEF2FF" }}>
                <img
                  src={exc.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80"}
                  alt={sanitizeText(exc.title)}
                  className="card-img"
                />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(5,51,102,0.4) 0%, transparent 55%)" }} />
                <button className="remove-btn" onClick={() => handleRemove(f.id)} disabled={removing === f.id}>
                  {removing === f.id
                    ? <Loader size={15} color="#9CA3AF" style={{ animation:"spin 1s linear infinite" }} />
                    : <Heart size={15} color="#F43F5E" fill="#F43F5E" />}
                </button>
                {exc.categories?.[0] && (
                  <div style={{ position:"absolute", top:12, left:12, padding:"4px 11px", background:"rgba(5,51,102,0.7)", backdropFilter:"blur(8px)", borderRadius:20, fontSize:11, fontWeight:700, color:"white" }}>
                    {sanitizeText(exc.categories[0])}
                  </div>
                )}
                <div style={{ position:"absolute", bottom:12, left:12, padding:"5px 12px", background:"linear-gradient(135deg,#02AFCF,#259FFC)", borderRadius:20, fontSize:14, fontWeight:800, color:"white", boxShadow:"0 4px 12px rgba(2,175,207,0.4)" }}>
                  {exc.price_per_person} <span style={{ fontSize:11, fontWeight:500 }}>TND</span>
                </div>
              </div>

              <div style={{ padding:"16px 18px 18px" }}>
                <div style={{ marginBottom:12 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:"#053366", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-0.2px" }}>
                    {sanitizeText(exc.title)}
                  </h3>
                  <p style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                    <MapPin size={11} color="#02AFCF" strokeWidth={2} />{sanitizeText(exc.city)}
                  </p>
                </div>
                <div style={{ display:"flex", gap:14, marginBottom:14, paddingBottom:14, borderBottom:"1px solid #EEF2FF" }}>
                  <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                    <Clock size={11} color="#9CA3AF" strokeWidth={2} />{exc.duration_hours}h
                  </span>
                  {exc.rating > 0 && (
                    <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:4 }}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" strokeWidth={0} />
                      <span style={{ fontWeight:700, color:"#374151" }}>{exc.rating}</span>
                      <span style={{ color:"#D1D5DB" }}>({exc.reviews_count})</span>
                    </span>
                  )}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Link href="/touriste/itineraire" className="plan-btn"><Plus size={12} /> Ajouter au plan</Link>
                  <button onClick={() => setSelectedExc(exc)} className="reserve-btn">
                    Réserver <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CHECKOUT MODAL ── */}
      {selectedExc && (
        <CheckoutModal
          excursion={selectedExc}
          userId={userId}
          onClose={() => setSelectedExc(null)}
        />
      )}
    </>
  );
}