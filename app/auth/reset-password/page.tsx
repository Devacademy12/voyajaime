"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function pwdStrength(p: string) {
  if (p.length === 0) return null;
  if (p.length < 6) return { level: 0, label: "Trop court", color: "#EF4444" };
  if (p.length < 8) return { level: 1, label: "Faible", color: "#F59E0B" };
  const score = [/[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p), p.length >= 12].filter(Boolean).length;
  if (score <= 1) return { level: 2, label: "Moyen", color: "#F59E0B" };
  if (score === 2) return { level: 3, label: "Bon", color: "#10B981" };
  return { level: 4, label: "Excellent", color: "#059669" };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  // ✅ Stocker les tokens récupérés depuis le hash de l'URL
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Extraire les tokens depuis le hash Supabase (#access_token=...&refresh_token=...)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const at = params.get("access_token");
    const rt = params.get("refresh_token");

    if (!at || !rt) {
      setError("Lien invalide ou expiré. Veuillez refaire une demande.");
    } else {
      setAccessToken(at);
      setRefreshToken(rt);
    }
    setIsValidating(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (newPassword !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!accessToken || !refreshToken) { setError("Session invalide. Veuillez refaire une demande."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Envoyer les tokens avec le nouveau mot de passe
        body: JSON.stringify({ newPassword, accessToken, refreshToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Mot de passe mis à jour avec succès !");
      setTimeout(() => router.push("/"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally { setLoading(false); }
  };

  const strength = pwdStrength(newPassword);

  if (isValidating) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#EFF9FB,#E0F2FE)", fontFamily:"system-ui,sans-serif" }}>
        <div style={{ background:"white", padding:40, borderRadius:24, boxShadow:"0 8px 32px rgba(0,0,0,.10)", textAlign:"center" }}>
          <div style={{ width:44, height:44, border:"3.5px solid #2B96A8", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 16px" }}/>
          <p style={{ color:"#64748B", fontSize:14, margin:0 }}>Vérification du lien…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#EFF9FB,#E0F2FE)", fontFamily:"'DM Sans',system-ui,sans-serif", padding:16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        .rp-input{width:100%;padding:12px 44px 12px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:inherit;color:#111827;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s}
        .rp-input:focus{border-color:#2B96A8;background:white;box-shadow:0 0 0 3px rgba(43,150,168,.1)}
        .rp-eye{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;align-items:center;padding:0}
        .rp-btn{width:100%;padding:13px;background:#111827;color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;margin-top:4px}
        .rp-btn:hover:not(:disabled){background:#0F172A;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,.18)}
        .rp-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
      `}</style>

      <div style={{ background:"white", padding:"40px 36px 32px", borderRadius:28, boxShadow:"0 4px 6px rgba(0,0,0,.05),0 24px 60px rgba(43,150,168,.14)", width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:18, background:"linear-gradient(135deg,#EFF9FB,#CFFAFE)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", border:"1px solid rgba(43,150,168,.2)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B96A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, color:"#111827", margin:"0 0 6px", letterSpacing:"-.02em" }}>Nouveau mot de passe</h1>
          <p style={{ fontSize:13, color:"#9CA3AF", margin:0 }}>Choisissez un mot de passe sécurisé</p>
        </div>

        {error && !success && (
          <div style={{ padding:"10px 13px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", fontSize:12, fontWeight:500, marginBottom:18 }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ padding:"10px 13px", borderRadius:10, background:"#F0FDF4", border:"1px solid #BBF7D0", color:"#15803D", fontSize:12, fontWeight:500, marginBottom:18 }}>
            ✅ {success} Redirection en cours…
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:".5px", textTransform:"uppercase" as const, marginBottom:6 }}>
                Nouveau mot de passe
              </label>
              <div style={{ position:"relative" }}>
                <input className="rp-input" type={showPassword ? "text" : "password"} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 caractères"
                  autoComplete="new-password" required />
                <button type="button" className="rp-eye" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
              {strength && (
                <div style={{ marginTop:7 }}>
                  <div style={{ display:"flex", gap:3, marginBottom:4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= strength.level ? strength.color : "#E5E7EB", transition:"background .25s" }}/>
                    ))}
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:".5px", textTransform:"uppercase" as const, marginBottom:6 }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position:"relative" }}>
                <input className="rp-input" type={showConfirm ? "text" : "password"} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} placeholder="Répétez votre mot de passe"
                  autoComplete="new-password" required
                  style={{ borderColor: confirmPassword.length > 0 ? (confirmPassword === newPassword ? "#86EFAC" : "#FCA5A5") : undefined }} />
                <button type="button" className="rp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p style={{ fontSize:11, color:"#EF4444", marginTop:5, fontWeight:600 }}>Les mots de passe ne correspondent pas.</p>
              )}
              {confirmPassword.length > 0 && confirmPassword === newPassword && (
                <p style={{ fontSize:11, color:"#10B981", marginTop:5, fontWeight:600 }}>✓ Les mots de passe correspondent.</p>
              )}
            </div>

            <button className="rp-btn" type="submit"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}>
              {loading ? "Mise à jour…" : "Mettre à jour le mot de passe →"}
            </button>
          </form>
        )}

        <div style={{ textAlign:"center", marginTop:20, paddingTop:16, borderTop:"1px solid #F3F4F6" }}>
          <button onClick={() => router.push("/")} style={{ background:"none", border:"none", fontSize:12, color:"#2B96A8", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}