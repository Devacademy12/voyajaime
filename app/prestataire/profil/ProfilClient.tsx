"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui/Toast";
import {
  Camera,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock4,
  Lock,
  User,
  Building2,
  MapPin,
  Phone,
  FileText,
  Save,
  Loader2,
  Mail,
  BadgeCheck,
} from "lucide-react";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];

interface Props {
  profile: Record<string, unknown> | null;
  email: string;
}

export default function ProfilClient({ profile, email }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName,     setFullName]     = useState(String(profile?.full_name    || ""));
  const [agencyName,   setAgencyName]   = useState(String(profile?.agency_name  || ""));
  const [city,         setCity]         = useState(String(profile?.city         || ""));
  const [phone,        setPhone]        = useState(String(profile?.phone        || ""));
  const [description,  setDescription]  = useState(String(profile?.description  || ""));
  const [avatarUrl,    setAvatarUrl]    = useState(String(profile?.avatar_url   || ""));
  const [avatarPreview,setAvatarPreview]= useState<string | null>(null);
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null);
  const [avatarLoading,setAvatarLoading]= useState(false);
  const [loading,      setLoading]      = useState(false);

  const { toast, showToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      showToast("Format non supporté (JPG, PNG, WebP)", false); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image trop lourde — max 2 MB", false); return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl || null;
    setAvatarLoading(true);
    const ext  = avatarFile.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("avatars").upload(path, avatarFile, { upsert: true });
    setAvatarLoading(false);
    if (error) { showToast("Upload échoué : " + error.message, false); return null; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
    return publicUrl;
  };

  const removeAvatar = async () => {
    if (!confirm("Supprimer la photo de profil ?")) return;
    if (avatarUrl) {
      const path = avatarUrl.split("/avatars/")[1];
      if (path) await supabase.storage.from("avatars").remove([path]);
      await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId);
    }
    setAvatarUrl(""); setAvatarPreview(null); setAvatarFile(null);
    showToast("Photo supprimée");
  };

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
    if (error) showToast("Erreur : " + error.message, false);
    else showToast("Profil mis à jour !");
  };

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .pf-input{width:100%;padding:10px 14px 10px 38px;border:1.5px solid #E5E7EB;border-radius:11px;font-size:13px;font-family:inherit;color:#111827;outline:none;transition:all .2s;background:#FAFAFA;box-sizing:border-box}
        .pf-input:focus{border-color:#2B96A8;background:white;box-shadow:0 0 0 3px rgba(43,150,168,.08)}
        .pf-input:disabled{background:#F3F4F6;color:#9CA3AF;cursor:not-allowed;border-color:#F3F4F6}
        .pf-input-bare{width:100%;padding:10px 14px;border:1.5px solid #E5E7EB;border-radius:11px;font-size:13px;font-family:inherit;color:#111827;outline:none;transition:all .2s;background:#FAFAFA;box-sizing:border-box;resize:vertical}
        .pf-input-bare:focus{border-color:#2B96A8;background:white;box-shadow:0 0 0 3px rgba(43,150,168,.08)}
        .pf-label{display:block;font-size:11px;font-weight:700;color:#6B7280;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px}
        .avatar-wrap{cursor:pointer}
        .avatar-wrap:hover .avatar-ov{opacity:1}
        .avatar-ov{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
        .toast-pos{position:fixed;top:20px;right:20px;z-index:9999;padding:11px 18px;border-radius:13px;font-size:13px;font-weight:600;font-family:inherit;box-shadow:0 8px 24px rgba(0,0,0,.1);animation:tin .25s ease;display:flex;align-items:center;gap:8px}
        .save-btn:hover:not(:disabled){background:#1f2937!important;transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.2)}
        .img-btn:hover{opacity:.85}
      `}</style>

      <Toast toast={toast} />

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }} onChange={handleFileSelect} />

      {/* ── 2-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 16, height: "100%" }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Avatar card */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #F3F4F6", padding: "24px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

            {/* Avatar */}
            <div className="avatar-wrap" style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}
              onClick={() => fileInputRef.current?.click()}>
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar"
                  style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid #F0F0F0", display: "block" }} />
              ) : (
                <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg,#2B96A8,#4AABB8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "white", border: "3px dashed #C9E8EE" }}>
                  {initiale}
                </div>
              )}
              {/* Overlay */}
              <div className="avatar-ov">
                {avatarLoading
                  ? <Loader2 size={22} color="white" style={{ animation: "spin .65s linear infinite" }} />
                  : <Camera size={22} color="white" />
                }
              </div>
              {/* Badge prêt */}
              {avatarFile && (
                <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: "50%", background: "#22C55E", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={12} color="white" />
                </div>
              )}
              {/* Badge edit */}
              {!avatarFile && (
                <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: "50%", background: "#2B96A8", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={11} color="white" />
                </div>
              )}
            </div>

            {/* Name + email */}
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 3, wordBreak: "break-word" }}>{displayName}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10, wordBreak: "break-all" }}>{email}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: isValidated ? "#F0FDF4" : "#FFFBEB", color: isValidated ? "#15803D" : "#D97706", border: `1px solid ${isValidated ? "#BBF7D0" : "#FDE68A"}` }}>
                {isValidated ? <><BadgeCheck size={12}/>Compte validé</> : <><Clock4 size={12}/>En attente</>}
              </span>
            </div>

            {/* Photo actions */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
              <button type="button" className="img-btn" onClick={() => fileInputRef.current?.click()}
                style={{ width: "100%", padding: "8px", background: "rgba(43,150,168,.08)", color: "#2B96A8", border: "1.5px solid rgba(43,150,168,.2)", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity .15s" }}>
                <Camera size={13}/>{currentAvatar ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {currentAvatar && !avatarFile && (
                <button type="button" className="img-btn" onClick={removeAvatar}
                  style={{ width: "100%", padding: "8px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity .15s" }}>
                  <Trash2 size={13}/>Supprimer
                </button>
              )}
              {avatarFile && (
                <button type="button" className="img-btn" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  style={{ width: "100%", padding: "8px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "opacity .15s" }}>
                  <X size={13}/>Annuler la sélection
                </button>
              )}
            </div>

            <p style={{ fontSize: 10, color: "#D1D5DB", textAlign: "center", lineHeight: 1.5 }}>JPG, PNG, WebP · max 2 Mo</p>
          </div>

          {/* Hint new photo */}
          {avatarFile && (
            <div style={{ padding: "9px 13px", background: "rgba(43,150,168,.07)", border: "1px solid rgba(43,150,168,.18)", borderRadius: 12, fontSize: 12, color: "#1e7a8a", fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
              <Camera size={13} style={{ flexShrink: 0 }} />
              <span><strong>{avatarFile.name}</strong> sera uploadée à la sauvegarde</span>
            </div>
          )}

          {/* Account (read-only) */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #F3F4F6", padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.04)", flex: 1 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 3, height: 14, background: "#2B96A8", borderRadius: 2, display: "inline-block" }}/>
              <Lock size={13} color="#2B96A8"/>Compte
            </h2>
            <label className="pf-label">Adresse email</label>
            <div style={{ position: "relative" }}>
              <Mail size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input className="pf-input" value={email} disabled />
            </div>
            <p style={{ fontSize: 11, color: "#C4C9D4", marginTop: 6 }}>L&apos;email ne peut pas être modifié. Contactez le support si nécessaire.</p>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Informations professionnelles */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid #F3F4F6", padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,.04)", flex: 1 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 18, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 3, height: 14, background: "#2B96A8", borderRadius: 2, display: "inline-block" }}/>
              <User size={13} color="#2B96A8"/>Informations professionnelles
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              {/* Nom complet */}
              <div>
                <label className="pf-label">Nom complet</label>
                <div style={{ position: "relative" }}>
                  <User size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input className="pf-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Votre nom et prénom" />
                </div>
              </div>

              {/* Agence */}
              <div>
                <label className="pf-label">Nom de l&apos;agence / activité</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input className="pf-input" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex : TunisEscape Tours" />
                </div>
              </div>

              {/* Ville */}
              <div>
                <label className="pf-label">Ville principale</label>
                <div style={{ position: "relative" }}>
                  <MapPin size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }} />
                  <select className="pf-input" value={city} onChange={e => setCity(e.target.value)}
                    style={{ cursor: "pointer", appearance: "none" as const }}>
                    <option value="">Sélectionnez</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="pf-label">Téléphone</label>
                <div style={{ position: "relative" }}>
                  <Phone size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <input className="pf-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="pf-label">Présentation publique</label>
              <div style={{ position: "relative" }}>
                <FileText size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, top: 12, pointerEvents: "none" }} />
                <textarea className="pf-input-bare" rows={4} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Décrivez votre agence, votre expertise, ce qui vous distingue..."
                  style={{ paddingLeft: 34 }} />
              </div>
              <p style={{ fontSize: 11, color: description.length > 480 ? "#D97706" : "#C4C9D4", marginTop: 4, textAlign: "right" }}>
                {description.length} / 500
              </p>
            </div>
          </div>

          {/* Save button */}
          <button type="submit" className="save-btn" disabled={loading || avatarLoading}
            style={{ padding: "13px", background: (loading || avatarLoading) ? "#6B7280" : "#111827", color: "white", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: (loading || avatarLoading) ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexShrink: 0 }}>
            {loading ? (
              <><Loader2 size={16} style={{ animation: "spin .65s linear infinite" }} />Sauvegarde...</>
            ) : (
              <><Save size={15}/>Sauvegarder les modifications</>
            )}
          </button>
        </form>
      </div>
    </>
  );
}