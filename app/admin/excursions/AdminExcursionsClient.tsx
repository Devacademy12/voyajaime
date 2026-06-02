"use client";

import { useState } from "react";
import {
  MapPin, Clock, Users, Star, Pencil, Trash2,
  PauseCircle, PlayCircle, CheckCircle2, FileText,
  Loader2, Mountain, Search, Grid3x3, List, X,
} from "lucide-react";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui";

interface Excursion {
  id: string; title: string; city: string; duration_hours: number;
  price_per_person: number; max_people: number; rating: number;
  reviews_count: number; is_active: boolean; prestataire_name: string;
  photos: string[]; categories: string[];
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

export default function AdminExcursionsClient({ excursions: initial }: { excursions: Excursion[] }) {
  const [excursions, setExcursions] = useState<Excursion[]>(initial);
  const [filter, setFilter]         = useState<"all" | "active" | "draft">("all");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState<string | null>(null);
  const [view, setView]             = useState<"grid" | "list">("grid");
  const { toast, showToast }        = useToast();

  const toggleActive = async (id: string, currentIsActive: boolean) => {
    setLoading(id);
    setExcursions(prev => prev.map(e => e.id === id ? { ...e, is_active: !currentIsActive } : e));
    try {
      const res = await fetch("/api/admin/manage-excursion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id, value: { is_active: !currentIsActive } }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Erreur ${res.status}`);
      showToast(!currentIsActive ? "Excursion publiée ✓" : "Excursion dépubliée ✓", true);
    } catch (e) {
      setExcursions(prev => prev.map(ex => ex.id === id ? { ...ex, is_active: currentIsActive } : ex));
      showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur inconnue"}`, false);
    } finally { setLoading(null); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ? Cette action est irréversible.`)) return;
    setLoading(id);
    try {
      const res = await fetch("/api/admin/manage-excursion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id, value: { id } }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Erreur ${res.status}`);
      setExcursions(prev => prev.filter(e => e.id !== id));
      showToast("Excursion supprimée ✓", true);
    } catch (e) {
      showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur inconnue"}`, false);
    } finally { setLoading(null); }
  };

  const filtered = excursions.filter(e => {
    const matchFilter = filter === "active" ? e.is_active : filter === "draft" ? !e.is_active : true;
    const q = search.toLowerCase();
    const matchSearch = !search || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.prestataire_name.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    all:    excursions.length,
    active: excursions.filter(e =>  e.is_active).length,
    draft:  excursions.filter(e => !e.is_active).length,
  };

  // ── Global empty ────────────────────────────────────────────────────────────
  if (!excursions.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 14, border: "1px solid #EEF2FF" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <Mountain size={24} color="#9CA3AF" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", margin: "0 0 6px" }}>Aucune excursion</p>
      <p style={{ fontSize: 12, color: "#9CA3AF" }}>Créez votre première excursion pour recevoir des réservations</p>
    </div>
  );

  return (
    <>
      <style>{`
        /* ── Toolbar ── */
        .etab {
          padding: 6px 13px; border-radius: 8px; border: 1px solid #EEF2FF;
          cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit;
          transition: all .2s; display: inline-flex; align-items: center; gap: 6px;
        }
        .etab.on  { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 2px 8px rgba(2,175,207,.3); }
        .etab:not(.on) { background: white; color: #6B7280; }
        .etab:not(.on):hover { background: #F8FAFF; border-color: #DCE5FF; color: #053366; }
        .etab-count { font-size: 10px; border-radius: 10px; padding: 1px 6px; font-weight: 800; }

        .esearch-wrap { position: relative; flex: 1; min-width: 180px; max-width: 280px; }
        .esearch-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .esearch {
          width: 100%; padding: 7px 12px 7px 34px; border-radius: 9px;
          border: 1px solid #EEF2FF; font-size: 12px; font-family: inherit;
          color: #053366; background: #F8FAFF; outline: none;
          transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
        }
        .esearch::placeholder { color: #9CA3AF; }
        .esearch:focus { border-color: #02AFCF; box-shadow: 0 0 0 3px rgba(2,175,207,.1); background: white; }

        .eview-toggle { display: flex; gap: 3px; background: #EEF2FF; padding: 3px; border-radius: 9px; }
        .eview-btn {
          padding: 5px 11px; border-radius: 7px; background: transparent;
          border: none; cursor: pointer; display: flex; align-items: center;
          gap: 5px; font-size: 11px; font-weight: 700; color: #6B7280; font-family: inherit;
          transition: all .2s;
        }
        .eview-btn.on { background: white; color: #02AFCF; box-shadow: 0 1px 4px rgba(5,51,102,.08); }

        /* ── Grid card ── */
        .exc-card {
          background: white; border-radius: 14px; border: 1px solid #EEF2FF;
          overflow: hidden; transition: all .25s; position: relative; cursor: pointer;
        }
        .exc-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(5,51,102,.10); border-color: #DCE5FF; }
        .exc-card-img { width: 100%; height: 190px; object-fit: cover; display: block; transition: transform .4s; }
        .exc-card:hover .exc-card-img { transform: scale(1.04); }

        /* ── List row ── */
        .exc-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 18px; border-bottom: 1px solid #EEF2FF; transition: background .2s; cursor: pointer;
        }
        .exc-row:last-child { border-bottom: none; }
        .exc-row:hover { background: #F8FAFF; }

        /* ── Action buttons ── */
        .ebtn {
          padding: 7px 12px; border-radius: 8px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; font-family: inherit;
          transition: all .2s; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .ebtn:disabled { opacity: .45; cursor: not-allowed; }
        .ebtn-teal  { background: rgba(2,175,207,.1);  color: #02AFCF;  border: 1px solid rgba(2,175,207,.2);  }
        .ebtn-teal:hover:not(:disabled)  { background: rgba(2,175,207,.18); }
        .ebtn-red   { background: rgba(220,38,38,.08); color: #DC2626;  border: 1px solid rgba(220,38,38,.15); }
        .ebtn-red:hover:not(:disabled)   { background: rgba(220,38,38,.15); }
        .ebtn-gray  { background: #F8FAFF; color: #374151; border: 1px solid #EEF2FF; }
        .ebtn-gray:hover:not(:disabled)  { background: #EEF2FF; }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Toast toast={toast} />

      {/* ── Toolbar ── */}
      <div style={{
        background: "white", borderRadius: 14, border: "1px solid #EEF2FF",
        padding: "14px 16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(5,51,102,.04)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 10,
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {([
            { k: "all"    as const, label: "Toutes",     Icon: null           },
            { k: "active" as const, label: "Publiées",   Icon: CheckCircle2   },
            { k: "draft"  as const, label: "Brouillons", Icon: FileText       },
          ]).map(t => (
            <button key={t.k} className={`etab ${filter === t.k ? "on" : ""}`} onClick={() => setFilter(t.k)}>
              {t.Icon && <t.Icon size={12} strokeWidth={2} />}
              {t.label}
              <span className="etab-count" style={{
                background: filter === t.k ? "rgba(255,255,255,.25)" : "#EEF2FF",
                color:      filter === t.k ? "white" : "#6B7280",
              }}>
                {counts[t.k]}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Search */}
          <div className="esearch-wrap">
            <Search size={13} color="#9CA3AF" className="esearch-icon" />
            <input
              className="esearch"
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* View toggle */}
          <div className="eview-toggle">
            <button className={`eview-btn ${view === "grid" ? "on" : ""}`} onClick={() => setView("grid")}>
              <Grid3x3 size={12} /> Grille
            </button>
            <button className={`eview-btn ${view === "list" ? "on" : ""}`} onClick={() => setView("list")}>
              <List size={12} /> Liste
            </button>
          </div>
        </div>
      </div>

      {/* ── No results ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 14, border: "1px solid #EEF2FF" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Search size={22} color="#9CA3AF" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", margin: "0 0 5px" }}>Aucun résultat</p>
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>Aucune excursion ne correspond à vos critères</p>
        </div>

      // ── Grid ────────────────────────────────────────────────────────────────
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map(exc => (
            <div
              key={exc.id}
              className="exc-card"
              onClick={e => { if ((e.target as HTMLElement).closest("button,a")) return; window.location.href = `/admin/excursions/${exc.id}`; }}
            >
              {/* Image */}
              <div style={{ overflow: "hidden", position: "relative", height: 190, background: "#EEF2FF" }}>
                <img
                  src={exc.photos?.find(Boolean) || FALLBACK}
                  alt={exc.title}
                  className="exc-card-img"
                  onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                />
                {/* Status */}
                <div style={{ position: "absolute", top: 10, left: 10 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800,
                    backdropFilter: "blur(8px)", color: "white", display: "inline-flex", alignItems: "center", gap: 4,
                    background: exc.is_active ? "rgba(2,175,207,.85)" : "rgba(107,114,128,.8)",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "white", display: "inline-block" }} />
                    {exc.is_active ? "Publié" : "Brouillon"}
                  </span>
                </div>
                {/* Prestataire */}
                <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", background: "rgba(5,51,102,.65)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 10, color: "white", fontWeight: 600 }}>
                  {exc.prestataire_name}
                </div>
                {/* Price */}
                <div style={{ position: "absolute", bottom: 10, right: 12, padding: "4px 11px", background: "rgba(5,51,102,.75)", backdropFilter: "blur(8px)", borderRadius: 20, fontSize: 13, fontWeight: 800, color: "white" }}>
                  {exc.price_per_person} EUR
                </div>
                {exc.categories?.[0] && (
                  <div style={{ position: "absolute", bottom: 10, left: 12, padding: "3px 10px", background: "rgba(5,51,102,.55)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 10, color: "white", fontWeight: 500 }}>
                    {exc.categories[0]}
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: "14px 16px" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#053366", margin: "0 0 8px", lineHeight: 1.3 }}>
                  {exc.title}
                </h3>

                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#6B7280", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #EEF2FF", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} strokeWidth={1.5} /> {exc.city}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} strokeWidth={1.5} /> {exc.duration_hours}h</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Users size={11} strokeWidth={1.5} /> max {exc.max_people}</span>
                  {exc.rating > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={11} fill="#F59E0B" stroke="#F59E0B" strokeWidth={1.5} /> {exc.rating}
                      <span style={{ color: "#9CA3AF" }}>({exc.reviews_count})</span>
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 7 }}>
                  <button
                    className={exc.is_active ? "ebtn ebtn-red" : "ebtn ebtn-teal"}
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={loading === exc.id}
                    onClick={e => { e.stopPropagation(); toggleActive(exc.id, exc.is_active); }}
                  >
                    {loading === exc.id
                      ? <Loader2 size={13} style={{ animation: "spin .7s linear infinite" }} />
                      : exc.is_active
                        ? <><PauseCircle size={13} /> Dépublier</>
                        : <><PlayCircle  size={13} /> Publier</>
                    }
                  </button>
                  <button
                    className="ebtn ebtn-red"
                    disabled={loading === exc.id}
                    onClick={e => { e.stopPropagation(); handleDelete(exc.id, exc.title); }}
                    style={{ padding: "7px 11px" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      // ── List ─────────────────────────────────────────────────────────────────
      ) : (
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #EEF2FF", overflow: "hidden", boxShadow: "0 2px 8px rgba(5,51,102,.04)" }}>
          {filtered.map(exc => (
            <div
              key={exc.id}
              className="exc-row"
              onClick={e => { if ((e.target as HTMLElement).closest("button,a")) return; window.location.href = `/admin/excursions/${exc.id}`; }}
            >
              {/* Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 46, height: 38, borderRadius: 9, overflow: "hidden", flexShrink: 0, background: "#EEF2FF" }}>
                  <img
                    src={exc.photos?.find(Boolean) || FALLBACK}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#053366", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {exc.title}
                  </p>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 2 }}><MapPin size={10} strokeWidth={1.5} />{exc.city}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Clock size={10} strokeWidth={1.5} />{exc.duration_hours}h</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Users size={10} strokeWidth={1.5} />{exc.max_people}</span>
                    {exc.rating > 0 && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Star size={10} fill="#F59E0B" stroke="#F59E0B" />{exc.rating}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#02AFCF", minWidth: 70, flexShrink: 0 }}>
                  {exc.price_per_person} EUR
                </div>
                {/* Status inline badge */}
                <span style={{
                  padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
                  background: exc.is_active ? "rgba(2,175,207,.1)"  : "rgba(217,119,6,.1)",
                  color:      exc.is_active ? "#02AFCF"             : "#D97706",
                  border:     `1px solid ${exc.is_active ? "rgba(2,175,207,.2)" : "rgba(217,119,6,.2)"}`,
                }}>
                  {exc.is_active ? "Publié" : "Brouillon"}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, marginLeft: 12, flexShrink: 0 }}>
                <button
                  className={exc.is_active ? "ebtn ebtn-red" : "ebtn ebtn-teal"}
                  disabled={loading === exc.id}
                  onClick={e => { e.stopPropagation(); toggleActive(exc.id, exc.is_active); }}
                  style={{ padding: "6px 11px" }}
                >
                  {loading === exc.id
                    ? <Loader2 size={12} style={{ animation: "spin .7s linear infinite" }} />
                    : exc.is_active
                      ? <><PauseCircle size={12} /> Dépublier</>
                      : <><PlayCircle  size={12} /> Publier</>
                  }
                </button>
                <a
                  href={`/admin/excursions/${exc.id}/edit`}
                  onClick={e => e.stopPropagation()}
                  className="ebtn ebtn-gray"
                  style={{ textDecoration: "none", padding: "6px 10px" }}
                >
                  <Pencil size={12} />
                </a>
                <button
                  className="ebtn ebtn-red"
                  disabled={loading === exc.id}
                  onClick={e => { e.stopPropagation(); handleDelete(exc.id, exc.title); }}
                  style={{ padding: "6px 10px" }}
                >
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