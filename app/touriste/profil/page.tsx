"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  Camera, Pencil, Plane, CheckCircle2, AlertTriangle,
  LogOut, Loader2, User, Mail, CalendarDays, Save,
} from "lucide-react";

type Profile = {
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
};

export default function ProfilPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile]             = useState<Profile | null>(null);
  const [userId, setUserId]               = useState<string>("");
  const [fullName, setFullName]           = useState("");
  const [avatarUrl, setAvatarUrl]         = useState<string>("");
  const [loading, setLoading]             = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [uploadError, setUploadError]     = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles").select("*").eq("user_id", user.id).single();
      const prof: Profile = { ...data, email: user.email || "" };
      setProfile(prof);
      setFullName(data?.full_name || "");
      setAvatarUrl(data?.avatar_url || "");
    });
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Veuillez sélectionner une image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("L'image ne doit pas dépasser 2 Mo.");
      return;
    }
    setUploadError(""); setUploadSuccess(false); setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${userId}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars").upload(filePath, file, { upsert: true, cacheControl: "3600" });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateErr } = await supabase
        .from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);
      if (updateErr) throw updateErr;
      setAvatarUrl(publicUrl);
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setLoading(true);
    // ✅ XSS : nettoie le nom avant de sauvegarder en base
    const cleanFullName = sanitizeText(fullName);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: cleanFullName })
        .eq("user_id", user.id);
      // Met à jour l'état local avec la valeur nettoyée
      setFullName(cleanFullName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!profile) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"60vh" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation:"spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const initials = fullName
    ? fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "T";

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month:"long", year:"numeric" })
    : null;

  return (
    <div style={{ maxWidth:1160, margin:"0 auto", padding:"36px 48px 60px", width:"100%", minHeight:"60vh", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
        .avatar-wrapper { cursor:pointer; position:relative; display:inline-block; }
        .avatar-overlay { opacity:0; transition:opacity 0.2s; }
        .avatar-wrapper:hover .avatar-overlay { opacity:1; }
        .field-input { width:100%; padding:10px 14px 10px 38px; border:1.5px solid #E5E7EB; border-radius:10px; font-size:14px; color:#111827; outline:none; transition:border-color 0.2s, box-shadow 0.2s; background:white; box-sizing:border-box; }
        .field-input:focus { border-color:#2B96A8; box-shadow:0 0 0 3px rgba(43,150,168,0.1); }
        .field-input:disabled { background:#F9FAFB; color:#9CA3AF; }
        .save-btn:hover:not(:disabled) { background:#1f2937 !important; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.2); }
        .signout-btn:hover { background:#FEE2E2 !important; border-color:#FCA5A5 !important; }
      `}</style>

      <div style={{ marginBottom:20, flexShrink:0 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:2 }}>Mon profil</h1>
        <p style={{ color:"#9CA3AF", fontSize:13 }}>Gérez vos informations personnelles</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:16, flex:1, minHeight:0 }}>

        {/* ── LEFT ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"white", borderRadius:18, border:"1px solid #F3F4F6", padding:"28px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", display:"flex", flexDirection:"column", alignItems:"center", gap:14, flex:1 }}>

            <div className="avatar-wrapper" onClick={() => !uploading && fileInputRef.current?.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar"
                  style={{ width:96, height:96, borderRadius:"50%", objectFit:"cover", border:"3px solid #E5E7EB", display:"block" }} />
              ) : (
                <div style={{ width:96, height:96, borderRadius:"50%", background:"linear-gradient(135deg,#2B96A8,#1e7a8a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, fontWeight:700, color:"white", border:"3px solid #E5E7EB" }}>
                  {initials}
                </div>
              )}
              <div className="avatar-overlay" style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {uploading
                  ? <Loader2 size={22} color="white" style={{ animation:"spin 0.7s linear infinite" }} />
                  : <Camera size={22} color="white" />}
              </div>
              <div style={{ position:"absolute", bottom:2, right:2, width:24, height:24, background:"#2B96A8", borderRadius:"50%", border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Pencil size={11} color="white" />
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display:"none" }} onChange={handleAvatarChange} />

            <div style={{ textAlign:"center" }}>
              {/* ✅ XSS : sanitizeText au moment d'afficher le nom */}
              <p style={{ fontSize:16, fontWeight:700, color:"#111827", marginBottom:3 }}>{sanitizeText(fullName) || "Touriste"}</p>
              <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:10, wordBreak:"break-all" }}>{profile.email}</p>
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background:"#EFF9FB", color:"#2B96A8", borderRadius:20, fontSize:11, fontWeight:700 }}>
                <Plane size={11} /> Touriste
              </span>
            </div>

            {memberSince && (
              <div style={{ width:"100%", borderTop:"1px solid #F3F4F6", paddingTop:12, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <CalendarDays size={12} color="#9CA3AF" />
                  <p style={{ fontSize:11, color:"#9CA3AF" }}>Membre depuis</p>
                </div>
                <p style={{ fontSize:12, fontWeight:600, color:"#6B7280", textTransform:"capitalize" }}>{memberSince}</p>
              </div>
            )}

            <p style={{ fontSize:11, color:"#D1D5DB", textAlign:"center", lineHeight:1.5 }}>JPG, PNG, WebP · max 2 Mo</p>

            {uploadError && (
              <div style={{ width:"100%", padding:"8px 12px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, fontSize:12, color:"#DC2626", animation:"fadeIn 0.3s ease", boxSizing:"border-box", display:"flex", alignItems:"center", gap:6 }}>
                <AlertTriangle size={13} style={{ flexShrink:0 }} /> {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div style={{ width:"100%", padding:"8px 12px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, fontSize:12, color:"#15803D", animation:"fadeIn 0.3s ease", boxSizing:"border-box", display:"flex", alignItems:"center", gap:6 }}>
                <CheckCircle2 size={13} style={{ flexShrink:0 }} /> Photo mise à jour !
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:"white", borderRadius:18, border:"1px solid #F3F4F6", padding:"22px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", flex:1 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:3, height:16, background:"#2B96A8", borderRadius:2, display:"inline-block" }} />
              Informations personnelles
            </h2>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6B7280", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:6 }}>Nom complet</label>
                <div style={{ position:"relative" }}>
                  <User size={14} color="#9CA3AF" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                  <input className="field-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Votre nom complet" />
                </div>
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#6B7280", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:6 }}>Adresse email</label>
                <div style={{ position:"relative" }}>
                  <Mail size={14} color="#9CA3AF" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                  <input className="field-input" value={profile.email} disabled />
                </div>
                <p style={{ fontSize:11, color:"#C4C9D4", marginTop:4 }}>Non modifiable</p>
              </div>
            </div>

            {saved && (
              <div style={{ padding:"8px 12px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, fontSize:13, color:"#15803D", marginBottom:14, animation:"fadeIn 0.3s ease", display:"flex", alignItems:"center", gap:6 }}>
                <CheckCircle2 size={14} /> Modifications sauvegardées !
              </div>
            )}

            <button className="save-btn" onClick={handleSave} disabled={loading}
              style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 22px", background:"#111827", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?.7:1, transition:"all 0.2s", fontFamily:"inherit" }}>
              {loading
                ? <><Loader2 size={15} style={{ animation:"spin 0.7s linear infinite" }} /> Sauvegarde…</>
                : <><Save size={15} /> Sauvegarder les modifications</>}
            </button>
          </div>

          <div style={{ background:"white", borderRadius:18, border:"1px solid #F3F4F6", padding:"18px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.04)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexShrink:0 }}>
            <div>
              <h2 style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:2 }}>Déconnexion</h2>
              <p style={{ fontSize:12, color:"#9CA3AF" }}>Vous serez redirigé vers la page d&apos;accueil</p>
            </div>
            <button className="signout-btn" onClick={handleSignOut}
              style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", whiteSpace:"nowrap", flexShrink:0 }}>
              <LogOut size={14} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}