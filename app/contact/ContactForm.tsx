"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Loader2, Check, AlertCircle } from "lucide-react";

const CSS = `
  .cf-field {
    width: 100%; padding: 12px 16px;
    background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.10);
    border-radius: 10px; font-size: 14px; font-family: inherit;
    color: #fff; outline: none; transition: border .18s, background .18s;
  }
  .cf-field::placeholder { color: rgba(255,255,255,.3); }
  .cf-field:focus { border-color: rgba(2,175,207,.5); background: rgba(255,255,255,.08); }

  .cf-label {
    display: block; font-size: 11px; font-weight: 700;
    color: rgba(255,255,255,.4); text-transform: uppercase;
    letter-spacing: .8px; margin-bottom: 7px;
  }

  .cf-submit {
    width: 100%; padding: 14px 20px;
    background: #02AFCF; color: #fff;
    border: none; border-radius: 11px;
    font-size: 14px; font-weight: 800;
    font-family: inherit; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all .2s; box-shadow: 0 4px 20px rgba(2,175,207,.3);
  }
  .cf-submit:hover:not(:disabled) { background: #00c4e8; box-shadow: 0 6px 28px rgba(2,175,207,.45); }
  .cf-submit:disabled { opacity: .6; cursor: not-allowed; }
  .cf-submit.ok { background: #059669; box-shadow: 0 4px 20px rgba(5,150,105,.3); }

  @keyframes cfspin { to { transform: rotate(360deg); } }
  .cf-spin { animation: cfspin .7s linear infinite; }
`;

interface Props {
  ctaLabel:   string;
  successMsg: string;
}

export default function ContactForm({ ctaLabel, successMsg }: Props) {
  const sb = createClient();
  const [form, setForm] = useState({ name:"", email:"", subject:"", message:"" });
  const [loading, setLoading] = useState(false);
  const [ok,      setOk]      = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Veuillez remplir les champs obligatoires.");
      return;
    }
    setLoading(true); setError(null);
    try {
      const { error: err } = await sb.from("contact_messages").insert({
        name:    form.name,
        email:   form.email,
        subject: form.subject,
        message: form.message,
      });
      if (err) throw err;
      setOk(true);
      setForm({ name:"", email:"", subject:"", message:"" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:18 }}>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div>
            <label className="cf-label">Nom *</label>
            <input className="cf-field" value={form.name} onChange={upd("name")} placeholder="Votre nom" required />
          </div>
          <div>
            <label className="cf-label">Email *</label>
            <input className="cf-field" type="email" value={form.email} onChange={upd("email")} placeholder="votre@email.com" required />
          </div>
        </div>

        <div>
          <label className="cf-label">Sujet</label>
          <input className="cf-field" value={form.subject} onChange={upd("subject")} placeholder="Objet de votre message…" />
        </div>

        <div>
          <label className="cf-label">Message *</label>
          <textarea
            className="cf-field"
            value={form.message}
            onChange={upd("message")}
            placeholder="Décrivez votre demande…"
            rows={5}
            required
            style={{ resize:"vertical" }}
          />
        </div>

        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(220,38,38,.12)", border:"1px solid rgba(220,38,38,.3)", borderRadius:10, fontSize:13, color:"#FCA5A5" }}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        {ok && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(5,150,105,.12)", border:"1px solid rgba(5,150,105,.3)", borderRadius:10, fontSize:13, color:"#6EE7B7" }}>
            <Check size={14}/> {successMsg}
          </div>
        )}

        <button className={`cf-submit ${ok ? "ok" : ""}`} type="submit" disabled={loading || ok}>
          {loading ? <><Loader2 size={15} className="cf-spin"/> Envoi en cours…</>
           : ok     ? <><Check size={15}/> Message envoyé !</>
           : ctaLabel}
        </button>
      </form>
    </>
  );
}