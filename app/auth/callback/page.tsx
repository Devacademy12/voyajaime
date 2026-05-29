// app/auth/callback/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Lire le hash de l'URL (c'est là que Supabase met les infos)
    const hash = window.location.hash;
    const fullUrl = window.location.href;
    
    console.log("🔍 Callback page - Hash:", hash);
    console.log("🔍 Callback page - Full URL:", fullUrl);
    
    // Vérifier si c'est une erreur (lien expiré, etc.)
    if (hash && hash.includes("error_code")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");
      
      // Rediriger vers la page de reset avec l'erreur dans l'URL
      if (errorCode === "otp_expired") {
        router.replace(`/auth/reset-password#error_code=otp_expired&error_description=${encodeURIComponent("Ce lien a expiré. Veuillez refaire une demande.")}`);
        return;
      }
      
      router.replace(`/auth/reset-password#error_code=${errorCode}&error_description=${errorDesc || "Lien invalide"}`);
      return;
    }
    
    // Si c'est un vrai token de récupération valide
    if (hash && hash.includes("access_token")) {
      // Rediriger vers la page de reset avec le token
      router.replace(`/auth/reset-password${hash}`);
      return;
    }
    
    // Fallback : aller à la page de login
    router.replace("/auth");
  }, [router, searchParams]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg,#EFF9FB,#E0F2FE)",
      fontFamily: "system-ui,sans-serif"
    }}>
      <div style={{
        background: "white",
        padding: 40,
        borderRadius: 24,
        boxShadow: "0 8px 32px rgba(0,0,0,.10)",
        textAlign: "center"
      }}>
        <div style={{
          width: 44,
          height: 44,
          border: "3.5px solid #2B96A8",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin .7s linear infinite",
          margin: "0 auto 16px"
        }} />
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
          Redirection en cours...
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <CallbackContent />
    </Suspense>
  );
}