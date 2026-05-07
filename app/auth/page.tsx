"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import AuthModal from "@/app/components/auth/AuthModal";

type Mode = "login" | "register" | "prestataire";

function AuthContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("type") === "prestataire") setMode("prestataire");
  }, [searchParams]);

  // ── Après connexion réussie : rediriger vers la bonne page ──
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const uid = session.user.id;

          // Récupérer le rôle
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", uid)
            .single();

          const role = profile?.role;

          // Vérifier s'il y a un redirect demandé par le middleware
          const redirectParam = searchParams.get("redirect");

          // Si le middleware a passé un redirect ET que c'est cohérent avec le rôle
          if (redirectParam && redirectParam !== "/auth") {
            const isRoleOk =
              (role === "touriste"     && redirectParam.startsWith("/touriste")) ||
              (role === "prestataire"  && redirectParam.startsWith("/prestataire")) ||
              (role === "admin"        && redirectParam.startsWith("/admin")) ||
              (!redirectParam.startsWith("/touriste") && !redirectParam.startsWith("/prestataire") && !redirectParam.startsWith("/admin"));

            if (isRoleOk) {
              router.push(redirectParam);
              return;
            }
          }

          // Sinon, redirect vers le bon dashboard selon le rôle
          if (role === "admin")       router.push("/admin/dashboard");
          else if (role === "prestataire") router.push("/prestataire/dashboard");
          else                        router.push("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router, searchParams]);

  const handleClose = () => router.push("/");

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; }
        .auth-bg-frame {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: none;
          filter: brightness(0.6);
          transform: scale(1.02);
        }
      `}</style>

      <iframe
        src="/"
        className="auth-bg-frame"
        tabIndex={-1}
        aria-hidden="true"
        scrolling="no"
      />

      <AuthModal
        isOpen={true}
        onClose={handleClose}
        defaultMode={mode}
      />
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", background:"#F9FAFB" }}>
        <div style={{ width:40, height:40, border:"4px solid #E5E7EB", borderTopColor:"#2B96A8", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}