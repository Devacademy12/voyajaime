"use client";

import { useState } from "react";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Heart,
  PiggyBank,
  X,
} from "lucide-react";

/* ─── HelpPanel ──────────────────────────────────────────── */

type HelpTab = "guide" | "conseils" | "faq";

export function HelpPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<HelpTab>("guide");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    {
      title: "Naviguez entre les jours",
      desc: 'Cliquez sur les onglets « Jour 1 », « Jour 2 »… en haut pour passer d\'une journée à l\'autre. Chaque jour correspond à une ville.',
    },
    {
      title: "Choisissez une date (optionnel)",
      desc: 'Cliquez sur « Choisir une date » dans le planificateur pour filtrer les excursions disponibles ce jour-là.',
    },
    {
      title: "Ajoutez des excursions",
      desc: 'Parcourez le catalogue à gauche. Cliquez sur « Réserver » puis choisissez le créneau (Matin / Après-midi / Soir) et l\'heure.',
    },
    {
      title: "Personnalisez votre plan",
      desc: 'Ajoutez une note personnelle 📝 à chaque activité ou supprimez-la si vous changez d\'avis.',
    },
    {
      title: "Consultez le résumé",
      desc: 'Cliquez sur « Voir le résumé » en haut à droite pour la vue complète et sauvegarder votre itinéraire.',
    },
  ];

  const tips = [
    {
      type: "info" as const,
      icon: <CalendarCheck size={15} />,
      text: 'Une excursion avec le badge « Dates spécifiques » n\'est disponible qu\'à certaines dates. Choisissez d\'abord la date du jour pour voir ce qui est disponible.',
    },
    {
      type: "success" as const,
      icon: <CheckCircle2 size={15} />,
      text: 'Les excursions « Toujours disponible » peuvent être réservées n\'importe quel jour, sans contrainte de date.',
    },
    {
      type: "warning" as const,
      icon: <AlertCircle size={15} />,
      text: 'Si vous changez la ville d\'un jour, toutes les activités de ce jour seront effacées.',
    },
    {
      type: "info" as const,
      icon: <Clock size={15} />,
      text: 'L\'outil détecte les conflits d\'horaires automatiquement. Si deux activités se chevauchent, un message vous alertera.',
    },
    {
      type: "success" as const,
      icon: <PiggyBank size={15} />,
      text: 'Le budget total s\'affiche en temps réel dans la barre du haut. Le prix indiqué est par personne.',
    },
    {
      type: "info" as const,
      icon: <Heart size={15} />,
      text: 'Utilisez le bouton cœur pour mettre une excursion en favori sans l\'ajouter tout de suite à votre planning.',
    },
  ];

  const faqs = [
    {
      q: "Puis-je ajouter plusieurs excursions par jour ?",
      a: "Oui, vous pouvez en ajouter autant que vous le souhaitez dans les trois créneaux (Matin, Après-midi, Soir). L'outil vérifie que les horaires ne se chevauchent pas.",
    },
    {
      q: "Comment changer la ville d'un jour ?",
      a: "Dans le planificateur, utilisez le menu déroulant à côté de la date. Attention : changer de ville effacera les activités déjà ajoutées pour ce jour.",
    },
    {
      q: "Mes données sont-elles sauvegardées automatiquement ?",
      a: "Non, vous devez cliquer sur « Sauvegarder » depuis la page Résumé. Vous devez être connecté à votre compte.",
    },
    {
      q: "Que signifie « Indisponible ce jour » ?",
      a: "L'excursion n'est pas proposée à la date choisie. Cliquez dessus pour voir les prochaines dates disponibles.",
    },
    {
      q: "Puis-je modifier l'heure de départ d'une activité ?",
      a: "Oui. Lors de l'ajout, après avoir choisi le créneau, un champ de saisie d'heure apparaît pour ajuster précisément l'horaire.",
    },
    {
      q: "À quoi servent les notes personnelles ?",
      a: "Les notes apparaissent dans le résumé. Utilisez-les pour noter un point de rendez-vous, une recommandation, ou un rappel personnel.",
    },
  ];

  const tipColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    info:    { bg: "#E6F1FB", border: "#B5D4F4", text: "#0C447C", icon: "#185FA5" },
    success: { bg: "#EAF3DE", border: "#C0DD97", text: "#27500A", icon: "#3B6D11" },
    warning: { bg: "#FAEEDA", border: "#FAC775", text: "#633806", icon: "#854F0B" },
  };

  return (
    /* ── Overlay ── */
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
        display: "flex", justifyContent: "flex-end", zIndex: 200,
      }}
      onClick={onClose}
    >
      {/* ── Panel ── */}
      <div
        style={{
          width: 380, height: "100%", background: "#fff",
          borderLeft: ".5px solid #E5E7EB",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: ".5px solid #F3F4F6", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <HelpCircle size={18} color="#0F6E56" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>Guide du créateur</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Comment construire votre itinéraire</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, border: ".5px solid #E5E7EB", borderRadius: 6, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", padding: ".75rem 1.25rem .5rem", gap: 6, borderBottom: ".5px solid #F3F4F6" }}>
          {(["guide", "conseils", "faq"] as HelpTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                border: tab === t ? ".5px solid #9FE1CB" : ".5px solid transparent",
                background: tab === t ? "#E1F5EE" : "transparent",
                color: tab === t ? "#0F6E56" : "#6B7280",
                fontFamily: "inherit",
              }}
            >
              {t === "guide" ? "Étapes" : t === "conseils" ? "Conseils" : "FAQ"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem" }}>

          {/* ── TAB : Étapes ── */}
          {tab === "guide" && (
            <>
              {steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 12, marginBottom: ".75rem",
                    padding: ".875rem 1rem", border: ".5px solid #F3F4F6",
                    borderRadius: 12, background: "#fff",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", background: "#E1F5EE",
                    color: "#0F6E56", fontSize: 12, fontWeight: 500, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginBottom: 3 }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: "1.25rem", padding: ".875rem 1rem", background: "#F9FAFB", borderRadius: 10, border: ".5px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".5rem" }}>Raccourcis rapides</div>
                {[
                  { label: "Jour suivant", keys: ["→"] },
                  { label: "Jour précédent", keys: ["←"] },
                  { label: "Voir le résumé", keys: ["Résumé ↗"] },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".375rem 0", borderBottom: i < 2 ? ".5px solid #F3F4F6" : "none" }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{r.label}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {r.keys.map(k => (
                        <span key={k} style={{ background: "#F3F4F6", border: ".5px solid #E5E7EB", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace", color: "#374151" }}>{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TAB : Conseils ── */}
          {tab === "conseils" && tips.map((tip, i) => {
            const c = tipColors[tip.type];
            return (
              <div
                key={i}
                style={{ padding: ".75rem 1rem", borderRadius: 8, marginBottom: ".625rem", display: "flex", gap: 10, alignItems: "flex-start", background: c.bg, border: `.5px solid ${c.border}` }}
              >
                <span style={{ color: c.icon, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
                <p style={{ fontSize: 12, color: c.text, lineHeight: 1.55, margin: 0 }}>{tip.text}</p>
              </div>
            );
          })}

          {/* ── TAB : FAQ ── */}
          {tab === "faq" && faqs.map((faq, i) => (
            <div key={i} style={{ border: ".5px solid #F3F4F6", borderRadius: 8, marginBottom: ".5rem", overflow: "hidden" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: "100%", padding: ".75rem 1rem", fontSize: 13, fontWeight: 500, color: "#111827",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: openFaq === i ? "#F9FAFB" : "#fff", border: "none", cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left",
                }}
              >
                {faq.q}
                <ChevronRight size={14} color="#9CA3AF" style={{ transform: openFaq === i ? "rotate(90deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
              </button>
              {openFaq === i && (
                <div style={{ padding: ".125rem 1rem .875rem", fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}