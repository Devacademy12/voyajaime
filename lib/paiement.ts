export type PaiementStatus = "pending" | "paid" | "failed" | "refunded";

export interface Paiement {
  id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  status: PaiementStatus;
  created_at: string;
  prestataire_id: string;
  reservation_id: string;
  excursion_id: string;
  touriste_id: string;
}

export const PAIEMENT_STATUS: Record<PaiementStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:  { label: "En attente", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706" },
  paid:     { label: "Payé",       color: "#059669", bg: "#ECFDF5", border: "#6EE7B7", dot: "#059669" },
  failed:   { label: "Échec",      color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", dot: "#DC2626" },
  refunded: { label: "Remboursé",  color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", dot: "#7C3AED" },
};

export function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtMonth(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export function groupByMonth(paiements: Paiement[]): Record<string, Paiement[]> {
  const grouped: Record<string, Paiement[]> = {};
  paiements.forEach(paiement => {
    const monthKey = fmtMonth(paiement.created_at);
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(paiement);
  });
  return grouped;
}

export function exportCSV(data: Record<string, any>[], filename: string = "paiements.csv"): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(header => row[header]).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}