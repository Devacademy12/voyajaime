'use client'

import { useState, useEffect } from 'react'
// ✅ CORRECTION : importer 'supabase' directement (nom réel de l'export)
import { createClient } from '@/lib/supabaseClient'

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 28C16 28 4 19.5 4 11.5C4 7.91 6.91 5 10.5 5C12.5 5 14.3 5.97 16 7.5C17.7 5.97 19.5 5 21.5 5C25.09 5 28 7.91 28 11.5C28 19.5 16 28 16 28Z"
        fill="var(--teal)"
      />
      <path
        d="M16 13L14.5 10H12L15 14.5L11 14V16L15.5 15.5L16 19L16.5 15.5L21 16V14L17 14.5L20 10H17.5L16 13Z"
        fill="white"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#1877F2"/>
      <path d="M12.375 11.25l.375-2.25H10.5V7.5c0-.619.304-1.125 1.219-1.125H12.75V4.219S11.944 4.125 11.137 4.125c-1.819 0-3.012 1.106-3.012 3.094V9H6v2.25h2.125V16.5C8.575 16.5 9 16.5 9 16.5s.425 0 .875-.034V11.25H12.375z" fill="white"/>
    </svg>
  )
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

// ─── Background ───────────────────────────────────────────────────────────────

function Background() {
  return (
    <div className="fixed inset-0 z-0">
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, #C8DDE8 0%, #D5E6EE 20%, #E8EEF0 45%, #F0EEEA 70%, #E8E4DE 100%)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(to bottom, #B8D0DF 0%, transparent 100%)' }} />
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: '80%' }} viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice" fill="none">
        <rect x="0" y="180" width="220" height="420" fill="#F5F3F0" rx="4"/>
        <rect x="20" y="120" width="160" height="480" fill="#F8F7F4" rx="4"/>
        <rect x="40" y="200" width="80" height="200" fill="#EAE7E2" rx="3"/>
        <rect x="55" y="340" width="50" height="80" fill="#6BB8C2" rx="25 25 0 0"/>
        <rect x="60" y="245" width="28" height="36" fill="#7EC8D4" rx="3"/>
        <rect x="100" y="245" width="28" height="36" fill="#7EC8D4" rx="3"/>
        <rect x="25" y="180" width="40" height="50" fill="#8ED0D8" rx="3"/>
        <rect x="180" y="250" width="120" height="350" fill="#F0EDE8" rx="4"/>
        <rect x="190" y="340" width="40" height="60" fill="#5BAAB8" rx="20 20 0 0"/>
        <rect x="200" y="280" width="30" height="40" fill="#7EC8D4" rx="3"/>
        <rect x="1100" y="150" width="340" height="450" fill="#F5F3F0" rx="4"/>
        <rect x="1150" y="220" width="200" height="380" fill="#F8F7F4" rx="4"/>
        <rect x="1220" y="330" width="100" height="150" fill="#2B96A8" rx="50 50 0 0"/>
        <rect x="1160" y="260" width="45" height="60" fill="#4AABB8" rx="4"/>
        <rect x="1230" y="240" width="40" height="55" fill="#5BBBC6" rx="4"/>
        <rect x="1290" y="280" width="35" height="48" fill="#4AABB8" rx="4"/>
        <ellipse cx="1360" cy="148" rx="40" ry="25" fill="#F0EDE8"/>
        <rect x="1340" y="150" width="40" height="100" fill="#EBE8E2" rx="2"/>
        <rect x="0" y="550" width="1440" height="50" fill="#D4CFC8" rx="2"/>
        <rect x="200" y="555" width="1040" height="6" fill="#C8C2BA" rx="3"/>
        <rect x="320" y="320" width="100" height="280" fill="#EEEBE6" rx="3"/>
        <rect x="330" y="380" width="35" height="50" fill="#6AB6C4" rx="17 17 0 0"/>
        <rect x="1380" y="100" width="60" height="500" fill="#EDE9E3" rx="3"/>
        <rect x="1385" y="200" width="25" height="35" fill="#5AB2BE" rx="3"/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────

export default function AuthPage() {
  // ✅ Utiliser 'supabase' directement (pas createClient())
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.")
    }
  }, [])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/dashboard'
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        })
        if (error) throw error
        setSuccess('Vérifiez votre email pour confirmer votre inscription!')
      }
    } catch (err: any) {
      const messages: Record<string, string> = {
        'Invalid login credentials': 'Email ou mot de passe incorrect.',
        'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
        'User already registered': 'Un compte existe déjà avec cet email.',
        'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
      }
      setError(messages[err.message] || err.message || "Une erreur s'est produite.")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError("Impossible de se connecter via " + (provider === 'google' ? 'Google' : 'Facebook') + ".")
      setOauthLoading(null)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Entrez votre email pour réinitialiser le mot de passe.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      })
      if (error) throw error
      setSuccess('Email de réinitialisation envoyé!')
    } catch (err: any) {
      setError("Impossible d'envoyer l'email de réinitialisation.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '20px' }}>
      <Background />

      {/* Logo top-left */}
      <div style={{ position: 'fixed', top: '20px', left: '24px', zIndex: 10 }}
        className={`animate-fade-in ${mounted ? '' : 'opacity-0'}`}>
        <LogoIcon size={36} />
      </div>

      {/* Auth Card */}
      <div className="glass-card animate-slide-up"
        style={{ width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '36px 32px 32px', position: 'relative', zIndex: 5 }}>

        {/* Card Logo + Title */}
        <div className="animate-fade-in delay-100" style={{ marginBottom: '28px' }}>
          <LogoIcon size={40} />
          <h1 style={{ marginTop: '14px', fontSize: '22px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
            {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            {mode === 'login' ? 'Connectez-vous pour continuer votre aventure' : 'Rejoignez des milliers de voyageurs'}
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(254, 226, 226, 0.8)', border: '1px solid rgba(252, 165, 165, 0.5)', borderRadius: '10px', fontSize: '13px', color: '#DC2626' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(209, 250, 229, 0.8)', border: '1px solid rgba(110, 231, 183, 0.5)', borderRadius: '10px', fontSize: '13px', color: '#059669' }}>
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth}>
          <div className="animate-fade-in delay-200" style={{ marginBottom: '12px' }}>
            <input type="email" className="auth-input" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div className="animate-fade-in delay-300" style={{ marginBottom: '8px', position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} className="auth-input" placeholder="Mot de passe"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{ paddingRight: '44px' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
              <EyeIcon show={showPassword} />
            </button>
          </div>

          {mode === 'login' && (
            <div className="animate-fade-in delay-300" style={{ marginBottom: '16px', textAlign: 'right' }}>
              <button type="button" onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--teal)', cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', padding: '4px 0' }}>
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="animate-fade-in delay-400" style={{ margin: '16px 0' }}>
            <div className="divider">ou continuer avec</div>
          </div>

          {/* OAuth Buttons */}
          <div className="animate-fade-in delay-400" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <button type="button" className="oauth-btn" onClick={() => handleOAuth('google')} disabled={!!oauthLoading}>
              {oauthLoading === 'google' ? <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#374151' }} /> : <GoogleIcon />}
              <span>Continuer avec Google</span>
            </button>
            <button type="button" className="oauth-btn" onClick={() => handleOAuth('facebook')} disabled={!!oauthLoading}>
              {oauthLoading === 'facebook' ? <div className="spinner" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: '#374151' }} /> : <FacebookIcon />}
              <span>Continuer avec Facebook</span>
            </button>
          </div>

          {/* Submit */}
          <div className="animate-fade-in delay-500">
            <button type="submit" className="cta-btn" disabled={loading}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div className="spinner" />
                  <span>Connexion...</span>
                </div>
              ) : (
                mode === 'login' ? 'Se connecter' : "S'inscrire"
              )}
            </button>
          </div>
        </form>

        {/* Toggle mode */}
        <div className="animate-fade-in delay-600"
          style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
          {mode === 'login' ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccess(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--teal)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', fontSize: '14px' }}>
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </div>
      </div>

      {/* Sparkle */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 2, opacity: 0.4 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 0L15.5 12.5L28 14L15.5 15.5L14 28L12.5 15.5L0 14L12.5 12.5L14 0Z" fill="white"/>
        </svg>
      </div>
    </main>
  )
}