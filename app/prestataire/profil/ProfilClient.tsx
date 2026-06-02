"use client";

import { useState, useRef, useEffect } from "react";
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

/* ─── CSS ───────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pw {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #F5F7FA;
    min-height: 100vh;
    padding: 28px 36px 64px;
    width: 100%;
  }

  /* ── Header ── */
  .pw-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    animation: fadeUp .35s ease both;
    flex-wrap: wrap;
  }
  .pw-header-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    background: #EFF9FB; border: 1px solid rgba(43,150,168,.22);
    border-radius: 20px; padding: 4px 12px;
    font-size: 11px; font-weight: 700; color: #2B96A8;
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 10px;
  }
  .pw-header-title {
    font-size: clamp(22px, 4vw, 30px); font-weight: 800;
    color: #053366; line-height: 1.1; letter-spacing: -.02em;
  }
  .pw-header-sub {
    font-size: 13px; color: #94A3B8; margin-top: 5px; font-weight: 500;
  }
  .pw-header-badge {
    display: flex; align-items: center; gap: 8px;
    background: #fff; border: 1.5px solid #E2E8F0; border-radius: 12px;
    padding: 10px 16px; flex-shrink: 0; align-self: flex-start;
  }
  .pw-header-badge-avatar {
    width: 32px; height: 32px; border-radius: 8px;
    background: linear-gradient(135deg, #053366, #2B96A8);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: #fff;
  }
  .pw-header-badge-name { font-size: 13px; font-weight: 700; color: #053366; }
  .pw-header-badge-role { font-size: 11px; color: #94A3B8; font-weight: 500; }

  /* ── Grid ── */
  .pf-grid {
    display: grid; grid-template-columns: 320px 1fr; gap: 24px;
    animation: fadeUp .45s ease both;
  }

  /* ── Card ── */
  .pf-card {
    background: #fff; border-radius: 20px; border: 1.5px solid #E2E8F0;
    padding: 24px; height: fit-content;
  }
  .pf-label {
    display: block; font-size: 11px; font-weight: 700; color: #94A3B8;
    text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px;
  }
  .pf-input {
    width: 100%; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #E2E8F0;
    background: #F8FAFC; font-size: 14px; font-family: inherit; font-weight: 500;
    color: #053366; outline: none; transition: all .2s;
  }
  .pf-input:focus { border-color: #2B96A8; background: #fff; box-shadow: 0 0 0 4px rgba(43,150,168,0.08); }
  .pf-input:disabled { background: #F1F5F9; color: #94A3B8; cursor: not-allowed; }

  /* ── Avatar ── */
  .pf-avatar-wrap {
    position: relative; width: 120px; height: 120px; margin: 0 auto 20px;
    cursor: pointer;
  }
  .pf-avatar-img {
    width: 100%; height: 100%; border-radius: 30px; object-fit: cover;
    border: 3px solid #fff; box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  }
  .pf-avatar-placeholder {
    width: 100%; height: 100%; border-radius: 30px;
    background: linear-gradient(135deg, #053366, #2B96A8);
    display: flex; align-items: center; justify-content: center;
    font-size: 40px; font-weight: 800; color: #fff;
  }
  .pf-avatar-edit {
    position: absolute; bottom: -8px; right: -8px;
    width: 36px; height: 36px; border-radius: 12px;
    background: #fff; border: 1.5px solid #E2E8F0;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: #053366;
  }

  .pw-btn-save {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px; border-radius: 14px; background: #053366; color: #fff;
    font-size: 14px; font-weight: 700; border: none; cursor: pointer;
    transition: all .2s; font-family: inherit; margin-top: 12px;
  }
  .pw-btn-save:hover { background: #042952; transform: translateY(-1px); }
  .pw-btn-save:disabled { background: #CBD5E1; cursor: not-allowed; }

  @media (max-width: 1024px) {
    .pf-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .pw { padding: 20px 16px; }
  }
`;

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
  const [userId,       setUserId]       = useState<string | null>(null);
  const [isValidated,  setIsValidated]  = useState(false);

  const { toast, showToast } = useToast();

  const name = agencyName || fullName || "Prestataire";
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Avatar actuel (priorité à la prévisualisation)
  const currentAvatar = avatarPreview || avatarUrl;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profileData } = await supabase
          .from("profiles").select("is_validated")
          .eq("user_id", user.id).single();
        setIsValidated(profileData?.is_validated || false);
      }
    };
    getUser();
  }, [supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Image trop lourde (max 2 MB)", "error"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    let finalUrl = avatarUrl;
    if (avatarFile) {
      setAvatarLoading(true);
      const ext  = avatarFile.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { data, error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile);
      if (!upErr && data) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
        finalUrl = publicUrl;
      }
      setAvatarLoading(false);
    }
    const { error } = await supabase.from("profiles").update({
      full_name: fullName, agency_name: agencyName, city, phone, description, avatar_url: finalUrl || null,
    }).eq("user_id", userId);
    if (!error) showToast("Profil mis à jour !"); else showToast("Erreur", "error");
    setLoading(false);
  };

  return (
    <div className="pw">
      <style>{CSS}</style>
      <Toast toast={toast} />
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />

      <header className="pw-header">
        <div className="pw-header-left">
          <div className="pw-header-eyebrow">
            <User size={12} /> Mon Profil
          </div>
          <h1 className="pw-header-title">Paramètres du compte</h1>
        </div>

      </header>

      <form onSubmit={handleSave} className="pf-grid">
        {/* Colonne Gauche - Photo & Quick Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="pf-card">
            <div className="pf-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="pf-avatar-img" />
              ) : (
                <div className="pf-avatar-placeholder">{initials}</div>
              )}
              <div className="pf-avatar-edit">
                {avatarLoading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </div>
            </div>
            
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#053366", marginBottom: 4 }}>{name}</h3>
              <p style={{ fontSize: 13, color: "#94A3B8" }}>{email}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "12px", borderRadius: "12px", background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
                <span className="pf-label" style={{ marginBottom: 4 }}>Statut</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: isValidated ? "#059669" : "#D97706" }}>
                  {isValidated ? <BadgeCheck size={16} /> : <Clock4 size={16} />}
                  {isValidated ? "Compte validé" : "Vérification en cours"}
                </div>
              </div>
            </div>
          </div>

          <div className="pf-card" style={{ background: "#EFF9FB", borderColor: "rgba(43,150,168,.2)" }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#2B96A8", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={14} /> Sécurité
            </h4>
            <p style={{ fontSize: 12, color: "#2B96A8", lineHeight: 1.5 }}>
              Votre adresse email est utilisée pour la facturation et les notifications. Pour la changer, veuillez contacter le support.
            </p>
          </div>
        </div>

        {/* Colonne Droite - Formulaire */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="pf-card">
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#053366", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={18} color="#2B96A8" /> Informations professionnelles
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <label className="pf-label">Nom Complet</label>
                <input className="pf-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="pf-label">Nom de l&apos;agence</label>
                <input className="pf-input" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Mon Agence Tours" />
              </div>
              <div>
                <label className="pf-label">Ville</label>
                <select className="pf-input" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">Sélectionnez</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="pf-label">Téléphone</label>
                <input className="pf-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 ..." />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="pf-label">Description / Bio</label>
              <textarea className="pf-input" style={{ minHeight: 120, resize: "vertical" }} 
                value={description} onChange={e => setDescription(e.target.value)} 
                placeholder="Décrivez votre expertise et vos excursions..." />
            </div>

            <button type="submit" className="pw-btn-save" disabled={loading || avatarLoading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
