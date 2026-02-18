"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Star, Search, Flag, ThumbsUp } from "lucide-react";

const TEAL = "#0BBEC9";
const TEAL_LIGHT = "#E0F7F8";
const TEAL_DARK = "#062830";

const avis = [
  { id: 1, auteur: "Sophie Martin", excursion: "Tour Carthage", note: 5, commentaire: "Expérience absolument incroyable ! Notre guide Karim était passionné et très professionnel. Je recommande vivement cette visite à quiconque vient à Tunis.", status: "pending", date: "15 Fév 2025", avatar: "SM", likes: 12 },
  { id: 2, auteur: "Thomas Durand", excursion: "Randonnée Ain Draham", note: 4, commentaire: "Belle randonnée avec des paysages magnifiques. Quelques parties du chemin un peu difficiles mais l'encadrement était excellent.", status: "approved", date: "14 Fév 2025", avatar: "TD", likes: 8 },
  { id: 3, auteur: "Ibrahim Khalil", excursion: "Plongée Tabarka", note: 2, commentaire: "Déçu de cette excursion. Le matériel était en mauvais état et le guide n'était pas disponible pour les questions. À améliorer.", status: "pending", date: "13 Fév 2025", avatar: "IK", likes: 3 },
  { id: 4, auteur: "Marie Leblanc", excursion: "Kitesurf Djerba", note: 5, commentaire: "Cours de kitesurf extraordinaire ! Mehdi est un excellent professeur, très patient. Je suis reparti avec de bonnes bases solides.", status: "approved", date: "12 Fév 2025", avatar: "ML", likes: 21 },
  { id: 5, auteur: "Hamza Rezgui", excursion: "Médina Sfax", note: 1, commentaire: "Contenu inapproprié et signalement effectué par plusieurs utilisateurs. Ce commentaire ne respecte pas les règles de la plateforme.", status: "pending", date: "11 Fév 2025", avatar: "HR", likes: 0, flagged: true },
  { id: 6, auteur: "Clara Petit", excursion: "Atelier poterie Nabeul", note: 4, commentaire: "Super atelier de poterie ! L'enseignante était très pédagogue et j'ai adoré créer mon propre objet artisanal tunisien.", status: "rejected", date: "10 Fév 2025", avatar: "CP", likes: 5 },
];

function StarRow({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} fill={i <= note ? "#F59E0B" : "none"} style={{ color: i <= note ? "#F59E0B" : "#E2E8F0" }} />
      ))}
    </div>
  );
}

export default function AvisPage() {
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const filterMap: Record<string, string> = { "Tous": "all", "En attente": "pending", "Validés": "approved", "Rejetés": "rejected" };

  const filtered = avis.filter((a) => {
    const matchF = filterMap[filter] === "all" || a.status === filterMap[filter];
    const matchS = a.auteur.toLowerCase().includes(search.toLowerCase()) || a.excursion.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  const statusBadge = (s: string, flagged?: boolean) => {
    if (flagged) return { bg: "#EDE9FE", color: "#7C3AED", label: "Signalé" };
    if (s === "pending") return { bg: "#FEF3C7", color: "#D97706", label: "En attente" };
    if (s === "approved") return { bg: "#D1FAE5", color: "#059669", label: "Validé" };
    return { bg: "#FEE2E2", color: "#DC2626", label: "Rejeté" };
  };

  const counts = {
    pending: avis.filter((a) => a.status === "pending").length,
    flagged: avis.filter((a) => a.flagged).length,
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEAL_DARK, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Modérer les Avis
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
          {counts.pending} en attente · {counts.flagged} signalés
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: TEAL_LIGHT }}>
          {["Tous", "En attente", "Validés", "Rejetés"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: filter === f ? TEAL : "transparent", color: filter === f ? "white" : TEAL }}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-white"
          style={{ border: "1px solid rgba(11,190,201,0.2)" }}>
          <Search size={14} style={{ color: TEAL }} />
          <input placeholder="Rechercher..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => {
          const badge = statusBadge(a.status, a.flagged);
          return (
            <div key={a.id} className="bg-white rounded-2xl p-5 transition-all hover:shadow-md"
              style={{
                border: a.flagged ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(11,190,201,0.1)",
                boxShadow: a.flagged ? "0 0 0 3px rgba(124,58,237,0.05)" : undefined,
              }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${TEAL}, #089AA8)` }}>
                  {a.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: TEAL_DARK }}>{a.auteur}</span>
                    <span className="text-xs" style={{ color: "#94a3b8" }}>sur</span>
                    <span className="text-xs font-medium" style={{ color: TEAL }}>{a.excursion}</span>
                    {a.flagged && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                        <Flag size={9} /> Signalé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <StarRow note={a.note} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#4B5563" }}>{a.commentaire}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#94a3b8" }}>
                        <ThumbsUp size={11} /> {a.likes} likes
                      </span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{a.date}</span>
                    </div>
                    {a.status === "pending" && (
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: "#D1FAE5", color: "#059669" }}>
                          <CheckCircle size={12} /> Valider
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
                          style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          <XCircle size={12} /> Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}