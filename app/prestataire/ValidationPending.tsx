"use client";

import { useRouter } from "next/navigation";

export default function ValidationPending() {
  const router = useRouter();

  const logout = () => {
    router.push("/auth");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F9FAFB",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          padding: "48px 40px",
          background: "white",
          borderRadius: "20px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ fontSize: "52px", marginBottom: "16px" }}>⏳</p>

        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
            marginBottom: "10px",
          }}
        >
          Validation en cours
        </h2>

        <p
          style={{
            color: "#6B7280",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Votre compte prestataire est en cours de vérification par notre
          équipe.
          <br />
          Vous recevrez un email sous <strong>24 à 48 heures</strong>.
        </p>

        <div
          style={{
            padding: "14px",
            background: "#FEF3C7",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#D97706",
          }}
        >
          support@voyajaime.tn
        </div>

        <button
          onClick={logout}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "none",
            border: "1px solid #E5E7EB",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
