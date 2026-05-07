"use client";

import { useState } from "react";
import { createClient } from "../../../lib/supabaseClient";
import {
  MapPin,
  Clock,
  Users,
  Star,
  Camera,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Mountain,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useToast } from "../../../lib/useToast";
import { Toast, SearchBar, FilterTabs, DataList } from "../../components/ui";
import { useCrudOperation } from "../../../lib/useCrudOperation";
import { useListFiltering } from "../../../lib/useListFiltering";

interface Excursion {
  id: string; title: string; city: string; duration_hours: number;
  price_per_person: number; max_people: number; rating: number;
  reviews_count: number; is_active: boolean;
  photos: string[]; categories: string[];
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

export default function ExcursionsListClient({
  excursions: initial, prestataireId,
}: {
  excursions: Excursion[];
  prestataireId: string;
}) {
  const supabase = createClient();
  const [excursions, setExcursions] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(id);
    const { error } = await supabase.from("excursions")
      .update({ is_active: !current })
      .eq("id", id).eq("prestataire_id", prestataireId);
    if (!error) {
      setExcursions(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
      showToast(!current ? "Excursion publiée !" : "Mise en brouillon");
    } else {
      showToast("Erreur lors de la mise à jour", false);
    }
    setLoading(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setLoading(id);
    const { error } = await supabase.from("excursions").delete()
      .eq("id", id).eq("prestataire_id", prestataireId);
    if (!error) {
      setExcursions(prev => prev.filter(e => e.id !== id));
      showToast("Excursion supprimée");
    } else {
      showToast("Erreur lors de la suppression", false);
    }
    setLoading(null);
  };

  const filtered = excursions.filter(e =>
    filter === "active" ? e.is_active : filter === "draft" ? !e.is_active : true
  );

  if (!excursions.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid #F3F4F6" }}>
      <Mountain size={52} style={{ color: "#E5E7EB", margin: "0 auto 16px" }} />
      <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucune excursion</p>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>Créez votre première excursion pour recevoir des réservations</p>
      <a href="/prestataire/excursions/nouveau"
        style={{ padding: "12px 24px", background: "#2B96A8", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 }}>
        <Plus size={16} /> Créer une excursion
      </a>
    </div>
  );

  return (
    <>
      <style>{`
        .exc-card{background:white;border-radius:18px;border:1px solid #F0F0F0;overflow:hidden;transition:all .25s;position:relative}
        .exc-card:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,.09)}
        .exc-card-img{width:100%;height:200px;object-fit:cover;display:block;transition:transform .4s}
        .exc-card:hover .exc-card-img{transform:scale(1.05)}
        .exc-btn{padding:8px 12px;border-radius:10px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;transition:all .2s;background:white;white-space:nowrap;display:flex;align-items:center;gap:5px}
        .exc-btn:disabled{opacity:.5;cursor:not-allowed}
        .ftab{padding:7px 16px;border-radius:20px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px}
        .ftab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .ftab:not(.on){background:white;color:#6B7280}
        .toast-p{position:fixed;top:24px;right:24px;z-index:9999;padding:13px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:inherit;box-shadow:0 8px 30px rgba(0,0,0,.12);animation:tin .3s ease;display:flex;align-items:center;gap:8px}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {toast && (
        <div className="toast-p" style={{ background: toast.ok ? "#F0FDF4" : "#FEF2F2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}` }}>
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([
          { k: "all" as const, label: `Toutes (${excursions.length})`, icon: null },
          { k: "active" as const, label: `Publiées (${excursions.filter(e => e.is_active).length})`, icon: <CheckCircle2 size={13} /> },
          { k: "draft" as const, label: `Brouillons (${excursions.filter(e => !e.is_active).length})`, icon: <FileText size={13} /> },
        ]).map(t => (
          <button key={t.k} className={`ftab ${filter === t.k ? "on" : ""}`} onClick={() => setFilter(t.k)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Grille */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
        {filtered.map(exc => (
          <div key={exc.id} className="exc-card"
            onClick={(e) => { if ((e.target as HTMLElement).closest("button,a")) return; window.location.href = `/prestataire/excursions/${exc.id}`; }}
            style={{ cursor: "pointer" }}>

            {/* Image */}
            <div style={{ overflow: "hidden", position: "relative", height: 200, background: "#F3F4F6" }}>
              <img
                src={exc.photos?.find(Boolean) || FALLBACK}
                alt={exc.title}
                className="exc-card-img"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
              />

              {/* Status */}
              <div style={{ position: "absolute", top: 10, left: 10 }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, backdropFilter: "blur(8px)", color: "white", background: exc.is_active ? "rgba(21,128,61,.88)" : "rgba(107,114,128,.82)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                  {exc.is_active ? "Publié" : "Brouillon"}
                </span>
              </div>

              {/* Catégorie */}
              {exc.categories?.[0] && (
                <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", background: "rgba(0,0,0,.52)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 600 }}>
                  {exc.categories[0]}
                </div>
              )}

              {/* Prix */}
              <div style={{ position: "absolute", bottom: 10, right: 12, padding: "5px 12px", background: "rgba(0,0,0,.62)", backdropFilter: "blur(8px)", borderRadius: 20, fontSize: 14, fontWeight: 800, color: "white" }}>
                {exc.price_per_person} EUR
              </div>

              {/* Nb photos */}
              {(exc.photos?.filter(Boolean).length || 0) > 1 && (
                <div style={{ position: "absolute", bottom: 10, left: 12, padding: "3px 8px", background: "rgba(0,0,0,.45)", backdropFilter: "blur(6px)", borderRadius: 12, fontSize: 11, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
                  <Camera size={11} /> {exc.photos.filter(Boolean).length}
                </div>
              )}
            </div>

            {/* Contenu */}
            <div style={{ padding: "16px 18px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 6, lineHeight: 1.3 }}>
                {exc.title}
              </h3>

              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6B7280", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F3F4F6", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={12} /> {exc.city}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={12} /> {exc.duration_hours}h</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={12} /> max {exc.max_people}</span>
                {exc.rating > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Star size={12} fill="#F59E0B" stroke="#F59E0B" /> {exc.rating}
                    <span style={{ color: "#9CA3AF" }}>({exc.reviews_count})</span>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="exc-btn" disabled={loading === exc.id}
                  onClick={() => toggleActive(exc.id, exc.is_active)}
                  style={{ flex: 1, justifyContent: "center", color: exc.is_active ? "#374151" : "#059669", background: exc.is_active ? "white" : "#F0FDF4", borderColor: exc.is_active ? "#E5E7EB" : "#BBF7D0" }}>
                  {loading === exc.id
                    ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />
                    : exc.is_active
                    ? <><PauseCircle size={14} /> Dépublier</>
                    : <><PlayCircle size={14} /> Publier</>
                  }
                </button>
                <a href={`/prestataire/excursions/${exc.id}/edit`}
                  style={{ padding: "8px 12px", background: "#F3F4F6", color: "#374151", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center" }}>
                  <Pencil size={14} />
                </a>
                <button className="exc-btn" disabled={loading === exc.id}
                  onClick={() => handleDelete(exc.id, exc.title)}
                  style={{ padding: "8px 12px", color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}