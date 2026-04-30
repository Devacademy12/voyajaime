// app/admin/dashboard/AdminCharts.tsx
"use client";

import { useState, useEffect } from "react";
import { TrendingUp, MapPin, Coins, Users, BarChart3 } from "lucide-react";

type Props = {
  reservationsParJour: { date: string; total: number; assiste: number }[];
  topVilles:           { city: string; count: number }[];
  revenusParMois:      { month: string; commission: number }[];
  statsVisiteurs:      { total: number; bounce: number; moy_session: string; nouveaux: number };
};

// ─── Line chart SVG ──────────────────────────────────────────────────────────
function LineChart({
  data,
  keys,
  colors,
  height = 120,
}: {
  data:   Record<string, number | string>[];
  keys:   string[];
  colors: string[];
  height?: number;
}) {
  const W      = 520;
  const H      = height;
  const PAD    = { top: 10, right: 10, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(
    ...data.flatMap(d => keys.map(k => Number(d[k]) || 0)),
    1,
  );

  const xStep = innerW / Math.max(data.length - 1, 1);

  const pointsFor = (key: string) =>
    data
      .map((d, i) => {
        const x = PAD.left + i * xStep;
        const y = PAD.top + innerH - ((Number(d[key]) || 0) / maxVal) * innerH;
        return `${x},${y}`;
      })
      .join(" ");

  const rawTicks = [0, 0.25, 0.5, 0.75, 1].map((r, idx) => ({
    val: Math.round(r * maxVal),
    y:   PAD.top + innerH - r * innerH,
    idx,
  }));
  const seen   = new Set<number>();
  const yTicks = rawTicks.filter(t => {
    if (seen.has(t.val)) return false;
    seen.add(t.val);
    return true;
  });

  const xLabels = data
    .map((d, i) => ({ label: String(d.label ?? ""), i }))
    .filter((_, i) => i === 0 || i === data.length - 1 || i % 7 === 0);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {yTicks.map(t => (
        <g key={`ytick-${t.idx}`}>
          <line
            x1={PAD.left} y1={t.y}
            x2={W - PAD.right} y2={t.y}
            stroke="#F3F4F6" strokeWidth={1}
          />
          <text
            x={PAD.left - 6} y={t.y}
            textAnchor="end" dominantBaseline="central"
            fontSize={9} fill="#D1D5DB"
          >
            {t.val}
          </text>
        </g>
      ))}

      {xLabels.map(({ label, i }) => (
        <text
          key={`xlabel-${i}`}
          x={PAD.left + i * xStep}
          y={H - 4}
          textAnchor="middle"
          fontSize={9}
          fill="#9CA3AF"
        >
          {label}
        </text>
      ))}

      {keys.map((key, ki) => (
        <polyline
          key={`line-${key}`}
          points={pointsFor(key)}
          fill="none"
          stroke={colors[ki]}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={ki === 1 ? "5 3" : undefined}
        />
      ))}

      {keys.map((key, ki) =>
        data.map((d, i) => {
          const x = PAD.left + i * xStep;
          const y = PAD.top + innerH - ((Number(d[key]) || 0) / maxVal) * innerH;
          return (
            <circle
              key={`dot-${key}-${i}`}
              cx={x} cy={y} r={3}
              fill={colors[ki]}
              stroke="white"
              strokeWidth={1.5}
            />
          );
        })
      )}
    </svg>
  );
}

// ─── Barres horizontales ─────────────────────────────────────────────────────
function HBarChart({
  data,
  color,
}: {
  data:  { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d, i) => (
        <div key={`hbar-${i}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontSize: 12, color: "#6B7280",
            width: 120, flexShrink: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {d.label}
          </span>
          <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, height: 10, overflow: "hidden" }}>
            <div style={{
              width: `${(d.value / max) * 100}%`,
              height: "100%",
              background: color,
              borderRadius: 4,
              transition: "width .6s ease",
            }} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 700, color: "#053366",
            width: 32, textAlign: "right", flexShrink: 0,
          }}>
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Composant GA4 (optionnel - à placer dans le layout principal) ──────────
// À AJOUTER DANS VOTRE layout.tsx ou root layout, PAS ICI
// Ce composant est juste pour référence
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  useEffect(() => {
    if (!measurementId) return;
    
    // Ajouter le script GA4
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialiser dataLayer et gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', measurementId);

    // Nettoyer au démontage
    return () => {
      const gaScript = document.querySelector(`script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`);
      if (gaScript) gaScript.remove();
    };
  }, [measurementId]);

  return null;
}

// Déclaration TypeScript pour window
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// ─── Hook personnalisé pour envoyer des événements GA4 ──────────────────────
export function useGAPageView(pageTitle: string, pagePath?: string) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
        page_title: pageTitle,
        page_path: pagePath || window.location.pathname,
      });
    }
  }, [pageTitle, pagePath]);
}

// ─── Fonction utilitaire pour envoyer des événements personnalisés ──────────
export function sendGAEvent(eventName: string, eventParams?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function AdminCharts({
  reservationsParJour,
  topVilles,
  revenusParMois,
  statsVisiteurs,
}: Props) {
  const [period, setPeriod] = useState<"7" | "30">("30");
  
  // Envoyer un événement GA quand l'admin charge le dashboard
  useEffect(() => {
    sendGAEvent('admin_dashboard_view', {
      page: 'dashboard_admin',
      timestamp: new Date().toISOString(),
    });
  }, []);

  const filtered = period === "7"
    ? reservationsParJour.slice(-7)
    : reservationsParJour;

  const lineData = filtered.map(r => ({
    label:   r.date.slice(5),
    total:   r.total,
    assiste: r.assiste,
  }));

  const totalResa    = reservationsParJour.reduce((s, r) => s + r.total,   0);
  const totalAssiste = reservationsParJour.reduce((s, r) => s + r.assiste, 0);
  const maxCommDay   = Math.max(...revenusParMois.map(r => r.commission), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Visiteurs ── */}
      <div style={{
        background: "white", borderRadius: 20,
        border: "1px solid #EEF2FF", padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(5,51,102,.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(2,175,207,.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={14} color="#02AFCF" />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", margin: 0 }}>
            Visiteurs — page d&apos;accueil
          </h2>
          <button 
            onClick={() => sendGAEvent('refresh_visitor_stats')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
            title="Rafraîchir les stats"
          >
            <BarChart3 size={14} color="#9CA3AF" />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { label: "Visites totales",     value: statsVisiteurs.total.toLocaleString("fr-FR"),    color: "#02AFCF" },
            { label: "Nouveaux visiteurs",  value: statsVisiteurs.nouveaux.toLocaleString("fr-FR"), color: "#22C55E" },
            { label: "Taux de rebond",      value: `${statsVisiteurs.bounce}%`,                     color: "#F59E0B" },
            { label: "Durée moy. session",  value: statsVisiteurs.moy_session,                      color: "#8B5CF6" },
          ].map((s, i) => (
            <div 
              key={`visit-${i}`} 
              style={{ background: "#F8FAFF", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}
              onClick={() => sendGAEvent('visitor_card_click', { metric: s.label })}
            >
              <p style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px", margin: "0 0 4px" }}>
                {s.label}
              </p>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0, lineHeight: 1 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        
        {/* Petite note sur la source des données */}
        <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 12, textAlign: "right" }}>
          📊 Données issues de Google Analytics (dernières 24h)
        </p>
      </div>

      {/* ── Évolution réservations ── */}
      <div style={{
        background: "white", borderRadius: 20,
        border: "1px solid #EEF2FF", padding: "20px 24px",
        boxShadow: "0 2px 12px rgba(5,51,102,.06)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 16,
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(37,159,252,.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingUp size={14} color="#259FFC" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", margin: 0 }}>
              Évolution des réservations
            </h2>
          </div>

          <div style={{
            display: "flex", background: "#F3F4F6",
            borderRadius: 10, padding: 3, gap: 2,
          }}>
            {(["7", "30"] as const).map(p => (
              <button
                key={`period-${p}`}
                onClick={() => {
                  setPeriod(p);
                  sendGAEvent('change_reservation_period', { period: p });
                }}
                style={{
                  padding: "5px 14px", borderRadius: 8,
                  border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700,
                  background: period === p ? "white"       : "transparent",
                  color:      period === p ? "#053366"     : "#9CA3AF",
                  boxShadow:  period === p ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  transition: "all .15s",
                }}
              >
                {p === "7" ? "7 jours" : "30 jours"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { color: "#259FFC", label: `Réservations totales (${totalResa})`,  dash: false },
            { color: "#02AFCF", label: `Mode assisté (${totalAssiste})`,        dash: true  },
          ].map((l, i) => (
            <span 
              key={`legend-${i}`} 
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7280", cursor: "pointer" }}
              onClick={() => sendGAEvent('legend_click', { legend: l.label })}
            >
              <svg width="20" height="10" viewBox="0 0 20 10">
                <line
                  x1="0" y1="5" x2="20" y2="5"
                  stroke={l.color} strokeWidth="2"
                  strokeDasharray={l.dash ? "5 3" : undefined}
                  strokeLinecap="round"
                />
              </svg>
              {l.label}
            </span>
          ))}
        </div>

        <LineChart
          data={lineData}
          keys={["total", "assiste"]}
          colors={["#259FFC", "#02AFCF"]}
          height={130}
        />
      </div>

      {/* ── Top villes + Commission ── */}
      <div className="d-charts-mid" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>

        {/* Top 5 villes */}
        <div style={{
          flex: 1,
          background: "white", borderRadius: 20,
          border: "1px solid #EEF2FF", padding: "20px 24px",
          boxShadow: "0 2px 12px rgba(5,51,102,.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(217,119,6,.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MapPin size={14} color="#D97706" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", margin: 0 }}>
              Top 5 villes
            </h2>
          </div>
          <HBarChart
            data={topVilles.map(v => ({ label: v.city, value: v.count }))}
            color="#F59E0B"
          />
        </div>

        {/* Commission mensuelle */}
        <div style={{
          flex: 1,
          background: "white", borderRadius: 20,
          border: "1px solid #EEF2FF", padding: "20px 24px",
          boxShadow: "0 2px 12px rgba(5,51,102,.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(2,175,207,.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Coins size={14} color="#02AFCF" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#053366", margin: 0 }}>
              Commission mensuelle
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
            {revenusParMois.map((m, i) => {
              const h = Math.max((m.commission / maxCommDay) * 100, 4);
              return (
                <div
                  key={`comm-${i}`}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                >
                  <span style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 600 }}>
                    {m.commission > 0 ? m.commission : ""}
                  </span>
                  <div style={{
                    width: "100%", height: h,
                    background: "#02AFCF",
                    borderRadius: "3px 3px 0 0",
                    opacity: 0.85,
                  }} />
                  <span style={{ fontSize: 9, color: "#9CA3AF" }}>{m.month}</span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
              Total commissions :{" "}
              <strong style={{ color: "#02AFCF" }}>
                {revenusParMois.reduce((s, m) => s + m.commission, 0).toLocaleString("fr-FR")} TND
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}