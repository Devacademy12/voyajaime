"use client";

import { useState } from "react";
import { useToast } from "../../../lib/useToast";
import { useCrudOperation } from "../../../lib/useCrudOperation";
import { apiPost } from "../../../lib/api";
import { Toast } from "../../components/ui/Toast";
import {
  MapPin, Tag, Plus, Pencil, Trash2, Play, Pause,
  CheckCircle, Save, X,
} from "lucide-react";

interface Ville {
  id: string; nom: string;
  region: string; description: string; active: boolean; created_at: string;
}
interface Categorie {
  id: string; nom: string; couleur: string; created_at: string;
}

const COULEURS_PRESET = [
  "#02AFCF","#259FFC","#053366","#D97706","#10B981",
  "#8B5CF6","#EC4899","#F97316","#6366F1","#14B8A6",
];

const DEFAULT_VILLE: Partial<Ville>     = { nom: "", region: "Tunisie", description: "", active: true };
const DEFAULT_CAT:   Partial<Categorie> = { nom: "", couleur: "#02AFCF" };

export default function CatalogueClient({
  villes: initV, categories: initC,
}: { villes: Ville[]; categories: Categorie[] }) {
  const [tab, setTab]           = useState<"villes" | "categories">("villes");
  const [villeModal, setVilleModal] = useState<Partial<Ville>     | null>(null);
  const [catModal,   setCatModal]   = useState<Partial<Categorie> | null>(null);

  const { toast, showToast } = useToast();

  // ── VILLES CRUD ─────────────────────────────────────────────────────────────
  const { loading: villeLoading, data: villes, execute: executeVille } =
    useCrudOperation(initV, async (payload) => apiPost("/api/admin/villes", payload));

  const saveVille = async () => {
    if (!villeModal?.nom?.trim()) { showToast("Le nom est requis", false); return; }
    try {
      if (villeModal.id) {
        await executeVille(villeModal.id, { action: "update", id: villeModal.id, value: { nom: villeModal.nom, region: villeModal.region, description: villeModal.description, active: villeModal.active } }, {
          successMessage: "Ville mise à jour",
          onSuccess: (prev) => prev.map(v => v.id === villeModal.id ? { ...v, ...villeModal } : v),
        });
      } else {
        await executeVille("create", { action: "create", id: "create", value: { nom: villeModal.nom, region: villeModal.region, description: villeModal.description, active: villeModal.active } }, {
          successMessage: "Ville ajoutée",
          onSuccess: (prev) => [...prev, { ...villeModal, id: "temp" } as Ville].sort((a, b) => a.nom.localeCompare(b.nom)),
        });
      }
      setVilleModal(null);
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
  };

  const deleteVille = async (id: string, nom: string) => {
    await executeVille(id, { action: "delete", id, value: { id } }, {
      confirmMessage: `Supprimer "${nom}" ?`,
      successMessage: "Ville supprimée",
    });
  };

  const toggleVille = async (v: Ville) => {
    await executeVille(v.id, { action: "toggle", id: v.id, value: { active: !v.active } }, {
      successMessage: "",
      onSuccess: (prev) => prev.map(x => x.id === v.id ? { ...x, active: !x.active } : x),
    });
  };

  // ── CATÉGORIES CRUD ──────────────────────────────────────────────────────────
  const { loading: catLoading, data: categories, execute: executeCat } =
    useCrudOperation(initC, async (payload) => apiPost("/api/admin/categories", payload));

  const saveCat = async () => {
    if (!catModal?.nom?.trim()) { showToast("Le nom est requis", false); return; }
    try {
      if (catModal.id) {
        await executeCat(catModal.id, { action: "update", id: catModal.id, value: { nom: catModal.nom, couleur: catModal.couleur } }, {
          successMessage: "Catégorie mise à jour",
          onSuccess: (prev) => prev.map(c => c.id === catModal.id ? { ...c, ...catModal } : c),
        });
      } else {
        await executeCat("create", { action: "create", id: "create", value: { nom: catModal.nom, couleur: catModal.couleur } }, {
          successMessage: "Catégorie ajoutée",
          onSuccess: (prev) => [...prev, { ...catModal, id: "temp" } as Categorie].sort((a, b) => a.nom.localeCompare(b.nom)),
        });
      }
      setCatModal(null);
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
  };

  const deleteCat = async (id: string, nom: string) => {
    await executeCat(id, { action: "delete", id, value: { id } }, {
      confirmMessage: `Supprimer "${nom}" ?`,
      successMessage: "Catégorie supprimée",
    });
  };

  return (
    <>
      <style>{`
        /* ── Tabs ── */
        .ctab {
          padding: 6px 14px; border-radius: 8px; border: 1px solid #EEF2FF;
          cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit;
          transition: all .2s; display: inline-flex; align-items: center; gap: 6px;
        }
        .ctab.on  { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 2px 8px rgba(2,175,207,.3); }
        .ctab:not(.on) { background: white; color: #6B7280; }
        .ctab:not(.on):hover { background: #F8FAFF; border-color: #DCE5FF; color: #053366; }
        .ctab-count { font-size: 10px; border-radius: 10px; padding: 1px 6px; font-weight: 800; }

        /* ── Add button ── */
        .cadd-btn {
          padding: 8px 16px; background: linear-gradient(135deg,#02AFCF,#259FFC);
          color: white; border: none; border-radius: 9px; cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: inherit;
          display: inline-flex; align-items: center; gap: 6px;
          box-shadow: 0 2px 8px rgba(2,175,207,.3); transition: opacity .2s;
        }
        .cadd-btn:hover { opacity: .9; }

        /* ── Item card ── */
        .ccard {
          background: white; border-radius: 12px; border: 1px solid #EEF2FF;
          padding: 13px 16px; display: flex; align-items: center; gap: 14px;
          transition: all .2s;
        }
        .ccard:hover { box-shadow: 0 4px 16px rgba(5,51,102,.07); border-color: #DCE5FF; }

        /* ── Item action buttons ── */
        .cbtn {
          padding: 6px 11px; border-radius: 8px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; font-family: inherit;
          transition: all .2s; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .cbtn:disabled { opacity: .45; cursor: not-allowed; }
        .cbtn-teal { background: rgba(2,175,207,.1);  color: #02AFCF; }
        .cbtn-teal:hover:not(:disabled) { background: rgba(2,175,207,.18); }
        .cbtn-red  { background: rgba(220,38,38,.08); color: #DC2626; }
        .cbtn-red:hover:not(:disabled)  { background: rgba(220,38,38,.15); }
        .cbtn-gray { background: #F8FAFF; color: #374151; }
        .cbtn-gray:hover:not(:disabled) { background: #EEF2FF; }
        .cbtn-green { background: rgba(16,185,129,.1); color: #059669; }
        .cbtn-green:hover:not(:disabled) { background: rgba(16,185,129,.18); }

        /* ── Modal ── */
        .overlay {
          position: fixed; inset: 0; background: rgba(5,51,102,.35);
          z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px;
          backdrop-filter: blur(2px);
        }
        .modal {
          background: white; border-radius: 18px; width: 100%; max-width: 480px;
          box-shadow: 0 24px 72px rgba(5,51,102,.18);
          border: 1px solid #EEF2FF;
        }
        .modal-header {
          padding: 20px 24px 0;
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;
        }
        .modal-close {
          background: #F8FAFF; border: 1px solid #EEF2FF; border-radius: "50%";
          width: 30px; height: 30px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; transition: background .2s;
        }
        .modal-close:hover { background: #EEF2FF; }

        /* ── Form input ── */
        .fi {
          width: 100%; padding: 9px 13px; border: 1px solid #EEF2FF; border-radius: 9px;
          font-size: 13px; font-family: inherit; outline: none;
          transition: border-color .2s, box-shadow .2s; background: #F8FAFF; color: #053366;
          box-sizing: border-box;
        }
        .fi::placeholder { color: #9CA3AF; }
        .fi:focus { border-color: #02AFCF; box-shadow: 0 0 0 3px rgba(2,175,207,.1); background: white; }

        /* ── Color swatch ── */
        .color-swatch {
          width: 26px; height: 26px; border-radius: 8px; cursor: pointer;
          transition: all .2s; border: 2px solid transparent;
        }
        .color-swatch.on { border-color: #053366; transform: scale(1.2); box-shadow: 0 0 0 2px white, 0 0 0 4px #053366; }

        /* ── Modal buttons ── */
        .mbtn-cancel {
          flex: 1; padding: 11px; background: #F8FAFF; color: #374151;
          border: 1px solid #EEF2FF; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 6px;
          transition: background .2s;
        }
        .mbtn-cancel:hover { background: #EEF2FF; }
        .mbtn-save {
          flex: 2; padding: 11px;
          background: linear-gradient(135deg,#02AFCF,#259FFC);
          color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 6px;
          box-shadow: 0 2px 8px rgba(2,175,207,.3); transition: opacity .2s;
        }
        .mbtn-save:disabled { opacity: .6; cursor: not-allowed; }
        .mbtn-save:not(:disabled):hover { opacity: .9; }

        /* ── Empty state ── */
        .empty-state {
          text-align: center; padding: 52px 20px;
          background: white; border-radius: 14px; border: 1px solid #EEF2FF;
        }
      `}</style>

      <Toast toast={toast} />

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {([
          { key: "villes"      as const, label: "Villes",      Icon: MapPin, count: villes.length      },
          { key: "categories"  as const, label: "Catégories",  Icon: Tag,    count: categories.length  },
        ]).map(({ key, label, Icon, count }) => (
          <button key={key} className={`ctab ${tab === key ? "on" : ""}`} onClick={() => setTab(key)}>
            <Icon size={12} strokeWidth={1.5} />
            {label}
            <span className="ctab-count" style={{
              background: tab === key ? "rgba(255,255,255,.25)" : "#EEF2FF",
              color:      tab === key ? "white" : "#6B7280",
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ════════════════ VILLES ════════════════ */}
      {tab === "villes" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, margin: 0 }}>
              <span style={{ color: "#02AFCF", fontWeight: 700 }}>{villes.filter(v => v.active).length}</span> actives
              {" · "}
              <span style={{ fontWeight: 600 }}>{villes.filter(v => !v.active).length}</span> inactives
            </p>
            <button className="cadd-btn" onClick={() => setVilleModal({ ...DEFAULT_VILLE })}>
              <Plus size={13} /> Ajouter une ville
            </button>
          </div>

          {villes.length === 0 ? (
            <div className="empty-state">
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <MapPin size={22} color="#9CA3AF" strokeWidth={1.5} />
              </div>
              <p style={{ fontWeight: 700, color: "#053366", fontSize: 14, margin: "0 0 5px" }}>Aucune ville</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Ajoutez votre première ville</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 8 }}>
              {villes.map(v => (
                <div key={v.id} className="ccard" style={{ borderLeft: `3px solid ${v.active ? "#02AFCF" : "#EEF2FF"}` }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: v.active ? "rgba(2,175,207,.1)" : "#F8FAFF",
                    border: `1px solid ${v.active ? "rgba(2,175,207,.2)" : "#EEF2FF"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <MapPin size={18} color={v.active ? "#02AFCF" : "#9CA3AF"} strokeWidth={1.5} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#053366" }}>{v.nom}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        display: "inline-flex", alignItems: "center", gap: 3,
                        background: v.active ? "rgba(2,175,207,.1)"  : "#F8FAFF",
                        color:      v.active ? "#02AFCF"             : "#9CA3AF",
                        border:     `1px solid ${v.active ? "rgba(2,175,207,.2)" : "#EEF2FF"}`,
                      }}>
                        {v.active ? <CheckCircle size={8} /> : <Pause size={8} />}
                        {v.active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, fontWeight: 500 }}>
                      {v.region}
                      {v.description ? ` · ${v.description.slice(0, 40)}${v.description.length > 40 ? "…" : ""}` : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button
                      className={v.active ? "cbtn cbtn-gray" : "cbtn cbtn-green"}
                      disabled={villeLoading === v.id}
                      onClick={() => toggleVille(v)}
                    >
                      {villeLoading === v.id ? "…" : v.active ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                    <button className="cbtn cbtn-teal" disabled={villeLoading === v.id} onClick={() => setVilleModal({ ...v })}>
                      <Pencil size={12} />
                    </button>
                    <button className="cbtn cbtn-red" disabled={villeLoading === v.id} onClick={() => deleteVille(v.id, v.nom)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ CATÉGORIES ════════════════ */}
      {tab === "categories" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, margin: 0 }}>
              <span style={{ color: "#D97706", fontWeight: 700 }}>{categories.length}</span> catégorie{categories.length !== 1 ? "s" : ""}
            </p>
            <button className="cadd-btn" onClick={() => setCatModal({ ...DEFAULT_CAT })}>
              <Plus size={13} /> Ajouter une catégorie
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="empty-state">
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <Tag size={22} color="#9CA3AF" strokeWidth={1.5} />
              </div>
              <p style={{ fontWeight: 700, color: "#053366", fontSize: 14, margin: "0 0 5px" }}>Aucune catégorie</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Ajoutez votre première catégorie</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 8 }}>
              {categories.map(c => (
                <div key={c.id} className="ccard" style={{ borderLeft: `3px solid ${c.couleur}` }}>
                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${c.couleur}15`,
                    border: `1px solid ${c.couleur}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Tag size={18} color={c.couleur} strokeWidth={1.5} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#053366" }}>{c.nom}</span>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.couleur, display: "inline-block", flexShrink: 0 }} />
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace", margin: 0 }}>{c.couleur}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button className="cbtn cbtn-teal" disabled={catLoading === c.id} onClick={() => setCatModal({ ...c })}>
                      <Pencil size={12} />
                    </button>
                    <button className="cbtn cbtn-red" disabled={catLoading === c.id} onClick={() => deleteCat(c.id, c.nom)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ MODAL VILLE ════════════════ */}
      {villeModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setVilleModal(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: 0 }}>
                {villeModal.id ? "Modifier la ville" : "Ajouter une ville"}
              </h2>
              <button className="modal-close" onClick={() => setVilleModal(null)}>
                <X size={14} color="#6B7280" />
              </button>
            </div>

            <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
                  Nom de la ville *
                </label>
                <input className="fi" value={villeModal.nom || ""} onChange={e => setVilleModal(p => ({ ...p!, nom: e.target.value }))} placeholder="Ex: Tunis" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
                  Région
                </label>
                <input className="fi" value={villeModal.region || ""} onChange={e => setVilleModal(p => ({ ...p!, region: e.target.value }))} placeholder="Ex: Grand Tunis" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
                  Description
                </label>
                <textarea className="fi" rows={2} value={villeModal.description || ""} onChange={e => setVilleModal(p => ({ ...p!, description: e.target.value }))} placeholder="Courte description…" style={{ resize: "vertical" }} />
              </div>

              <label style={{
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                padding: "10px 14px", background: "#F8FAFF", borderRadius: 10, border: "1px solid #EEF2FF",
              }}>
                <input
                  type="checkbox"
                  checked={villeModal.active !== false}
                  onChange={e => setVilleModal(p => ({ ...p!, active: e.target.checked }))}
                  style={{ width: 15, height: 15, accentColor: "#02AFCF" }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Ville active (visible pour les prestataires)</span>
              </label>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="mbtn-cancel" onClick={() => setVilleModal(null)}>
                  <X size={13} /> Annuler
                </button>
                <button className="mbtn-save" onClick={saveVille} disabled={!!villeLoading}>
                  {villeLoading ? "Sauvegarde…" : villeModal.id ? <><Save size={13} /> Enregistrer</> : <><Plus size={13} /> Ajouter</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MODAL CATÉGORIE ════════════════ */}
      {catModal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setCatModal(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#053366", margin: 0 }}>
                {catModal.id ? "Modifier la catégorie" : "Ajouter une catégorie"}
              </h2>
              <button className="modal-close" onClick={() => setCatModal(null)}>
                <X size={14} color="#6B7280" />
              </button>
            </div>

            <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
                  Nom de la catégorie *
                </label>
                <input className="fi" value={catModal.nom || ""} onChange={e => setCatModal(p => ({ ...p!, nom: e.target.value }))} placeholder="Ex: Randonnée" />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                  Couleur
                </label>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                  {COULEURS_PRESET.map(col => (
                    <button
                      key={col} type="button"
                      className={`color-swatch ${catModal.couleur === col ? "on" : ""}`}
                      style={{ background: col }}
                      onClick={() => setCatModal(p => ({ ...p!, couleur: col }))}
                    />
                  ))}
                  <input
                    type="color"
                    value={catModal.couleur || "#02AFCF"}
                    onChange={e => setCatModal(p => ({ ...p!, couleur: e.target.value }))}
                    style={{ width: 30, height: 26, border: "1px solid #EEF2FF", borderRadius: 8, cursor: "pointer", padding: 2 }}
                  />
                </div>

                {/* Preview chip */}
                <div style={{
                  marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  background: `${catModal.couleur}15`, border: `1px solid ${catModal.couleur}35`,
                }}>
                  <Tag size={12} color={catModal.couleur} strokeWidth={2} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: catModal.couleur }}>
                    {catModal.nom || "Aperçu"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="mbtn-cancel" onClick={() => setCatModal(null)}>
                  <X size={13} /> Annuler
                </button>
                <button className="mbtn-save" onClick={saveCat} disabled={!!catLoading}>
                  {catLoading ? "Sauvegarde…" : catModal.id ? <><Save size={13} /> Enregistrer</> : <><Plus size={13} /> Ajouter</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}