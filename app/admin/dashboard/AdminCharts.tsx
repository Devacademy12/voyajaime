"use client";

import { useState, useEffect } from "react";
import { TrendingUp, MapPin, Coins } from "lucide-react";

type Props = {
  reservationsParJour: { date: string; total: number; assiste: number }[];
  topVilles:           { city: string; count: number }[];
  revenusParMois:      { month: string; commission: number }[];
};

// ─── GA helper ───────────────────────────────────────────────────────────────
declare global {
  interface Window { dataLayer: any[]; gtag: (...args: any[]) => void; }
}
export function sendGAEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) window.gtag("event", eventName, params);
}

// ─── Mini Line Chart ─────────────────────────────────────────────────────────
function LineChart({
  data, keys, colors, height = 90,
}: {
  data: Record<string, number | string>[];
  keys: string[];
  colors: string[];
  height?: number;
}) {
  const W = 480;
  const H = height;
  const PAD = { top: 8, right: 8, bottom: 22, left: 30 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => Number(d[k]) || 0)), 1);
  const xStep  = iW / Math.max(data.length - 1, 1);

  const pts = (key: string) =>
    data.map((d, i) =>
      `${PAD.left + i * xStep},${PAD.top + iH - ((Number(d[key]) || 0) / maxVal) * iH}`
    ).join(" ");

  const yTicks = [0, 0.5, 1].map(r => ({
    val: Math.round(r * maxVal),
    y: PAD.top + iH - r * iH,
  }));

  const xLabels = data
    .map((d, i) => ({ label: String(d.label ?? ""), i }))
    .filter((_, i, arr) =>
      i === 0 || i === arr.length - 1 || i % Math.ceil(arr.length / 5) === 0
    );

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {yTicks.map((t, idx) => (
        <g key={idx}>
          <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y}
            stroke="#F3F4F6" strokeWidth={1} />
          <text x={PAD.left - 5} y={t.y} textAnchor="end" dominantBaseline="central"
            fontSize={8} fill="#D1D5DB">{t.val}</text>
        </g>
      ))}
      {xLabels.map(({ label, i }) => (
        <text key={i} x={PAD.left + i * xStep} y={H - 3}
          textAnchor="middle" fontSize={8} fill="#9CA3AF">{label}</text>
      ))}
      {keys.map((key, ki) => (
        <polyline key={ki} points={pts(key)} fill="none" stroke={colors[ki]}
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={ki === 1 ? "5 3" : undefined} />
      ))}
      {keys.map((key, ki) =>
        data.map((d, i) => {
          const x = PAD.left + i * xStep;
          const y = PAD.top + iH - ((Number(d[key]) || 0) / maxVal) * iH;
          return (
            <circle key={`${ki}-${i}`} cx={x} cy={y} r={2.5}
              fill={colors[ki]} stroke="white" strokeWidth={1.5} />
          );
        })
      )}
    </svg>
  );
}

// ─── Barres horizontales ──────────────────────────────────────────────────────
function HBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 11, color: "#6B7280", width: 90, flexShrink: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {d.label}
          </span>
          <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${(d.value / max) * 100}%`, height: "100%",
              background: color, borderRadius: 4, transition: "width .6s ease",
            }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#053366", width: 26, textAlign: "right", flexShrink: 0 }}>
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AdminCharts({ reservationsParJour, topVilles, revenusParMois }: Props) {
  const [period, setPeriod] = useState<"7" | "30">("30");

  useEffect(() => {
    sendGAEvent("admin_dashboard_view", {
      page: "dashboard_admin",
      timestamp: new Date().toISOString(),
    });
  }, []);

  const filtered  = period === "7" ? reservationsParJour.slice(-7) : reservationsParJour;
  const lineData  = filtered.map(r => ({ label: r.date.slice(5), total: r.total, assiste: r.assiste }));
  const totalResa = reservationsParJour.reduce((s, r) => s + r.total, 0);
  // ✅ Fix — label mis à jour : "assistée" = liée à un itinéraire
  const totalAss  = reservationsParJour.reduce((s, r) => s + r.assiste, 0);
  const maxComm   = Math.max(...revenusParMois.map(r => r.commission), 1);
  const totalComm = revenusParMois.reduce((s, m) => s + m.commission, 0);

  const cardBase: React.CSSProperties = {
    background: "white", borderRadius: 16,
    border: "1px solid #EEF2FF", padding: "16px 18px",
    boxShadow: "0 2px 10px rgba(5,51,102,.05)",
  };

  const iconBox = (bg: string): React.CSSProperties => ({
    width: 26, height: 26, borderRadius: 7, background: bg,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });

  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 800, color: "#053366", margin: 0,
  };

  return (
    <>
      <style>{`
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 14px;
        }
        .chart-resa   { grid-column: 1 / 3; }
        .chart-villes { grid-column: 3 / 4; grid-row: 1 / 3; }
        .chart-comm   { grid-column: 1 / 3; }

        @media(max-width:900px) {
          .charts-grid  { grid-template-columns: 1fr 1fr; }
          .chart-resa   { grid-column: 1 / 3; }
          .chart-villes { grid-column: 1 / 2; grid-row: auto; }
          .chart-comm   { grid-column: 2 / 3; grid-row: auto; }
        }
        @media(max-width:600px) {
          .charts-grid { grid-template-columns: 1fr; }
          .chart-resa, .chart-villes, .chart-comm { grid-column: 1; grid-row: auto; }
        }

        .period-btn {
          padding: 4px 12px; border-radius: 7px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; transition: all .15s;
          font-family: inherit;
        }
      `}</style>

      <div className="charts-grid">

        {/* ── Évolution réservations ─────────────────────────────────────── */}
        <div style={cardBase} className="chart-resa">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={iconBox("rgba(37,159,252,.1)")}><TrendingUp size={13} color="#259FFC" /></div>
              <h2 style={sectionTitle}>Évolution des réservations</h2>
            </div>
            <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 8, padding: 2, gap: 2 }}>
              {(["7", "30"] as const).map(p => (
                <button
                  key={p}
                  className="period-btn"
                  onClick={() => { setPeriod(p); sendGAEvent("change_period", { period: p }); }}
                  style={{
                    background: period === p ? "white" : "transparent",
                    color: period === p ? "#053366" : "#9CA3AF",
                    boxShadow: period === p ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  }}
                >
                  {p === "7" ? "7 j" : "30 j"}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Fix — légende "Via itinéraire" reflète itineraire_id IS NOT NULL */}
          <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
            {[
              { color: "#259FFC", label: `Total (${totalResa})`,          dash: false },
              { color: "#02AFCF", label: `Via itinéraire (${totalAss})`,  dash: true  },
            ].map((l, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6B7280" }}>
                <svg width="16" height="8" viewBox="0 0 16 8">
                  <line x1="0" y1="4" x2="16" y2="4" stroke={l.color} strokeWidth="2"
                    strokeDasharray={l.dash ? "4 2" : undefined} strokeLinecap="round" />
                </svg>
                {l.label}
              </span>
            ))}
          </div>

          <LineChart data={lineData} keys={["total", "assiste"]} colors={["#259FFC", "#02AFCF"]} height={90} />
        </div>

        {/* ── Top 5 villes ──────────────────────────────────────────────── */}
        <div style={cardBase} className="chart-villes">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <div style={iconBox("rgba(217,119,6,.1)")}><MapPin size={13} color="#D97706" /></div>
            <h2 style={sectionTitle}>Top 5 villes</h2>
          </div>
          <HBarChart
            data={topVilles.map(v => ({ label: v.city, value: v.count }))}
            color="#F59E0B"
          />
        </div>

        {/* ── Commission mensuelle ───────────────────────────────────────── */}
        <div style={cardBase} className="chart-comm">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={iconBox("rgba(2,175,207,.1)")}><Coins size={13} color="#02AFCF" /></div>
              <h2 style={sectionTitle}>Commission mensuelle</h2>
            </div>
            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
              Total :{" "}
              <strong style={{ color: "#02AFCF" }}>
                {totalComm.toLocaleString("fr-FR")} TND
              </strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
            {revenusParMois.map((m, i) => {
              const h = Math.max((m.commission / maxComm) * 80, 4);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  {m.commission > 0 && (
                    <span style={{ fontSize: 8, color: "#9CA3AF", fontWeight: 600 }}>
                      {m.commission}
                    </span>
                  )}
                  <div style={{
                    width: "100%", height: h,
                    background: "linear-gradient(180deg,#02AFCF,#259FFC)",
                    borderRadius: "3px 3px 0 0", opacity: 0.85,
                    marginTop: "auto",
                  }} />
                  <span style={{ fontSize: 8, color: "#9CA3AF" }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}