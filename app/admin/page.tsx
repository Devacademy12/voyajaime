"use client";

import { useState } from "react";
import {
  Users,
  MapPin,
  MessageSquare,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Gauge Chart
────────────────────────────────────────────── */
function GaugeChart({ value, label }: { value: number; label: string }) {
  const r = 54;
  const circ = Math.PI * r;
  const progress = (value / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path
          d={`M 16 72 A ${r} ${r} 0 0 1 124 72`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 16 72 A ${r} ${r} 0 0 1 124 72`}
          fill="none"
          stroke="#14B8A6"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circ}`}
        />
        <text
          x="70"
          y="65"
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fill="#0F172A"
        >
          {value}%
        </text>
      </svg>
      <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Bar Chart
────────────────────────────────────────────── */
const monthData = [65, 120, 85, 160, 110, 190, 145, 80, 170, 210, 155, 195];
const months = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function BarChart() {
  const max = Math.max(...monthData);

  return (
    <div className="flex items-end gap-2 h-48 pt-4">
      {monthData.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="w-full flex items-end h-36">
            <div
              className="w-full rounded-md bg-gradient-to-t from-teal-500 to-cyan-400 transition-all duration-300 group-hover:opacity-80"
              style={{ height: `${(v / max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400">{months[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [period, setPeriod] = useState("Mensuel");

  const kpis = [
    {
      icon: Users,
      label: "Prestataires",
      value: "142",
      sub: "+12 ce mois",
      trend: "up",
    },
    {
      icon: MapPin,
      label: "Excursions",
      value: "389",
      sub: "+34 ce mois",
      trend: "up",
    },
    {
      icon: MessageSquare,
      label: "Avis",
      value: "1 247",
      sub: "+89 ce mois",
      trend: "up",
    },
    {
      icon: TrendingUp,
      label: "Taux validation",
      value: "87%",
      sub: "+5% vs mois dernier",
      trend: "up",
    },
  ];

  const recentActivity = [
    {
      name: "Karim Touati",
      action: "Demande de validation",
      time: "Il y a 5 min",
      status: "pending",
    },
    {
      name: "Tour Carthage Sunset",
      action: "Excursion soumise",
      time: "Il y a 18 min",
      status: "pending",
    },
    {
      name: "Sophie M.",
      action: "Avis signalé",
      time: "Il y a 1h",
      status: "flagged",
    },
    {
      name: "Yassine Ben Ali",
      action: "Profil validé",
      time: "Il y a 2h",
      status: "approved",
    },
  ];

  const statusStyle = (s: string) => {
    if (s === "pending")
      return { color: "text-amber-600", icon: Clock };
    if (s === "approved")
      return { color: "text-emerald-600", icon: CheckCircle };
    if (s === "rejected")
      return { color: "text-red-600", icon: XCircle };
    return { color: "text-purple-600", icon: Eye };
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ───────── HEADER ───────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-teal-500">
            Administration
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Tableau de bord
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vue globale de l’activité de la plateforme
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-teal-50 border border-teal-100">
          {["Mensuel", "Trimestriel", "Annuel"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition
                ${
                  period === p
                    ? "bg-teal-500 text-white shadow"
                    : "text-teal-600 hover:bg-teal-100"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ───────── KPI STRIP ───────── */}
      <div className="grid md:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-xl p-4 bg-white border border-slate-200 hover:border-teal-300 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  {k.label}
                </p>
                <Icon size={16} className="text-teal-500" />
              </div>

              <p className="text-2xl font-bold text-slate-900 mt-1">
                {k.value}
              </p>

              <div className="flex items-center gap-1 mt-1 text-xs">
                {k.trend === "up" ? (
                  <ArrowUp size={12} className="text-emerald-500" />
                ) : (
                  <ArrowDown size={12} className="text-red-500" />
                )}
                <span
                  className={
                    k.trend === "up"
                      ? "text-emerald-500"
                      : "text-red-500"
                  }
                >
                  {k.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ───────── ANALYSE ───────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Analyse d’activité
          </h2>
          <p className="text-xs text-slate-500">
            Performance de la plateforme
          </p>
        </div>

        <div className="grid xl:grid-cols-3 gap-6">

          {/* Bar chart */}
          <div className="xl:col-span-2 rounded-2xl p-6 bg-white border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Excursions validées (2025)
            </h3>
            <BarChart />
          </div>

          {/* Gauges */}
          <div className="rounded-2xl p-6 bg-white border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              Taux de validation
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <GaugeChart value={87} label="Prestataires" />
              <GaugeChart value={74} label="Excursions" />
              <GaugeChart value={91} label="Avis" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────── ACTIVITÉ ───────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Modération & activité
            </h2>
            <p className="text-xs text-slate-500">
              Actions nécessitant une intervention
            </p>
          </div>
          <button className="text-xs font-semibold text-teal-600 hover:underline">
            Voir tout
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {recentActivity.map((a, i) => {
            const s = statusStyle(a.status);
            const StatusIcon = s.icon;

            return (
              <div
                key={i}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {a.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.action}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <StatusIcon size={16} className={s.color} />
                  <span className="text-xs text-slate-400">
                    {a.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
