"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Loader2, Check, AlertCircle } from "lucide-react";

const CSS = `
  /* ── Form fields dark ── */
  .cfi-row   { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .cfi-group { display:flex; flex-direction:column; }

  .cfi-label {
    font-size: 10.5px; font-weight: 800;
    color: rgba(255,255,255,.38);
    text-transform: uppercase; letter-spacing: .9px;
    margin-bottom: 7px; display: block;
  }

  .cfi-field {
    width: 100%; padding: 14px 16px;
    background: rgba(255,255,255,.06);
    border: 1.5px solid rgba(255,255,255,.10);
    border-radius: 10px;
    font-size: 14px; font-family: inheritinherit; color: #fff;
    outline: none; transition: border .18s, background .18s;
    resize: vertical;
  }
  .cfi-field::placeholder { color: rgba(255,255,255,.22); }
  .cfi-field:focus {
    border-color: rgba(2,175,207,.55);
    background: rgba(255,255,255,.08);
  }

  .cfi-submit {
    width: 100%; padding: 16px;
    background: #02AFCF; color: #fff;
    border: none; border-radius: 11px;
    font-size: 15px; font-weight: 800; font-family: inheritinherit;
    cursor: pointer; letter-spacing: .1px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all .2s;
    box-shadow: 0 4px 22px rgba(2,175,207,.35);
  }
  .cfi-submit:hover:not(:disabled) {
    background: #00c8ea;
    box-shadow: 0 6px 30px rgba(2,175,207,.5);
  }
  .cfi-submit:disabled { opacity:.6; cursor:not-allowed; }
  .cfi-submit.ok { background: #059669; box-shadow: 0 4px 20px rgba(5,150,105,.3); }

  .cfi-alert {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 10px;
    font-size: 13px;
  }
  .cfi-alert.err { background:rgba(220,38,38,.12); border:1px solid rgba(220,38,38,.3); color:#FCA5A5; }
  .cfi-alert.ok  { background:rgba(5,150,105,.12);  border:1px solid rgba(5,150,105,.3);  color:#6EE7B7; }

  @keyframes cfispin { to { transform:rotate(360deg); } }
  .cfi-spin { animation: cfispin .7s linear infinite; }

  @media(max-width:480px){ .cfi-row { grid-template-columns:1fr!important; } }
`;

export default function ContactFormInline({
  ctaLabel   = "Envoyer le message",
  successMsg = "Message envoyé ! Nous vous répondrons sous 24h.",
}: {
  ctaLabel?:   string;
  successMsg?: string;
}) {
  const sb = createClient();
  const [form, setForm]     = useState({ name:"", email:"", subject:"", message:"" });
  const [loading, setLoading] = useState(false);
  const [ok,      setOk]      = useState(false);
  const [error,   setError]   = useState<string|null>(null);

  const upd = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
        name: form.name, email: form.email,
        subject: form.subject, message: form.message,
      });
      if (err) throw err;
      setOk(true);
      setForm({ name:"", email:"", subject:"", message:"" });
    } catch(e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

        {/* Nom + Email */}
        <div className="cfi-row">
          <div className="cfi-group">
            <label className="cfi-label">Nom *</label>
            <input className="cfi-field" value={form.name} onChange={upd("name")} placeholder="Votre nom" required />
          </div>
          <div className="cfi-group">
            <label className="cfi-label">Email *</label>
            <input className="cfi-field" type="email" value={form.email} onChange={upd("email")} placeholder="votre@email.com" required />
          </div>
        </div>

        {/* Sujet */}
        <div className="cfi-group">
          <label className="cfi-label">Sujet</label>
          <input className="cfi-field" value={form.subject} onChange={upd("subject")} placeholder="Objet de votre message…" />
        </div>

        {/* Message */}
        <div className="cfi-group">
          <label className="cfi-label">Message *</label>
          <textarea
            className="cfi-field"
            value={form.message}
            onChange={upd("message")}
            placeholder="Décrivez votre demande…"
            rows={5}
            required
          />
        </div>

        {/* Feedback */}
        {error && <div className="cfi-alert err"><AlertCircle size={14}/> {error}</div>}
        {ok    && <div className="cfi-alert ok"><Check size={14}/> {successMsg}</div>}

        {/* Submit */}
        <button className={`cfi-submit ${ok ? "ok" : ""}`} type="submit" disabled={loading || ok}>
          {loading
            ? <><Loader2 size={15} className="cfi-spin"/> Envoi en cours…</>
            : ok
              ? <><Check size={15}/> Message envoyé !</>
              : ctaLabel}
        </button>

      </form>
    </>
  );
}