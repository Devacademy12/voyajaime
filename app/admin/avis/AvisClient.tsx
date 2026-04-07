"use client";
import { useState } from "react";
import {
  Clock, CheckCircle, FolderOpen, Trash2, ThumbsUp,
  MapPin, Star, MessageCircle, XCircle, Mountain,
} from "lucide-react";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui/Toast";

type Filter = "pending" | "approved" | "all";

interface Avis {
  id: string; rating: number; comment: string; is_moderated: boolean;
  created_at: string; touriste_name: string; excursion_id: string;
  excursion_title: string; excursion_city: string; excursion_photo: string | null;
}

export default function AvisClient({ avis: initial }: { avis: Avis[] }) {
  const [avis, setAvis]     = useState(initial);
  const [filter, setFilter] = useState<Filter>("pending");
  const [loading, setLoading] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const callApi = async (avisId: string, action: string) => {
    const res = await fetch("/api/admin/moderate-avis", {
      method: "POST", headers: { "Content-Type": "application/json" },
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
      showToast(`Avis de ${name} approuvé et publié`);
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    setLoading(id);
    try {
      await callApi(id, "delete");
      setAvis(prev => prev.filter(a => a.id !== id));
      showToast("Avis supprimé");
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const filtered = avis.filter(a =>
    filter === "pending" ? !a.is_moderated : filter === "approved" ? a.is_moderated : true
  );
  const counts = {
    pending:  avis.filter(a => !a.is_moderated).length,
    approved: avis.filter(a => a.is_moderated).length,
    all:      avis.length,
  };

  return (
    <>
      <style>{`
        .atab{padding:8px 16px;border-radius:20px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
        .atab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .atab:not(.on){background:white;color:#6B7280}
        .atab:not(.on):hover{background:#F9FAFB}
        .abtn{padding:8px 14px;border-radius:10px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
        .abtn:disabled{opacity:.5;cursor:not-allowed}
        .abtn-green{background:#F0FDF4;color:#15803D}.abtn-green:hover:not(:disabled){background:#DCFCE7}
        .abtn-red{background:#FEF2F2;color:#DC2626}.abtn-red:hover:not(:disabled){background:#FEE2E2}
        .avis-row{background:white;border-radius:16px;border:1px solid #F3F4F6;padding:20px 24px;display:flex;justify-content:space-between;gap:20px;transition:box-shadow .2s}
        .avis-row:hover{box-shadow:0 4px 16px rgba(0,0,0,.06)}
        .badge-count{font-size:11px;border-radius:12px;padding:1px 7px;font-weight:800}
      `}</style>

      <Toast toast={toast} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {([
          { key: "pending"  as const, label: "En attente", Icon: Clock,        count: counts.pending  },
          { key: "approved" as const, label: "Approuvés",  Icon: CheckCircle,  count: counts.approved },
          { key: "all"      as const, label: "Tous",        Icon: FolderOpen,   count: counts.all      },
        ]).map(({ key, label, Icon, count }) => (
          <button key={key} className={`atab ${filter === key ? "on" : ""}`} onClick={() => setFilter(key)}>
            <Icon size={13} strokeWidth={2} />
            {label}
            <span className="badge-count" style={{ background: filter === key ? "rgba(255,255,255,.25)" : "#F3F4F6", color: filter === key ? "white" : "#6B7280" }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, border: "1px solid #F3F4F6" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            {filter === "pending" ? <CheckCircle size={26} color="#9CA3AF" strokeWidth={1.5} /> : <MessageCircle size={26} color="#9CA3AF" strokeWidth={1.5} />}
          </div>
          <p style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>
            {filter === "pending" ? "Aucun avis en attente de modération" : "Aucun avis trouvé"}
          </p>
          {filter === "pending" && <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>Tous les avis ont été traités !</p>}
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
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{a.touriste_name}</span>
                      <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: a.is_moderated ? "#F0FDF4" : "#FFFBEB", color: a.is_moderated ? "#15803D" : "#D97706", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {a.is_moderated ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {a.is_moderated ? "Publié" : "En attente"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {/* Étoiles */}
                  <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} fill={s <= a.rating ? "#F59E0B" : "none"} color={s <= a.rating ? "#F59E0B" : "#E5E7EB"} strokeWidth={1.5} />
                    ))}
                  </div>
                </div>

                {/* Excursion mini-card */}
                <a href={`/admin/excursions/${a.excursion_id}`}
                  style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "9px 12px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #F0F0F0", textDecoration: "none", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#EFF9FB"; (e.currentTarget as HTMLElement).style.borderColor = "#B2E3EB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; (e.currentTarget as HTMLElement).style.borderColor = "#F0F0F0"; }}>
                  <div style={{ width: 44, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {a.excursion_photo
                      ? <img src={a.excursion_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Mountain size={18} color="#9CA3AF" strokeWidth={1.5} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.excursion_title}</p>
                    {a.excursion_city && (
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1, display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={10} color="#C4B8B0" strokeWidth={1.5} />{a.excursion_city}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0, fontWeight: 600 }}>Voir →</span>
                </a>

                {/* Commentaire */}
                {a.comment && (
                  <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "10px 14px", borderLeft: "3px solid #E5E7EB" }}>
                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>&ldquo;{a.comment}&rdquo;</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, justifyContent: "center" }}>
                {!a.is_moderated && (
                  <button className="abtn abtn-green" onClick={() => handleApprove(a.id, a.touriste_name)} disabled={loading === a.id}>
                    <CheckCircle size={13} />{loading === a.id ? "..." : "Approuver"}
                  </button>
                )}
                <button className="abtn abtn-red" onClick={() => handleDelete(a.id)} disabled={loading === a.id}>
                  <Trash2 size={13} />{loading === a.id ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}