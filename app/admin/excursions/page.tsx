"use client";

import { useState } from "react";
import { CheckCircle, XCircle, MapPin, Clock, Star, Search, Calendar } from "lucide-react";

const TEAL = "#0BBEC9";
const TEAL_LIGHT = "#E0F7F8";
const TEAL_DARK = "#062830";

const excursions = [
  { id: 1, titre: "Tour Carthage au coucher du soleil", prestataire: "Karim Touati", ville: "Tunis", prix: "85 TND", duree: "4h", categorie: "Culture", note: 4.8, status: "pending", date: "14 Fév 2025", image: "🏛️" },
  { id: 2, titre: "Randonnée Ain Draham", prestataire: "Yassine Ben Ali", ville: "Jendouba", prix: "60 TND", duree: "6h", categorie: "Nature", note: 4.9, status: "approved", date: "12 Fév 2025", image: "🌲" },
  { id: 3, titre: "Plongée à Tabarka", prestataire: "Leila Mansouri", ville: "Tabarka", prix: "120 TND", duree: "3h", categorie: "Sport", note: 4.6, status: "pending", date: "11 Fév 2025", image: "🤿" },
  { id: 4, titre: "Balade en Médina de Sfax", prestataire: "Amira Chatti", ville: "Sfax", prix: "45 TND", duree: "2h", categorie: "Culture", note: 4.3, status: "rejected", date: "10 Fév 2025", image: "🕌" },
  { id: 5, titre: "Kitesurf à Djerba", prestataire: "Mehdi Nouri", ville: "Djerba", prix: "150 TND", duree: "5h", categorie: "Sport", note: 4.7, status: "pending", date: "09 Fév 2025", image: "🪁" },
  { id: 6, titre: "Atelier poterie Nabeul", prestataire: "Sana Kchouk", ville: "Nabeul", prix: "55 TND", duree: "3h", categorie: "Artisanat", note: 4.5, status: "approved", date: "08 Fév 2025", image: "🏺" },
];

const filters = ["Toutes", "En attente", "Validées", "Rejetées"];
const filterMap: Record<string, string> = { "Toutes": "all", "En attente": "pending", "Validées": "approved", "Rejetées": "rejected" };

const catColors: Record<string, { bg: string; color: string }> = {
  "Culture": { bg: "#EDE9FE", color: "#7C3AED" },
  "Nature": { bg: "#D1FAE5", color: "#059669" },
  "Sport": { bg: "#DBEAFE", color: "#2563EB" },
  "Artisanat": { bg: "#FEF3C7", color: "#D97706" },
};

export default function ExcursionsPage() {
  const [activeFilter, setActiveFilter] = useState("Toutes");
  const [search, setSearch] = useState("");

  const filtered = excursions.filter((e) => {
    const matchFilter = filterMap[activeFilter] === "all" || e.status === filterMap[activeFilter];
    const matchSearch = e.titre.toLowerCase().includes(search.toLowerCase()) || e.ville.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusBadge = (s: string) => {
    if (s === "pending") return { bg: "#FEF3C7", color: "#D97706", label: "En attente" };
    if (s === "approved") return { bg: "#D1FAE5", color: "#059669", label: "Validée" };
    return { bg: "#FEE2E2", color: "#DC2626", label: "Rejetée" };
  };

  const counts = {
    pending: excursions.filter((e) => e.status === "pending").length,
    approved: excursions.filter((e) => e.status === "approved").length,
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEAL_DARK, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Modérer les Excursions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {counts.pending} excursions en attente · {counts.approved} validées
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: TEAL_LIGHT }}>
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: activeFilter === f ? TEAL : "transparent", color: activeFilter === f ? "white" : TEAL }}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-white"
          style={{ border: "1px solid rgba(11,190,201,0.2)" }}>
          <Search size={14} style={{ color: TEAL }} />
          <input placeholder="Rechercher une excursion..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((exc) => {
          const badge = statusBadge(exc.status);
          const cat = catColors[exc.categorie] || { bg: TEAL_LIGHT, color: TEAL };
          return (
            <div key={exc.id} className="bg-white rounded-2xl overflow-hidden transition-all hover:shadow-lg"
              style={{ border: "1px solid rgba(11,190,201,0.1)" }}>
              {/* Card header */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: TEAL_LIGHT }}>
                    {exc.image}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                </div>
                <h3 className="font-bold text-sm leading-tight" style={{ color: TEAL_DARK }}>{exc.titre}</h3>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>par {exc.prestataire}</p>
              </div>

              {/* Info pills */}
              <div className="px-4 flex flex-wrap gap-2 mb-3">
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full"
                  style={{ background: "#F1F5F9", color: "#64748b" }}>
                  <MapPin size={9} /> {exc.ville}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full"
                  style={{ background: "#F1F5F9", color: "#64748b" }}>
                  <Clock size={9} /> {exc.duree}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full"
                  style={{ background: "#F1F5F9", color: "#64748b" }}>
                  <Star size={9} /> {exc.note}
                </span>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: cat.bg, color: cat.color }}>{exc.categorie}</span>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(11,190,201,0.08)" }}>
                <div>
                  <p className="text-base font-bold" style={{ color: TEAL }}>{exc.prix}</p>
                  <p className="text-[10px]" style={{ color: "#94a3b8" }}>
                    <Calendar size={8} className="inline mr-1" />{exc.date}
                  </p>
                </div>
                {exc.status === "pending" && (
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: "#D1FAE5", color: "#059669" }}>
                      <CheckCircle size={12} /> Valider
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      <XCircle size={12} /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin size={40} style={{ color: TEAL_LIGHT }} />
          <p className="mt-3 font-medium" style={{ color: "#94a3b8" }}>Aucune excursion trouvée</p>
        </div>
      )}
    </div>
  );
}