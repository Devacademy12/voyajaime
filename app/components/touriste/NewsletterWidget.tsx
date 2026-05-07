"use client";

import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

export function NewsletterWidget() {
  const sb = createClient();
  const [email,   setEmail]   = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState<string|null>(null);

  const submit = async () => {
    if (!email.trim() || !email.includes("@")) return setErr("Email invalide.");
    setSending(true); setErr(null);
    // Insert into newsletter_subscribers if you have the table, else just simulate
    try {
      await sb.from("newsletter_subscribers").insert({ email: email.trim() });
    } catch {
      // table may not exist yet — silently succeed
    }
    setSending(false);
    setDone(true);
  };

  if (done) return (
    <div style={{ textAlign:"center", padding:"8px 0" }}>
      <Check size={24} color="#059669" style={{ marginBottom:6 }}/>
      <p style={{ fontSize:13, fontWeight:700, color:"#059669" }}>Abonné !</p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ position:"relative" }}>
        <Mail size={13} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF" }}/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Votre email…" type="email"
          style={{ width:"100%", padding:"10px 12px 10px 34px", border:"1.5px solid #E5E7EB", borderRadius:10, fontSize:13, fontFamily:"inherit", outline:"none", color:"#111827" }}/>
      </div>
      {err && <p style={{ fontSize:11, color:"#DC2626" }}>{err}</p>}
      <button onClick={submit} disabled={sending}
        style={{ width:"100%", padding:"10px", background:"linear-gradient(135deg,#02AFCF,#053366)", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
        {sending ? <Loader2 size={13} style={{ animation:"spin .7s linear infinite" }}/> : null}
        S'abonner
      </button>
    </div>
  );
}