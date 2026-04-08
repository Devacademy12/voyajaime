"use client";

import {
  Search, Mountain, MapPin, Clock, Users, Wallet, Star, Camera,
  Trash2, Play, Pause, LayoutGrid, List, CheckCircle,
} from "lucide-react";

interface Excursion {
  id: string;
  title: string;
  city: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  prestataire_name: string;
  photos: string[];
  categories: string[];
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

// ─── TOOLBAR ───
export function ExcursionToolbar({ search, setSearch, filter, setFilter, view, setView, counts }: any) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #F3F4F6", padding: "14px 18px", marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      {/* Search */}
      <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
        <input placeholder="Titre, ville, prestataire..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "9px 14px 9px 34px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", transition: "border-color .2s", background: "#FAFAFA", color: "#111827" }}
          onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
          onBlur={e => e.currentTarget.style.borderColor = "#E5E7EB"} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {([
          { k: "all", Icon: Mountain, label: "Toutes", count: counts.all },
          { k: "active", Icon: CheckCircle, label: "Actives", count: counts.active },
          { k: "draft", Icon: Clock, label: "Brouillons", count: counts.draft },
        ] as const).map(({ k, Icon, label, count }) => (
          <button key={k} style={{ padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", transition: "all .2s", border: "1px solid #E5E7EB", display: "inline-flex", alignItems: "center", gap: 6, background: filter === k ? "#2B96A8" : "white", color: filter === k ? "white" : "#6B7280", borderColor: filter === k ? "#2B96A8" : "#E5E7EB" }} onClick={() => setFilter(k)}>
            <Icon size={12} strokeWidth={2} />
            {label}
            <span style={{ fontSize: 11, borderRadius: 12, padding: "1px 7px", fontWeight: 800, background: filter === k ? "rgba(255,255,255,.25)" : "#F3F4F6", color: filter === k ? "white" : "#6B7280" }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Vue toggle */}
      <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 10, padding: 3, gap: 2 }}>
        {([
          { v: "grid" as const, Icon: LayoutGrid },
          { v: "list" as const, Icon: List },
        ]).map(({ v, Icon }) => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: view === v ? "white" : "transparent", boxShadow: view === v ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .2s", display: "flex", alignItems: "center" }}>
            <Icon size={15} color={view === v ? "#2B96A8" : "#9CA3AF"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── EXCURSION GRID CARD ───
export function ExcursionGridCard({ exc, loading, onToggle, onDelete }: any) {
  return (
    <div style={{ borderRadius: 18, overflow: "hidden", background: "white", border: "1px solid #F0F0F0", transition: "all .25s", position: "relative", cursor: "pointer" }} onClick={e => { if ((e.target as HTMLElement).closest("button")) return; window.location.href = `/admin/excursions/${exc.id}`; }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(0,0,0,.1)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
      {/* Image */}
      <div style={{ overflow: "hidden", height: 190, position: "relative", background: "#F3F4F6" }}>
        <img src={exc.photos?.find((p: string) => p) || FALLBACK} alt={exc.title} style={{ width: "100%", height: 190, objectFit: "cover", display: "block", transition: "transform .4s" }} onMouseEnter={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"} onMouseLeave={(e) => (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: exc.is_active ? "rgba(21,128,61,.9)" : "rgba(107,114,128,.85)", backdropFilter: "blur(6px)", color: "white", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.8 }} />
            {exc.is_active ? "Actif" : "Brouillon"}
          </span>
        </div>
        {exc.categories?.[0] && (
          <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 9px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 600 }}>
            {exc.categories[0]}
          </div>
        )}
        {exc.photos?.filter(Boolean).length > 1 && (
          <div style={{ position: "absolute", bottom: 10, right: 10, padding: "3px 8px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", display: "flex", alignItems: "center", gap: 4 }}>
            <Camera size={11} /> {exc.photos.filter(Boolean).length}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4, lineHeight: 1.3 }}>{exc.title}</h3>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
          <MapPin size={11} color="#C4B8B0" strokeWidth={1.5} />{exc.city}
          <span style={{ marginLeft: 4, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Users size={11} color="#C4B8B0" strokeWidth={1.5} />{exc.prestataire_name}
          </span>
        </p>

        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#6B7280", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F3F4F6" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} strokeWidth={1.5} />{exc.duration_hours}h</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Wallet size={11} strokeWidth={1.5} />{exc.price_per_person} TND</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} strokeWidth={1.5} />{exc.max_people}</span>
          {exc.rating > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={11} fill="#F59E0B" color="#F59E0B" />{exc.rating}</span>}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid #E5E7EB", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", background: "white", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, flex: 1, color: exc.is_active ? "#374151" : "#059669", borderColor: exc.is_active ? "#E5E7EB" : "#BBF7D0", backgroundColor: exc.is_active ? "white" : "#F0FDF4", opacity: loading === exc.id ? 0.5 : 1 }} disabled={loading === exc.id} onClick={() => onToggle(exc.id, exc.is_active)}>
            {loading === exc.id ? "..." : exc.is_active ? <><Pause size={12} /> Désactiver</> : <><Play size={12} /> Activer</>}
          </button>
          <button style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid #E5E7EB", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", background: "white", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, color: "#DC2626", borderColor: "#FECACA", backgroundColor: "#FEF2F2", width: 36, justifyContent: "center", opacity: loading === exc.id ? 0.5 : 1 }} disabled={loading === exc.id} onClick={() => onDelete(exc.id, exc.title)}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EXCURSION ROW ───
export function ExcursionRow({ exc, loading, onToggle, onDelete }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", transition: "background .15s", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }} onClick={e => { if ((e.target as HTMLElement).closest("button")) return; window.location.href = `/admin/excursions/${exc.id}`; }} onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#FAFAFA"} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "white"}>
      <div style={{ width: 68, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#F3F4F6" }}>
        <img src={exc.photos?.find((p: string) => p) || FALLBACK} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
      </div>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: exc.is_active ? "#22C55E" : "#E5E7EB", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{exc.title}</span>
          <span style={{ padding: "1px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: exc.is_active ? "#F0FDF4" : "#F9FAFB", color: exc.is_active ? "#15803D" : "#9CA3AF" }}>
            {exc.is_active ? "Actif" : "Brouillon"}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={11} color="#9CA3AF" strokeWidth={1.5} />{exc.city}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Clock size={11} color="#9CA3AF" strokeWidth={1.5} />{exc.duration_hours}h</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Wallet size={11} color="#9CA3AF" strokeWidth={1.5} />{exc.price_per_person} TND</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Users size={11} color="#9CA3AF" strokeWidth={1.5} />{exc.prestataire_name}</span>
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid #E5E7EB", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", background: "white", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, color: "#374151", opacity: loading === exc.id ? 0.5 : 1 }} disabled={loading === exc.id} onClick={() => onToggle(exc.id, exc.is_active)}>
          {loading === exc.id ? "..." : exc.is_active ? <><Pause size={12} /> Désactiver</> : <><Play size={12} /> Activer</>}
        </button>
        <button style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid #E5E7EB", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", background: "white", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, color: "#DC2626", borderColor: "#FECACA", opacity: loading === exc.id ? 0.5 : 1 }} disabled={loading === exc.id} onClick={() => onDelete(exc.id, exc.title)}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ───
export function EmptyExcursions() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #F3F4F6" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <Mountain size={26} color="#9CA3AF" strokeWidth={1.5} />
      </div>
      <p style={{ color: "#6B7280", fontWeight: 700, fontSize: 15 }}>Aucune excursion trouvée</p>
    </div>
  );
}
