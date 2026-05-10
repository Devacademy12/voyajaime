"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import { useRouter } from "next/navigation";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];
type Mode = "login" | "register" | "prestataire";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [city, setCity] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const pwdStrength = (p: string) => {
    if (p.length === 0) return null;
    if (p.length < 6) return { level: 0, label: "Trop court", color: "#EF4444" };
    if (p.length < 8) return { level: 1, label: "Faible", color: "#F59E0B" };
    const has = (r: RegExp) => r.test(p);
    const score = [has(/[A-Z]/), has(/[0-9]/), has(/[^A-Za-z0-9]/), p.length >= 12].filter(Boolean).length;
    if (score <= 1) return { level: 2, label: "Moyen", color: "#F59E0B" };
    if (score === 2) return { level: 3, label: "Bon", color: "#10B981" };
    return { level: 4, label: "Excellent", color: "#059669" };
  };
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError(null);
      setSuccess(null);
      setEmail("");
      setPassword("");
      setFullName("");
      setAgencyName("");
      setCity("");
    }
  }, [isOpen, defaultMode]);

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const errMsg: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "Email not confirmed": "Confirmez votre email avant de vous connecter.",
    "User already registered": "Un compte existe déjà avec cet email.",
    "Password should be at least 6 characters": "Minimum 8 caractères requis.",
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);

    // Validations client
    if (!emailRegex.test(email.trim())) {
      setError("Adresse email invalide."); return;
    }
    if (mode !== "login" && password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères."); return;
    }
    if (mode === "register" && fullName.trim().length < 2) {
      setError("Veuillez entrer votre nom complet."); return;
    }
    if (mode === "prestataire") {
      if (fullName.trim().length < 2) { setError("Veuillez entrer votre nom complet."); return; }
      if (agencyName.trim().length < 2) { setError("Le nom de l'agence est trop court."); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const cleanEmail = sanitizeText(email);
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).single();
        const role = profile?.role || "touriste";
        onClose();
        if (role === "touriste") {
          const saved = sessionStorage.getItem("redirect_after_login") || "/";
          sessionStorage.removeItem("redirect_after_login");
          window.location.href = saved;
        } else { window.location.href = `/${role}/dashboard`; }

      } else if (mode === "register") {
        const cleanEmail    = sanitizeText(email);
        const cleanFullName = sanitizeText(fullName);
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail, password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            data: { role: "touriste", full_name: cleanFullName || cleanEmail },
          },
        });
        if (error) throw error;
        if (!data.user) return;
        await supabase.from("profiles").upsert(
          { user_id: data.user.id, role: "touriste", full_name: cleanFullName || cleanEmail },
          { onConflict: "user_id" }
        );
        if (!data.user.email_confirmed_at) setSuccess("Vérifiez votre email pour confirmer votre inscription !");
        else { onClose(); window.location.href = "/"; }

      } else {
        const cleanEmail      = sanitizeText(email);
        const cleanFullName   = sanitizeText(fullName);
        const cleanAgencyName = sanitizeText(agencyName);
        const cleanCity       = sanitizeText(city);

        // 1. Créer le compte Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail, password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            data: { role: "prestataire", full_name: cleanFullName, agency_name: cleanAgencyName, city: cleanCity },
          },
        });
        if (error) throw error;

        // signUp retourne data.user = null si l'email existe déjà
        if (!data.user) {
          throw new Error("Cet email est déjà utilisé. Essayez de vous connecter.");
        }

        // 2. Appel API avec détection explicite HTML vs JSON
        const res = await fetch("/api/register-prestataire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId:     data.user.id,
            email:      cleanEmail,
            fullName:   cleanFullName,
            agencyName: cleanAgencyName,
            city:       cleanCity,
          }),
        });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(`Erreur serveur (${res.status}) — vérifiez votre configuration.`);
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur lors de la création du compte.");

        setSuccess("Compte créé ! Vérifiez votre email pour continuer l'inscription.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errMsg[msg] || msg);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { setError("Impossible de se connecter avec Google."); setGoogleLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { 
      setError("Entrez votre email d'abord."); 
      return; 
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
    
    const cleanEmail = sanitizeText(email);
    setLoading(true); 
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }
      
      // Message de succès (même si l'email n'existe pas, pour sécurité)
      setSuccess("✅ Un lien de réinitialisation a été envoyé à votre adresse email. Vérifiez votre boîte de réception (et vos spams).");
      
      // Optionnel: vider l'email après envoi
      setEmail("");
      
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible d'envoyer l'email. Réessayez.";
      setError(msg);
    } finally { 
      setLoading(false); 
    }
  };

  const isPresta = mode === "prestataire";

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .auth-backdrop {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: backdropIn .2s ease;
        }
        @keyframes backdropIn { from { opacity:0 } to { opacity:1 } }
        .auth-overlay {
          position: absolute; inset: 0;
          background: rgba(10, 14, 20, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .auth-modal {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
          background: white;
          border-radius: 28px;
          padding: 40px 40px 32px;
          box-shadow:
            0 0 0 1px rgba(0,0,0,0.06),
            0 8px 20px -4px rgba(0,0,0,0.1),
            0 32px 80px -8px rgba(43,150,168,0.18);
          font-family: 'DM Sans', sans-serif;
          animation: modalIn .28s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 90vh;
          overflow-y: auto;
        }
        @keyframes modalIn {
          from { opacity:0; transform: translateY(20px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }
        .auth-close-btn {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px;
          border-radius: 50%; border: none;
          background: #F3F4F6; color: #9CA3AF;
          font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .15s; font-family: 'DM Sans', sans-serif;
          line-height: 1;
        }
        .auth-close-btn:hover { background: #E5E7EB; color: #374151; }
        .auth-form-head { margin-bottom: 22px; }
        .auth-form-title { font-family:'Playfair Display',serif; font-size:24px; font-weight:900; color:#111827; letter-spacing:-0.4px; line-height:1.2; margin-bottom:5px; }
        .auth-form-sub { font-size:13px; color:#9CA3AF; font-weight:500; }
        .auth-accent { color:#2B96A8; }
        .auth-tabs { display:flex; background:#F3F4F6; border-radius:12px; padding:3px; margin-bottom:18px; gap:3px; }
        .auth-tab { flex:1; padding:9px; border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; }
        .auth-tab.on { background:white; color:#111827; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
        .auth-tab:not(.on) { background:transparent; color:#9CA3AF; }
        .auth-fields { display:flex; flex-direction:column; gap:9px; }
        .auth-field label { display:block; font-size:11px; font-weight:700; color:#374151; letter-spacing:0.5px; margin-bottom:5px; text-transform:uppercase; }
        .auth-field input, .auth-field select { width:100%; padding:11px 14px; border:1.5px solid #E5E7EB; border-radius:12px; font-size:14px; font-family:'DM Sans',sans-serif; color:#111827; background:#F9FAFB; transition:all .2s; outline:none; appearance:none; box-sizing: border-box; }
        .auth-field input:focus, .auth-field select:focus { border-color:#2B96A8; background:white; box-shadow:0 0 0 3px rgba(43,150,168,0.1); }
        .auth-field input::placeholder { color:#C4C9D4; }
        .auth-field-pwd { position:relative; }
        .auth-field-pwd input { padding-right:44px; }
        .auth-eye-btn { position:absolute; right:13px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9CA3AF; display:flex; align-items:center; padding:0; transition:color .15s; }
        .auth-eye-btn:hover { color:#6B7280; }
        .auth-pwd-strength { margin-top:7px; }
        .auth-pwd-bars { display:flex; gap:3px; margin-bottom:4px; }
        .auth-pwd-bar { flex:1; height:3px; border-radius:2px; background:#E5E7EB; transition:background .25s; }
        .auth-pwd-label { font-size:11px; font-weight:600; }
        .auth-field-row { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
        .auth-alert { padding:10px 13px; border-radius:10px; font-size:12px; line-height:1.5; font-weight:500; margin-bottom:14px; display:flex; align-items:flex-start; gap:7px; }
        .auth-alert-err { background:#FEF2F2; border:1px solid #FECACA; color:#DC2626; }
        .auth-alert-ok  { background:#F0FDF4; border:1px solid #BBF7D0; color:#15803D; }
        .auth-google-btn { width:100%; padding:11px 16px; background:white; color:#374151; border:1.5px solid #E5E7EB; border-radius:12px; font-size:13px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:9px; margin-bottom:2px; box-sizing: border-box; }
        .auth-google-btn:hover { border-color:#D1D5DB; box-shadow:0 2px 8px rgba(0,0,0,0.06); background:#FAFAFA; }
        .auth-divider { display:flex; align-items:center; gap:10px; margin:12px 0; font-size:11px; color:#C4C9D4; font-weight:600; letter-spacing:0.5px; }
        .auth-divider::before, .auth-divider::after { content:''; flex:1; height:1px; background:#F0F0F0; }
        .auth-submit-btn { width:100%; padding:13px; background:#111827; color:white; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:14px; box-sizing: border-box; }
        .auth-submit-btn:hover:not(:disabled) { background:#0F172A; transform:translateY(-1px); box-shadow:0 8px 24px rgba(0,0,0,0.18); }
        .auth-submit-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .auth-arrow { width:20px; height:20px; background:rgba(255,255,255,0.12); border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:13px; }
        .auth-forgot-row { text-align:right; margin-top:-2px; margin-bottom:2px; }
        .auth-forgot-btn { background:none; border:none; font-size:12px; color:#2B96A8; cursor:pointer; font-family:'DM Sans',sans-serif; font-weight:600; padding:0; transition: all 0.2s; }
        .auth-forgot-btn:hover { color:#1E7A8A; text-decoration: underline; }
        .auth-footer-row { font-size:12px; color:#9CA3AF; text-align:center; margin-top:18px; padding-top:16px; border-top:1px solid #F3F4F6; line-height:1.6; }
        .auth-footer-row button { background:none; border:none; color:#2B96A8; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; transition: all 0.2s; }
        .auth-footer-row button:hover { color:#1E7A8A; text-decoration: underline; }
        .auth-back-btn { background:none; border:none; color:#9CA3AF; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:500; padding:0; margin-bottom:14px; display:flex; align-items:center; gap:4px; transition: all 0.2s; }
        .auth-back-btn:hover { color:#6B7280; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .auth-spin { width:15px; height:15px; border:2px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; }
        .auth-spin-dark { width:15px; height:15px; border:2px solid rgba(0,0,0,.1); border-top-color:#374151; border-radius:50%; animation:spin .7s linear infinite; }
        @media (max-width: 480px) { .auth-modal { padding: 28px 20px 24px; border-radius: 20px; } }
      `}</style>

      <div className="auth-backdrop">
        {/* Overlay — clic pour fermer */}
        <div className="auth-overlay" onClick={onClose} />

        <div className="auth-modal" key={mode}>
          {/* Bouton fermer */}
          <button className="auth-close-btn" onClick={onClose} aria-label="Fermer">✕</button>

          <div className="auth-form-head">
            {isPresta && (
              <button className="auth-back-btn" onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>← Retour</button>
            )}
            <h1 className="auth-form-title">
              {mode === "login" ? <>Bon retour <span className="auth-accent">👋</span></>
                : isPresta ? <>Devenir <span className="auth-accent">prestataire</span></>
                : <>Créer un <span className="auth-accent">compte</span></>}
            </h1>
            <p className="auth-form-sub">
              {mode === "login" ? "Connectez-vous pour continuer votre aventure"
                : isPresta ? "Listez vos excursions sur VoyajAime"
                : "Rejoignez des milliers de voyageurs en Tunisie"}
            </p>
          </div>

          {!isPresta && (
            <div className="auth-tabs">
              {(["login","register"] as const).map(m => (
                <button key={m} className={`auth-tab ${mode === m ? "on" : ""}`}
                  onClick={() => { setMode(m); setError(null); setSuccess(null); }}>
                  {m === "login" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>
          )}

          {error   && <div className="auth-alert auth-alert-err">⚠️ {error}</div>}
          {success && <div className="auth-alert auth-alert-ok">✅ {success}</div>}

          {!isPresta && (
            <>
              <button className="auth-google-btn" onClick={handleGoogle} disabled={googleLoading}>
                {googleLoading ? <span className="auth-spin-dark" /> : (
                  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                )}
                Continuer avec Google
              </button>
              <div className="auth-divider">OU</div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-fields">
              {isPresta ? (
                <>
                  <div className="auth-field-row">
                    <div className="auth-field">
                      <label>Nom complet</label>
                      <input type="text" placeholder="Prénom Nom" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </div>
                    <div className="auth-field">
                      <label>Agence</label>
                      <input type="text" placeholder="Nom de l'agence" value={agencyName} onChange={e => setAgencyName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="auth-field-row">
                    <div className="auth-field">
                      <label>Ville</label>
                      <select value={city} onChange={e => setCity(e.target.value)} required>
                        <option value="">Sélectionner</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="auth-field">
                      <label>Email</label>
                      <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                  </div>
                  <div className="auth-field">
                    <label>Mot de passe</label>
                    <div className="auth-field-pwd">
                      <input type={showPwd ? "text" : "password"} placeholder="Minimum 6 caractères"
                        value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {mode === "register" && (
                    <div className="auth-field">
                      <label>Nom complet</label>
                      <input type="text" placeholder="Prénom et Nom" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </div>
                  )}
                  <div className="auth-field">
                    <label>Email</label>
                    <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div className="auth-field">
                    <label>Mot de passe</label>
                    <div className="auth-field-pwd">
                      <input type={showPwd ? "text" : "password"}
                        placeholder={mode === "login" ? "Votre mot de passe" : "Minimum 8 caractères"}
                        value={password} onChange={e => setPassword(e.target.value)} required
                        autoComplete={mode === "login" ? "current-password" : "new-password"} />
                      <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                    {mode !== "login" && password.length > 0 && (() => {
                      const s = pwdStrength(password);
                      if (!s) return null;
                      return (
                        <div className="auth-pwd-strength">
                          <div className="auth-pwd-bars">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="auth-pwd-bar" style={{ background: i <= s.level ? s.color : "#E5E7EB" }}/>
                            ))}
                          </div>
                          <span className="auth-pwd-label" style={{ color: s.color }}>{s.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>

            {mode === "login" && (
              <div className="auth-forgot-row">
                <button type="button" className="auth-forgot-btn" onClick={handleForgotPassword}>
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading
                ? <><span className="auth-spin" />Chargement...</>
                : <>{mode === "login" ? "Se connecter" : isPresta ? "Envoyer ma demande" : "Créer mon compte"}<span className="auth-arrow">→</span></>
              }
            </button>
          </form>

          <div className="auth-footer-row">
            {!isPresta ? (
              <p>Vous êtes prestataire ?{" "}
                <button onClick={() => { setMode("prestataire"); setError(null); setSuccess(null); }}>
                  Inscrivez votre activité →
                </button>
              </p>
            ) : (
              <p style={{ fontSize:11, color:"#B0B7C3" }}>Votre profil sera vérifié par notre équipe sous 24–48h.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}