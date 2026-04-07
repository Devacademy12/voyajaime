// ─────────────────────────────────────────────
//  components/ui/StatusBadge.tsx
// ─────────────────────────────────────────────
import { StatusConfig } from "../../../lib/statusConfig";

interface Props {
  status: string;
  config: Record<string, StatusConfig>;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export default function StatusBadge({ status, config, size = "md", showIcon = false }: Props) {
  const cfg = config[status] ?? {
    label: status,
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    dot: "#6B7280",
  };

  return (
    <span
      className={`status-badge ${size === "md" ? "md" : ""}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span
        className="status-badge-dot"
        style={{
          background: cfg.dot,
        }}
      />
      {showIcon && cfg.icon && <cfg.icon size={size === "sm" ? 9 : 10} />}
      {cfg.label}
    </span>
  );
}