"use client";

import { useState } from "react";
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
  Search,
  Grid3x3,
  List,
} from "lucide-react";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui";
import { useCrudOperation } from "../../../lib/useCrudOperation";
import { apiPost } from "../../../lib/api";

interface Excursion {
  id: string; title: string; city: string; duration_hours: number;
  price_per_person: number; max_people: number; rating: number;
  reviews_count: number; is_active: boolean; prestataire_name: string;
  photos: string[]; categories: string[];
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

export default function AdminExcursionsClient({ excursions: initial }: { excursions: Excursion[] }) {
  const [excursions, setExcursions] = useState(initial);
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const { toast, showToast } = useToast();

  const { execute } = useCrudOperation(initial, async (payload) => {
    return apiPost("/api/admin/manage-excursion", payload);
  });

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(id);
    try {
      await execute(id, {
        action: "toggle",
        id: id,
        value: { is_active: !current }
      }, {
        successMessage: !current ? "Excursion activée" : "Excursion désactivée",
        onSuccess: (prev) => prev.map(e => e.id === id ? { ...e, is_active: !current } : e)
      });
    } catch (e) {
      showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setLoading(id);
    try {
      await execute(id, {
        action: "delete",
        id: id,
        value: { id }
      }, {
        confirmMessage: `Supprimer "${title}" ?`,
        successMessage: "Excursion supprimée",
        onSuccess: (prev) => prev.filter(e => e.id !== id)
      });
    } catch (e) {
      showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false);
    } finally {
      setLoading(null);
    }
  };

  const filtered = excursions.filter(e => {
    const matchFilter = filter === "active" ? e.is_active : filter === "draft" ? !e.is_active : true;
    const matchSearch = !search || 
      e.title.toLowerCase().includes(search.toLowerCase()) || 
      e.city.toLowerCase().includes(search.toLowerCase()) || 
      e.prestataire_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: excursions.length,
    active: excursions.filter(e => e.is_active).length,
    draft: excursions.filter(e => !e.is_active).length
  };

  if (!excursions.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid #F3F4F6" }}>
      <Mountain size={52} style={{ color: "#E5E7EB", margin: "0 auto 16px" }} />
      <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucune excursion</p>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>Créez votre première excursion pour recevoir des réservations</p>
    </div>
  );

  return (
    <>
      <style>{`
        .admin-exc-card{background:white;border-radius:18px;border:1px solid #F0F0F0;overflow:hidden;transition:all .25s;position:relative}
        .admin-exc-card:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,.09)}
        .admin-exc-card-img{width:100%;height:200px;object-fit:cover;display:block;transition:transform .4s}
        .admin-exc-card:hover .admin-exc-card-img{transform:scale(1.05)}
        .admin-exc-btn{padding:8px 12px;border-radius:10px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;transition:all .2s;background:white;white-space:nowrap;display:flex;align-items:center;gap:5px}
        .admin-exc-btn:disabled{opacity:.5;cursor:not-allowed}
        .ftab{padding:7px 16px;border-radius:20px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s;display:flex;align-items:center;gap:6px}
        .ftab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .ftab:not(.on){background:white;color:#6B7280}
        .search-bar{display:flex;align-items:center;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:40px;padding:5px 16px;gap:8px;flex:1;max-width:320px}
        .search-bar input{background:transparent;border:none;outline:none;font-size:13px;width:100%}
        .view-toggle{display:flex;gap:4px;background:#F3F4F6;padding:3px;border-radius:40px}
        .view-btn{padding:6px 12px;border-radius:30px;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#6B7280}
        .view-btn.active{background:white;color:#2B96A8;box-shadow:0 1px 3px rgba(0,0,0,.05)}
        .admin-exc-row{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #F3F4F6;transition:background .2s}
        .admin-exc-row:hover{background:#F9FAFB}
        .admin-exc-row-info{display:flex;align-items:center;gap:14px;flex:1}
        .admin-exc-row-img{width:48px;height:48px;border-radius:10px;object-fit:cover;background:#F3F4F6}
        .admin-exc-row-details{display:flex;flex-direction:column;gap:4px}
        .admin-exc-row-title{font-size:14px;font-weight:700;color:#111827}
        .admin-exc-row-meta{display:flex;gap:12px;font-size:11px;color:#6B7280}
        .admin-exc-row-actions{display:flex;gap:6px}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <Toast toast={toast} />

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { k: "all" as const, label: `Toutes (${counts.all})`, icon: null },
            { k: "active" as const, label: `Publiées (${counts.active})`, icon: <CheckCircle2 size={13} /> },
            { k: "draft" as const, label: `Brouillons (${counts.draft})`, icon: <FileText size={13} /> },
          ].map(t => (
            <button key={t.k} className={`ftab ${filter === t.k ? "on" : ""}`} onClick={() => setFilter(t.k)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="search-bar">
            <Search size={14} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button className={`view-btn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}>
              <Grid3x3 size={13} /> Grille
            </button>
            <button className={`view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
              <List size={13} /> Liste
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, border: "1px solid #F3F4F6" }}>
          <Search size={48} style={{ color: "#E5E7EB", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucun résultat</p>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Aucune excursion ne correspond à vos critères</p>
        </div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {filtered.map(exc => (
            <div key={exc.id} className="admin-exc-card" style={{ cursor: "pointer" }}
              onClick={(e) => { if ((e.target as HTMLElement).closest("button,a")) return; window.location.href = `/admin/excursions/${exc.id}`; }}>

              {/* Image */}
              <div style={{ overflow: "hidden", position: "relative", height: 200, background: "#F3F4F6" }}>
                <img
                  src={exc.photos?.find(Boolean) || FALLBACK}
                  alt={exc.title}
                  className="admin-exc-card-img"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />

                {/* Status */}
                <div style={{ position: "absolute", top: 10, left: 10 }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, backdropFilter: "blur(8px)", color: "white", background: exc.is_active ? "rgba(21,128,61,.88)" : "rgba(107,114,128,.82)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                    {exc.is_active ? "Publié" : "Brouillon"}
                  </span>
                </div>

                {/* Prestataire */}
                <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", background: "rgba(0,0,0,.52)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 600 }}>
                  {exc.prestataire_name}
                </div>

                {/* Prix */}
                <div style={{ position: "absolute", bottom: 10, right: 12, padding: "5px 12px", background: "rgba(0,0,0,.62)", backdropFilter: "blur(8px)", borderRadius: 20, fontSize: 14, fontWeight: 800, color: "white" }}>
                  {exc.price_per_person} EUR
                </div>

                {/* Catégorie */}
                {exc.categories?.[0] && (
                  <div style={{ position: "absolute", bottom: 10, left: 12, padding: "3px 10px", background: "rgba(0,0,0,.52)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 500 }}>
                    {exc.categories[0]}
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
                  <button className="admin-exc-btn" disabled={loading === exc.id}
                    onClick={() => toggleActive(exc.id, exc.is_active)}
                    style={{ flex: 1, justifyContent: "center", color: exc.is_active ? "#374151" : "#059669", background: exc.is_active ? "white" : "#F0FDF4", borderColor: exc.is_active ? "#E5E7EB" : "#BBF7D0" }}>
                    {loading === exc.id
                      ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />
                      : exc.is_active
                      ? <><PauseCircle size={14} /> Dépublier</>
                      : <><PlayCircle size={14} /> Publier</>
                    }
                  </button>
                 
                  <button className="admin-exc-btn" disabled={loading === exc.id}
                    onClick={() => handleDelete(exc.id, exc.title)}
                    style={{ padding: "8px 12px", color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #F0F0F0", overflow: "hidden" }}>
          {filtered.map(exc => (
            <div key={exc.id} className="admin-exc-row" style={{ cursor: "pointer" }}
              onClick={(e) => { if ((e.target as HTMLElement).closest("button,a")) return; window.location.href = `/admin/excursions/${exc.id}`; }}>

              <div className="admin-exc-row-info">
                <img
                  src={exc.photos?.find(Boolean) || FALLBACK}
                  alt=""
                  className="admin-exc-row-img"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />
                <div className="admin-exc-row-details">
                  <div className="admin-exc-row-title">{exc.title}</div>
                  <div className="admin-exc-row-meta">
                    <span><MapPin size={10} /> {exc.city}</span>
                    <span><Clock size={10} /> {exc.duration_hours}h</span>
                    <span><Users size={10} /> {exc.max_people}</span>
                    {exc.rating > 0 && <span><Star size={10} fill="#F59E0B" stroke="#F59E0B" /> {exc.rating}</span>}
                    <span style={{ color: exc.is_active ? "#059669" : "#6B7280" }}>
                      • {exc.is_active ? "Publié" : "Brouillon"}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#2B96A8", minWidth: 70 }}>
                  {exc.price_per_person} EUR
                </div>
              </div>

              <div className="admin-exc-row-actions">
                <button className="admin-exc-btn" disabled={loading === exc.id}
                  onClick={() => toggleActive(exc.id, exc.is_active)}
                  style={{ padding: "6px 10px", background: exc.is_active ? "#FEF2F2" : "#F0FDF4", color: exc.is_active ? "#DC2626" : "#059669", borderColor: exc.is_active ? "#FECACA" : "#BBF7D0" }}>
                  {loading === exc.id
                    ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} />
                    : exc.is_active
                    ? <><PauseCircle size={12} /> Dépublier</>
                    : <><PlayCircle size={12} /> Publier</>
                  }
                </button>
                <a href={`/admin/excursions/${exc.id}/edit`}
                  style={{ padding: "6px 10px", background: "#F3F4F6", color: "#374151", borderRadius: 8, textDecoration: "none", display: "flex", alignItems: "center" }}>
                  <Pencil size={12} />
                </a>
                <button className="admin-exc-btn" disabled={loading === exc.id}
                  onClick={() => handleDelete(exc.id, exc.title)}
                  style={{ padding: "6px 10px", color: "#DC2626", borderColor: "#FECACA", background: "#FEF2F2" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}