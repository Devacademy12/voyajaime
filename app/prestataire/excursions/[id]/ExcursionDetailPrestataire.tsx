"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";

interface Excursion {
  id: string; title: string; city: string; description: string;
  duration_hours: number; price_per_person: number; max_people: number;
  categories: string[]; languages: string[]; inclusions: string[];
  photos: string[]; rating: number; reviews_count: number; is_active: boolean;
}

interface Avis {
  id: string; rating: number; comment: string; is_moderated: boolean;
  created_at: string; touriste_name: string;
  prestataire_response: string | null; likes_count: number; liked_by_me: boolean;
}

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1200&q=85&fit=crop";
const STARS = [1,2,3,4,5];

export default function ExcursionDetailPrestataire({
  exc, avis: initialAvis, prestataireId, avgRating,
}: {
  exc: Excursion; avis: Avis[]; prestataireId: string; avgRating: string | null;
}) {
  const supabase = createClient();
  const [avis, setAvis] = useState(initialAvis);
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Réponse
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Edit réponse
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000);
  };

  const photos = exc.photos?.filter(Boolean).length ? exc.photos.filter(Boolean) : [FALLBACK];

  // ── LIKE ──
  const toggleLike = async (avisId: string, liked: boolean, currentCount: number) => {
    // Optimistic update
    setAvis(prev => prev.map(a => a.id === avisId
      ? { ...a, liked_by_me: !liked, likes_count: liked ? currentCount - 1 : currentCount + 1 }
      : a
    ));

    if (liked) {
      const { error } = await supabase.from("avis_likes")
        .delete().eq("avis_id", avisId).eq("user_id", prestataireId);
      if (error) {
        // Rollback
        setAvis(prev => prev.map(a => a.id === avisId
          ? { ...a, liked_by_me: liked, likes_count: currentCount } : a
        ));
        showToast("❌ Erreur", false);
      } else {
        await supabase.from("avis").update({ likes_count: currentCount - 1 }).eq("id", avisId);
      }
    } else {
      const { error } = await supabase.from("avis_likes")
        .insert({ avis_id: avisId, user_id: prestataireId });
      if (error) {
        setAvis(prev => prev.map(a => a.id === avisId
          ? { ...a, liked_by_me: liked, likes_count: currentCount } : a
        ));
        showToast("❌ Erreur", false);
      } else {
        await supabase.from("avis").update({ likes_count: currentCount + 1 }).eq("id", avisId);
      }
    }
  };

  // ── RÉPONDRE ──
  const submitReply = async (avisId: string) => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    const { error } = await supabase.from("avis")
      .update({ prestataire_response: replyText.trim() })
      .eq("id", avisId);
    if (!error) {
      setAvis(prev => prev.map(a => a.id === avisId
        ? { ...a, prestataire_response: replyText.trim() } : a
      ));
      setReplyingTo(null);
      setReplyText("");
      showToast("✅ Réponse publiée !");
    } else {
      showToast("❌ Erreur : " + error.message, false);
    }
    setReplyLoading(false);
  };

  // ── MODIFIER RÉPONSE ──
  const saveEdit = async (avisId: string) => {
    if (!editText.trim()) return;
    setReplyLoading(true);
    const { error } = await supabase.from("avis")
      .update({ prestataire_response: editText.trim() })
      .eq("id", avisId);
    if (!error) {
      setAvis(prev => prev.map(a => a.id === avisId
        ? { ...a, prestataire_response: editText.trim() } : a
      ));
      setEditingId(null);
      setEditText("");
      showToast("✅ Réponse modifiée !");
    } else {
      showToast("❌ Erreur", false);
    }
    setReplyLoading(false);
  };

  // ── SUPPRIMER RÉPONSE ──
  const deleteReply = async (avisId: string) => {
    if (!confirm("Supprimer votre réponse ?")) return;
    const { error } = await supabase.from("avis")
      .update({ prestataire_response: null })
      .eq("id", avisId);
    if (!error) {
      setAvis(prev => prev.map(a => a.id === avisId ? { ...a, prestataire_response: null } : a));
      showToast("🗑️ Réponse supprimée");
    }
  };

  const pending = avis.filter(a => !a.is_moderated).length;
  const approved = avis.filter(a => a.is_moderated);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        .thumb-p{width:72px;height:54px;border-radius:10px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;transition:all .2s;flex-shrink:0}
        .thumb-p.on{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,.15)}
        .thumb-p img{width:100%;height:100%;object-fit:cover}
        .avis-card{background:white;border-radius:18px;border:1px solid #F0F0F0;padding:20px 22px;margin-bottom:12px;transition:box-shadow .2s}
        .avis-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.07)}
        .reply-box{background:rgba(43,150,168,.05);border-radius:12px;padding:14px 16px;border-left:3px solid #2B96A8;margin-top:12px}
        .like-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s}
        .like-btn.liked{background:#FEF2F2;border-color:#FECACA;color:#E11D48}
        .like-btn:not(.liked){color:#6B7280}.like-btn:not(.liked):hover{background:#F9FAFB;border-color:#D1D5DB}
        .reply-btn{padding:7px 14px;border-radius:10px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s;color:#2B96A8;border-color:#B2E3EB}
        .reply-btn:hover{background:rgba(43,150,168,.06)}
        .action-btn{padding:7px 14px;border-radius:10px;border:none;cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s}
        .toast-p{position:fixed;top:24px;right:24px;z-index:999;padding:13px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.12);animation:tin .3s ease;z-index:9999}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease forwards}
      `}</style>

      {toast && (
        <div className="toast-p" style={{ background: toast.ok ? "#F0FDF4" : "#FEF2F2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}` }}>
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 13, color: "#9CA3AF" }}>
        <Link href="/prestataire/excursions" style={{ color: "#6B7280", textDecoration: "none", fontWeight: 500 }}>
          ← Mes excursions
        </Link>
        <span>/</span>
        <span style={{ color: "#111827", fontWeight: 600 }}>{exc.title}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>

        {/* ── COLONNE GAUCHE ── */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {exc.categories?.map(c => (
                <span key={c} style={{ padding: "3px 10px", background: "rgba(43,150,168,.1)", color: "#2B96A8", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c}</span>
              ))}
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: exc.is_active ? "#F0FDF4" : "#F9FAFB", color: exc.is_active ? "#15803D" : "#9CA3AF" }}>
                {exc.is_active ? "● Publiée" : "● Brouillon"}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>
              {exc.title}
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280" }}>📍 {exc.city}</p>
          </div>

          {/* Galerie */}
          <div style={{ borderRadius: 18, overflow: "hidden", aspectRatio: "16/9", background: "#F3F4F6", marginBottom: 10, position: "relative" }}>
            <img src={photos[currentPhoto]} alt={exc.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity .3s" }}
              onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
            />
            {photos.length > 1 && (
              <>
                <button onClick={() => setCurrentPhoto(p => (p - 1 + photos.length) % photos.length)}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.85)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>‹</button>
                <button onClick={() => setCurrentPhoto(p => (p + 1) % photos.length)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.85)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>›</button>
                <div style={{ position: "absolute", bottom: 12, right: 12, padding: "3px 10px", background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)", borderRadius: 20, fontSize: 11, color: "white", fontWeight: 700 }}>
                  {currentPhoto + 1}/{photos.length}
                </div>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 8 }}>
              {photos.map((p, i) => (
                <div key={i} className={`thumb-p ${currentPhoto === i ? "on" : ""}`} onClick={() => setCurrentPhoto(i)}>
                  <img src={p} alt="" />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #F0F0F0", padding: "20px 22px", marginTop: 16, marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 10 }}>Description</h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.85 }}>{exc.description}</p>
          </div>

          {/* ── SECTION AVIS ── */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "#111827" }}>
                Avis clients
                {avgRating && <span style={{ fontSize: 16, color: "#F59E0B", marginLeft: 8 }}>★ {avgRating}</span>}
              </h2>
              <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                <span style={{ padding: "4px 10px", background: "#F0FDF4", color: "#15803D", borderRadius: 20, fontWeight: 700 }}>
                  {approved.length} publiés
                </span>
                {pending > 0 && (
                  <span style={{ padding: "4px 10px", background: "#FFFBEB", color: "#D97706", borderRadius: 20, fontWeight: 700 }}>
                    {pending} en attente
                  </span>
                )}
              </div>
            </div>

            {avis.length === 0 ? (
              <div style={{ textAlign: "center", padding: "44px 20px", background: "white", borderRadius: 18, border: "1px solid #F0F0F0" }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>💬</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>Aucun avis pour le moment</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>Les avis clients apparaîtront ici</p>
              </div>
            ) : (
              avis.map(a => (
                <div key={a.id} className="avis-card fu">

                  {/* En attente badge */}
                  {!a.is_moderated && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#D97706", marginBottom: 10 }}>
                      ⏳ En attente de modération
                    </div>
                  )}

                  {/* Header avis */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                        {(a.touriste_name[0] || "C").toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{a.touriste_name}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>
                          {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 1 }}>
                      {STARS.map(s => <span key={s} style={{ fontSize: 16, color: s <= a.rating ? "#F59E0B" : "#E5E7EB" }}>★</span>)}
                    </div>
                  </div>

                  {/* Commentaire */}
                  {a.comment && (
                    <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, paddingLeft: 50, marginBottom: 12 }}>
                      &ldquo;{a.comment}&rdquo;
                    </p>
                  )}

                  {/* Réponse existante */}
                  {a.prestataire_response && editingId !== a.id && (
                    <div className="reply-box">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: "#2B96A8", display: "flex", alignItems: "center", gap: 5 }}>
                          <span>🏢</span> Votre réponse
                        </p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="action-btn" onClick={() => { setEditingId(a.id); setEditText(a.prestataire_response || ""); }}
                            style={{ background: "#EFF9FB", color: "#2B96A8", fontSize: 11 }}>
                            ✏️ Modifier
                          </button>
                          <button className="action-btn" onClick={() => deleteReply(a.id)}
                            style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 11 }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{a.prestataire_response}</p>
                    </div>
                  )}

                  {/* Formulaire modifier réponse */}
                  {editingId === a.id && (
                    <div className="reply-box fu">
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#2B96A8", marginBottom: 8 }}>✏️ Modifier la réponse</p>
                      <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #B2E3EB", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none", marginBottom: 8, background: "white" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
                        onBlur={e => e.currentTarget.style.borderColor = "#B2E3EB"}
                      />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => { setEditingId(null); setEditText(""); }}
                          style={{ padding: "7px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          Annuler
                        </button>
                        <button onClick={() => saveEdit(a.id)} disabled={replyLoading || !editText.trim()}
                          style={{ padding: "7px 16px", background: editText.trim() ? "#2B96A8" : "#E5E7EB", color: editText.trim() ? "white" : "#9CA3AF", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: editText.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                          {replyLoading ? "Sauvegarde..." : "Sauvegarder"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Formulaire nouvelle réponse */}
                  {replyingTo === a.id && (
                    <div className="reply-box fu">
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#2B96A8", marginBottom: 8 }}>💬 Votre réponse</p>
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                        placeholder="Répondez à cet avis..."
                        style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #B2E3EB", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans',sans-serif", resize: "vertical", outline: "none", marginBottom: 8, background: "white" }}
                        onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
                        onBlur={e => e.currentTarget.style.borderColor = "#B2E3EB"}
                      />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          style={{ padding: "7px 14px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                          Annuler
                        </button>
                        <button onClick={() => submitReply(a.id)} disabled={replyLoading || !replyText.trim()}
                          style={{ padding: "7px 16px", background: replyText.trim() ? "#2B96A8" : "#E5E7EB", color: replyText.trim() ? "white" : "#9CA3AF", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: replyText.trim() ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                          {replyLoading ? "Envoi..." : "Publier la réponse"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                    {/* Like */}
                    <button
                      className={`like-btn ${a.liked_by_me ? "liked" : ""}`}
                      onClick={() => toggleLike(a.id, a.liked_by_me, a.likes_count)}>
                      <span style={{ fontSize: 16 }}>{a.liked_by_me ? "❤️" : "🤍"}</span>
                      <span>{a.likes_count > 0 ? a.likes_count : ""}</span>
                      <span>{a.liked_by_me ? "J'aime" : "J'aime"}</span>
                    </button>

                    {/* Répondre */}
                    {!a.prestataire_response && replyingTo !== a.id && (
                      <button className="reply-btn" onClick={() => { setReplyingTo(a.id); setReplyText(""); setEditingId(null); }}>
                        💬 Répondre
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── COLONNE DROITE ── */}
        <div style={{ position: "sticky", top: 80, height: "fit-content" }}>

          {/* Stats card */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #F0F0F0", padding: "22px", marginBottom: 16, boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}>
              Statistiques
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Prix / personne", val: `${exc.price_per_person} TND`, icon: "💰" },
                { label: "Durée", val: `${exc.duration_hours}h`, icon: "⏱️" },
                { label: "Capacité max", val: `${exc.max_people} pers.`, icon: "👥" },
                { label: "Note moyenne", val: avgRating ? `⭐ ${avgRating}/5` : "—", icon: "📊" },
                { label: "Avis approuvés", val: `${avis.filter(a => a.is_moderated).length}`, icon: "✅" },
                { label: "En attente", val: `${pending}`, icon: "⏳" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                  <span style={{ color: "#6B7280" }}>{s.icon} {s.label}</span>
                  <span style={{ fontWeight: 700, color: "#111827" }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #F0F0F0", padding: "22px", boxShadow: "0 4px 20px rgba(0,0,0,.06)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 14 }}>Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href={`/excursions/${exc.id}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "11px 16px", background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, textAlign: "center", transition: "all .2s" }}>
                👁️ Voir la page publique
              </a>
              <a href={`/prestataire/excursions/${exc.id}/edit`}
                style={{ padding: "11px 16px", background: "rgba(43,150,168,.08)", color: "#2B96A8", border: "1px solid rgba(43,150,168,.2)", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                ✏️ Modifier l&apos;excursion
              </a>
              <Link href="/prestataire/excursions"
                style={{ padding: "11px 16px", background: "white", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 12, textDecoration: "none", fontSize: 13, fontWeight: 700, textAlign: "center" }}>
                ← Retour à mes excursions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}