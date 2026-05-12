"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { ArrowRight, LogOut } from "lucide-react";

interface Props {
  userId: string;
  profilComplete?: boolean;
}

function Step({ done, label, last }: { done: boolean; label: string; last?: boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom: last ? 0 : 12 }}>
      <div style={{
        width:22, height:22, borderRadius:"50%", flexShrink:0,
        background: done ? "#059669" : "#F3F4F6",
        border: `2px solid ${done ? "#059669" : "#D1D5DB"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {done && <span style={{ color:"white", fontSize:12, fontWeight:800 }}>✓</span>}
      </div>
      <span style={{ fontSize:13, fontWeight: done ? 600 : 400, color: done ? "#111827" : "#9CA3AF" }}>
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
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F9FAFB", padding:"20px" }}>
      <div style={{ maxWidth:"460px", width:"100%", textAlign:"center", padding:"48px 40px", background:"white", borderRadius:"20px", border:"1px solid #E5E7EB", boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>

        {/* Icône */}
        <div style={{ width:68, height:68, background:"#FFFBEB", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32, border:"1px solid #FDE68A" }}>
          ⏳
        </div>

        <h2 style={{ fontSize:22, fontWeight:800, color:"#111827", marginBottom:10 }}>
          Validation en cours
        </h2>

        {!profilComplete ? (
          <>
            <p style={{ color:"#6B7280", lineHeight:1.7, marginBottom:24, fontSize:14 }}>
              Pour accélérer la validation de votre compte, commencez par compléter les détails de votre agence.
            </p>
            <button
              onClick={() => router.push('/completer-profil')}
              style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"14px 28px", background:"#2B96A8", color:"white", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:12 }}
            >
              Compléter mon profil agence <ArrowRight size={15} />
            </button>
          </>
        ) : (
          <p style={{ color:"#6B7280", lineHeight:1.7, marginBottom:24, fontSize:14 }}>
            Votre dossier est en cours de vérification. Vous recevrez un email sous <strong>24 à 48 heures</strong>.
          </p>
        )}

        {/* Étapes */}
        <div style={{ background:"#F8FAFC", border:"1px solid #E5E7EB", borderRadius:12, padding:"16px 20px", marginBottom:24, textAlign:"left" }}>
          <Step done label="Compte créé" />
          <Step done={profilComplete} label="Profil agence complété" />
          <Step done={false} label="Validation par l'équipe VoyaJaime" />
          <Step done={false} last label="Accès à votre espace prestataire" />
        </div>

        <button
          onClick={logout}
          style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 20px", background:"transparent", color:"#9CA3AF", border:"1px solid #E5E7EB", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
        >
          <LogOut size={13} /> Se déconnecter
        </button>
      </div>
    </div>
  );
}