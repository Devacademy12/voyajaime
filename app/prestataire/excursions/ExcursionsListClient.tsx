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

/* ─── CSS ───────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pw {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #F5F7FA;
    min-height: 100vh;
    padding: 28px 36px 64px;
    width: 100%;
  }

  /* ── Header ── */
  .pw-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    animation: fadeUp .35s ease both;
    flex-wrap: wrap;
  }
  .pw-header-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: #EFF9FB; border: 1px solid rgba(43,150,168,.22);
    border-radius: 20px; padding: 4px 12px;
    font-size: 11px; font-weight: 700; color: #2B96A8;
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 10px;
  }
  .pw-header-title {
    font-size: clamp(22px, 4vw, 30px); font-weight: 800;
    color: #053366; line-height: 1.1; letter-spacing: -.02em;
  }
  .pw-header-sub {
    font-size: 13px; color: #94A3B8; margin-top: 5px; font-weight: 500;
  }
  .pw-header-badge {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
    padding: 10px 16px; flex-shrink: 0; align-self: flex-start;
  }
  .pw-header-badge-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #053366, #2B96A8);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #fff;
  }
  .pw-header-badge-name { font-size: 13px; font-weight: 700; color: #053366; }
  .pw-header-badge-role { font-size: 11px; color: #94A3B8; font-weight: 500; }

  /* ── Tabs/Filtres ── */
  .pw-tabs {
    display: flex; gap: 2px;
    background: #fff; border-radius: 14px;
    padding: 5px; margin-bottom: 24px;
    border: 1.5px solid #E2E8F0;
    width: fit-content;
    animation: fadeUp .4s ease both;
  }
  .pw-tab {
    padding: 9px 18px; border: none; background: none;
    font-family: inherit; font-size: 13px; font-weight: 600;
    color: #94A3B8; cursor: pointer; border-radius: 10px;
    display: flex; align-items: center; gap: 7px; transition: all .18s;
  }
  .pw-tab.active {
    background: #053366; color: #fff; box-shadow: 0 4px 16px rgba(5,51,102,.22);
  }
  .pw-tab:hover:not(.active) { color: #053366; background: #F0F4F8; }

  /* ── Button ── */
  .pw-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 12px; font-size: 13.5px; font-weight: 700;
    cursor: pointer; transition: all .2s; border: none; font-family: inherit;
    text-decoration: none; background: #053366; color: #fff;
    box-shadow: 0 4px 12px rgba(5,51,102,0.15);
  }
  .pw-btn-primary:hover { background: #042952; transform: translateY(-1px); }

  /* ── Cards ── */
  .exc-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px; animation: fadeUp .5s ease both;
  }
  .exc-card {
    background: #fff; border-radius: 20px; border: 1.5px solid #E2E8F0;
    overflow: hidden; transition: all .25s; position: relative;
    display: flex; flexDirection: column;
  }
  .exc-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(5,51,102,.08); border-color: #2B96A8; }
  
  .exc-card-img-wrap { position: relative; height: 200px; overflow: hidden; background: #F8FAFC; }
  .exc-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
  .exc-card:hover .exc-card-img { transform: scale(1.08); }

  .exc-badge {
    position: absolute; top: 12px; left: 12px;
    padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: .05em; backdrop-filter: blur(8px);
  }
  .exc-badge-active { background: rgba(34,197,94,.9); color: #fff; }
  .exc-badge-draft  { background: rgba(100,116,139,.9); color: #fff; }

  .exc-price {
    position: absolute; bottom: 12px; right: 12px;
    padding: 6px 14px; background: #053366; border-radius: 12px;
    color: #fff; font-size: 15px; font-weight: 800;
  }

  .exc-content { padding: 20px; flex: 1; display: flex; flexDirection: column; }
  .exc-title { font-size: 17px; font-weight: 800; color: #053366; margin-bottom: 8px; line-height: 1.3; }
  
  .exc-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
  .exc-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #94A3B8; font-weight: 500; }
  
  .exc-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 16px; border-top: 1.5px solid #F1F5F9; }
  .exc-btn-icon {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    border: 1.5px solid #E2E8F0; background: #fff; color: #64748B;
    cursor: pointer; transition: all .2s;
  }
  .exc-btn-icon:hover { border-color: #2B96A8; color: #2B96A8; background: #EFF9FB; }
  .exc-btn-text {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 0 16px; height: 38px; border-radius: 10px; font-size: 12.5px; font-weight: 700;
    cursor: pointer; transition: all .2s; border: 1.5px solid #E2E8F0; background: #fff;
    font-family: inherit; color: #475569;
  }
  .exc-btn-text:hover:not(:disabled) { border-color: #2B96A8; color: #2B96A8; background: #EFF9FB; }

  @media (max-width: 768px) {
    .pw { padding: 20px 16px; }
    .pw-header { flex-direction: column; }
    .pw-header-badge { width: 100%; }
    .exc-grid { grid-template-columns: 1fr; }
  }
`;

export default function ExcursionsListClient({
  excursions: initial, prestataireId, prestataireInfo
}: {
  excursions: Excursion[];
  prestataireId: string;
  prestataireInfo: { full_name: string | null; agency_name: string | null };
}) {
  const supabase = createClient();
  const [excursions, setExcursions] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");

  const name = prestataireInfo.agency_name || prestataireInfo.full_name || "Prestataire";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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

  return (
    <div className="pw">
      <style>{CSS}</style>

      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 100, animation: "fadeUp .3s ease both" }}>
          <div style={{ background: toast.ok ? "#ECFDF5" : "#FEF2F2", border: `1.5px solid ${toast.ok ? "#10B981" : "#EF4444"}`, padding: "12px 20px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 24px rgba(0,0,0,.08)" }}>
            {toast.ok ? <CheckCircle2 size={16} color="#10B981" /> : <AlertTriangle size={16} color="#EF4444" />}
            <span style={{ fontSize: "14px", fontWeight: 700, color: toast.ok ? "#065F46" : "#991B1B" }}>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="pw-header">
        <div className="pw-header-left">
          <div className="pw-header-eyebrow">
            <Mountain size={12} /> Mon Catalogue
          </div>
          <h1 className="pw-header-title">Mes Excursions</h1>
          <p className="pw-header-sub">Gérez vos offres et leur disponibilité en temps réel.</p>
        </div>

        <div className="pw-header-badge">
          <div className="pw-header-badge-avatar">{initials}</div>
          <div>
            <div className="pw-header-badge-name">{name}</div>
            <div className="pw-header-badge-role">Prestataire</div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div className="pw-tabs">
          <button className={`pw-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            Toutes <span style={{ fontSize: 10, opacity: .7 }}>{excursions.length}</span>
          </button>
          <button className={`pw-tab ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>
            Publiées <span style={{ fontSize: 10, opacity: .7 }}>{excursions.filter(e => e.is_active).length}</span>
          </button>
          <button className={`pw-tab ${filter === "draft" ? "active" : ""}`} onClick={() => setFilter("draft")}>
            Brouillons <span style={{ fontSize: 10, opacity: .7 }}>{excursions.filter(e => !e.is_active).length}</span>
          </button>
        </div>

        <a href="/prestataire/excursions/nouveau" className="pw-btn-primary">
          <Plus size={16} /> Créer une excursion
        </a>
      </div>

      {!excursions.length ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 24, border: "1.5px solid #E2E8F0" }}>
          <Mountain size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#053366", marginBottom: 8 }}>Aucune excursion trouvée</h3>
          <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>Créez votre première offre pour commencer à attirer des touristes.</p>
          <a href="/prestataire/excursions/nouveau" className="pw-btn-primary">
            + Ajouter une excursion
          </a>
        </div>
      ) : (
        <div className="exc-grid">
          {filtered.map(exc => (
            <div key={exc.id} className="exc-card">
              <div className="exc-card-img-wrap" 
                onClick={() => window.location.href = `/prestataire/excursions/${exc.id}`}>
                <img src={exc.photos?.find(Boolean) || FALLBACK} alt={exc.title} className="exc-card-img" />
                <div className={`exc-badge ${exc.is_active ? "exc-badge-active" : "exc-badge-draft"}`}>
                  {exc.is_active ? "En ligne" : "Brouillon"}
                </div>
                <div className="exc-price">{exc.price_per_person} EUR</div>
              </div>

              <div className="exc-content">
                <h3 className="exc-title" onClick={() => window.location.href = `/prestataire/excursions/${exc.id}`} style={{ cursor: "pointer" }}>
                  {exc.title}
                </h3>
                
                <div className="exc-meta">
                  <div className="exc-meta-item"><MapPin size={13} /> {exc.city}</div>
                  <div className="exc-meta-item"><Clock size={13} /> {exc.duration_hours}h</div>
                  <div className="exc-meta-item"><Users size={13} /> max {exc.max_people}</div>
                  {exc.rating > 0 && (
                    <div className="exc-meta-item" style={{ color: "#F59E0B" }}>
                      <Star size={13} fill="currentColor" /> {exc.rating} ({exc.reviews_count})
                    </div>
                  )}
                </div>

                <div className="exc-actions">
                  <button className="exc-btn-text" 
                    disabled={loading === exc.id}
                    onClick={() => toggleActive(exc.id, exc.is_active)}>
                    {loading === exc.id ? (
                      <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} />
                    ) : exc.is_active ? (
                      <><PauseCircle size={14} /> Dépublier</>
                    ) : (
                      <><PlayCircle size={14} /> Publier</>
                    )}
                  </button>
                  <a href={`/prestataire/excursions/${exc.id}/edit`} className="exc-btn-icon">
                    <Pencil size={14} />
                  </a>
                  <button className="exc-btn-icon" 
                    onClick={() => handleDelete(exc.id, exc.title)}
                    style={{ color: "#EF4444" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}