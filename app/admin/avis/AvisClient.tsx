"use client";
import { useState } from "react";

type Filter = "pending" | "approved" | "all";

interface Avis {
  id: string;
  rating: number;
  comment: string;
  is_moderated: boolean;
  created_at: string;
  touriste_name: string;
  excursion_title: string;
  excursion_city: string;
}

export default function AvisClient({ avis: initial }: { avis: Avis[] }) {
  const [avis, setAvis] = useState(initial);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const callApi = async (avisId: string, action: string) => {
    const res = await fetch("/api/admin/moderate-avis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avisId, action }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || "Erreur serveur");
  };

  const handleApprove = async (id: string, name: string) => {
    setLoading(id);
    try {
      await callApi(id, "approve");
      setAvis(prev => prev.map(a => a.id === id ? { ...a, is_moderated: true } : a));
      showToast(`✅ Avis de ${name} approuvé et publié !`);
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false);
    }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    setLoading(id);
    try {
      await callApi(id, "delete");
      setAvis(prev => prev.filter(a => a.id !== id));
      showToast("🗑️ Avis supprimé.");
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false);
    }
    setLoading(null);
  };

  const filtered = avis.filter(a =>
    filter === "pending" ? !a.is_moderated :
    filter === "approved" ? a.is_moderated : true
  );

  const counts = {
    pending: avis.filter(a => !a.is_moderated).length,
    approved: avis.filter(a => a.is_moderated).length,
    all: avis.length,
  };

  return (
    <>
      <style>{`
        .atab { padding: 8px 18px; border-radius: 20px; border: 1px solid #E5E7EB; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; transition: all .2s; }
        .atab.on { background: #2B96A8; color: white; border-color: #2B96A8; }
        .atab:not(.on) { background: white; color: #6B7280; }
        .atab:not(.on):hover { background: #F9FAFB; }
        .abtn { padding: 8px 16px; border-radius: 10px; border: none; cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit; transition: all .2s; white-space: nowrap; }
        .abtn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; }
        .abtn-green { background: #F0FDF4; color: #15803D; }
        .abtn-green:hover:not(:disabled) { background: #DCFCE7; transform: translateY(-1px); }
        .abtn-red { background: #FEF2F2; color: #DC2626; }
        .abtn-red:hover:not(:disabled) { background: #FEE2E2; transform: translateY(-1px); }
        .avis-row { background: white; border-radius: 16px; border: 1px solid #F3F4F6; padding: 20px 24px; display: flex; justify-content: space-between; gap: 20px; transition: box-shadow .2s; }
        .avis-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }
        .toast-wrap { position: fixed; top: 24px; right: 24px; z-index: 999; padding: 14px 20px; border-radius: 14px; font-size: 14px; font-weight: 600; font-family: inherit; box-shadow: 0 8px 30px rgba(0,0,0,.12); animation: tin .3s ease; }
        @keyframes tin { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {toast && (
        <div className="toast-wrap" style={{
          background: toast.ok ? "#F0FDF4" : "#FEF2F2",
          color: toast.ok ? "#15803D" : "#DC2626",
          border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}`,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {([
          { key: "pending" as const, label: `⏳ En attente (${counts.pending})` },
          { key: "approved" as const, label: `✅ Approuvés (${counts.approved})` },
          { key: "all" as const, label: `🗂️ Tous (${counts.all})` },
        ]).map(t => (
          <button key={t.key} className={`atab ${filter === t.key ? "on" : ""}`}
            onClick={() => setFilter(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #F3F4F6" }}>
          <p style={{ fontSize: 44, marginBottom: 12 }}>
            {filter === "pending" ? "🎉" : "💬"}
          </p>
          <p style={{ fontWeight: 700, color: "#111827", fontSize: 16 }}>
            {filter === "pending" ? "Aucun avis en attente de modération" : "Aucun avis trouvé"}
          </p>
          {filter === "pending" && (
            <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>Tous les avis ont été traités !</p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(a => (
            <div key={a.id} className="avis-row"
              style={{ borderLeft: `4px solid ${a.is_moderated ? "#2B96A8" : "#F59E0B"}` }}>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                    {(a.touriste_name?.[0] || "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                        {a.touriste_name}
                      </span>
                      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: a.is_moderated ? "#F0FDF4" : "#FFFBEB", color: a.is_moderated ? "#15803D" : "#D97706" }}>
                        {a.is_moderated ? "✅ Publié" : "⏳ En attente"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {/* Étoiles */}
                  <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: 15, color: s <= a.rating ? "#F59E0B" : "#E5E7EB" }}>★</span>
                    ))}
                  </div>
                </div>

                {/* Excursion */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "#F3F4F6", borderRadius: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 12 }}>🏔️</span>
                  <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
                    {a.excursion_title}
                  </span>
                  {a.excursion_city && (
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>— {a.excursion_city}</span>
                  )}
                </div>

                {/* Commentaire */}
                {a.comment && (
                  <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid #E5E7EB" }}>
                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                      &ldquo;{a.comment}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, justifyContent: "center" }}>
                {!a.is_moderated && (
                  <button className="abtn abtn-green"
                    onClick={() => handleApprove(a.id, a.touriste_name)}
                    disabled={loading === a.id}>
                    {loading === a.id ? "..." : "✅ Approuver"}
                  </button>
                )}
                <button className="abtn abtn-red"
                  onClick={() => handleDelete(a.id)}
                  disabled={loading === a.id}>
                  {loading === a.id ? "..." : "🗑️ Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}