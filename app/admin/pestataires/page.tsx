"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Eye, Search, Filter, User, MapPin, Star, Clock } from "lucide-react";

const TEAL = "#0BBEC9";
const TEAL_LIGHT = "#E0F7F8";
const TEAL_DARK = "#062830";

const prestataires = [
  { id: 1, name: "Karim Touati", email: "k.touati@gmail.com", ville: "Tunis", specialite: "Tours culturels", note: 4.8, excursions: 24, status: "pending", avatar: "KT", joined: "15 Fév 2025" },
  { id: 2, name: "Leila Mansouri", email: "leila.m@yahoo.fr", ville: "Sfax", specialite: "Plongée sous-marine", note: 4.6, excursions: 18, status: "approved", avatar: "LM", joined: "10 Fév 2025" },
  { id: 3, name: "Yassine Ben Ali", email: "yassine.ba@outlook.com", ville: "Sousse", specialite: "Randonnée", note: 4.9, excursions: 31, status: "approved", avatar: "YB", joined: "05 Fév 2025" },
  { id: 4, name: "Amira Chatti", email: "a.chatti@gmail.com", ville: "Hammamet", specialite: "Gastronomie", note: 4.4, excursions: 12, status: "rejected", avatar: "AC", joined: "02 Fév 2025" },
  { id: 5, name: "Mehdi Nouri", email: "m.nouri@gmail.com", ville: "Monastir", specialite: "Kitesurf", note: 4.7, excursions: 8, status: "pending", avatar: "MN", joined: "18 Jan 2025" },
  { id: 6, name: "Sana Kchouk", email: "sana.k@gmail.com", ville: "Djerba", specialite: "Artisanat", note: 4.5, excursions: 19, status: "pending", avatar: "SK", joined: "12 Jan 2025" },
];

const filters = ["Tous", "En attente", "Validés", "Rejetés"];
const filterMap: Record<string, string> = { "Tous": "all", "En attente": "pending", "Validés": "approved", "Rejetés": "rejected" };

export default function PrestatairesPage() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = prestataires.filter((p) => {
    const matchFilter = filterMap[activeFilter] === "all" || p.status === filterMap[activeFilter];
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.ville.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: prestataires.length,
    pending: prestataires.filter((p) => p.status === "pending").length,
    approved: prestataires.filter((p) => p.status === "approved").length,
    rejected: prestataires.filter((p) => p.status === "rejected").length,
  };

  const statusBadge = (s: string) => {
    if (s === "pending") return { bg: "#FEF3C7", color: "#D97706", label: "En attente" };
    if (s === "approved") return { bg: "#D1FAE5", color: "#059669", label: "Validé" };
    return { bg: "#FEE2E2", color: "#DC2626", label: "Rejeté" };
  };

  const selectedP = prestataires.find((p) => p.id === selected);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: TEAL_DARK, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Gérer les Prestataires
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {counts.pending} en attente de validation
          </p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: "Total", value: counts.all, color: TEAL },
            { label: "En attente", value: counts.pending, color: "#D97706" },
            { label: "Validés", value: counts.approved, color: "#059669" },
          ].map((s) => (
            <div key={s.label} className="text-center px-4 py-2 rounded-xl bg-white"
              style={{ border: "1px solid rgba(11,190,201,0.12)" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px]" style={{ color: "#94a3b8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Search */}
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
          <input placeholder="Rechercher un prestataire..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* List */}
        <div className="xl:col-span-2 space-y-3">
          {filtered.map((p) => {
            const badge = statusBadge(p.status);
            const isSelected = selected === p.id;
            return (
              <div key={p.id}
                onClick={() => setSelected(isSelected ? null : p.id)}
                className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md"
                style={{
                  border: isSelected ? `2px solid ${TEAL}` : "1px solid rgba(11,190,201,0.1)",
                  boxShadow: isSelected ? `0 0 0 4px rgba(11,190,201,0.08)` : "0 2px 8px rgba(0,0,0,0.03)",
                }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${TEAL}, #089AA8)` }}>
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: TEAL_DARK }}>{p.name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#94a3b8" }}>
                        <MapPin size={10} /> {p.ville}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#94a3b8" }}>
                        <Star size={10} /> {p.note}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#94a3b8" }}>
                        {p.excursions} excursions
                      </span>
                    </div>
                  </div>
                  {p.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "#D1FAE5", color: "#059669" }}>
                        <CheckCircle size={13} /> Valider
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "#FEE2E2", color: "#DC2626" }}>
                        <XCircle size={13} /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User size={40} style={{ color: TEAL_LIGHT }} />
              <p className="mt-3 font-medium" style={{ color: "#94a3b8" }}>Aucun prestataire trouvé</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl bg-white p-5 h-fit"
          style={{ border: "1px solid rgba(11,190,201,0.1)", boxShadow: "0 2px 12px rgba(11,190,201,0.04)" }}>
          {selectedP ? (
            <div>
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white mb-3"
                  style={{ background: `linear-gradient(135deg, ${TEAL}, #089AA8)` }}>
                  {selectedP.avatar}
                </div>
                <h3 className="font-bold" style={{ color: TEAL_DARK }}>{selectedP.name}</h3>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{selectedP.email}</p>
                <span className="mt-2 text-[10px] font-bold px-3 py-1 rounded-full"
                  style={statusBadge(selectedP.status)}>
                  {statusBadge(selectedP.status).label}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Ville", value: selectedP.ville },
                  { label: "Spécialité", value: selectedP.specialite },
                  { label: "Note", value: `⭐ ${selectedP.note}/5` },
                  { label: "Excursions", value: `${selectedP.excursions} publiées` },
                  { label: "Inscrit le", value: selectedP.joined },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2"
                    style={{ borderBottom: "1px solid rgba(11,190,201,0.08)" }}>
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{row.label}</span>
                    <span className="text-xs font-semibold" style={{ color: TEAL_DARK }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {selectedP.status === "pending" && (
                <div className="flex gap-2 mt-5">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ background: TEAL, color: "white" }}>
                    <CheckCircle size={15} /> Valider
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "#FEE2E2", color: "#DC2626" }}>
                    <XCircle size={15} /> Rejeter
                  </button>
                </div>
              )}
              {selectedP.status === "approved" && (
                <button className="w-full flex items-center justify-center gap-2 mt-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  <XCircle size={15} /> Supprimer le prestataire
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Eye size={32} style={{ color: TEAL_LIGHT }} />
              <p className="mt-3 text-sm font-medium" style={{ color: "#94a3b8" }}>
                Sélectionnez un prestataire pour voir son profil
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}