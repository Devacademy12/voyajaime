"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
  const [ready, setReady]           = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Supabase injecte la session depuis le lien magique
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Minimum 6 caractères."); return; }
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError("Erreur lors de la mise à jour. Réessayez.");
    else setSuccess(true);
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'DM Sans', -apple-system, sans-serif; }
        .root { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#F9FAFB; }
        .card { background:white; border-radius:24px; padding:40px; width:100%; max-width:400px; box-shadow:0 0 0 1px rgba(0,0,0,0.05), 0 8px 32px rgba(43,150,168,0.12); animation:fadeUp .3s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .logo { display:flex; align-items:center; gap:8px; justify-content:center; margin-bottom:28px; text-decoration:none; }
        .logo-text { font-size:20px; font-weight:900; color:#053366; letter-spacing:-0.4px; }
        h1 { font-size:22px; font-weight:800; color:#111827; margin-bottom:6px; }
        .sub { font-size:13px; color:#9CA3AF; margin-bottom:24px; line-height:1.5; }
        .field { margin-bottom:14px; }
        .field label { display:block; font-size:11px; font-weight:700; color:#374151; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:5px; }
        .pwd-wrap { position:relative; }
        .field input { width:100%; padding:12px 44px 12px 14px; border:1.5px solid #E5E7EB; border-radius:12px; font-size:14px; color:#111827; background:#F9FAFB; outline:none; transition:all .2s; font-family:inherit; }
        .field input:focus { border-color:#02AFCF; background:white; box-shadow:0 0 0 3px rgba(2,175,207,0.1); }
        .eye { position:absolute; right:13px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9CA3AF; display:flex; padding:0; }
        .eye:hover { color:#6B7280; }
        .alert-err { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; padding:10px 13px; border-radius:10px; font-size:13px; margin-bottom:14px; }
        .btn { width:100%; padding:13px; background:linear-gradient(135deg,#053366,#02AFCF); color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:6px; }
        .btn:hover:not(:disabled) { opacity:.92; transform:translateY(-1px); box-shadow:0 8px 24px rgba(2,175,207,0.3); }
        .btn:disabled { opacity:.55; cursor:not-allowed; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
        .success-box { text-align:center; padding:16px 0; }
        .success-icon { font-size:48px; margin-bottom:16px; }
        .success-title { font-size:20px; font-weight:800; color:#111827; margin-bottom:8px; }
        .success-sub { font-size:14px; color:#6B7280; margin-bottom:24px; line-height:1.6; }
        .link-btn { display:inline-block; padding:12px 28px; background:#02AFCF; color:white; border-radius:12px; text-decoration:none; font-size:14px; font-weight:700; }
        .strength { margin-top:6px; height:4px; border-radius:2px; background:#E5E7EB; overflow:hidden; }
        .strength-bar { height:100%; border-radius:2px; transition:all .3s; }
        .waiting { text-align:center; padding:20px 0; color:#9CA3AF; font-size:14px; }
      `}</style>

      <div className="root">
        <div className="card">

          <Link href="/" className="logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#02AFCF"/>
              <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
            </svg>
            <span className="logo-text">VoyajAime</span>
          </Link>

          {success ? (
            <div className="success-box">
              <div className="success-icon">🎉</div>
              <div className="success-title">Mot de passe mis à jour !</div>
              <p className="success-sub">Votre mot de passe a été changé avec succès. Vous pouvez maintenant vous connecter.</p>
              <Link href="/auth" className="link-btn">Se connecter →</Link>
            </div>
          ) : !ready ? (
            <div className="waiting">
              <div style={{ fontSize:32, marginBottom:12 }}>🔗</div>
              <p>Chargement du lien de réinitialisation...</p>
              <p style={{ fontSize:12, marginTop:8 }}>Si rien ne se passe, vérifiez que vous avez cliqué sur le bon lien depuis votre email.</p>
            </div>
          ) : (
            <>
              <h1>Nouveau mot de passe 🔐</h1>
              <p className="sub">Choisissez un mot de passe sécurisé pour votre compte.</p>

              {error && <div className="alert-err">⚠️ {error}</div>}

              <form onSubmit={handleReset}>
                <div className="field">
                  <label>Nouveau mot de passe</label>
                  <div className="pwd-wrap">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Minimum 6 caractères"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button type="button" className="eye" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  {password && (
                    <div className="strength">
                      <div className="strength-bar" style={{
                        width: password.length < 6 ? "25%" : password.length < 8 ? "50%" : password.length < 12 ? "75%" : "100%",
                        background: password.length < 6 ? "#EF4444" : password.length < 8 ? "#F59E0B" : password.length < 12 ? "#3B82F6" : "#10B981",
                      }} />
                    </div>
                  )}
                </div>

                <div className="field">
                  <label>Confirmer le mot de passe</label>
                  <div className="pwd-wrap">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Répétez le mot de passe"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      style={{ borderColor: confirm && confirm !== password ? "#EF4444" : "" }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? <><span className="spin" /> Mise à jour...</> : "Changer mon mot de passe →"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </>
  );
}