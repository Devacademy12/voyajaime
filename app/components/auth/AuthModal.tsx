"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  Eye, EyeOff, X, ArrowRight, ArrowLeft,
  Mail, Lock, User, Building2, MapPin,
  CheckCircle, AlertCircle, Loader2,
} from "lucide-react";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];
type Mode = "login" | "register" | "prestataire";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}

function pwdStrength(p: string) {
  if (p.length === 0) return null;
  if (p.length < 6) return { level: 0, label: "Trop court", color: "#EF4444" };
  if (p.length < 8) return { level: 1, label: "Faible",    color: "#F59E0B" };
  const has = (r: RegExp) => r.test(p);
  const score = [has(/[A-Z]/), has(/[0-9]/), has(/[^A-Za-z0-9]/), p.length >= 12].filter(Boolean).length;
  if (score <= 1) return { level: 2, label: "Moyen",    color: "#F59E0B" };
  if (score === 2) return { level: 3, label: "Bon",      color: "#10B981" };
  return              { level: 4, label: "Excellent", color: "#059669" };
}

const REDIRECT_URL        = "https://voyajaime.com/api/auth/callback";
const REGISTER_PRESTA_URL = "https://voyajaime.com/api/register-prestataire";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes am-backdropIn { from{opacity:0} to{opacity:1} }
  @keyframes am-modalIn    { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes am-spin        { to{transform:rotate(360deg)} }
  @keyframes am-slideUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .am-backdrop {
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    padding:16px;
    animation:am-backdropIn .2s ease;
  }
  .am-overlay {
    position:absolute;inset:0;
    background:rgba(5,19,51,.62);
    backdrop-filter:blur(10px);
    -webkit-backdrop-filter:blur(10px);
  }
  .am-modal {
    position:relative;z-index:1;
    width:100%;max-width:460px;
    background:#FAFAF9;
    border-radius:24px;
    border:1px solid #E5E7EB;
    font-family:'DM Sans',sans-serif;
    animation:am-modalIn .3s cubic-bezier(.34,1.56,.64,1);
    max-height:92vh;overflow-y:auto;
    box-shadow:0 32px 80px rgba(5,51,102,.18);
  }
  .am-strip {
    height:4px;
    background:linear-gradient(90deg,#053366,#02AFCF);
    border-radius:24px 24px 0 0;
  }
  .am-inner { padding:32px 36px 28px; }
  .am-close {
    position:absolute;top:18px;right:18px;
    width:30px;height:30px;
    border-radius:50%;border:1px solid #E5E7EB;
    background:white;color:#9CA3AF;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:all .15s;
  }
  .am-close:hover { background:#F3F4F6;color:#374151;border-color:#D1D5DB; }
  .am-head { margin-bottom:24px; }
  .am-back  { background:none;border:1.5px solid #E5E7EB;border-radius:7px;color:#053366;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;padding:0;margin-bottom:12px;display:flex;align-items:center;gap:4px;transition:color .15s; }
  .am-back:hover { color:#6B7280; }
  .am-title { font-size:22px;font-weight:800;color:#053366;letter-spacing:-.5px;line-height:1.15;margin:0 0 5px; }
  .am-title em { font-family:'Instrument Serif',serif;font-style:italic;color:#02AFCF;font-weight:400; }
  .am-sub   { font-size:13px;color:#9CA3AF;font-weight:500;margin:0; }
  .am-tabs { display:flex;background:#F3F4F6;border-radius:12px;padding:3px;margin-bottom:20px;gap:3px; }
  .am-tab  { flex:1;padding:9px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;color:#9CA3AF;background:transparent; }
  .am-tab.on { background:white;color:#053366;box-shadow:0 1px 4px rgba(5,51,102,.1); }
  .am-alert { padding:10px 13px;border-radius:10px;font-size:12px;line-height:1.5;font-weight:500;margin-bottom:16px;display:flex;align-items:flex-start;gap:7px; }
  .am-alert-err { background:#FEF2F2;border:1px solid #FECACA;color:#DC2626; }
  .am-alert-ok  { background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D; }
  .am-google {
    width:100%;padding:11px 16px;
    background:white;color:#374151;
    border:1.5px solid #E5E7EB;border-radius:12px;
    font-size:13px;font-weight:600;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all .2s;
    display:flex;align-items:center;justify-content:center;gap:8px;
    box-sizing:border-box;
  }
  .am-google:hover { border-color:#D1D5DB;box-shadow:0 2px 8px rgba(0,0,0,.06);background:#FAFAFA; }
  .am-divider { display:flex;align-items:center;gap:10px;margin:14px 0;font-size:11px;color:#C4C9D4;font-weight:700;letter-spacing:.5px; }
  .am-divider::before,.am-divider::after { content:'';flex:1;height:1px;background:#EBEBEB; }
  .am-fields  { display:flex;flex-direction:column;gap:12px; }
  .am-field   { display:flex;flex-direction:column;gap:5px; }
  .am-label   { font-size:11px;font-weight:700;color:#374151;letter-spacing:.4px;text-transform:uppercase;display:flex;align-items:center;gap:5px; }
  .am-input-wrap { position:relative;display:flex;align-items:center; }
  .am-icon-left  { position:absolute;left:12px;color:#C4C9D4;pointer-events:none;display:flex;align-items:center; }
  .am-input {
    width:100%;padding:11px 14px 11px 38px;
    border:1.5px solid #E5E7EB;border-radius:11px;
    font-size:14px;font-family:'DM Sans',sans-serif;color:#111827;
    background:#F9FAFB;transition:all .2s;outline:none;
    box-sizing:border-box;
  }
  .am-input:focus { border-color:#053366;background:white;box-shadow:0 0 0 3px rgba(5,51,102,.08); }
  .am-input::placeholder { color:#C4C9D4; }
  .am-input.no-icon { padding-left:14px; }
  .am-eye { position:absolute;right:12px;background:none;border:none;cursor:pointer;color:#C4C9D4;display:flex;align-items:center;padding:0;transition:color .15s; }
  .am-eye:hover { color:#6B7280; }
  .am-strength { margin-top:6px; }
  .am-bars { display:flex;gap:3px;margin-bottom:3px; }
  .am-bar  { flex:1;height:3px;border-radius:2px;background:#E5E7EB;transition:background .25s; }
  .am-bar-label { font-size:11px;font-weight:700; }
  .am-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
  .am-forgot-row { text-align:right;margin-top:-4px; }
  .am-forgot { background:none;border:none;font-size:12px;color:#02AFCF;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;padding:0;transition:all .2s; }
  .am-forgot:hover { color:#0099B5;text-decoration:underline; }
  .am-submit {
    width:100%;padding:13px;margin-top:16px;
    background:#053366;color:white;border:none;border-radius:12px;
    font-size:14px;font-weight:700;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all .2s;
    display:flex;align-items:center;justify-content:center;gap:8px;
    box-sizing:border-box;
  }
  .am-submit:hover:not(:disabled) { background:#02AFCF;transform:translateY(-1px);box-shadow:0 8px 24px rgba(2,175,207,.25); }
  .am-submit:disabled { opacity:.55;cursor:not-allowed;transform:none; }
  .am-footer { font-size:12px;color:#9CA3AF;text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #F3F4F6;line-height:1.6; }
  .am-footer button { background:none;border:none;color:#053366;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;transition:all .2s; }
  .am-footer button:hover { color:#02AFCF;text-decoration:underline; }
  .am-spin-icon { animation:am-spin .7s linear infinite; }

  @media(max-width:480px){
    .am-inner { padding:24px 20px 20px; }
    .am-row   { grid-template-columns:1fr; }
  }
`;

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const supabase = createClient();
  const [mode, setMode]             = useState<Mode>(defaultMode);
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [fullName, setFullName]     = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [city, setCity]             = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);

  const isPresta = mode === "prestataire";

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode); setError(null); setSuccess(null);
      setEmail(""); setPassword(""); setFullName(""); setAgencyName(""); setCity("");
    }
  }, [isOpen, defaultMode]);

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
    "Invalid login credentials":                "Email ou mot de passe incorrect.",
    "Email not confirmed":                      "Confirmez votre email avant de vous connecter.",
    "User already registered":                  "Un compte existe déjà avec cet email.",
    "Password should be at least 6 characters": "Minimum 8 caractères requis.",
    "over_email_send_rate_limit":               "Trop de tentatives. Patientez quelques minutes.",
    "email rate limit exceeded":                "Limite atteinte. Réessayez dans 1 heure.",
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);

    if (!emailRegex.test(email.trim()))                    { setError("Adresse email invalide."); return; }
    if (mode !== "login" && password.length < 8)           { setError("Minimum 8 caractères requis."); return; }
    if (mode === "register" && fullName.trim().length < 2) { setError("Veuillez entrer votre nom complet."); return; }
    if (isPresta) {
      if (fullName.trim().length < 2)   { setError("Veuillez entrer votre nom complet."); return; }
      if (agencyName.trim().length < 2) { setError("Le nom de l'agence est trop court."); return; }
      if (!city)                        { setError("Veuillez sélectionner une ville."); return; }
    }

    setLoading(true);
    try {

      // ── LOGIN ──
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizeText(email),
          password,
        });
        if (error) throw error;

        const { data: profile } = await supabase
          .from("profiles").select("role").eq("user_id", data.user.id).single();
        const role = profile?.role || "touriste";

        onClose();
        if (role === "touriste") {
          const saved = sessionStorage.getItem("redirect_after_login") || "/";
          sessionStorage.removeItem("redirect_after_login");
          window.location.href = saved;
        } else {
          window.location.href = `/${role}/dashboard`;
        }

      // ── REGISTER TOURISTE ──
      } else if (mode === "register") {
        const cleanEmail    = sanitizeText(email);
        const cleanFullName = sanitizeText(fullName);

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: REDIRECT_URL,
            data: {
              role:      "touriste",
              full_name: cleanFullName || cleanEmail,
            },
          },
        });

        if (error) {
          const msg = error.message.toLowerCase();
          if (
            msg.includes("rate limit") ||
            msg.includes("too many") ||
            (error as unknown as { status?: number }).status === 429
          ) {
            throw new Error("Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.");
          }
          throw error;
        }

        if (!data.user) throw new Error("Cet email est déjà utilisé. Essayez de vous connecter.");

        await supabase.from("profiles").upsert(
          { user_id: data.user.id, role: "touriste", full_name: cleanFullName || cleanEmail },
          { onConflict: "user_id" }
        );

        if (!data.user.email_confirmed_at) {
          setSuccess("Vérifiez votre email pour confirmer votre inscription !");
        } else {
          onClose();
          window.location.href = "/";
        }

      // ── REGISTER PRESTATAIRE ──
      } else {
        const cleanEmail      = sanitizeText(email);
        const cleanFullName   = sanitizeText(fullName);
        const cleanAgencyName = sanitizeText(agencyName);
        const cleanCity       = sanitizeText(city);

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: REDIRECT_URL,
            data: {
              role:        "prestataire",
              full_name:   cleanFullName,
              agency_name: cleanAgencyName,
              city:        cleanCity,
            },
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error("Cet email est déjà utilisé. Essayez de vous connecter.");

        const res = await fetch(REGISTER_PRESTA_URL, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT_URL },
    });
    if (error) {
      setError("Impossible de se connecter avec Google.");
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email)                         { setError("Entrez votre email d'abord."); return; }
    if (!emailRegex.test(email.trim())) { setError("Adresse email invalide."); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizeText(email) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");
      setSuccess("Un lien de réinitialisation a été envoyé à votre adresse email.");
      setEmail("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer l'email. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const strength = mode !== "login" && password.length > 0 ? pwdStrength(password) : null;

  return (
    <>
      <style>{CSS}</style>

      <div className="am-backdrop">
        <div className="am-overlay" onClick={onClose} />

        <div className="am-modal">
          <div className="am-strip" />

          <button className="am-close" onClick={onClose} aria-label="Fermer">
            <X size={14} strokeWidth={2.5} />
          </button>

          <div className="am-inner">

            {/* ── Header ── */}
            <div className="am-head">
              {isPresta && (
                <button className="am-back" onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>
                  <ArrowLeft size={13} /> Retour
                </button>
              )}
              <h1 className="am-title">
                {mode === "login" ? <>Se connecter</>
                  : isPresta      ? <>Devenir prestataire</>
                  :                 <>Créer un compte</>}
              </h1>
              <p className="am-sub">
                {mode === "login" ? "Connectez-vous pour continuer votre aventure"
                  : isPresta      ? "Listez vos excursions sur VoyajAime"
                  :                 "Rejoignez des milliers de voyageurs en Tunisie"}
              </p>
            </div>

            {/* ── Tabs ── */}
            {!isPresta && (
              <div className="am-tabs">
                {(["login", "register"] as const).map(m => (
                  <button key={m} className={`am-tab ${mode === m ? "on" : ""}`}
                    onClick={() => { setMode(m); setError(null); setSuccess(null); }}>
                    {m === "login" ? "Connexion" : "Inscription"}
                  </button>
                ))}
              </div>
            )}

            {/* ── Alerts ── */}
            {error && (
              <div className="am-alert am-alert-err">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}
            {success && (
              <div className="am-alert am-alert-ok">
                <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {success}
              </div>
            )}

            {/* ── Google ── */}
            {!isPresta && (
              <>
                <button className="am-google" onClick={handleGoogle} disabled={googleLoading}>
                  {googleLoading
                    ? <Loader2 size={15} className="am-spin-icon" />
                    : (
                      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                      </svg>
                    )
                  }
                  Continuer avec Google
                </button>
                <div className="am-divider">OU</div>
              </>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit}>
              <div className="am-fields">

                {isPresta ? (
                  <>
                    <div className="am-row">
                      <div className="am-field">
                        <label className="am-label"><User size={11} />Nom complet</label>
                        <div className="am-input-wrap">
                          <span className="am-icon-left"><User size={15} /></span>
                          <input className="am-input" type="text" placeholder="Prénom Nom"
                            value={fullName} onChange={e => setFullName(e.target.value)} required />
                        </div>
                      </div>
                      <div className="am-field">
                        <label className="am-label"><Building2 size={11} />Agence</label>
                        <div className="am-input-wrap">
                          <span className="am-icon-left"><Building2 size={15} /></span>
                          <input className="am-input" type="text" placeholder="Nom de l'agence"
                            value={agencyName} onChange={e => setAgencyName(e.target.value)} required />
                        </div>
                      </div>
                    </div>

                    <div className="am-row">
                      <div className="am-field">
                        <label className="am-label"><MapPin size={11} />Ville</label>
                        <div className="am-input-wrap">
                          <span className="am-icon-left"><MapPin size={15} /></span>
                          <select className="am-input" value={city} onChange={e => setCity(e.target.value)} required
                            style={{ appearance: "none" }}>
                            <option value="">Sélectionner</option>
                            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="am-field">
                        <label className="am-label"><Mail size={11} />Email</label>
                        <div className="am-input-wrap">
                          <span className="am-icon-left"><Mail size={15} /></span>
                          <input className="am-input" type="email" placeholder="votre@email.com"
                            value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                        </div>
                      </div>
                    </div>

                    <div className="am-field">
                      <label className="am-label"><Lock size={11} />Mot de passe</label>
                      <div className="am-input-wrap">
                        <span className="am-icon-left"><Lock size={15} /></span>
                        <input className="am-input" type={showPwd ? "text" : "password"}
                          placeholder="Minimum 8 caractères"
                          value={password} onChange={e => setPassword(e.target.value)} required
                          autoComplete="new-password" style={{ paddingRight: 40 }} />
                        <button type="button" className="am-eye" onClick={() => setShowPwd(!showPwd)}>
                          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {strength && (
                        <div className="am-strength">
                          <div className="am-bars">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="am-bar"
                                style={{ background: i <= strength.level ? strength.color : "#E5E7EB" }} />
                            ))}
                          </div>
                          <span className="am-bar-label" style={{ color: strength.color }}>{strength.label}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {mode === "register" && (
                      <div className="am-field">
                        <label className="am-label"><User size={11} />Nom complet</label>
                        <div className="am-input-wrap">
                          <span className="am-icon-left"><User size={15} /></span>
                          <input className="am-input" type="text" placeholder="Prénom et Nom"
                            value={fullName} onChange={e => setFullName(e.target.value)} required />
                        </div>
                      </div>
                    )}

                    <div className="am-field">
                      <label className="am-label"><Mail size={11} />Email</label>
                      <div className="am-input-wrap">
                        <span className="am-icon-left"><Mail size={15} /></span>
                        <input className="am-input" type="email" placeholder="votre@email.com"
                          value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                      </div>
                    </div>

                    <div className="am-field">
                      <label className="am-label"><Lock size={11} />Mot de passe</label>
                      <div className="am-input-wrap">
                        <span className="am-icon-left"><Lock size={15} /></span>
                        <input className="am-input"
                          type={showPwd ? "text" : "password"}
                          placeholder={mode === "login" ? "Votre mot de passe" : "Minimum 8 caractères"}
                          value={password} onChange={e => setPassword(e.target.value)} required
                          autoComplete={mode === "login" ? "current-password" : "new-password"}
                          style={{ paddingRight: 40 }} />
                        <button type="button" className="am-eye" onClick={() => setShowPwd(!showPwd)}>
                          {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {strength && (
                        <div className="am-strength">
                          <div className="am-bars">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="am-bar"
                                style={{ background: i <= strength.level ? strength.color : "#E5E7EB" }} />
                            ))}
                          </div>
                          <span className="am-bar-label" style={{ color: strength.color }}>{strength.label}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {mode === "login" && (
                <div className="am-forgot-row" style={{ marginTop: 8 }}>
                  <button type="button" className="am-forgot" onClick={handleForgotPassword}>
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              <button type="submit" className="am-submit" disabled={loading}>
                {loading
                  ? <><Loader2 size={15} className="am-spin-icon" /> Chargement…</>
                  : <>
                      {mode === "login" ? "Se connecter" : isPresta ? "Envoyer ma demande" : "Créer mon compte"}
                      <ArrowRight size={15} />
                    </>
                }
              </button>
            </form>

            <div className="am-footer">
              {!isPresta ? (
                <p>Vous êtes prestataire ?{" "}
                  <button onClick={() => { setMode("prestataire"); setError(null); setSuccess(null); }}>
                    Inscrivez votre activité →
                  </button>
                </p>
              ) : (
                <p style={{ fontSize: 11, color: "#B0B7C3" }}>
                  Votre profil sera vérifié par notre équipe sous 24–48h.
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}