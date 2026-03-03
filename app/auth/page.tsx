"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];
const BG_IMAGES = [
  { url: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=900&q=90&fit=crop", city: "Sidi Bou Saïd", desc: "Le village bleu et blanc" },
  { url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=900&q=90&fit=crop", city: "Désert du Sahara", desc: "Dunes infinies à Douz" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=90&fit=crop", city: "Île de Djerba", desc: "Plages turquoise" },
];
type Mode = "login" | "register" | "prestataire";

export default function AuthPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [city, setCity] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bgIdx, setBgIdx] = useState(0);
  const [bgFade, setBgFade] = useState(false);

  // Avatar prestataire
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error")) setError("Une erreur est survenue.");
    if (new URLSearchParams(window.location.search).get("type") === "prestataire") setMode("prestataire");
    const t = setInterval(() => {
      setBgFade(true);
      setTimeout(() => { setBgIdx(p => (p + 1) % BG_IMAGES.length); setBgFade(false); }, 600);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const errMsg: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "Email not confirmed": "Confirmez votre email avant de vous connecter.",
    "User already registered": "Un compte existe déjà avec cet email.",
    "Password should be at least 6 characters": "Minimum 6 caractères.",
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { setError("Format non supporté (JPG, PNG, WebP)"); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Image trop lourde (max 2 MB)"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
    e.target.value = "";
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<{ base64: string; ext: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        resolve({ base64, ext });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).single();
        const role = profile?.role || "touriste";
        if (role === "touriste") {
          const saved = sessionStorage.getItem("redirect_after_login") || "/";
          sessionStorage.removeItem("redirect_after_login");
          window.location.href = saved;
        } else {
          window.location.href = `/${role}/dashboard`;
        }

      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            data: { role: "touriste", full_name: fullName || email },
          },
        });
        if (error) throw error;
        if (!data.user) return;
        await supabase.from("profiles").upsert({
          user_id: data.user.id, role: "touriste", full_name: fullName || email,
        }, { onConflict: "user_id" });
        if (!data.user.email_confirmed_at) {
          setSuccess("Vérifiez votre email pour confirmer votre inscription !");
        } else {
          window.location.href = "/";
        }

      } else {
        // ── PRESTATAIRE ──
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            data: { role: "prestataire", full_name: fullName, agency_name: agencyName, city },
          },
        });
        if (error) throw error;
        if (!data.user) throw new Error("Erreur création compte");

        // Préparer avatar
        let avatarBase64: string | null = null;
        let avatarExt: string | null = null;
        if (avatarFile) {
          const { base64, ext } = await fileToBase64(avatarFile);
          avatarBase64 = base64;
          avatarExt = ext;
        }

        // Appel API avec retry intégré côté serveur
        const res = await fetch("/api/register-prestataire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: data.user.id, fullName, agencyName, city, avatarBase64, avatarExt }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erreur serveur");

        setSuccess("Demande envoyée ! Votre profil sera validé sous 24-48h.");
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
    if (!email) { setError("Entrez votre email d'abord."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    });
    setLoading(false);
    if (error) setError("Impossible d'envoyer l'email.");
    else setSuccess("Email de réinitialisation envoyé !");
  };

  const isPresta = mode === "prestataire";
  const bg = BG_IMAGES[bgIdx];
  const prestDisplayName = agencyName || fullName || "P";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif}
        .auth-wrap{display:flex;min-height:100vh}
        .left-panel{position:relative;flex:1.1;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end}
        .left-bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity .7s ease}
        .left-ov1{position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.05) 40%,rgba(0,0,0,.55) 100%)}
        .right-panel{width:500px;flex-shrink:0;background:white;display:flex;flex-direction:column;justify-content:center;padding:52px;overflow-y:auto;position:relative}
        .field{margin-bottom:13px}
        .field label{display:block;font-size:11px;font-weight:700;color:#374151;letter-spacing:.8px;margin-bottom:6px;text-transform:uppercase}
        .field input,.field select{width:100%;padding:12px 15px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:'DM Sans',sans-serif;color:#111827;background:#FAFAFA;transition:all .2s;outline:none}
        .field input:focus,.field select:focus{border-color:#2B96A8;background:white;box-shadow:0 0 0 4px rgba(43,150,168,.1)}
        .field-pwd{position:relative}
        .field-pwd input{padding-right:48px}
        .pwd-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9CA3AF;display:flex;align-items:center;padding:0}
        .tabs{display:flex;background:#F3F4F6;border-radius:12px;padding:4px;margin-bottom:26px;gap:4px}
        .tab{flex:1;padding:10px;border:none;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s}
        .tab.on{background:white;color:#111827;box-shadow:0 1px 4px rgba(0,0,0,.12)}
        .tab:not(.on){background:transparent;color:#9CA3AF}
        .submit-btn{width:100%;padding:14px;background:#111827;color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
        .submit-btn:hover:not(:disabled){background:#1f2937;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.2)}
        .submit-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .google-btn{width:100%;padding:13px;background:white;color:#374151;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:14px}
        .google-btn:hover{border-color:#D1D5DB;box-shadow:0 2px 8px rgba(0,0,0,.08)}
        .divider{display:flex;align-items:center;gap:12px;margin:14px 0;font-size:12px;color:#9CA3AF;font-weight:500}
        .divider::before,.divider::after{content:'';flex:1;height:1px;background:#E5E7EB}
        .alert{padding:12px 14px;border-radius:10px;font-size:13px;margin-bottom:14px;line-height:1.5}
        .alert-err{background:#FEF2F2;border:1px solid #FECACA;color:#DC2626}
        .alert-ok{background:#F0FDF4;border:1px solid #BBF7D0;color:#15803D}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite}
        .spin-dark{width:16px;height:16px;border:2px solid rgba(0,0,0,.12);border-top-color:#374151;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes sIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .slide-in{animation:sIn .3s ease forwards}
        .av-ring{position:relative;cursor:pointer;transition:all .2s}
        .av-ring:hover .av-ov{opacity:1}
        .av-ov{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;font-size:18px;color:white}
        @media(max-width:768px){.left-panel{display:none}.right-panel{width:100%;padding:36px 24px}}
      `}</style>

      <div className="auth-wrap">
        {/* ── GAUCHE ── */}
        <div className="left-panel">
          <div className="left-bg" style={{ backgroundImage:`url(${bg.url})`, opacity:bgFade?0:1 }} />
          <div className="left-ov1" />
          <div style={{ position:"absolute",top:36,left:48,zIndex:3 }}>
            <Link href="/" style={{ display:"flex",alignItems:"center",gap:10,textDecoration:"none" }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z" fill="#2B96A8"/>
                <path d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z" fill="white"/>
              </svg>
              <span style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:"white" }}>voyajaime</span>
            </Link>
          </div>
          <div style={{ position:"relative",zIndex:2,padding:"48px 52px" }}>
            <div style={{ display:"flex",gap:6,marginBottom:20 }}>
              {BG_IMAGES.map((_,i) => (
                <div key={i} style={{ width:i===bgIdx?24:6,height:6,borderRadius:3,background:i===bgIdx?"#2B96A8":"rgba(255,255,255,.4)",transition:"all .4s" }} />
              ))}
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:900,color:"white",lineHeight:1.15,marginBottom:8,textShadow:"0 2px 16px rgba(0,0,0,.3)" }}>
              {bg.city}
            </h2>
            <p style={{ fontSize:15,color:"rgba(255,255,255,.72)" }}>{bg.desc}</p>
            <div style={{ display:"flex",gap:28,marginTop:32,paddingTop:24,borderTop:"1px solid rgba(255,255,255,.15)" }}>
              {[["2400+","Voyageurs"],["180+","Excursions"],["4.9★","Note moy."]].map(([v,l]) => (
                <div key={l}>
                  <p style={{ fontSize:20,fontWeight:800,color:"white" }}>{v}</p>
                  <p style={{ fontSize:12,color:"rgba(255,255,255,.55)",marginTop:2 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DROITE ── */}
        <div className="right-panel">
          <Link href="/" style={{ position:"absolute",top:28,right:28,fontSize:13,color:"#9CA3AF",textDecoration:"none",fontWeight:500 }}>← Accueil</Link>

          <div className="slide-in" key={mode}>
            <div style={{ marginBottom:24 }}>
              {isPresta && (
                <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                  style={{ background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4,marginBottom:18,padding:0 }}>
                  ← Retour
                </button>
              )}
              <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"#111827",marginBottom:5 }}>
                {mode==="login" ? "Bon retour 👋" : isPresta ? "Devenir prestataire" : "Créer un compte"}
              </h1>
              <p style={{ fontSize:14,color:"#6B7280" }}>
                {mode==="login" ? "Connectez-vous pour continuer" : isPresta ? "Listez vos excursions sur VoyajAime" : "Rejoignez des milliers de voyageurs"}
              </p>
            </div>

            {/* Tabs */}
            {!isPresta && (
              <div className="tabs">
                {(["login","register"] as const).map(m => (
                  <button key={m} className={`tab ${mode===m?"on":""}`}
                    onClick={() => { setMode(m); setError(null); setSuccess(null); }}>
                    {m==="login" ? "Connexion" : "Inscription"}
                  </button>
                ))}
              </div>
            )}

            {error   && <div className="alert alert-err">{error}</div>}
            {success && <div className="alert alert-ok">{success}</div>}

            {/* Google */}
            {!isPresta && (
              <>
                <button className="google-btn" onClick={handleGoogle} disabled={googleLoading}>
                  {googleLoading ? <span className="spin-dark" /> : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continuer avec Google
                </button>
                <div className="divider">ou avec votre email</div>
              </>
            )}

            <form onSubmit={handleSubmit}>
              {/* ── AVATAR PRESTATAIRE ── */}
              {isPresta && (
                <div style={{ display:"flex",justifyContent:"center",marginBottom:20 }}>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={handleAvatarSelect} />
                  <div style={{ textAlign:"center" }}>
                    <div className="av-ring" style={{ width:80,height:80,borderRadius:"50%",margin:"0 auto 8px",border:avatarPreview?"2px solid #2B96A8":"2px dashed #D1D5DB",transition:"border-color .2s" }}
                      onClick={() => fileRef.current?.click()}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" style={{ width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover",display:"block" }} />
                      ) : (
                        <div style={{ width:"100%",height:"100%",borderRadius:"50%",background:"linear-gradient(135deg,#2B96A8,#4AABB8)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:28 }}>
                          {prestDisplayName[0].toUpperCase()}
                        </div>
                      )}
                      <div className="av-ov">📷</div>
                    </div>
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ background:"none",border:"none",fontSize:12,color:"#2B96A8",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700,padding:0 }}>
                      {avatarPreview ? "✓ Photo sélectionnée — Changer" : "📷 Ajouter une photo (optionnel)"}
                    </button>
                    {avatarPreview && (
                      <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                        style={{ display:"block",background:"none",border:"none",fontSize:11,color:"#9CA3AF",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",margin:"3px auto 0" }}>
                        ✕ Supprimer
                      </button>
                    )}
                    <p style={{ fontSize:11,color:"#9CA3AF",marginTop:4 }}>JPG, PNG ou WebP · max 2 MB</p>
                  </div>
                </div>
              )}

              {(mode==="register" || isPresta) && (
                <div className="field">
                  <label>Nom complet</label>
                  <input type="text" placeholder="Prénom et Nom" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
              )}
              {isPresta && (
                <>
                  <div className="field">
                    <label>Agence / Activité</label>
                    <input type="text" placeholder="Ex: TunisEscape Tours" value={agencyName} onChange={e => setAgencyName(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Ville principale</label>
                    <select value={city} onChange={e => setCity(e.target.value)} required style={{ appearance:"none",cursor:"pointer" }}>
                      <option value="">Sélectionner une ville</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="field">
                <label>Email</label>
                <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div className="field">
                <label>Mot de passe</label>
                <div className="field-pwd">
                  <input type={showPwd?"text":"password"}
                    placeholder={mode==="login"?"Votre mot de passe":"Minimum 6 caractères"}
                    value={password} onChange={e => setPassword(e.target.value)} required
                    autoComplete={mode==="login"?"current-password":"new-password"} />
                  <button type="button" className="pwd-eye" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {mode==="login" && (
                <div style={{ textAlign:"right",marginBottom:14,marginTop:-4 }}>
                  <button type="button" onClick={handleForgotPassword}
                    style={{ background:"none",border:"none",fontSize:13,color:"#2B96A8",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? <><span className="spin" /> {isPresta ? "Envoi en cours..." : "Chargement..."}</>
                  : mode==="login" ? "Se connecter →"
                  : isPresta ? "Envoyer ma demande →"
                  : "Créer mon compte →"}
              </button>
            </form>

            <div style={{ marginTop:20,paddingTop:18,borderTop:"1px solid #F3F4F6",textAlign:"center" }}>
              {!isPresta ? (
                <p style={{ fontSize:13,color:"#9CA3AF" }}>
                  Vous êtes prestataire ?{" "}
                  <button onClick={() => { setMode("prestataire"); setError(null); setSuccess(null); }}
                    style={{ background:"none",border:"none",color:"#2B96A8",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>
                    Inscrivez votre activité →
                  </button>
                </p>
              ) : (
                <p style={{ fontSize:12,color:"#9CA3AF",lineHeight:1.6 }}>
                  Votre profil sera vérifié par notre équipe sous 24-48h.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}