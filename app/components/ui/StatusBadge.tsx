// ─────────────────────────────────────────────
//  components/ui/StatusBadge.tsx
// ─────────────────────────────────────────────
import { StatusConfig, RESERVATION_STATUS, PAYMENT_STATUS, PRESTATAIRE_STATUS, AVIS_STATUS } from "@/lib/statusConfig";

interface Props {
  status: string;
  config?: Record<string, StatusConfig>;
  type?: "reservation" | "payment" | "prestataire" | "avis";
  size?: "sm" | "md";
  showIcon?: boolean;
}

export default function StatusBadge({ status, config, type, size = "md", showIcon = false }: Props) {
  // Resolve config based on type if config is not provided
  let resolvedConfig: Record<string, StatusConfig> | undefined;
  if (config) {
    resolvedConfig = config;
  } else if (type === "reservation") {
    resolvedConfig = RESERVATION_STATUS as Record<string, StatusConfig>;
  } else if (type === "payment") {
    resolvedConfig = PAYMENT_STATUS as Record<string, StatusConfig>;
  } else if (type === "prestataire") {
    resolvedConfig = PRESTATAIRE_STATUS as Record<string, StatusConfig>;
  } else if (type === "avis") {
    resolvedConfig = AVIS_STATUS as Record<string, StatusConfig>;
  }

  const cfg = (resolvedConfig?.[status]) ?? {
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