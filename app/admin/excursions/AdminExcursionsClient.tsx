"use client";

import { useState } from "react";

interface Excursion {
  id: string; title: string; city: string; duration_hours: number;
  price_per_person: number; max_people: number; rating: number;
  reviews_count: number; is_active: boolean; prestataire_name: string;
  photos: string[]; categories: string[];
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

export default function AdminExcursionsClient({ excursions: initial }: { excursions: Excursion[] }) {
  const [excursions, setExcursions] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const callApi = async (id: string, action: string, value?: boolean) => {
    const res = await fetch("/api/admin/manage-excursion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excursionId: id, action, value }),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(id);
    try {
      await callApi(id, "toggle", !current);
      setExcursions(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
      showToast(!current ? "✅ Excursion activée" : "⏸️ Excursion désactivée");
    } catch (e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    setLoading(id);
    try {
      await callApi(id, "delete");
      setExcursions(prev => prev.filter(e => e.id !== id));
      showToast("🗑️ Excursion supprimée");
    } catch (e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const filtered = excursions.filter(e => {
    const matchFilter = filter === "active" ? e.is_active : filter === "draft" ? !e.is_active : true;
    const q = search.toLowerCase();
    const matchSearch = !search || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.prestataire_name.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    all: excursions.length,
    active: excursions.filter(e => e.is_active).length,
    draft: excursions.filter(e => !e.is_active).length,
  };

  return (
    <>
      <style>{`
        .etab{padding:8px 16px;border-radius:20px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s;border:1px solid #E5E7EB}
        .etab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .etab:not(.on){background:white;color:#6B7280}
        .etab:not(.on):hover{background:#F9FAFB}
        .ecard{border-radius:18px;overflow:hidden;background:white;border:1px solid #F0F0F0;transition:all .25s;position:relative}
        .ecard:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,.1)}
        .ecard-img{width:100%;height:190px;object-fit:cover;display:block;transition:transform .4s}
        .ecard:hover .ecard-img{transform:scale(1.04)}
        .ebtn{padding:7px 14px;border-radius:9px;border:1px solid #E5E7EB;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s;background:white;white-space:nowrap}
        .ebtn:disabled{opacity:.5;cursor:not-allowed}
        .erow{display:flex;align-items:center;gap:14px;padding:14px 18px;transition:background .15s;border-bottom:1px solid #F3F4F6}
        .erow:last-child{border-bottom:none}
        .erow:hover{background:#FAFAFA}
        .toast-w{position:fixed;top:24px;right:24px;z-index:999;padding:13px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:inherit;box-shadow:0 8px 30px rgba(0,0,0,.12);animation:tin .3s ease}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast && (
        <div className="toast-w" style={{ background: toast.ok ? "#F0FDF4" : "#FEF2F2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}` }}>
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Titre, ville, prestataire..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", minWidth: 200, transition: "border-color .2s" }}
          onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
          onBlur={e => e.currentTarget.style.borderColor = "#E5E7EB"}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "active", "draft"] as const).map(k => (
            <button key={k} className={`etab ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
              {k === "all" ? `Toutes (${counts.all})` : k === "active" ? `✅ Actives (${counts.active})` : `📝 Brouillons (${counts.draft})`}
            </button>
          ))}
        </div>
        {/* Vue toggle */}
        <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 3, gap: 2 }}>
          {(["grid", "list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, background: view === v ? "white" : "transparent", boxShadow: view === v ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
              {v === "grid" ? "⊞" : "☰"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏔️</p>
          <p style={{ color: "#6B7280", fontWeight: 600, fontSize: 15 }}>Aucune excursion trouvée</p>
        </div>
      ) : view === "grid" ? (
        /* ── VUE GRILLE AVEC IMAGES ── */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {filtered.map(exc => (
            <div key={exc.id} className="ecard" onClick={e => { if ((e.target as HTMLElement).closest("button")) return; window.location.href=`/admin/excursions/${exc.id}`; }} style={{ cursor:"pointer" }}>
              {/* Image */}
              <div style={{ overflow: "hidden", height: 190, position: "relative", background: "#F3F4F6" }}>
                <img
                  src={exc.photos?.find(p => p) || FALLBACK}
                  alt={exc.title}
                  className="ecard-img"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />
                {/* Status badge */}
                <div style={{ position: "absolute", top: 10, left: 10 }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: exc.is_active ? "rgba(21,128,61,.9)" : "rgba(107,114,128,.85)", backdropFilter: "blur(6px)", color: "white" }}>
                    {exc.is_active ? "● Actif" : "● Brouillon"}
                  </span>
                </div>
                {/* Category */}
                {exc.categories?.[0] && (
                  <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 600 }}>
                    {exc.categories[0]}
                  </div>
                )}
                {/* Photo count */}
                {exc.photos?.filter(Boolean).length > 1 && (
                  <div style={{ position: "absolute", bottom: 10, right: 10, padding: "3px 8px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white" }}>
                    📷 {exc.photos.filter(Boolean).length}
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: "16px 18px" }}>
                <div style={{ marginBottom: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 3, lineHeight: 1.3 }}>{exc.title}</h3>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>📍 {exc.city} · 🏢 {exc.prestataire_name}</p>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6B7280", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F3F4F6" }}>
                  <span>⏱️ {exc.duration_hours}h</span>
                  <span>💰 {exc.price_per_person} TND</span>
                  <span>👥 {exc.max_people}</span>
                  {exc.rating > 0 && <span>⭐ {exc.rating}</span>}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="ebtn" disabled={loading === exc.id}
                    onClick={() => toggleActive(exc.id, exc.is_active)}
                    style={{ flex: 1, color: exc.is_active ? "#374151" : "#059669", borderColor: exc.is_active ? "#E5E7EB" : "#BBF7D0", background: exc.is_active ? "white" : "#F0FDF4" }}>
                    {loading === exc.id ? "..." : exc.is_active ? "⏸ Désactiver" : "▶ Activer"}
                  </button>
                  <button className="ebtn" disabled={loading === exc.id}
                    onClick={() => handleDelete(exc.id, exc.title)}
                    style={{ color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2", width: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── VUE LISTE ── */
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #F3F4F6", overflow: "hidden" }}>
          {filtered.map(exc => (
            <div key={exc.id} className="erow" onClick={e => { if ((e.target as HTMLElement).closest("button")) return; window.location.href=`/admin/excursions/${exc.id}`; }} style={{ cursor:"pointer" }}>
              {/* Thumbnail */}
              <div style={{ width: 70, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F3F4F6" }}>
                <img src={exc.photos?.find(p => p) || FALLBACK} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />
              </div>
              {/* Status dot */}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: exc.is_active ? "#22C55E" : "#E5E7EB", flexShrink: 0 }} />
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{exc.title}</span>
                  <span style={{ padding: "1px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: exc.is_active ? "#F0FDF4" : "#F9FAFB", color: exc.is_active ? "#15803D" : "#9CA3AF" }}>
                    {exc.is_active ? "Actif" : "Brouillon"}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#6B7280" }}>
                  📍 {exc.city} · ⏱️ {exc.duration_hours}h · {exc.price_per_person} TND · 🏢 {exc.prestataire_name}
                </p>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="ebtn" disabled={loading === exc.id}
                  onClick={() => toggleActive(exc.id, exc.is_active)}
                  style={{ color: "#374151" }}>
                  {loading === exc.id ? "..." : exc.is_active ? "⏸ Désactiver" : "▶ Activer"}
                </button>
                <button className="ebtn" disabled={loading === exc.id}
                  onClick={() => handleDelete(exc.id, exc.title)}
                  style={{ color: "#DC2626", borderColor: "#FECACA" }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}