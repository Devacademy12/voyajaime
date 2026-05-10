"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Send, Loader2, Check, User, Mail, MessageSquare } from "lucide-react";

export function CommentForm({ postId }: { postId: string }) {
  const sb = createClient();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [body,    setBody]    = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !body.trim()) return setErr("Le nom et le commentaire sont obligatoires.");
    setSending(true); setErr(null);
    const { error } = await sb.from("blog_comments").insert({
      post_id:    postId,
      author:     name.trim(),
      email:      email.trim() || null,
      body:       body.trim(),
      is_approved: false,
    });
    setSending(false);
    if (error) return setErr(error.message);
    setDone(true);
    setName(""); setEmail(""); setBody("");
  };

  const FIELD = {
    width:"100%", padding:"12px 16px", border:"1.5px solid #E5E7EB",
    borderRadius:12, fontSize:14, fontFamily:"inherit", color:"#111827",
    background:"white", outline:"none", transition:"border .2s",
  } as const;

  if (done) return (
    <div style={{ padding:"24px", background:"#F0FFF4", border:"1.5px solid #A7F3D0", borderRadius:16, textAlign:"center" }}>
      <Check size={32} color="#059669" style={{ marginBottom:8 }}/>
      <p style={{ fontWeight:700, color:"#065F46", fontSize:15 }}>Commentaire envoyé !</p>
      <p style={{ color:"#6B7280", fontSize:13, marginTop:4 }}>Il sera publié après modération.</p>
      <button onClick={()=>setDone(false)} style={{ marginTop:12, padding:"8px 18px", background:"#059669", color:"white", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        Écrire un autre
      </button>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ position:"relative" }}>
          <User size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF" }}/>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Votre nom *"
            style={{ ...FIELD, paddingLeft:38 }}
            onFocus={e=>(e.target.style.borderColor="#02AFCF")}
            onBlur={e=>(e.target.style.borderColor="#E5E7EB")}/>
        </div>
        <div style={{ position:"relative" }}>
          <Mail size={14} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF" }}/>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email (optionnel)" type="email"
            style={{ ...FIELD, paddingLeft:38 }}
            onFocus={e=>(e.target.style.borderColor="#02AFCF")}
            onBlur={e=>(e.target.style.borderColor="#E5E7EB")}/>
        </div>
      </div>
      <div style={{ position:"relative" }}>
        <MessageSquare size={14} style={{ position:"absolute", left:14, top:14, color:"#9CA3AF" }}/>
        <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Votre commentaire *" rows={5}
          style={{ ...FIELD, paddingLeft:38, resize:"vertical" }}
          onFocus={e=>(e.target.style.borderColor="#02AFCF")}
          onBlur={e=>(e.target.style.borderColor="#E5E7EB")}/>
      </div>
      {err && <p style={{ fontSize:12, color:"#DC2626", display:"flex", alignItems:"center", gap:4 }}>⚠ {err}</p>}
      <button onClick={submit} disabled={sending}
        style={{ alignSelf:"flex-start", display:"flex", alignItems:"center", gap:8, padding:"12px 28px", background:"linear-gradient(135deg,#02AFCF,#053366)", color:"white", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:sending?"not-allowed":"pointer", fontFamily:"inherit", opacity:sending?.7:1, transition:"all .2s", boxShadow:"0 4px 14px rgba(2,175,207,.3)" }}>
        {sending ? <><Loader2 size={14} style={{ animation:"spin .7s linear infinite" }}/>Envoi…</> : <><Send size={14}/>Publier</>}
      </button>
    </div>
  );
}