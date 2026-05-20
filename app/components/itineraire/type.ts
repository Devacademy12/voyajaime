// ─── Types ────────────────────────────────────────────────────────────
export interface Excursion {
  id: string;
  title: string;
  city: string;
  photos: string[];
  duration_hours: number;
  price_per_person: number;
  meeting_point?: string;
  rating?: number;
}

export interface Reservation {
  id: string;
  booking_code: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  status: string;
  payment_status?: string | null;
  payment_deadline?: string | null;
  excursion_id?: string;
  excursion: Excursion | null;
}

// ─── Constants ────────────────────────────────────────────────────────
export type PayMethod = "flouci" | "cash" | "bank";

import { CreditCard, Wallet, Building2 } from "lucide-react";

export const PAY_METHODS: {
  id: PayMethod;
  label: string;
  sub: string;
  Icon: React.ElementType;
}[] = [
  { id: "flouci", label: "Paiement en ligne",  sub: "Carte bancaire · CIB · Flouci", Icon: CreditCard },
  { id: "cash",   label: "Espèces sur place",  sub: "Paiement à la rencontre",       Icon: Wallet     },
  { id: "bank",   label: "Virement bancaire",  sub: "RIB transmis par email",        Icon: Building2  },
];

export const STEPS = ["Revue", "Infos", "Paiement"];

export const TODAY = new Date().toISOString().split("T")[0];

export const STATUS_CFG: Record<string, {
  label: string; dot: string; text: string; bg: string; border: string;
}> = {
  pending:   { label: "En attente", dot: "#F59E0B", text: "#F59E0B", bg: "rgba(245,158,11,.1)",  border: "rgba(245,158,11,.25)"  },
  confirmed: { label: "Confirmée",  dot: "#0D9488", text: "#0D9488", bg: "rgba(13,148,136,.1)",  border: "rgba(13,148,136,.25)"  },
  completed: { label: "Terminée",   dot: "#3B82F6", text: "#3B82F6", bg: "rgba(59,130,246,.1)",  border: "rgba(59,130,246,.25)"  },
  cancelled: { label: "Annulée",    dot: "#EF4444", text: "#EF4444", bg: "rgba(239,68,68,.1)",   border: "rgba(239,68,68,.25)"   },
};

// ─── Helpers ──────────────────────────────────────────────────────────
export function fmtDate(d: string, short = false) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (short) return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function daysUntil(dateStr: string): number {
  const excDate = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((excDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function fmtCountdown(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}