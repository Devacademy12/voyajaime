// components/ui/StatCard.tsx
"use client";
import React from "react";
import { fmtAmount } from "../../../lib/paiement";

interface Props {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  delay?: number;
}

export default function StatCard({ label, value, suffix = "", icon, color, bg, border, delay = 0 }: Props) {
  return (
    <div style={{
      background: "white",
      borderRadius: 18,
      border: `1.5px solid ${border}`,
      padding: "20px 22px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      flex: 1,
      minWidth: 0,
      animation: `fadeUp .4s ease both`,
      animationDelay: `${delay}s`,
      boxShadow: "0 2px 12px rgba(0,0,0,.04)",
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: 14,
        background: bg,
        border: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        color,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: .8, marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontWeight: 900, color: "#111827", lineHeight: 1 }}>
          {fmtAmount(value)}
          {suffix && <span style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", marginLeft: 4 }}>{suffix}</span>}
        </p>
      </div>
    </div>
  );
}
