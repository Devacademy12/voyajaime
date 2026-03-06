"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Heart, Star, Clock, MapPin, ArrowRight,
  SlidersHorizontal, Loader, Plus, Compass,
} from "lucide-react";

interface Excursion {
  id: string; title: string; city: string; price_per_person: number;
  duration_hours: number; rating: number; reviews_count: number;
  photos: string[]; categories: string[];
}
interface Favori { id: string; excursion: Excursion | null; }

export default function FavorisClient({ favoris: init, userId }: { favoris: Favori[]; userId: string }) {
  const supabase = createClient();
  const [favoris, setFavoris] = useState(init);
  const [removing, setRemoving] = useState<string | null>(null);
  const [sort, setSort] = useState<"default" | "price_asc" | "price_desc" | "rating">("default");

  const handleRemove = async (favId: string) => {
    setRemoving(favId);
    await supabase.from("favoris").delete().eq("id", favId).eq("touriste_id", userId);
    setFavoris(p => p.filter(f => f.id !== favId));
    setRemoving(null);
  };

  const sorted = [...favoris].sort((a, b) => {
    const ea = a.excursion, eb = b.excursion;
    if (!ea || !eb) return 0;
    if (sort === "price_asc")  return ea.price_per_person - eb.price_per_person;
    if (sort === "price_desc") return eb.price_per_person - ea.price_per_person;
    if (sort === "rating")     return eb.rating - ea.rating;
    return 0;
  });

  if (!favoris.length) return (
    <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 24, border: "1px solid #F3F4F6" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Heart size={32} color="#FDA4AF" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucun favori pour l&apos;instant</h3>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
        Parcourez les excursions et cliquez sur <Heart size={13} style={{ display: "inline", verticalAlign: "middle" }} /> pour sauvegarder vos préférées
      </p>
      <Link href="/excursions" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#2B96A8", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(43,150,168,0.35)" }}>
        Découvrir les excursions <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <>
      {/* Sort bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
          <Heart size={14} color="#F43F5E" fill="#F43F5E" />
          <span style={{ fontWeight: 700, color: "#111827" }}>{favoris.length}</span> excursion{favoris.length > 1 ? "s" : ""} sauvegardée{favoris.length > 1 ? "s" : ""}
        </p>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <SlidersHorizontal size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, pointerEvents: "none" }} />
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            style={{ padding: "8px 14px 8px 32px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#374151", background: "white", cursor: "pointer", outline: "none", appearance: "none" }}>
            <option value="default">Ordre d&apos;ajout</option>
            <option value="rating">Meilleures notes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {sorted.map(f => {
          const exc = f.excursion;
          if (!exc) return null;
          return (
            <div key={f.id} style={{ background: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #F3F4F6", transition: "all 0.25s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 12px 36px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            >
              {/* Image */}
              <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                <img
                  src={exc.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80"}
                  alt={exc.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {/* Remove btn */}
                <button onClick={() => handleRemove(f.id)} disabled={removing === f.id}
                  style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
                  title="Retirer des favoris"
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}
                >
                  {removing === f.id
                    ? <Loader size={16} color="#9CA3AF" style={{ animation: "spin 1s linear infinite" }} />
                    : <Heart size={16} color="#F43F5E" fill="#F43F5E" />
                  }
                </button>
                {exc.categories?.[0] && (
                  <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "white" }}>
                    {exc.categories[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "18px 18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{exc.title}</h3>
                    <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={11} color="#C4B8B0" strokeWidth={1.5} />{exc.city}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{exc.price_per_person} <span style={{ fontSize: 11, fontWeight: 500 }}>TND</span></p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>/ pers.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} color="#9CA3AF" strokeWidth={1.5} />{exc.duration_hours}h
                  </span>
                  {exc.rating > 0 && (
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />{exc.rating}
                      <span style={{ color: "#9CA3AF" }}>({exc.reviews_count})</span>
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href="/touriste/itineraire"
                    style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "9px 0", background: "#F9FAFB", color: "#374151", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600, border: "1px solid #E5E7EB", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F3F4F6"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}>
                    <Plus size={13} /> Ajouter au plan
                  </Link>
                  <button style={{ flex: 1, padding: "9px 0", background: "#2B96A8", color: "white", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#1e7a8a"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#2B96A8"}>
                    Réserver <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}