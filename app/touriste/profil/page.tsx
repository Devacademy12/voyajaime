"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ProfilPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<{full_name: string; email: string; avatar_url?: string; created_at?: string} | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      setProfile({ ...data, email: user.email || "" });
      setFullName(data?.full_name || "");
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!profile) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
      <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTop: "3px solid #2B96A8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 600 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Mon profil</h1>
        <p style={{ color: "#6B7280", fontSize: 15 }}>Gérez vos informations personnelles</p>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36, padding: "24px 28px", background: "white", borderRadius: 20, border: "1px solid #F3F4F6", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #2B96A8, #1e7a8a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "white", flexShrink: 0 }}>
          {fullName ? fullName.charAt(0).toUpperCase() : "T"}
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{fullName || "Touriste"}</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>{profile.email}</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", background: "#EFF9FB", color: "#2B96A8", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            ✈️ Touriste
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #F3F4F6", padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 20 }}>Informations personnelles</h2>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 7 }}>
            Nom complet
          </label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#111827", outline: "none", transition: "border-color 0.2s" }}
            onFocus={e => e.currentTarget.style.borderColor = "#2B96A8"}
            onBlur={e => e.currentTarget.style.borderColor = "#E5E7EB"}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 7 }}>
            Email
          </label>
          <input
            value={profile.email}
            disabled
            style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #F3F4F6", borderRadius: 12, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "#9CA3AF", background: "#FAFAFA" }}
          />
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>L&apos;email ne peut pas être modifié</p>
        </div>

        {saved && (
          <div style={{ padding: "10px 14px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#15803D", marginBottom: 16 }}>
            ✅ Profil sauvegardé !
          </div>
        )}

        <button onClick={handleSave} disabled={loading}
          style={{ padding: "12px 24px", background: "#111827", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1, transition: "all 0.2s" }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#1f2937"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#111827"; }}
        >
          {loading ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </button>
      </div>

      {/* Sign out */}
      <div style={{ background: "white", borderRadius: 20, border: "1px solid #F3F4F6", padding: "20px 28px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Déconnexion</h2>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Vous serez redirigé vers la page d&apos;accueil</p>
        <button onClick={handleSignOut}
          style={{ padding: "10px 20px", background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#FEE2E2"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2"}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}