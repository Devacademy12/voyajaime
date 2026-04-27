"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/app/components/auth/AuthModal";

type Mode = "login" | "register" | "prestataire";

// Composant client qui utilise useSearchParams
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    if (searchParams.get("type") === "prestataire") setMode("prestataire");
  }, [searchParams]);

  const handleClose = () => {
    router.push("/");
  };

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

// Composant principal avec Suspense (Server Component)
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "#F9FAFB"
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "4px solid #E5E7EB",
          borderTopColor: "#2B96A8",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}