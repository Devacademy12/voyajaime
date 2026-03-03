"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

type Profile = {
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
};

export default function ProfilPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // ── Chargement du profil ────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const prof: Profile = {
        ...data,
        email: user.email || "",
      };
      setProfile(prof);
      setFullName(data?.full_name || "");
      setAvatarUrl(data?.avatar_url || "");
    });
  }, []);

  // ── Upload de la photo vers Supabase Storage ────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validation : type et taille (max 2 Mo)
    if (!file.type.startsWith("image/")) {
      setUploadError("Veuillez sélectionner une image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      // 🔴 CORRECTION: Utiliser un chemin simple sans répétition
      const ext = file.name.split(".").pop();
      const fileName = `${userId}.${ext}`;
      // Stocker directement dans le bucket, pas dans un dossier "avatars/" 
      // car le bucket s'appelle déjà "avatars"
      const filePath = fileName; // Changé ici : plus de "avatars/" en préfixe

      console.log("Uploading to path:", filePath); // Debug

      // Upload dans le bucket "avatars"
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        throw uploadErr;
      }

      // Récupérer l'URL publique - CORRECTION: utiliser le bon chemin
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      console.log("Public URL:", publicUrl); // Debug

      // Sauvegarder l'URL dans la table profiles
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      if (updateErr) throw updateErr;

      // Mettre à jour l'état local
      setAvatarUrl(publicUrl);
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'upload";
      console.error("Upload error details:", err);
      setUploadError(message);
    } finally {
      setUploading(false);
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Sauvegarde du nom ───────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setLoading(false);
  };

  // ── Déconnexion ─────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ── Initiales pour l'avatar par défaut ─────────────────────────────────
  const initials = fullName
    ? fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "T";

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (!profile) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTop: "3px solid #2B96A8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .avatar-overlay { opacity: 0; transition: opacity 0.2s; }
        .avatar-wrapper:hover .avatar-overlay { opacity: 1; }
        .avatar-wrapper { cursor: pointer; }
        .save-btn:hover:not(:disabled) { background: #1f2937 !important; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
        .signout-btn:hover { background: #FEE2E2 !important; }
      `}</style>

      {/* Titre */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Mon profil</h1>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Gérez vos informations personnelles</p>
      </div>

      {/* ── Carte Avatar + Infos ── */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #F3F4F6", padding: "24px 28px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: 24 }}>

        {/* Zone avatar cliquable */}
        <div className="avatar-wrapper" style={{ position: "relative", flexShrink: 0 }}
          onClick={() => !uploading && fileInputRef.current?.click()}>

          {/* Avatar : photo ou initiales */}
          {avatarUrl ? (
            <img src={avatarUrl} alt="Photo de profil"
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid #E5E7EB", display: "block" }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #2B96A8, #1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "white", border: "3px solid #E5E7EB" }}>
              {initials}
            </div>
          )}

          {/* Overlay hover */}
          <div className="avatar-overlay" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {uploading ? (
              <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.4)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <span style={{ fontSize: 18, color: "white" }}>📷</span>
            )}
          </div>

          {/* Badge "Modifier" */}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, background: "#2B96A8", borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
            ✏️
          </div>
        </div>

        {/* Input fichier caché */}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={handleAvatarChange} />

        {/* Infos texte */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{fullName || "Touriste"}</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>{profile.email}</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", background: "#EFF9FB", color: "#2B96A8", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            ✈️ Touriste
          </span>
        </div>

        {/* Aide upload */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>
            Cliquez sur la photo<br />pour la modifier<br />
            <span style={{ color: "#D1D5DB" }}>JPG, PNG, WebP · max 2 Mo</span>
          </p>
        </div>
      </div>

      {/* Message d'erreur upload */}
      {uploadError && (
        <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: 12, animation: "fadeIn 0.3s ease" }}>
          ⚠️ {uploadError}
        </div>
      )}

      {/* Message succès upload - CORRECTION: améliorer la condition */}
      {!uploading && avatarUrl && !uploadError && (
        <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#15803D", marginBottom: 12, animation: "fadeIn 0.3s ease" }}>
          ✅ Photo mise à jour avec succès !
        </div>
      )}

      {/* ── Informations personnelles ── */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #F3F4F6", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Informations personnelles</h2>

        {/* Nom complet */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 7 }}>
            Nom complet
          </label>
          <input value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Votre nom complet"
            style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, fontFamily: "inherit", color: "#111827", outline: "none", transition: "border-color 0.2s, box-shadow 0.2s" }}
            onFocus={e => { e.currentTarget.style.borderColor = "#2B96A8"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(43,150,168,0.1)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>

        {/* Email (non modifiable) */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 7 }}>
            Adresse email
          </label>
          <input value={profile.email} disabled
            style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #F3F4F6", borderRadius: 12, fontSize: 14, fontFamily: "inherit", color: "#9CA3AF", background: "#FAFAFA" }} />
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>L&apos;adresse email ne peut pas être modifiée</p>
        </div>

        {/* Feedback sauvegarde */}
        {saved && (
          <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#15803D", marginBottom: 16, animation: "fadeIn 0.3s ease" }}>
            ✅ Modifications sauvegardées !
          </div>
        )}

        <button className="save-btn" onClick={handleSave} disabled={loading}
          style={{ padding: "12px 24px", background: "#111827", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1, transition: "all 0.2s" }}>
          {loading ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
        </button>
      </div>

      {/* ── Déconnexion ── */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #F3F4F6", padding: "20px 28px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Déconnexion</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Vous serez redirigé vers la page d&apos;accueil</p>
        <button className="signout-btn" onClick={handleSignOut}
          style={{ padding: "10px 20px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}