"use client";

import { useState } from "react";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];

interface Prestataire {
  id: string; user_id: string; full_name: string | null;
  agency_name: string | null; city: string | null;
  description: string | null; phone: string | null;
  avatar_url: string | null; is_validated: boolean;
  rating: number | null; created_at: string;
  excursion_count: number; excursion_active: number;
}
type Filter = "pending" | "validated" | "all";

export default function PrestatairesClient({ prestataires: initial }: { prestataires: Prestataire[] }) {
  const [prestataires, setPrestataires] = useState(initial);
  const [filter, setFilter]   = useState<Filter>("pending");
  const [search, setSearch]   = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [selected, setSelected] = useState<Prestataire | null>(null);
  const [mode, setMode]       = useState<"view" | "edit">("view");

  const [editFullName, setEditFullName] = useState("");
  const [editAgency,   setEditAgency]   = useState("");
  const [editCity,     setEditCity]     = useState("");
  const [editPhone,    setEditPhone]    = useState("");
  const [editDesc,     setEditDesc]     = useState("");
  const [editLoading,  setEditLoading]  = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3500);
  };

  const openModal = (p: Prestataire, m: "view" | "edit" = "view") => {
    setSelected(p); setMode(m);
    setEditFullName(p.full_name || ""); setEditAgency(p.agency_name || "");
    setEditCity(p.city || ""); setEditPhone(p.phone || ""); setEditDesc(p.description || "");
  };

  const callApi = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/validate-prestataire", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Erreur"); }
  };

  const handleValidate = async (userId: string, name: string) => {
    setLoading(userId);
    try {
      await callApi(userId, "validate");
      setPrestataires(prev => prev.map(p => p.user_id === userId ? { ...p, is_validated: true } : p));
      if (selected?.user_id === userId) setSelected(s => s ? { ...s, is_validated: true } : null);
      showToast(`✅ ${name} validé !`);
    } catch (e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleRevoke = async (userId: string, name: string) => {
    if (!confirm(`Révoquer l'accès de ${name} ?`)) return;
    setLoading(userId);
    try {
      await callApi(userId, "revoke");
      setPrestataires(prev => prev.map(p => p.user_id === userId ? { ...p, is_validated: false } : p));
      if (selected?.user_id === userId) setSelected(s => s ? { ...s, is_validated: false } : null);
      showToast(`⚠️ Accès de ${name} révoqué.`);
    } catch (e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Supprimer définitivement ${name} ? Irréversible.`)) return;
    setLoading(userId);
    try {
      await callApi(userId, "delete");
      setPrestataires(prev => prev.filter(p => p.user_id !== userId));
      setSelected(null);
      showToast(`🗑️ ${name} supprimé.`);
    } catch (e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/update-prestataire", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.user_id,
          updates: { full_name: editFullName, agency_name: editAgency, city: editCity, phone: editPhone, description: editDesc },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = { ...selected, full_name: editFullName, agency_name: editAgency, city: editCity, phone: editPhone, description: editDesc };
      setPrestataires(prev => prev.map(p => p.user_id === selected.user_id ? updated : p));
      setSelected(updated); setMode("view");
      showToast("✅ Profil mis à jour !");
    } catch (e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setEditLoading(false);
  };

  const filtered = prestataires.filter(p => {
    const statusOk = filter === "pending" ? !p.is_validated : filter === "validated" ? p.is_validated : true;
    const name = (p.agency_name || p.full_name || "").toLowerCase();
    const searchOk = !search || name.includes(search.toLowerCase()) || (p.city||"").toLowerCase().includes(search.toLowerCase());
    const cityOk = !cityFilter || p.city === cityFilter;
    return statusOk && searchOk && cityOk;
  });

  const cities = [...new Set(prestataires.map(p => p.city).filter(Boolean))].sort() as string[];
  const counts = {
    pending: prestataires.filter(p => !p.is_validated).length,
    validated: prestataires.filter(p => p.is_validated).length,
    all: prestataires.length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        .ptab{padding:8px 18px;border-radius:20px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}
        .ptab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .ptab:not(.on){background:white;color:#6B7280}
        .ptab:not(.on):hover{background:#F9FAFB}
        .pcard{background:white;border-radius:14px;border:1px solid #F0F0F0;padding:16px 18px;display:flex;align-items:center;gap:14px;transition:all .2s;cursor:pointer}
        .pcard:hover{box-shadow:0 4px 18px rgba(0,0,0,.07);border-color:#E5E7EB;transform:translateY(-1px)}
        .pbtn{padding:7px 13px;border-radius:9px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s;white-space:nowrap}
        .pbtn:disabled{opacity:.5;cursor:not-allowed}
        .pbtn-green{background:#F0FDF4;color:#15803D}.pbtn-green:hover:not(:disabled){background:#DCFCE7}
        .pbtn-gray{background:#F9FAFB;color:#374151;border:1px solid #E5E7EB}.pbtn-gray:hover:not(:disabled){background:#F3F4F6}
        .pbtn-red{background:#FEF2F2;color:#DC2626}.pbtn-red:hover:not(:disabled){background:#FEE2E2}
        .pbtn-teal{background:rgba(43,150,168,.1);color:#2B96A8}.pbtn-teal:hover:not(:disabled){background:rgba(43,150,168,.18)}
        .fi{width:100%;padding:10px 14px;border:1.5px solid #E5E7EB;border-radius:11px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s;background:#FAFAFA;color:#111827}
        .fi:focus{border-color:#2B96A8;background:white}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:white;border-radius:24px;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.2)}
        .toast-w{position:fixed;top:22px;right:22px;z-index:9999;padding:12px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:inherit;box-shadow:0 8px 28px rgba(0,0,0,.12);animation:tin .3s ease}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .3s ease}
      `}</style>

      {toast && (
        <div className="toast-w" style={{ background: toast.ok ? "#F0FDF4" : "#FEF2F2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}` }}>
          {toast.msg}
        </div>
      )}

      {/* ── BARRE FILTRES ── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F3F4F6", padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Recherche */}
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", pointerEvents: "none" }}>🔍</span>
            <input className="fi" placeholder="Rechercher par nom, agence, ville..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }} />
          </div>

          {/* Ville */}
          <div style={{ position: "relative", width: 170 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9CA3AF", pointerEvents: "none" }}>📍</span>
            <select className="fi" value={cityFilter} onChange={e => setCityFilter(e.target.value)}
              style={{ paddingLeft: 34, cursor: "pointer", appearance: "none" }}>
              <option value="">Toutes les villes</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Séparateur vertical */}
          <div style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0 }} />

          {/* Tabs statut */}
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { k: "pending"   as const, label: "En attente", count: counts.pending,   icon: "⏳" },
              { k: "validated" as const, label: "Validés",    count: counts.validated, icon: "✅" },
              { k: "all"       as const, label: "Tous",       count: counts.all,       icon: "👥" },
            ]).map(t => (
              <button key={t.k} className={`ptab ${filter === t.k ? "on" : ""}`} onClick={() => setFilter(t.k)}>
                {t.icon} {t.label}
                <span style={{ marginLeft: 6, fontSize: 11, background: filter === t.k ? "rgba(255,255,255,.25)" : "#F3F4F6", color: filter === t.k ? "white" : "#6B7280", borderRadius: 12, padding: "1px 7px", fontWeight: 800 }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Résumé actif */}
        {(search || cityFilter || filter !== "all") && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
            {(search || cityFilter) && (
              <button onClick={() => { setSearch(""); setCityFilter(""); }}
                style={{ fontSize: 11, color: "#2B96A8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, padding: 0 }}>
                Effacer les filtres ×
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── LISTE ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px", background: "white", borderRadius: 16, border: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 38, marginBottom: 10 }}>{filter === "pending" ? "🎉" : "🔍"}</p>
          <p style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>
            {filter === "pending" ? "Aucun prestataire en attente" : "Aucun résultat"}
          </p>
          {filter === "pending" && <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 5 }}>Toutes les demandes ont été traitées !</p>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(p => {
            const name = p.agency_name || p.full_name || "Sans nom";
            const isLoading = loading === p.user_id;
            return (
              <div key={p.user_id} className="pcard"
                style={{ borderLeft: `3px solid ${p.is_validated ? "#2B96A8" : "#F59E0B"}` }}
                onClick={() => openModal(p, "view")}>

                {/* Avatar */}
                <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: p.is_validated ? "linear-gradient(135deg,#2B96A8,#4AABB8)" : "linear-gradient(135deg,#F59E0B,#FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18 }}>
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : name[0].toUpperCase()
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{name}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 18, fontSize: 11, fontWeight: 700, background: p.is_validated ? "#F0FDF4" : "#FFFBEB", color: p.is_validated ? "#15803D" : "#D97706" }}>
                      {p.is_validated ? "✅ Validé" : "⏳ En attente"}
                    </span>
                    {p.excursion_count > 0 && (
                      <span style={{ padding: "2px 8px", borderRadius: 18, fontSize: 11, fontWeight: 600, background: "rgba(43,150,168,.08)", color: "#2B96A8" }}>
                        🗺️ {p.excursion_active}/{p.excursion_count}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {p.full_name && p.agency_name && <span style={{ fontSize: 12, color: "#6B7280" }}>👤 {p.full_name}</span>}
                    {p.city && <span style={{ fontSize: 12, color: "#6B7280" }}>📍 {p.city}</span>}
                    {p.phone && <span style={{ fontSize: 12, color: "#6B7280" }}>📞 {p.phone}</span>}
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>🗓️ {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button className="pbtn pbtn-teal" onClick={() => openModal(p, "edit")} disabled={isLoading}>✏️</button>
                  {!p.is_validated ? (
                    <>
                      <button className="pbtn pbtn-green" onClick={() => handleValidate(p.user_id, name)} disabled={isLoading}>
                        {isLoading ? "..." : "✅ Valider"}
                      </button>
                      <button className="pbtn pbtn-red" onClick={() => handleDelete(p.user_id, name)} disabled={isLoading}>🗑️</button>
                    </>
                  ) : (
                    <>
                      <button className="pbtn pbtn-gray" onClick={() => handleRevoke(p.user_id, name)} disabled={isLoading}>
                        {isLoading ? "..." : "⚠️ Révoquer"}
                      </button>
                      <button className="pbtn pbtn-red" onClick={() => handleDelete(p.user_id, name)} disabled={isLoading}>🗑️</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ── */}
      {selected && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="modal fu">
            {/* Header modal */}
            <div style={{ padding: "22px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={() => setMode("view")}
                  style={{ padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: mode === "view" ? "#111827" : "#F3F4F6", color: mode === "view" ? "white" : "#6B7280", transition: "all .2s" }}>
                  👁️ Profil
                </button>
                <button onClick={() => setMode("edit")}
                  style={{ padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: mode === "edit" ? "#2B96A8" : "#F3F4F6", color: mode === "edit" ? "white" : "#6B7280", transition: "all .2s" }}>
                  ✏️ Modifier
                </button>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: "#F3F4F6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {mode === "view" ? (
              <div style={{ padding: "0 26px 26px" }}>
                {/* Avatar + nom */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #F0F0F0" }}>
                    {selected.avatar_url
                      ? <img src={selected.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: selected.is_validated ? "linear-gradient(135deg,#2B96A8,#4AABB8)" : "linear-gradient(135deg,#F59E0B,#FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 26 }}>
                          {(selected.agency_name || selected.full_name || "?")[0].toUpperCase()}
                        </div>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
                      {selected.agency_name || selected.full_name || "Sans nom"}
                    </h2>
                    {selected.full_name && selected.agency_name && (
                      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 7 }}>👤 {selected.full_name}</p>
                    )}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 9px", borderRadius: 18, fontSize: 11, fontWeight: 700, background: selected.is_validated ? "#F0FDF4" : "#FFFBEB", color: selected.is_validated ? "#15803D" : "#D97706", border: `1px solid ${selected.is_validated ? "#BBF7D0" : "#FDE68A"}` }}>
                        {selected.is_validated ? "✅ Validé" : "⏳ En attente"}
                      </span>
                      {selected.excursion_count > 0 && (
                        <span style={{ padding: "2px 9px", borderRadius: 18, fontSize: 11, fontWeight: 600, background: "rgba(43,150,168,.08)", color: "#2B96A8" }}>
                          🗺️ {selected.excursion_active}/{selected.excursion_count} excursions
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Détails */}
                <div style={{ marginBottom: 16 }}>
                  {[
                    { icon: "📍", label: "Ville",         val: selected.city || "—" },
                    { icon: "📞", label: "Téléphone",     val: selected.phone || "—" },
                    { icon: "⭐", label: "Note moyenne",  val: selected.rating ? `${selected.rating}/5` : "—" },
                    { icon: "🗓️", label: "Inscrit le",    val: new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
                  ].map((row, i) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? "1px solid #F3F4F6" : "none", fontSize: 13 }}>
                      <span style={{ color: "#6B7280" }}>{row.icon} {row.label}</span>
                      <span style={{ fontWeight: 700, color: "#111827" }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                {selected.description && (
                  <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Description</p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{selected.description}</p>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <button className="pbtn pbtn-teal" style={{ flex: 1 }} onClick={() => setMode("edit")}>✏️ Modifier</button>
                  {!selected.is_validated ? (
                    <button className="pbtn pbtn-green" style={{ flex: 1 }}
                      onClick={() => handleValidate(selected.user_id, selected.agency_name || selected.full_name || "—")} disabled={loading === selected.user_id}>
                      {loading === selected.user_id ? "..." : "✅ Valider"}
                    </button>
                  ) : (
                    <button className="pbtn pbtn-gray" style={{ flex: 1 }}
                      onClick={() => handleRevoke(selected.user_id, selected.agency_name || selected.full_name || "—")} disabled={loading === selected.user_id}>
                      {loading === selected.user_id ? "..." : "⚠️ Révoquer"}
                    </button>
                  )}
                  <button className="pbtn pbtn-red"
                    onClick={() => handleDelete(selected.user_id, selected.agency_name || selected.full_name || "—")} disabled={loading === selected.user_id}>
                    🗑️
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: "0 26px 26px" }}>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 18 }}>
                  Modification de <strong style={{ color: "#111827" }}>{selected.agency_name || selected.full_name}</strong>
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>Nom complet</label>
                    <input className="fi" value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder="Nom et prénom" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>Nom de l&apos;agence</label>
                    <input className="fi" value={editAgency} onChange={e => setEditAgency(e.target.value)} placeholder="Nom de l'agence" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>Ville</label>
                      <select className="fi" value={editCity} onChange={e => setEditCity(e.target.value)} style={{ cursor: "pointer", appearance: "none" }}>
                        <option value="">Sélectionnez</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>Téléphone</label>
                      <input className="fi" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+216 XX XXX XXX" type="tel" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>Description</label>
                    <textarea className="fi" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)}
                      placeholder="Description de l'activité..." style={{ resize: "vertical" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                  <button onClick={() => setMode("view")}
                    style={{ flex: 1, padding: "11px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Annuler
                  </button>
                  <button onClick={handleSaveEdit} disabled={editLoading}
                    style={{ flex: 2, padding: "11px", background: editLoading ? "#9CA3AF" : "#2B96A8", color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: editLoading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .2s" }}>
                    {editLoading ? "Sauvegarde..." : "💾 Sauvegarder"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}