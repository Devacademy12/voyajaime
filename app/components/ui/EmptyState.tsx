// components/ui/EmptyState.tsx
"use client";
import React from "react";

export default function EmptyState({
  icon, title, subtitle, action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{
      textAlign: "center", padding: "72px 24px",
      background: "white", borderRadius: 20,
      border: "1px solid #E5E7EB",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>{subtitle}</p>}
      {action}
    </div>
  );
}
