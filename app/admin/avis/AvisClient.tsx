"use client";
import {
  Clock, CheckCircle, FolderOpen, Trash2,
  MapPin, Star, MessageCircle, XCircle, Mountain,
} from "lucide-react";
import { useListFiltering } from "../../../lib/useListFiltering";
import { useCrudOperation } from "../../../lib/useCrudOperation";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui/Toast";

type Filter = "pending" | "approved" | "all";

interface Avis {
  id: string; rating: number; comment: string; is_moderated: boolean;
  created_at: string; touriste_name: string; excursion_id: string;
  excursion_title: string; excursion_city: string; excursion_photo: string | null;
}

export default function AvisClient({ avis: initial }: { avis: Avis[] }) {
  const { loading, data: avis, execute } = useCrudOperation(initial, async (payload) => {
    const res = await fetch("/api/admin/moderate-avis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avisId: payload.id, action: payload.action }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erreur serveur");
    return json;
  });

  const { toast, showToast } = useToast();

  const { filter, setFilter, filtered } = useListFiltering<Avis>({
    data: avis,
    filterFn: (item, value) =>
      value === "pending"
        ? !item.is_moderated
        : value === "approved"
        ? item.is_moderated
        : true,
    initialFilter: "pending",
  });

  const handleToggleVisibility = async (id: string, currentlyVisible: boolean, name: string) => {
    const action = currentlyVisible ? "hide" : "show";
    await execute(id, { id, action }, {
      successMessage: currentlyVisible
        ? `Avis de ${name} masqué`
        : `Avis de ${name} remis en ligne`,
      onSuccess: (prev) =>
        prev.map(a => a.id === id ? { ...a, is_moderated: !currentlyVisible } : a),
    });
  };

  const handleDelete = async (id: string) => {
    await execute(id, { id, action: "delete" }, {
      confirmMessage: "Supprimer définitivement cet avis ?",
      successMessage: "Avis supprimé",
    });
  };

  const counts = {
    pending:  avis.filter(a => !a.is_moderated).length,
    approved: avis.filter(a =>  a.is_moderated).length,
    all:      avis.length,
  };

  return (
    <>
      <style>{`
        /* ── Tabs ── */
        .atab {
          padding: 6px 14px; border-radius: 8px; border: 1px solid #EEF2FF;
          cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit;
          transition: all .2s; display: inline-flex; align-items: center; gap: 6px;
          letter-spacing: 0.1px;
        }
        .atab.on  { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 2px 8px rgba(2,175,207,.3); }
        .atab:not(.on) { background: white; color: #6B7280; }
        .atab:not(.on):hover { background: #F8FAFF; border-color: #DCE5FF; color: #053366; }

        /* ── Action buttons ── */
        .abtn {
          padding: 7px 13px; border-radius: 8px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; font-family: inherit;
          transition: all .2s; white-space: nowrap;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .abtn:disabled { opacity: .45; cursor: not-allowed; }
        .abtn-teal  { background: rgba(2,175,207,.1);  color: #02AFCF;  }
        .abtn-teal:hover:not(:disabled)  { background: rgba(2,175,207,.18); }
        .abtn-red   { background: rgba(220,38,38,.08); color: #DC2626;  }
        .abtn-red:hover:not(:disabled)   { background: rgba(220,38,38,.15); }

        /* ── Avis row ── */
        .avis-row {
          background: white; border-radius: 14px;
          border: 1px solid #EEF2FF;
          padding: 18px 20px;
          display: flex; justify-content: space-between; gap: 20px;
          transition: box-shadow .2s, border-color .2s;
        }
        .avis-row:hover { box-shadow: 0 4px 18px rgba(5,51,102,.07); border-color: #DCE5FF; }

        /* ── Badge count inside tab ── */
        .badge-count {
          font-size: 10px; border-radius: 10px; padding: 1px 7px; font-weight: 800;
        }

        /* ── Excursion mini-card ── */
        .exc-card {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 12px; padding: 9px 12px;
          background: #F8FAFF; border-radius: 10px;
          border: 1px solid #EEF2FF; text-decoration: none;
          transition: all .2s;
        }
        .exc-card:hover { background: #EFF9FB; border-color: #B2E3EB; }

        /* ── Comment bubble ── */
        .comment-bubble {
          background: #F8FAFF; border-radius: 10px;
          padding: 10px 14px; border-left: 3px solid #DCE5FF;
        }
      `}</style>

      <Toast toast={toast} />

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        {([
          { key: "pending"  as const, label: "En attente", Icon: Clock,        count: counts.pending  },
          { key: "approved" as const, label: "Approuvés",  Icon: CheckCircle,  count: counts.approved },
          { key: "all"      as const, label: "Tous",        Icon: FolderOpen,   count: counts.all      },
        ]).map(({ key, label, Icon, count }) => (
          <button
            key={key}
            className={`atab ${filter === key ? "on" : ""}`}
            onClick={() => setFilter(key)}
          >
            <Icon size={12} strokeWidth={2} />
            {label}
            <span
              className="badge-count"
              style={{
                background: filter === key ? "rgba(255,255,255,.25)" : "#EEF2FF",
                color:      filter === key ? "white" : "#6B7280",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "white", borderRadius: 14,
          border: "1px solid #EEF2FF",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "#EEF2FF",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            {filter === "pending"
              ? <CheckCircle size={24} color="#9CA3AF" strokeWidth={1.5} />
              : <MessageCircle size={24} color="#9CA3AF" strokeWidth={1.5} />
            }
          </div>
          <p style={{ fontWeight: 700, color: "#053366", fontSize: 14, margin: 0 }}>
            {filter === "pending" ? "Aucun avis en attente de modération" : "Aucun avis trouvé"}
          </p>
          {filter === "pending" && (
            <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 5 }}>
              Tous les avis ont été traités !
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(a => (
            <div
              key={a.id}
              className="avis-row"
              style={{ borderLeft: `3px solid ${a.is_moderated ? "#02AFCF" : "#D97706"}` }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* ── Row header ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>

                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#02AFCF,#259FFC)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: 13, fontWeight: 800,
                  }}>
                    {(a.touriste_name?.[0] || "?").toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#053366" }}>
                        {a.touriste_name}
                      </span>
                      {/* Status badge — same style as dashboard list badges */}
                      <span style={{
                        padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: a.is_moderated ? "rgba(2,175,207,.1)"  : "rgba(217,119,6,.1)",
                        color:      a.is_moderated ? "#02AFCF"              : "#D97706",
                        border:     `1px solid ${a.is_moderated ? "rgba(2,175,207,.2)" : "rgba(217,119,6,.2)"}`,
                      }}>
                        {a.is_moderated
                          ? <><CheckCircle size={9} />Publié</>
                          : <><Clock       size={9} />En attente</>
                        }
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0", fontWeight: 500 }}>
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  {/* Stars */}
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star
                        key={s} size={13}
                        fill={s <= a.rating ? "#F59E0B" : "none"}
                        color={s <= a.rating ? "#F59E0B" : "#E5E7EB"}
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                </div>

                {/* ── Excursion mini-card ── */}
                <a href={`/admin/excursions/${a.excursion_id}`} className="exc-card">
                  <div style={{
                    width: 42, height: 34, borderRadius: 8, overflow: "hidden",
                    flexShrink: 0, background: "#EEF2FF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {a.excursion_photo
                      ? <img src={a.excursion_photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Mountain size={16} color="#9CA3AF" strokeWidth={1.5} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#053366", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {a.excursion_title}
                    </p>
                    {a.excursion_city && (
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                        <MapPin size={9} color="#B0BAD4" strokeWidth={1.5} />
                        {a.excursion_city}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "#259FFC", flexShrink: 0, fontWeight: 700 }}>Voir →</span>
                </a>

                {/* ── Comment ── */}
                {a.comment && (
                  <div className="comment-bubble">
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0 }}>
                      &ldquo;{a.comment}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* ── Actions ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0, justifyContent: "center" }}>
                <button
                  className={a.is_moderated ? "abtn abtn-red" : "abtn abtn-teal"}
                  onClick={() => handleToggleVisibility(a.id, a.is_moderated, a.touriste_name)}
                  disabled={loading === a.id}
                >
                  {a.is_moderated
                    ? <><XCircle    size={12} />{loading === a.id ? "…" : "Masquer"}</>
                    : <><CheckCircle size={12} />{loading === a.id ? "…" : "Afficher"}</>
                  }
                </button>
                <button
                  className="abtn abtn-red"
                  onClick={() => handleDelete(a.id)}
                  disabled={loading === a.id}
                >
                  <Trash2 size={12} />{loading === a.id ? "…" : "Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}