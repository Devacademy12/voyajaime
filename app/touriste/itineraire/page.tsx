"use client";

import { useState } from "react";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];
const INTERESTS = ["Archéologie","Nature","Gastronomie","Culture","Aventure","Relaxation","Vie nocturne"];

type Mode = "choose" | "assiste" | "libre" | "result";

function toggle(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

export default function ItinerairePage() {
  const [mode, setMode] = useState<Mode>("choose");
  const [days, setDays] = useState(3);
  const [cities, setCities] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const chipStyle = (selected: boolean, color = "#2B96A8") => ({
    padding: "6px 14px",
    borderRadius: "20px",
    border: `1.5px solid ${selected ? color : "#E5E7EB"}`,
    background: selected ? `${color}12` : "white",
    color: selected ? color : "#374151",
    fontSize: "13px",
    fontWeight: selected ? 600 : 400,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  } as React.CSSProperties);

  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
        Planifier mon voyage
      </h1>
      <p style={{ color: "#6B7280", marginBottom: "28px" }}>
        Choisissez comment vous souhaitez organiser votre séjour
      </p>

      {/* CHOOSE MODE */}
      {mode === "choose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", maxWidth: "560px" }}>
          {[
            { m: "assiste" as const, icon: "🤖", title: "Mode Assisté", desc: "Répondez à 3 questions, on s'occupe du reste", color: "#2B96A8" },
            { m: "libre" as const, icon: "✏️", title: "Mode Libre", desc: "Construisez votre itinéraire vous-même", color: "#7C3AED" },
          ].map((opt) => (
            <button
              key={opt.m}
              onClick={() => setMode(opt.m)}
              style={{ padding: "28px 20px", background: "white", borderRadius: "16px", border: `2px solid ${opt.color}20`, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${opt.color}60`; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${opt.color}20`; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>{opt.icon}</div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>{opt.title}</h3>
              <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.5 }}>{opt.desc}</p>
              <div style={{ marginTop: "16px", fontSize: "13px", fontWeight: 600, color: opt.color }}>
                Choisir →
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ASSISTE */}
      {mode === "assiste" && (
        <div style={{ maxWidth: "520px" }}>
          <button onClick={() => setMode("choose")} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", marginBottom: "20px", fontFamily: "inherit", fontSize: "14px" }}>
            ← Retour
          </button>
          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "24px" }}>
              Parlez-nous de votre voyage ✈️
            </h2>

            {/* Durée */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>
                Durée du séjour : <span style={{ color: "#2B96A8" }}>{days} jour{days > 1 ? "s" : ""}</span>
              </label>
              <input type="range" min={1} max={14} value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#2B96A8", cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
                <span>1 jour</span><span>14 jours</span>
              </div>
            </div>

            {/* Villes */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>
                Villes à visiter
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {CITIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCities(toggle(cities, c))} style={chipStyle(cities.includes(c))}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Intérêts */}
            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>
                Vos centres d&apos;intérêt
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {INTERESTS.map((i) => (
                  <button key={i} type="button" onClick={() => setInterests(toggle(interests, i))} style={chipStyle(interests.includes(i), "#7C3AED")}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setMode("result")}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={cities.length === 0}
            >
              ✨ Générer mon itinéraire
            </button>
            {cities.length === 0 && (
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "8px", textAlign: "center" }}>
                Sélectionnez au moins une ville
              </p>
            )}
          </div>
        </div>
      )}

      {/* LIBRE */}
      {mode === "libre" && (
        <div style={{ maxWidth: "520px" }}>
          <button onClick={() => setMode("choose")} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", marginBottom: "20px", fontFamily: "inherit", fontSize: "14px" }}>
            ← Retour
          </button>
          <div className="card">
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", marginBottom: "24px" }}>
              Construisez votre voyage ✏️
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>
                Durée : <span style={{ color: "#7C3AED" }}>{days} jour{days > 1 ? "s" : ""}</span>
              </label>
              <input type="range" min={1} max={14} value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#7C3AED", cursor: "pointer" }} />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "10px" }}>
                Villes
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {CITIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCities(toggle(cities, c))} style={chipStyle(cities.includes(c), "#7C3AED")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar preview */}
            {cities.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "12px" }}>
                  Votre calendrier ({days} jours)
                </p>
                {Array.from({ length: days }, (_, i) => (
                  <div key={i} style={{ padding: "12px 14px", border: "1.5px dashed #E5E7EB", borderRadius: "10px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                      Jour {i + 1} — {cities[i % cities.length]}
                    </span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Vide — à remplir</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setMode("result")}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", background: "#7C3AED" }}
              disabled={cities.length === 0}
            >
              Créer mon itinéraire vide →
            </button>
          </div>
        </div>
      )}

      {/* RESULT */}
      {mode === "result" && (
        <div style={{ maxWidth: "600px" }}>
          <button onClick={() => setMode("assiste")} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", marginBottom: "20px", fontFamily: "inherit", fontSize: "14px" }}>
            ← Modifier
          </button>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>
                  🎉 Votre itinéraire sur {days} jours
                </h2>
                <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                  {cities.join(", ")} {interests.length > 0 && `· ${interests.slice(0, 3).join(", ")}`}
                </p>
              </div>
              <span className="badge badge-green">Prêt !</span>
            </div>

            {Array.from({ length: days }, (_, i) => (
              <div key={i} style={{ marginBottom: "12px", padding: "16px", background: "#F9FAFB", borderRadius: "12px", borderLeft: "4px solid #2B96A8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#2B96A8" }}>
                    Jour {i + 1} — {cities[i % cities.length]}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#9CA3AF" }}>3 activités suggérées</span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["🌅 Matin", "🌞 Après-midi", "🌙 Soir"].map((t) => (
                    <span key={t} style={{ padding: "4px 10px", background: "white", borderRadius: "8px", fontSize: "12px", color: "#374151", border: "1px solid #E5E7EB" }}>
                      {t} · Excursion à réserver
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginTop: "8px", padding: "14px", background: "rgba(43,150,168,0.06)", borderRadius: "10px", fontSize: "13px", color: "#6B7280" }}>
              💡 <strong>Astuce :</strong> Allez dans &quot;Mes favoris&quot; pour ajouter des excursions à cet itinéraire.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
