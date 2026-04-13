"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/app/components/auth/AuthModal";

type Mode = "login" | "register" | "prestataire";

export default function AuthPage() {
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

      {/* Page d\'accueil en arrière-plan via iframe */}
      <iframe
        src="/"
        className="auth-bg-frame"
        tabIndex={-1}
        aria-hidden="true"
        scrolling="no"
      />

      {/* Modal toujours ouvert, fermeture → retour accueil */}
      <AuthModal
        isOpen={true}
        onClose={handleClose}
        defaultMode={mode}
      />
    </>
  );
}