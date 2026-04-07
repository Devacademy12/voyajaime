// ─────────────────────────────────────────────
//  components/ui/StatCard.tsx
// ─────────────────────────────────────────────
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  suffix?: string;
  icon: ReactNode;
  color: string;
  bg: string;
  border: string;
  delay?: number;
}

export default function StatCard({ label, value, suffix, icon, color, bg, border, delay = 0 }: Props) {
  return (
    <div
      className="stat-card"
      style={{ borderColor: border, animationDelay: `${delay}s`, borderTop: `2px solid ${color}` }}
    >
      <div
        className="stat-card-icon"
        style={{ background: bg, borderColor: border, color }}
      >
        {icon}
      </div>
      <div>
        <p className="stat-card-label">
          {label}
        </p>
        <p className="stat-card-value">
          {value}
          {suffix && <span className="stat-card-suffix">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}