"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp, Coins, ArrowUpRight,
  Building2, CalendarDays, Users,
  Filter, Download, BarChart2,
} from "lucide-react";

import StatCard    from "../../components/ui/StatCard";
import { StatusBadge } from "../../components/ui";
import SearchBar   from "../../components/ui/SearchBar";
import EmptyState  from "../../components/ui/EmptyState";
import { Toast } from "../../components/ui";
import { useToast } from "../../../lib/useToast";
import {
  Paiement, PaiementStatus, PAIEMENT_STATUS,
  fmtDate, fmtMonth, exportCSV,
} from "../../../lib/paiement";

interface Profile   { user_id: string; full_name: string | null; agency_name?: string | null; }
interface Excursion { id: string; title: string; city: string; }
interface Props {
  paiements:    Paiement[];
  prestataires: Profile[];
  reservations: Record<string, unknown>[];
  excursions:   Excursion[];
  touristes:    Profile[];
}

function RevenueChart({ data }: { data: { month: string; amount: number; fees: number }[] }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid #EEF2FF", padding: "20px 24px", marginBottom: 20, boxShadow: "0 2px 12px rgba(5,51,102,.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(2,175,207,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={14} color="#02AFCF" strokeWidth={1.5} />
          </div>
          Revenus par mois
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#9CA3AF" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "linear-gradient(135deg,#02AFCF,#259FFC)", display: "inline-block" }} /> Volume
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#EEF2FF", border: "1px solid #DCE5FF", display: "inline-block" }} /> Commission
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, overflowX: "auto", paddingBottom: 4 }}>
        {data.map(d => (
          <div key={d.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 52, flex: 1 }}>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, justifyContent: "flex-end", height: 100 }}>
              <div style={{ width: "60%", borderRadius: "3px 3px 0 0", height: `${(d.fees / max) * 100}px`, background: "#EEF2FF", border: "1px solid #DCE5FF", minHeight: d.fees > 0 ? 4 : 0 }} />
              <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${(d.amount / max) * 100}px`, background: "linear-gradient(180deg,#02AFCF,#259FFC)", minHeight: d.amount > 0 ? 4 : 0 }} />
            </div>
            <span style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", whiteSpace: "nowrap" }}>{d.month.split(" ")[0].slice(0, 3)}</span>
            <span style={{ fontSize: 10, color: "#053366", fontWeight: 700 }}>{d.amount} TND</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPaiementsClient({ paiements, prestataires, reservations, excursions, touristes }: Props) {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaiementStatus>("all");
  const [sortBy,       setSortBy]       = useState<"date" | "amount">("date");
  const [showChart,    setShowChart]    = useState(false);
  const { toast, showToast } = useToast();

  const prestMap    = useMemo(() => Object.fromEntries(prestataires.map(p => [p.user_id, p])), [prestataires]);
  const resaMap     = useMemo(() => Object.fromEntries(reservations.map(r => [String(r.id), r])), [reservations]);
  const excMap      = useMemo(() => Object.fromEntries(excursions.map(e => [e.id, e])), [excursions]);
  const touristeMap = useMemo(() => Object.fromEntries(touristes.map(t => [t.user_id, t])), [touristes]);

  const totalVolume = useMemo(() => paiements.reduce((s, p) => s + Number(p.amount), 0), [paiements]);
  const totalFees   = useMemo(() => paiements.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.platform_fee), 0), [paiements]);
  const totalNet    = useMemo(() => paiements.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.net_amount), 0), [paiements]);

  const chartData = useMemo(() => {
    const byMonth: Record<string, { amount: number; fees: number }> = {};
    for (const p of paiements) {
      const key = fmtMonth(p.created_at);
      if (!byMonth[key]) byMonth[key] = { amount: 0, fees: 0 };
      byMonth[key].amount += Number(p.amount);
      byMonth[key].fees   += Number(p.platform_fee);
    }
    return Object.entries(byMonth).slice(-6).map(([month, v]) => ({ month, ...v }));
  }, [paiements]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: paiements.length };
    paiements.forEach(p => { c[p.status] = (c[p.status] ?? 0) + 1; });
    return c;
  }, [paiements]);

  const filtered = useMemo(() => {
    return paiements
      .filter(p => {
        const resa  = resaMap[p.reservation_id] || {};
        const exc   = excMap[String(resa.excursion_id)] || {} as Excursion;
        const prest = prestMap[p.prestataire_id] || {};
        const q     = search.toLowerCase();
        const matchSearch =
          (exc.title || "").toLowerCase().includes(q) ||
          (exc.city  || "").toLowerCase().includes(q) ||
          (prest.agency_name || prest.full_name || "").toLowerCase().includes(q) ||
          String(resa.booking_code || "").toLowerCase().includes(q);
        return matchSearch && (statusFilter === "all" || p.status === statusFilter);
      })
      .sort((a, b) => sortBy === "amount"
        ? Number(b.amount) - Number(a.amount)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [paiements, search, statusFilter, sortBy, resaMap, excMap, prestMap]);

  function handleExport() {
    const rows = filtered.map(p => {
      const resa  = resaMap[p.reservation_id] || {};
      const exc   = excMap[String(resa.excursion_id)] || {} as Excursion;
      const prest = prestMap[p.prestataire_id] || {};
      const tour  = touristeMap[String(resa.touriste_id)] || {};
      return {
        Date: fmtDate(p.created_at),
        Excursion: exc.title || "—",
        Ville: exc.city || "—",
        Prestataire: (prest as Profile).agency_name || (prest as Profile).full_name || "—",
        Touriste: (tour as Profile).full_name || "—",
        Code: String(resa.booking_code || "—"),
        "Montant TND": Number(p.amount),
        "Commission TND": Number(p.platform_fee),
        "Net TND": Number(p.net_amount),
        Statut: PAIEMENT_STATUS[p.status as PaiementStatus]?.label ?? p.status,
      };
    });
    exportCSV(rows, `paiements_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`${rows.length} paiement(s) exporté(s)`);
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tin    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .ap-card { animation: fadeUp .35s ease both; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(5,51,102,.1) !important; }
        .ap-kpis  { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 20px; }
        .ap-pills { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 20px; }
        .ap-row   { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: white; border-radius: 14px; border: 1px solid #EEF2FF; transition: all .15s; margin-bottom: 8px; }
        .ap-row:hover { background: #F8FAFF; border-color: #DCE5FF; }
        .ap-ftab  { padding: 7px 16px; border-radius: 20px; border: 1.5px solid #DCE5FF; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; white-space: nowrap; background: white; color: #053366; }
        .ap-ftab.on { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 3px 10px rgba(2,175,207,.3); }
        .ap-select { padding: 9px 14px; border: 1.5px solid #DCE5FF; border-radius: 12px; font-size: 13px; font-family: inherit; outline: none; color: #053366; background: white; cursor: pointer; }
        .ap-btn   { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .2s; border: 1.5px solid #DCE5FF; background: white; color: #053366; }
        .ap-btn:hover { background: #F8FAFF; border-color: #02AFCF; }
        .ap-btn.active { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 3px 10px rgba(2,175,207,.3); }
        .ap-row-meta { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 12px; }
        @media(max-width:900px) { .ap-kpis { grid-template-columns: repeat(2,1fr); } }
        @media(max-width:600px) { .ap-kpis { grid-template-columns: 1fr; } .ap-pills { grid-template-columns: 1fr; } .ap-row-meta { flex-direction: column; align-items: flex-start; } .ap-row-right { align-self: flex-end; } }
      `}</style>

      <Toast toast={toast} />

      {/* Header */}
      <div className="ap-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#02AFCF,#053366)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(2,175,207,.35)" }}>
              <Coins size={22} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#053366", margin: 0 }}>Paiements & Finances</h1>
              <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>{paiements.length} transaction{paiements.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`ap-btn ${showChart ? "active" : ""}`} onClick={() => setShowChart(v => !v)}>
              <BarChart2 size={14} /> Graphique
            </button>
            <button className="ap-btn active" onClick={handleExport}>
              <Download size={14} /> Exporter CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="ap-kpis ap-card" style={{ animationDelay: ".07s" }}>
        <StatCard label="Volume total"           value={totalVolume} suffix="TND" icon={<TrendingUp size={22}/>}  color="#02AFCF" bg="rgba(2,175,207,.1)"  border="rgba(2,175,207,.2)"  delay={0}    />
        <StatCard label="Commission encaissée"   value={totalFees}   suffix="TND" icon={<Coins size={22}/>}       color="#259FFC" bg="rgba(37,159,252,.1)" border="rgba(37,159,252,.2)" delay={0.07} />
        <StatCard label="Versé aux prestataires" value={totalNet}    suffix="TND" icon={<ArrowUpRight size={22}/>} color="#053366" bg="rgba(5,51,102,.08)"  border="rgba(5,51,102,.15)"  delay={0.14} />
      </div>

      {/* Statut pills */}
      <div className="ap-pills ap-card" style={{ animationDelay: ".14s" }}>
        {(["paid", "pending", "refunded"] as PaiementStatus[]).map(key => {
          const cfg   = PAIEMENT_STATUS[key];
          const count = paiements.filter(p => p.status === key).length;
          return (
            <div key={key} style={{ background: "white", border: `1px solid ${cfg.bg}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#053366", margin: 0, lineHeight: 1 }}>{count}</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", margin: "3px 0 0", fontWeight: 500 }}>{cfg.label}</p>
              </div>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            </div>
          );
        })}
      </div>

      {/* Graphique */}
      {showChart && chartData.length > 0 && (
        <div className="ap-card" style={{ animationDelay: ".18s" }}>
          <RevenueChart data={chartData} />
        </div>
      )}

      {/* Toolbar */}
      <div className="ap-card" style={{ background: "white", borderRadius: 16, border: "1px solid #EEF2FF", padding: "14px 16px", marginBottom: 16, animationDelay: ".2s" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Excursion, prestataire, code réservation..." />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["all", "paid", "pending", "refunded"] as const).map(s => (
              <button key={s} className={`ap-ftab ${statusFilter === s ? "on" : ""}`} onClick={() => setStatusFilter(s)}>
                {s === "all" ? `Tous (${counts.all})` : `${PAIEMENT_STATUS[s].label} (${counts[s] ?? 0})`}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={14} color="#9CA3AF" />
            <select className="ap-select" value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "amount")}>
              <option value="date">Plus récents</option>
              <option value="amount">Montant ↓</option>
            </select>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 12, fontWeight: 500 }}>
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Coins size={28} color="#02AFCF" strokeWidth={1.5} />}
          title="Aucun paiement trouvé"
          subtitle="Essayez d'autres filtres"
          action={
            <button onClick={() => { setSearch(""); setStatusFilter("all"); }}
              style={{ padding: "8px 20px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "inherit" }}>
              Réinitialiser
            </button>
          }
        />
      ) : (
        <div>
          {filtered.map((p, i) => {
            const resa  = resaMap[p.reservation_id] || {};
            const exc   = excMap[String(resa.excursion_id)] || {} as Excursion;
            const prest = prestMap[p.prestataire_id] || {};
            const tour  = touristeMap[String(resa.touriste_id)] || {};
            return (
              <div key={p.id} className="ap-card ap-row" style={{ animationDelay: `${i * .04}s` }}>
                <div className="ap-row-meta">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#053366", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exc.title || "—"}</span>
                      {exc.city && <span style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600, padding: "2px 8px", background: "rgba(2,175,207,.08)", borderRadius: 20 }}>{exc.city}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: "#02AFCF", fontWeight: 700 }}>#{String(resa.booking_code || "—")}</span>
                      {((prest as Profile).agency_name || (prest as Profile).full_name) && (
                        <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                          <Building2 size={11} color="#9CA3AF" />{(prest as Profile).agency_name || (prest as Profile).full_name}
                        </span>
                      )}
                      {(tour as Profile).full_name && (
                        <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                          <Users size={11} color="#9CA3AF" />{(tour as Profile).full_name}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarDays size={11} color="#9CA3AF" />{fmtDate(p.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="ap-row-right" style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 17, fontWeight: 900, color: "#053366", margin: 0 }}>
                        {Number(p.amount)} <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>TND</span>
                      </p>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 11, color: "#259FFC", fontWeight: 600 }}>Comm. {Number(p.platform_fee)} TND</span>
                        <span style={{ fontSize: 11, color: "#02AFCF", fontWeight: 600 }}>Net {Number(p.net_amount)} TND</span>
                      </div>
                    </div>
                    <StatusBadge status={p.status} config={PAIEMENT_STATUS} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}