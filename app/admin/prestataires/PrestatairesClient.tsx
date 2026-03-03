"use client";

import { useState } from "react";

interface Prestataire {
  id: string; user_id: string; full_name: string | null;
  agency_name: string | null; city: string | null;
  description: string | null; phone: string | null;
  is_validated: boolean; rating: number | null; created_at: string;
}
type Filter = "pending" | "validated" | "all";

export default function PrestatairesClient({ prestataires: initial }: { prestataires: Prestataire[] }) {
  const [prestataires, setPrestataires] = useState(initial);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const callApi = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/validate-prestataire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (!res.ok) {
      const j = await res.json();
      throw new Error(j.error || "Erreur");
    }
  };

  const handleValidate = async (userId: string, name: string) => {
    setLoading(userId);
    try {
      await callApi(userId, "validate");
      setPrestataires(prev => prev.map(p => p.user_id === userId ? { ...p, is_validated: true } : p));
      showToast(`✅ ${name} validé avec succès !`);
    } catch (e) {
      showToast(`❌ Erreur: ${e instanceof Error ? e.message : "Erreur"}`, false);
    }
    setLoading(null);
  };

  const handleRevoke = async (userId: string, name: string) => {
    if (!confirm(`Révoquer l'accès de ${name} ?`)) return;
    setLoading(userId);
    try {
      await callApi(userId, "revoke");
      setPrestataires(prev => prev.map(p => p.user_id === userId ? { ...p, is_validated: false } : p));
      showToast(`⚠️ Accès de ${name} révoqué.`);
    } catch (e) {
      showToast(`❌ Erreur: ${e instanceof Error ? e.message : "Erreur"}`, false);
    }
    setLoading(null);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Supprimer définitivement ${name} ? Irréversible.`)) return;
    setLoading(userId);
    try {
      await callApi(userId, "delete");
      setPrestataires(prev => prev.filter(p => p.user_id !== userId));
      showToast(`🗑️ ${name} supprimé.`);
    } catch (e) {
      showToast(`❌ Erreur: ${e instanceof Error ? e.message : "Erreur"}`, false);
    }
    setLoading(null);
  };

  const filtered = prestataires.filter(p => {
    if (filter === "pending") return !p.is_validated;
    if (filter === "validated") return p.is_validated;
    return true;
  });

  return (
    <>
      <style>{`
        .ptab{padding:8px 18px;border-radius:20px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all 0.2s}
        .ptab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .ptab:not(.on){background:white;color:#6B7280}
        .pcard{background:white;border-radius:16px;border:1px solid #F3F4F6;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:20px;transition:box-shadow 0.2s;border-left:4px solid transparent}
        .pcard:hover{box-shadow:0 4px 16px rgba(0,0,0,0.07)}
        .pbtn{padding:8px 16px;border-radius:10px;border:none;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;transition:all 0.2s}
        .pbtn:disabled{opacity:0.5;cursor:not-allowed}
        .pbtn-green{background:#F0FDF4;color:#15803D}.pbtn-green:hover:not(:disabled){background:#DCFCE7}
        .pbtn-gray{background:#F9FAFB;color:#374151;border:1px solid #E5E7EB}.pbtn-gray:hover:not(:disabled){background:#F3F4F6}
        .pbtn-red{background:#FEF2F2;color:#DC2626}.pbtn-red:hover:not(:disabled){background:#FEE2E2}
        .toast-wrap{position:fixed;top:24px;right:24px;z-index:999;padding:14px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;box-shadow:0 8px 30px rgba(0,0,0,0.15);animation:tin 0.3s ease}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {toast && (
        <div className="toast-wrap" style={{ background: toast.ok ? "#F0FDF4" : "#FEF2F2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}` }}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {([
          { key: "pending" as const, label: `⏳ En attente (${prestataires.filter(p => !p.is_validated).length})` },
          { key: "validated" as const, label: `✅ Validés (${prestataires.filter(p => p.is_validated).length})` },
          { key: "all" as const, label: `👥 Tous (${prestataires.length})` },
        ]).map(t => (
          <button key={t.key} className={`ptab ${filter === t.key ? "on" : ""}`} onClick={() => setFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>{filter === "pending" ? "🎉" : "🏢"}</p>
          <p style={{ fontWeight: 600, color: "#111827", fontSize: 16 }}>
            {filter === "pending" ? "Aucun prestataire en attente" : "Aucun prestataire trouvé"}
          </p>
          {filter === "pending" && <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>Toutes les demandes ont été traitées</p>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(p => {
            const name = p.agency_name || p.full_name || "Sans nom";
            const isLoading = loading === p.user_id;
            return (
              <div key={p.id} className="pcard" style={{ borderLeftColor: p.is_validated ? "#2B96A8" : "#F59E0B" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: p.is_validated ? "linear-gradient(135deg,#2B96A8,#4AABB8)" : "linear-gradient(135deg,#F59E0B,#FBBF24)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{name}</span>
                      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.is_validated ? "#F0FDF4" : "#FFFBEB", color: p.is_validated ? "#15803D" : "#D97706" }}>
                        {p.is_validated ? "✅ Validé" : "⏳ En attente"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {p.full_name && p.agency_name && <span style={{ fontSize: 12, color: "#6B7280" }}>👤 {p.full_name}</span>}
                      {p.city && <span style={{ fontSize: 12, color: "#6B7280" }}>📍 {p.city}</span>}
                      <span style={{ fontSize: 12, color: "#9CA3AF" }}>🗓️ {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {!p.is_validated ? (
                    <>
                      <button className="pbtn pbtn-green" onClick={() => handleValidate(p.user_id, name)} disabled={isLoading}>
                        {isLoading ? "..." : "✅ Valider"}
                      </button>
                      <button className="pbtn pbtn-red" onClick={() => handleDelete(p.user_id, name)} disabled={isLoading}>
                        🗑️ Rejeter
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="pbtn pbtn-gray" onClick={() => handleRevoke(p.user_id, name)} disabled={isLoading}>
                        {isLoading ? "..." : "⚠️ Révoquer"}
                      </button>
                      <button className="pbtn pbtn-red" onClick={() => handleDelete(p.user_id, name)} disabled={isLoading}>
                        🗑️ Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}