"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, Clock, Percent, Wallet,
  CalendarDays, Users, Download,
} from "lucide-react";

import StatCard    from "../../components/ui/StatCard";
import { StatusBadge } from "../../components/ui";
import SearchBar   from "../../components/ui/SearchBar";
import EmptyState  from "../../components/ui/EmptyState";
import { Toast } from "../../components/ui";
import { useToast } from "../../../lib/useToast";
import {
  Paiement, PaiementStatus, PAIEMENT_STATUS,
  fmtDate, groupByMonth, exportCSV,
} from "../../../lib/paiement";

interface Excursion { id: string; title: string; city: string; }
interface Props {
  paiements:    Paiement[];
  reservations: Record<string, unknown>[];
  excursions:   Excursion[];
  touristes:    { user_id: string; full_name: string | null }[];
}

export default function PrestatairePaiementsClient({ paiements, reservations, excursions, touristes }: Props) {
  const { toast, showToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaiementStatus>("all");

  const resaMap = useMemo(() => Object.fromEntries(reservations.map(r => [String(r.id), r])), [reservations]);
  const excMap  = useMemo(() => Object.fromEntries(excursions.map(e => [e.id, e])),            [excursions]);
  const tourMap = useMemo(() => Object.fromEntries(touristes.map(t => [t.user_id, t.full_name || "Anonyme"])), [touristes]);

  const totalPaid    = useMemo(() => paiements.filter(p => p.status === "paid")   .reduce((s, p) => s + Number(p.net_amount),   0), [paiements]);
  const totalPending = useMemo(() => paiements.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.net_amount),   0), [paiements]);
  const totalFees    = useMemo(() => paiements.reduce((s, p) => s + Number(p.platform_fee), 0), [paiements]);
  const nbPaid       = useMemo(() => paiements.filter(p => p.status === "paid").length, [paiements]);

  const filtered = useMemo(() => {
    return paiements.filter(p => {
      const resa = resaMap[p.reservation_id] || {};
      const exc  = excMap[String(resa.excursion_id)] || {} as Excursion;
      const tour = tourMap[String(resa.touriste_id)] || "";
      const q    = search.toLowerCase();
      const matchSearch =
        (exc.title || "").toLowerCase().includes(q) ||
        (exc.city  || "").toLowerCase().includes(q) ||
        tour.toLowerCase().includes(q)              ||
        String(resa.booking_code || "").toLowerCase().includes(q);
      return matchSearch && (statusFilter === "all" || p.status === statusFilter);
    });
  }, [paiements, search, statusFilter, resaMap, excMap, tourMap]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  function handleExport() {
    const rows = filtered.map(p => {
      const resa = resaMap[p.reservation_id] || {};
      const exc  = excMap[String(resa.excursion_id)] || {} as Excursion;
      const tour = tourMap[String(resa.touriste_id)] || "Anonyme";
      return {
        Date:           fmtDate(p.created_at),
        Excursion:      exc.title || "—",
        Ville:          exc.city  || "—",
        Touriste:       tour,
        Code:           String(resa.booking_code || "—"),
        "Montant TND":  Number(p.amount),
        "Commission TND": Number(p.platform_fee),
        "Net TND":      Number(p.net_amount),
        Statut:         PAIEMENT_STATUS[p.status as PaiementStatus]?.label ?? p.status,
      };
    });
    exportCSV(rows, `mes_paiements_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`${rows.length} paiement(s) exporté(s)`);
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tin    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .pp-card { animation: fadeUp .35s ease both; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,51,102,.1) !important; }
        .pp-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 24px; }
        .pp-row   { display: flex; justify-content: space-between; align-items: center; padding: 15px 18px; background: white; border-radius: 12px; border: 1px solid #EEF2FF; margin-bottom: 8px; transition: all .15s; }
        .pp-row:hover { background: #F8FAFF; border-color: #DCE5FF; }
        .pp-ftab  { padding: 7px 14px; border-radius: 20px; border: 1.5px solid #DCE5FF; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; white-space: nowrap; background: white; color: #053366; }
        .pp-ftab.on { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 3px 10px rgba(2,175,207,.3); }
        .pp-btn   { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; border: 1.5px solid transparent; background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; box-shadow: 0 3px 10px rgba(2,175,207,.3); }
        .pp-btn:hover { box-shadow: 0 5px 18px rgba(2,175,207,.45); transform: translateY(-1px); }
        .pp-row-inner { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 12px; }
        @media(max-width:900px) { .pp-stats { grid-template-columns: repeat(2,1fr); gap: 10px; } }
        @media(max-width:600px) { .pp-stats { grid-template-columns: 1fr; } .pp-row-inner { flex-direction: column; align-items: flex-start; } .pp-row-right { align-self: flex-end; } }
      `}</style>

      <Toast toast={toast} />

      {/* Header */}
      <div className="pp-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#02AFCF,#053366)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(2,175,207,.35)" }}>
              <Wallet size={22} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#053366", margin: 0 }}>Mes paiements</h1>
              <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>
                {paiements.length} transaction{paiements.length > 1 ? "s" : ""} · {nbPaid} versé{nbPaid > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button className="pp-btn" onClick={handleExport}>
            <Download size={14} /> Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="pp-stats pp-card" style={{ animationDelay: ".07s" }}>
        <StatCard label="Total encaissé"       value={`${totalPaid} TND`}    icon={<TrendingUp size={20}/>} color="#02AFCF" bg="rgba(2,175,207,.1)"   border="rgba(2,175,207,.2)"   delay={0.07} />
        <StatCard label="En attente versement" value={`${totalPending} TND`} icon={<Clock size={20}/>}      color="#A16207" bg="rgba(217,119,6,.1)"   border="rgba(217,119,6,.2)"   delay={0.12} />
        <StatCard label="Commission prélevée"  value={`${totalFees} TND`}    icon={<Percent size={20}/>}   color="#6B7280" bg="rgba(107,114,128,.08)" border="rgba(107,114,128,.15)" delay={0.17} />
      </div>

      {paiements.length === 0 ? (
        <EmptyState
          icon={<Wallet size={32} color="#02AFCF" strokeWidth={1.5} />}
          title="Aucun paiement pour l'instant"
          subtitle="Vos revenus apparaîtront ici après vos premières réservations confirmées"
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="pp-card" style={{ background: "white", borderRadius: 16, border: "1px solid #EEF2FF", padding: "14px 16px", marginBottom: 20, animationDelay: ".18s" }}>
            <div style={{ marginBottom: 12 }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Excursion, touriste, code réservation..." />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["all", "paid", "pending", "refunded"] as const).map(s => (
                <button key={s} className={`pp-ftab ${statusFilter === s ? "on" : ""}`} onClick={() => setStatusFilter(s)}>
                  {s === "all"
                    ? `Tous (${paiements.length})`
                    : `${PAIEMENT_STATUS[s].label} (${paiements.filter(p => p.status === s).length})`
                  }
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Wallet size={24} color="#9CA3AF" strokeWidth={1.5} />}
              title="Aucun résultat"
              subtitle="Essayez d'autres filtres"
              action={
                <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
                  style={{ padding: "8px 18px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "inherit" }}>
                  Réinitialiser
                </button>
              }
            />
          ) : (
            Object.entries(grouped).map(([month, items]) => {
              const monthNet = items.reduce((s, p) => s + Number(p.net_amount), 0);
              return (
                <div key={month} style={{ marginBottom: 28 }}>
                  {/* En-tête mois */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(#02AFCF,#259FFC)" }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#053366", textTransform: "capitalize" }}>{month}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{items.length} transaction{items.length > 1 ? "s" : ""}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#02AFCF" }}>{monthNet} TND net</span>
                  </div>

                  {/* Lignes */}
                  {items.map((p, i) => {
                    const resa = resaMap[p.reservation_id] || {};
                    const exc  = excMap[String(resa.excursion_id)] || {} as Excursion;
                    const tour = tourMap[String(resa.touriste_id)] || "Anonyme";
                    const cfg  = PAIEMENT_STATUS[p.status as PaiementStatus] ?? PAIEMENT_STATUS.pending;

                    return (
                      <div key={p.id} className="pp-card pp-row" style={{ animationDelay: `${i * .04}s`, borderLeft: `3px solid ${cfg.dot}` }}>
                        <div className="pp-row-inner">
                          {/* Gauche */}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: "#053366", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {exc.title || "Excursion"}
                              </span>
                              {exc.city && (
                                <span style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600, padding: "2px 8px", background: "rgba(2,175,207,.08)", borderRadius: 20 }}>
                                  {exc.city}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#02AFCF", fontWeight: 700, background: "rgba(2,175,207,.08)", padding: "2px 8px", borderRadius: 8 }}>
                                #{String(resa.booking_code || "—")}
                              </span>
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <CalendarDays size={11} color="#9CA3AF" /> {String(resa.date || "—")}
                              </span>
                              <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                                <Users size={11} color="#9CA3AF" /> {tour}
                              </span>
                            </div>
                            {/* Barre commission */}
                            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#EEF2FF", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${(Number(p.net_amount) / Number(p.amount)) * 100}%`, background: "linear-gradient(90deg,#02AFCF,#259FFC)", borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                                Comm. {Number(p.platform_fee)} TND ({Math.round((Number(p.platform_fee) / Number(p.amount)) * 100)}%)
                              </span>
                            </div>
                          </div>

                          {/* Droite */}
                          <div className="pp-row-right" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: 18, fontWeight: 900, color: "#053366", margin: 0 }}>
                                {Number(p.net_amount)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span>
                              </p>
                              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>sur {Number(p.amount)} TND total</p>
                              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{fmtDate(p.created_at)}</p>
                            </div>
                            <StatusBadge status={p.status} config={PAIEMENT_STATUS} size="sm" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}