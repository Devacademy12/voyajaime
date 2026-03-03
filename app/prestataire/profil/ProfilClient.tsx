"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];

interface Props {
  profile: Record<string, unknown> | null;
  email: string;
}

export default function ProfilClient({ profile, email }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName]     = useState(String(profile?.full_name   || ""));
  const [agencyName, setAgencyName] = useState(String(profile?.agency_name || ""));
  const [city, setCity]             = useState(String(profile?.city        || ""));
  const [phone, setPhone]           = useState(String(profile?.phone       || ""));
  const [description, setDescription] = useState(String(profile?.description || ""));

  const [avatarUrl, setAvatarUrl]       = useState(String(profile?.avatar_url || ""));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]     = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState<{ ok: boolean; text: string } | null>(null);

  const userId      = String(profile?.user_id || "");
  const displayName = agencyName || fullName || "P";
  const initiale    = displayName[0].toUpperCase();
  const isValidated = Boolean(profile?.is_validated);
  const currentAvatar = avatarPreview || avatarUrl || null;

  const showToast = (text: string, ok = true) => {
    setToast({ ok, text }); setTimeout(() => setToast(null), 3500);
  };

  /* ── Sélection fichier ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      showToast("❌ Format non supporté (JPG, PNG, WebP)", false); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("❌ Image trop lourde — max 2 MB", false); return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    // reset input so same file can be reselected
    e.target.value = "";
  };

  /* ── Upload vers Supabase Storage ── */
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl || null;
    setAvatarLoading(true);
    const ext  = avatarFile.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });
    setAvatarLoading(false);
    if (error) { showToast("❌ Upload échoué : " + error.message, false); return null; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
    return publicUrl;
  };

  /* ── Supprimer avatar ── */
  const removeAvatar = async () => {
    if (!confirm("Supprimer la photo de profil ?")) return;
    if (avatarUrl) {
      const path = avatarUrl.split("/avatars/")[1];
      if (path) await supabase.storage.from("avatars").remove([path]);
      await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId);
    }
    setAvatarUrl(""); setAvatarPreview(null); setAvatarFile(null);
    showToast("🗑️ Photo supprimée");
  };

  /* ── Sauvegarder ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalUrl = avatarUrl;
    if (avatarFile) {
      const uploaded = await uploadAvatar();
      if (uploaded) { finalUrl = uploaded; setAvatarUrl(uploaded); setAvatarPreview(null); setAvatarFile(null); }
    }

    const { error } = await supabase.from("profiles").update({
      full_name: fullName, agency_name: agencyName, city, phone, description,
      avatar_url: finalUrl || null,
    }).eq("user_id", userId);

    setLoading(false);
    if (error) showToast("❌ Erreur : " + error.message, false);
    else showToast("✅ Profil mis à jour !");
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .pf-input{width:100%;padding:11px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:inherit;color:#111827;outline:none;transition:all .2s;background:#FAFAFA}
        .pf-input:focus{border-color:#2B96A8;background:white;box-shadow:0 0 0 4px rgba(43,150,168,.08)}
        .pf-input:disabled{background:#F3F4F6;color:#9CA3AF;cursor:not-allowed;border-color:#F3F4F6}
        .pf-label{display:block;font-size:12px;font-weight:700;color:#374151;letter-spacing:.4px;text-transform:uppercase;margin-bottom:7px}
        .pf-card{background:white;border-radius:20px;border:1px solid #EBEBEB;padding:24px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.04)}
        .pf-card h2{font-size:14px;font-weight:800;color:#111827;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;gap:7px}
        .avatar-wrap{position:relative;width:96px;height:96px;cursor:pointer;flex-shrink:0}
        .avatar-wrap:hover .avatar-ov{opacity:1}
        .avatar-ov{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;font-size:20px;color:white}
        .toast-pos{position:fixed;top:22px;right:22px;z-index:9999;padding:12px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:inherit;box-shadow:0 8px 28px rgba(0,0,0,.12);animation:tin .3s ease}
      `}</style>

      {toast && (
        <div className="toast-pos" style={{ background: toast.ok ? "#F0FDF4" : "#FEF2F2", color: toast.ok ? "#15803D" : "#DC2626", border: `1px solid ${toast.ok ? "#BBF7D0" : "#FECACA"}` }}>
          {toast.text}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }} onChange={handleFileSelect} />

      <div style={{ maxWidth: 600 }}>

        {/* ── CARD PHOTO + IDENTITÉ ── */}
        <div className="pf-card" style={{ display: "flex", alignItems: "center", gap: 22 }}>

          {/* Avatar cliquable */}
          <div className="avatar-wrap" onClick={() => fileInputRef.current?.click()}
            style={{ border: avatarLoading ? "3px solid #2B96A8" : currentAvatar ? "3px solid #F0F0F0" : "3px dashed #D1D5DB", borderRadius: "50%", transition: "border-color .2s" }}>
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#4AABB8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "white" }}>
                {initiale}
              </div>
            )}
            {avatarLoading ? (
              <div className="avatar-ov" style={{ opacity: 1 }}>
                <div style={{ width: 22, height: 22, border: "2.5px solid rgba(255,255,255,.3)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin .65s linear infinite" }} />
              </div>
            ) : (
              <div className="avatar-ov">📷</div>
            )}

            {/* Point vert si fichier prêt */}
            {avatarFile && (
              <div style={{ position: "absolute", bottom: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "#22C55E", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white", fontWeight: 800 }}>✓</div>
            )}
          </div>

          {/* Nom + email + statut */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </p>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>{email}</p>
            <span style={{ padding: "3px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: isValidated ? "#F0FDF4" : "#FFFBEB", color: isValidated ? "#15803D" : "#D97706", border: `1px solid ${isValidated ? "#BBF7D0" : "#FDE68A"}`, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {isValidated ? "✅ Compte validé" : "⏳ En attente de validation"}
            </span>
          </div>

          {/* Boutons photo */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              style={{ padding: "8px 14px", background: "rgba(43,150,168,.08)", color: "#2B96A8", border: "1.5px solid rgba(43,150,168,.2)", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(43,150,168,.14)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(43,150,168,.08)"}>
              📷 {currentAvatar ? "Changer" : "Ajouter photo"}
            </button>
            {currentAvatar && !avatarFile && (
              <button type="button" onClick={removeAvatar}
                style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                🗑️ Supprimer
              </button>
            )}
            {avatarFile && (
              <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                ✕ Annuler
              </button>
            )}
          </div>
        </div>

        {/* Hint nouvelle photo */}
        {avatarFile && (
          <div style={{ padding: "9px 14px", background: "rgba(43,150,168,.07)", border: "1px solid rgba(43,150,168,.18)", borderRadius: 10, marginBottom: 12, fontSize: 13, color: "#1e7a8a", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
            📷 <span><strong>{avatarFile.name}</strong> — sera uploadée avec vos modifications</span>
          </div>
        )}

        <form onSubmit={handleSave}>

          {/* ── INFOS ── */}
          <div className="pf-card">
            <h2>👤 Informations professionnelles</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="pf-label">Nom complet</label>
                <input className="pf-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Votre nom et prénom" />
              </div>
              <div>
                <label className="pf-label">Nom de l&apos;agence / activité</label>
                <input className="pf-input" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex : TunisEscape Tours" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="pf-label">Ville principale</label>
                  <select className="pf-input" value={city} onChange={e => setCity(e.target.value)} style={{ cursor: "pointer", appearance: "none" }}>
                    <option value="">Sélectionnez</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="pf-label">Téléphone</label>
                  <input className="pf-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" />
                </div>
              </div>
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          <div className="pf-card">
            <h2>📝 Présentation</h2>
            <label className="pf-label">Description visible sur votre profil public</label>
            <textarea className="pf-input" rows={4} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez votre agence, votre expertise, ce qui vous distingue..."
              style={{ resize: "vertical" }} />
            <p style={{ fontSize: 12, color: description.length > 480 ? "#D97706" : "#9CA3AF", marginTop: 6 }}>
              {description.length} / 500 caractères
            </p>
          </div>

          {/* ── COMPTE ── */}
          <div className="pf-card">
            <h2>🔒 Compte</h2>
            <label className="pf-label">Adresse email</label>
            <input className="pf-input" value={email} disabled />
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>L&apos;email ne peut pas être modifié. Contactez le support si nécessaire.</p>
          </div>

          {/* ── SAVE ── */}
          <button type="submit" disabled={loading || avatarLoading}
            style={{ width: "100%", padding: "14px", background: loading ? "#6B7280" : "#111827", color: "white", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#1f2937"; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#111827"; }}>
            {loading ? (
              <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin .65s linear infinite" }} /> Sauvegarde...</>
            ) : "💾 Sauvegarder les modifications"}
          </button>
        </form>
      </div>
    </>
  );
}