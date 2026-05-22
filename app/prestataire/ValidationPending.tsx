"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ArrowRight, LogOut, Clock, CheckCircle2 } from "lucide-react";

interface Props {
  userId: string;
  profilComplete?: boolean;
}

function Step({ done, label, active, last }: { done: boolean; label: string; active?: boolean; last?: boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, paddingBottom: last ? 0 : 16 }}>
      <div style={{
        width:24, height:24, borderRadius:"50%", flexShrink:0,
        background: done ? "#059669" : (active ? "#fff" : "#F1F5F9"),
        border: `2px solid ${done ? "#059669" : (active ? "#2B96A8" : "#E2E8F0")}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: active ? "0 0 0 4px rgba(43,150,168,0.1)" : "none"
      }}>
        {done && <CheckCircle2 size={14} color="white" />}
        {!done && <div style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#2B96A8" : "#CBD5E1" }} />}
      </div>
      <span style={{ fontSize:13, fontWeight: (done || active) ? 700 : 500, color: (done || active) ? "#053366" : "#94A3B8" }}>
        {label}
      </span>
    </div>
  );
}

export default function ValidationPending({ userId, profilComplete = false }: Props) {
  const router  = useRouter();
  const supabase = createClient();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F5F7FA", padding:"20px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth:"480px", width:"100%", textAlign:"center", padding:"56px 48px", background:"white", borderRadius:"30px", border:"1.5px solid #E2E8F0", boxShadow:"0 10px 40px rgba(5,51,102,0.05)" }}>

        {/* Animation pulse pour l'icône */}
        <div style={{ 
          width:80, height:80, background:"#EFF9FB", borderRadius:"24px", 
          display:"flex", alignItems:"center", justifyContent:"center", 
          margin:"0 auto 28px", border:"1.5px solid rgba(43,150,168,0.2)",
          boxShadow: "0 8px 20px rgba(43,150,168,0.1)"
        }}>
          <Clock size={36} color="#2B96A8" />
        </div>

        <h2 style={{ fontSize:26, fontWeight:800, color:"#053366", marginBottom:12, letterSpacing: "-.02em" }}>
          Validation en cours
        </h2>

        {!profilComplete ? (
          <>
            <p style={{ color:"#64748B", lineHeight:1.7, marginBottom:28, fontSize:15, fontWeight: 500 }}>
              Pour accélérer la validation de votre compte, commencez par compléter les détails de votre agence.
            </p>
            <button
              onClick={() => router.push('/completer-profil')}
              style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"16px 28px", background:"#2B96A8", color:"white", border:"none", borderRadius:16, fontSize:15, fontWeight:700, cursor:"pointer", transition: "all .2s", boxShadow: "0 4px 12px rgba(43,150,168,0.2)" }}
            >
              Compléter mon profil agence <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <p style={{ color:"#64748B", lineHeight:1.7, marginBottom:28, fontSize:15, fontWeight: 500 }}>
            Votre dossier est en cours de vérification. Vous recevrez un email sous <strong>24 à 48 heures</strong>.
          </p>
        )}

        {/* Étapes */}
        <div style={{ background:"#F8FAFC", border:"1.5px solid #E2E8F0", borderRadius:20, padding:"24px", margin: "32px 0", textAlign:"left" }}>
          <Step done label="Compte créé" />
          <Step done={profilComplete} active={!profilComplete} label="Profil agence complété" />
          <Step done={false} active={profilComplete} label="Vérification par VoyaJaime" />
          <Step done={false} last label="Accès à votre espace partenaire" />
        </div>

        <button
          onClick={logout}
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 24px", background:"transparent", color:"#94A3B8", border:"1.5px solid #E2E8F0", borderRadius:14, fontSize:13, fontWeight:700, cursor:"pointer", transition: "all .15s" }}
        >
          <LogOut size={16} /> Me déconnecter
        </button>
      </div>
    </div>
  );
}