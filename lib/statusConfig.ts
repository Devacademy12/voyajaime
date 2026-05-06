import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

// Base structure for all status configurations
export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  icon?: React.ElementType;
  order?: number;
}

// ═══════════════════════════════════════════════════════════════
// RESERVATION STATUS
// ═══════════════════════════════════════════════════════════════
export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export const RESERVATION_STATUS: Record<ReservationStatus, StatusConfig> = {
  pending:   {
    label: "En attente",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FDE68A",
    dot: "#F59E0B",
    icon: Clock,
    order: 1
  },
  confirmed: {
    label: "Confirmée",
    color: "#065F46",
    bg: "#D1FAE5",
    border: "#6EE7B7",
    dot: "#10B981",
    icon: CheckCircle,
    order: 2
  },
  completed: {
    label: "Terminée",
    color: "#1E40AF",
    bg: "#DBEAFE",
    border: "#93C5FD",
    dot: "#3B82F6",
    icon: CheckCircle,
    order: 3
  },
  cancelled:  {
    label: "Annulée",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FCA5A5",
    dot: "#EF4444",
    icon: XCircle,
    order: 4
  },
};

// ═══════════════════════════════════════════════════════════════
// PAYMENT STATUS
// ═══════════════════════════════════════════════════════════════
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const PAYMENT_STATUS: Record<PaymentStatus, StatusConfig> = {
  pending:  {
    label: "En attente",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#D97706",
    icon: Clock,
    order: 1
  },
  paid:     {
    label: "Payé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#059669",
    icon: CheckCircle,
    order: 2
  },
  failed:   {
    label: "Échec",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FCA5A5",
    dot: "#DC2626",
    icon: XCircle,
    order: 3
  },
  refunded: {
    label: "Remboursé",
    color: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    dot: "#7C3AED",
    icon: AlertTriangle,
    order: 4
  },
};

// ═══════════════════════════════════════════════════════════════
// AVIS MODERATION STATUS
// ═══════════════════════════════════════════════════════════════
export type AvisStatus = "pending" | "approved";

export const AVIS_STATUS: Record<AvisStatus, StatusConfig> = {
  pending:  {
    label: "En attente",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#D97706",
    icon: Clock,
    order: 1
  },
  approved: {
    label: "Approuvé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#059669",
    icon: CheckCircle,
    order: 2
  },
};

// ═══════════════════════════════════════════════════════════════
// PRESTATAIRE VALIDATION STATUS
// ═══════════════════════════════════════════════════════════════
export type PrestataireStatus = "pending" | "validated";

export const PRESTATAIRE_STATUS: Record<PrestataireStatus, StatusConfig> = {
  pending:  {
    label: "En attente",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#D97706",
    icon: Clock,
    order: 1
  },
  validated: {
    label: "Validé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#059669",
    icon: CheckCircle,
    order: 2
  },
};

// ═══════════════════════════════════════════════════════════════
// EXCURSION STATUS
// ═══════════════════════════════════════════════════════════════
export type ExcursionStatus = "active" | "inactive";

export const EXCURSION_STATUS: Record<ExcursionStatus, StatusConfig> = {
  active: {
    label: "Active",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    dot: "#059669",
    icon: CheckCircle,
    order: 1
  },
  inactive: {
    label: "Inactive",
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    dot: "#6B7280",
    icon: XCircle,
    order: 2
  },
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getStatusConfig<T extends Record<string, StatusConfig>>(
  statusMap: T,
  status: keyof T
): StatusConfig {
  return statusMap[status] || {
    label: String(status),
    color: "#6B7280",
    bg: "#F9FAFB",
    border: "#E5E7EB",
    dot: "#6B7280",
  };
}

export function getAllStatuses<T extends Record<string, StatusConfig>>(statusMap: T): (keyof T)[] {
  return Object.keys(statusMap).sort((a, b) => {
    const orderA = statusMap[a].order || 0;
    const orderB = statusMap[b].order || 0;
    return orderA - orderB;
  }) as (keyof T)[];
}