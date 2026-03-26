"use client";
import React, { useState, useEffect, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
// Dans .env.local :
// NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/tunisia-planner
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";

const CITY_EMOJI = {
  tunis:"🏛️", carthage:"🏺", "sidi bou saïd":"🔵", "sidi bou said":"🔵",
  hammamet:"🌊", sousse:"🏰", monastir:"⛪", mahdia:"🐟",
  sfax:"🫒", tozeur:"🌴", douz:"🐪", djerba:"🏝️",
  tataouine:"🏜️", matmata:"🪨", kairouan:"🕌", béja:"🌿", beja:"🌿",
};

const getCityEmoji = (city = "") => CITY_EMOJI[city.toLowerCase()] || "📍";

const LOADING_MSGS = [
  "🔍 Lecture des excursions depuis votre base...",
  "🗺️ Sélection des meilleures activités...",
  "🤖 L'agent IA organise votre itinéraire...",
  "✨ Finalisation jour par jour...",
];

// ─── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────
export default function ModeAssiste() {
  const [step, setStep]                           = useState("accueil");
  const [days, setDays]                           = useState(5);
  const [selectedCities, setSelectedCities]       = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Données réelles depuis Supabase via n8n
  const [availableCities, setAvailableCities]     = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [excursionCount, setExcursionCount]       = useState(0);
  const [excLoading, setExcLoading]               = useState(false);

  // Itinéraire généré
  const [itinerary, setItinerary]                 = useState(null);
  const [genError, setGenError]                   = useState("");
  const [loadingMsg, setLoadingMsg]               = useState("");
  const [activeDay, setActiveDay]                 = useState(0);

  // Modification
  const [editingActivity, setEditingActivity]     = useState(null);
  const [editOptions, setEditOptions]             = useState([]);
  const [editLoading, setEditLoading]             = useState(false);

  // Checkout
  const [bookingConfirmed, setBookingConfirmed]   = useState(false);
  const [totalPrice, setTotalPrice]               = useState(0);

  const msgIdxRef = useRef(0);

  // Calcul prix total
  useEffect(() => {
    if (!itinerary) return;
    const total = itinerary.days.reduce(
      (acc, d) => acc + d.activities.reduce((a, act) => a + (Number(act.price) || 0), 0), 0
    );
    setTotalPrice(total);
  }, [itinerary]);

  // Charger les métadonnées depuis n8n dès le démarrage
  useEffect(() => {
    if (!N8N_WEBHOOK_URL) return;
    fetchMetadata();
  }, []);

  // ── Appel n8n pour récupérer les villes & catégories dispo ──
  const fetchMetadata = async () => {
    setExcLoading(true);
    try {
      // On envoie action:"metadata" pour que n8n retourne villes+catégories
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "metadata" }),
      });
      if (res.ok) {
        const data = await res.json();
        // n8n retourne : { cities: [...], categories: [...], total: 42 }
        const d = Array.isArray(data) ? data[0] : data;
        setAvailableCities(d.cities || []);
        setAvailableCategories(d.categories || []);
        setExcursionCount(d.total || 0);
      }
    } catch {
      // Silencieux — l'utilisateur verra les champs vides
    } finally {
      setExcLoading(false);
    }
  };

  const toggleCity     = (v) => setSelectedCities(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  const toggleInterest = (v) => setSelectedInterests(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  // ── Générer l'itinéraire via n8n ──
  const generateItinerary = async () => {
    if (!selectedCities.length || !selectedInterests.length) return;
    if (!N8N_WEBHOOK_URL) { setGenError("Webhook n8n non configuré."); return; }

    setStep("generation");
    setGenError("");
    msgIdxRef.current = 0;
    setLoadingMsg(LOADING_MSGS[0]);

    const interval = setInterval(() => {
      msgIdxRef.current = Math.min(msgIdxRef.current + 1, LOADING_MSGS.length - 1);
      setLoadingMsg(LOADING_MSGS[msgIdxRef.current]);
    }, 2200);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:    "generate",
          days,
          cities:    selectedCities,
          interests: selectedInterests,
        }),
      });
      clearInterval(interval);

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`n8n erreur ${res.status} : ${txt.slice(0, 200)}`);
      }

      const raw = await res.json();
      // n8n peut retourner un tableau (mode "Return all items") ou un objet direct
      const data = Array.isArray(raw) ? raw[0] : raw;

      if (!data?.days?.length) {
        throw new Error("L'agent n'a retourné aucune journée. Vérifie le workflow n8n.");
      }

      setItinerary(data);
      setActiveDay(0);
      setStep("itineraire");

    } catch (err) {
      clearInterval(interval);
      setGenError(err.message);
      setStep("questions");
    }
  };

  // ── Alternatives pour une activité ──
  const requestAlternatives = async (dayIdx, actIdx) => {
    setEditLoading(true);
    setEditingActivity({ dayIdx, actIdx });
    const act  = itinerary.days[dayIdx].activities[actIdx];
    const city = itinerary.days[dayIdx].city;
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:           "alternatives",
          city,
          current_activity: act,
          interests:        selectedInterests,
        }),
      });
      if (!res.ok) throw new Error();
      const raw  = await res.json();
      const data = Array.isArray(raw) ? raw[0] : raw;
      setEditOptions(data.alternatives || data || []);
    } catch {
      setEditOptions([]);
    } finally {
      setEditLoading(false);
    }
  };

  const applyAlternative = (alt) => {
    const { dayIdx, actIdx } = editingActivity;
    const updated = JSON.parse(JSON.stringify(itinerary));
    updated.days[dayIdx].activities[actIdx] = { ...alt, id: alt.id || `alt_${Date.now()}` };
    setItinerary(updated);
    setEditingActivity(null);
    setEditOptions([]);
  };

  const cancelEdit = () => { setEditingActivity(null); setEditOptions([]); };

  const resetAll = () => {
    setStep("accueil"); setItinerary(null); setSelectedCities([]);
    setSelectedInterests([]); setDays(5); setActiveDay(0);
    setBookingConfirmed(false); setGenError("");
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", backgroundColor:"#faf8f4", fontFamily:"'Georgia',serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;}
        .btn-primary{background:#c8752a;color:white;border:none;padding:14px 32px;border-radius:4px;font-family:'Lato',sans-serif;font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
        .btn-primary:hover{background:#a85f1f;transform:translateY(-1px);}
        .btn-primary:disabled{background:#ccc;transform:none;cursor:not-allowed;}
        .btn-secondary{background:transparent;color:#c8752a;border:1.5px solid #c8752a;padding:12px 28px;border-radius:4px;font-family:'Lato',sans-serif;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
        .btn-secondary:hover{background:#c8752a;color:white;}
        .chip{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border:1.5px solid #e0d5c5;border-radius:30px;background:white;cursor:pointer;font-family:'Lato',sans-serif;font-size:14px;color:#555;transition:all 0.2s;user-select:none;}
        .chip:hover{border-color:#c8752a;color:#c8752a;}
        .chip.on{background:#c8752a;border-color:#c8752a;color:white;}
        .icard{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 12px;border:1.5px solid #e0d5c5;border-radius:8px;background:white;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;color:#666;text-align:center;transition:all 0.2s;user-select:none;}
        .icard:hover{border-color:#c8752a;}
        .icard.on{background:#fff8f0;border-color:#c8752a;color:#c8752a;font-weight:700;}
        .day-tab{padding:8px 18px;border:1px solid #e0d5c5;border-radius:30px;background:white;cursor:pointer;font-family:'Lato',sans-serif;font-size:13px;color:#888;transition:all 0.15s;white-space:nowrap;}
        .day-tab.on{background:#c8752a;color:white;border-color:#c8752a;font-weight:700;}
        .acard{background:white;border:1px solid #ede7d9;border-radius:8px;padding:18px 20px;display:flex;gap:16px;align-items:flex-start;transition:all 0.2s;}
        .acard:hover{box-shadow:0 4px 20px rgba(200,117,42,0.1);border-color:#c8752a;}
        .altcard{background:white;border:1.5px solid #e0d5c5;border-radius:8px;padding:14px 16px;cursor:pointer;transition:all 0.2s;font-family:'Lato',sans-serif;}
        .altcard:hover{border-color:#c8752a;background:#fff8f0;}
        .pbadge{display:inline-block;background:#f0f9f4;color:#2a7a4a;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700;font-family:'Lato',sans-serif;}
        .pulse{animation:pulse 1.5s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .fin{animation:fin 0.5s ease-in;}
        @keyframes fin{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;background:linear-gradient(to right,#c8752a 0%,#c8752a var(--val,30%),#e0d5c5 var(--val,30%),#e0d5c5 100%);outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:white;border:2.5px solid #c8752a;cursor:pointer;box-shadow:0 2px 8px rgba(200,117,42,0.3);}
        .errbox{background:#fff5f5;border:1.5px solid #f5c6c6;border-radius:10px;padding:16px 20px;font-family:'Lato',sans-serif;font-size:14px;color:#b91c1c;line-height:1.6;}
        .warnbox{background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:14px 18px;font-family:'Lato',sans-serif;font-size:13px;color:#92400e;}
        .statdot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px;}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:"white", borderBottom:"1px solid #ede7d9", padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", color:"#2c1a0e", letterSpacing:"1px" }}>
          🇹🇳 <span style={{ color:"#c8752a" }}>Tunisia</span> Travel Planner
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <span style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color: N8N_WEBHOOK_URL ? "#2a7a4a" : "#b91c1c" }}>
            <span className="statdot" style={{ background: N8N_WEBHOOK_URL ? "#2a7a4a" : "#b91c1c" }} />
            {N8N_WEBHOOK_URL ? "Agent IA connecté" : "Agent non configuré"}
          </span>
          {excursionCount > 0 && (
            <span style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#888" }}>
              {excursionCount} excursions en base
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth:"780px", margin:"0 auto", padding:"40px 24px" }}>

        {/* ══ ACCUEIL ══ */}
        {step === "accueil" && (
          <div className="fin" style={{ textAlign:"center", paddingTop:"40px" }}>

            {!N8N_WEBHOOK_URL && (
              <div className="warnbox" style={{ marginBottom:"32px", textAlign:"left" }}>
                <strong>⚙️ Configuration requise</strong><br/>
                Ajoute dans <code>.env.local</code> :<br/>
                <code style={{ display:"block", marginTop:"8px", padding:"10px", background:"#fef3c7", borderRadius:"6px", fontSize:"12px" }}>
                  NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/tunisia-planner
                </code>
              </div>
            )}

            <div style={{ fontSize:"60px", marginBottom:"24px" }}>🏜️</div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"42px", color:"#2c1a0e", marginBottom:"12px", lineHeight:1.2 }}>
              Découvrez la Tunisie
            </h1>
            <p style={{ fontFamily:"'Lato',sans-serif", fontSize:"16px", color:"#888", marginBottom:"32px", lineHeight:1.7 }}>
              Notre agent IA lit vos excursions depuis Supabase<br/>et compose un itinéraire sur mesure, jour par jour.
            </p>

            {/* Statut chargement base */}
            {excLoading && (
              <p className="pulse" style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#c8752a", marginBottom:"24px" }}>
                Connexion à la base de données...
              </p>
            )}

            {!excLoading && excursionCount > 0 && (
              <div style={{ background:"#fff8f0", border:"1px solid #e0d5c5", borderRadius:"10px", padding:"16px 24px", marginBottom:"32px", display:"inline-block" }}>
                <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#c8752a", fontWeight:700, marginBottom:"8px", letterSpacing:"1px", textTransform:"uppercase" }}>
                  Base de données connectée ✓
                </div>
                <div style={{ display:"flex", gap:"24px", justifyContent:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#2c1a0e" }}>{excursionCount}</div>
                    <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa" }}>excursions</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#2c1a0e" }}>{availableCities.length}</div>
                    <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa" }}>villes</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#2c1a0e" }}>{availableCategories.length}</div>
                    <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa" }}>catégories</div>
                  </div>
                </div>
              </div>
            )}

            {!excLoading && N8N_WEBHOOK_URL && excursionCount === 0 && (
              <div className="errbox" style={{ marginBottom:"32px" }}>
                <strong>Base vide ou inaccessible</strong><br/>
                Vérifie que ton workflow n8n gère bien <code>action: "metadata"</code> et que ta table <code>excursions</code> contient des données.
              </div>
            )}

            <button className="btn-primary" onClick={() => setStep("questions")}
              style={{ fontSize:"16px", padding:"18px 48px" }}
              disabled={!N8N_WEBHOOK_URL}>
              ✨ Générer mon itinéraire
            </button>
          </div>
        )}

        {/* ══ QUESTIONS ══ */}
        {step === "questions" && (
          <div className="fin">

            {genError && (
              <div className="errbox" style={{ marginBottom:"24px" }}>
                <strong>Erreur de l'agent IA :</strong><br/>{genError}<br/>
                <span style={{ fontSize:"12px", color:"#999" }}>Vérifie que ton workflow n8n est actif et retourne bien un JSON valide.</span>
              </div>
            )}

            {/* Progress dots */}
            <div style={{ display:"flex", gap:0, alignItems:"center", marginBottom:"40px" }}>
              {["Q1","Q2","Q3"].map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{ width: i===0?"14px":"10px", height: i===0?"14px":"10px", borderRadius:"50%", background: i===0?"#c8752a":"#e0d5c5", flexShrink:0, boxShadow: i===0?"0 0 0 4px rgba(200,117,42,0.2)":"none", transition:"all 0.2s" }} />
                  {i < 2 && <div style={{ flex:1, height:"1.5px", background:"#e0d5c5" }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Q1 — Jours */}
            <div style={{ marginBottom:"48px" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#2c1a0e", marginBottom:"8px" }}>Combien de jours ?</h2>
              <p style={{ fontFamily:"'Lato',sans-serif", color:"#999", marginBottom:"32px" }}>Glissez pour choisir la durée</p>
              <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
                <input type="range" min="2" max="14" step="1" value={days}
                  style={{ "--val":`${((days-2)/12)*100}%`, flex:1 }}
                  onChange={e => setDays(Number(e.target.value))} />
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"48px", color:"#c8752a", minWidth:"80px", textAlign:"center" }}>
                  {days}
                  <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#aaa", marginTop:"-8px" }}>jours</div>
                </div>
              </div>
            </div>

            {/* Q2 — Villes depuis la BASE */}
            <div style={{ marginBottom:"48px" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#2c1a0e", marginBottom:"8px" }}>Quelles villes ?</h2>
              <p style={{ fontFamily:"'Lato',sans-serif", color:"#999", marginBottom:"20px" }}>
                {availableCities.length > 0
                  ? `${availableCities.length} villes disponibles dans ta base (${selectedCities.length} choisie${selectedCities.length!==1?"s":""})`
                  : `Chargement des villes... (${selectedCities.length} choisie${selectedCities.length!==1?"s":""})`
                }
              </p>

              {excLoading && <p className="pulse" style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#aaa" }}>Chargement depuis Supabase...</p>}

              {availableCities.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"10px" }}>
                  {availableCities.map(city => (
                    <button key={city} className={`chip ${selectedCities.includes(city) ? "on" : ""}`} onClick={() => toggleCity(city)}>
                      {getCityEmoji(city)} {city}
                    </button>
                  ))}
                </div>
              )}

              {!excLoading && availableCities.length === 0 && (
                <div className="warnbox">
                  Aucune ville trouvée. Vérifie que n8n retourne bien <code>{`{ cities: [...] }`}</code> pour <code>action: "metadata"</code>.
                </div>
              )}
            </div>

            {/* Q3 — Catégories depuis la BASE */}
            <div style={{ marginBottom:"48px" }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#2c1a0e", marginBottom:"8px" }}>Vos intérêts ?</h2>
              <p style={{ fontFamily:"'Lato',sans-serif", color:"#999", marginBottom:"20px" }}>
                {availableCategories.length > 0
                  ? `Catégories disponibles dans ta base (${selectedInterests.length} choisie${selectedInterests.length!==1?"s":""})`
                  : `Chargement des catégories...`
                }
              </p>

              {availableCategories.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
                  {availableCategories.map(cat => (
                    <button key={cat.id || cat} className={`icard ${selectedInterests.includes(cat.id || cat) ? "on" : ""}`}
                      onClick={() => toggleInterest(cat.id || cat)}>
                      <span style={{ fontSize:"24px" }}>{cat.icon || "🎯"}</span>
                      <span>{cat.label || cat}</span>
                    </button>
                  ))}
                </div>
              )}

              {!excLoading && availableCategories.length === 0 && (
                <div className="warnbox">
                  Aucune catégorie trouvée. Vérifie que n8n retourne <code>{`{ categories: [{id,label,icon}] }`}</code>.
                </div>
              )}
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button className="btn-secondary" onClick={() => { setStep("accueil"); setGenError(""); }}>← Retour</button>
              <button className="btn-primary" onClick={generateItinerary}
                disabled={!selectedCities.length || !selectedInterests.length || !N8N_WEBHOOK_URL}>
                Générer via l'agent IA ✨
              </button>
            </div>
          </div>
        )}

        {/* ══ GÉNÉRATION ══ */}
        {step === "generation" && (
          <div style={{ textAlign:"center", paddingTop:"100px" }}>
            <div style={{ fontSize:"64px", marginBottom:"32px" }} className="pulse">🤖</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"32px", color:"#2c1a0e", marginBottom:"16px" }}>
              L'agent IA prépare votre voyage...
            </h2>
            <p style={{ fontFamily:"'Lato',sans-serif", fontSize:"16px", color:"#999", minHeight:"28px" }}>{loadingMsg}</p>
            <p style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#ccc", marginTop:"8px" }}>
              Lecture de vos vraies excursions depuis Supabase
            </p>
            <div style={{ marginTop:"48px", display:"flex", justifyContent:"center", gap:"8px" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#c8752a", animation:`pulse ${0.8+i*0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* ══ ITINÉRAIRE ══ */}
        {step === "itineraire" && itinerary && (
          <div className="fin">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" }}>
              <div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"30px", color:"#2c1a0e", marginBottom:"4px" }}>{itinerary.title}</h1>
                <p style={{ fontFamily:"'Lato',sans-serif", color:"#aaa", fontSize:"13px" }}>
                  ✓ Basé sur vos excursions réelles • {itinerary.days.length} jours
                </p>
              </div>
              <button onClick={() => setStep("questions")}
                style={{ background:"none", border:"1px solid #e0d5c5", borderRadius:"6px", padding:"8px 14px", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa" }}>
                ✏️ Modifier
              </button>
            </div>

            {/* Tabs jours */}
            <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"12px", marginBottom:"28px" }}>
              {itinerary.days.map((d, i) => (
                <button key={i} className={`day-tab ${activeDay===i?"on":""}`} onClick={() => setActiveDay(i)}>
                  {d.emoji || getCityEmoji(d.city)} Jour {d.day}
                </button>
              ))}
            </div>

            {/* Contenu du jour actif */}
            {(() => {
              const day = itinerary.days[activeDay];
              return (
                <div>
                  <div style={{ marginBottom:"20px" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", color:"#2c1a0e" }}>
                      {day.emoji || getCityEmoji(day.city)} Jour {day.day} — {day.city}
                    </div>
                    {day.theme && (
                      <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#c8752a", letterSpacing:"1px", textTransform:"uppercase", marginTop:"4px" }}>
                        {day.theme}
                      </div>
                    )}
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                    {day.activities.map((act, ai) => (
                      <div key={act.id || ai}>
                        {editingActivity?.dayIdx === activeDay && editingActivity?.actIdx === ai ? (
                          <div style={{ border:"2px solid #c8752a", borderRadius:"10px", padding:"20px", background:"#fff8f0" }}>
                            <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#c8752a", fontWeight:700, marginBottom:"14px", textTransform:"uppercase", letterSpacing:"1px" }}>
                              🔄 Alternatives pour « {act.name} »
                            </div>
                            {editLoading ? (
                              <div className="pulse" style={{ textAlign:"center", padding:"20px", color:"#aaa", fontFamily:"'Lato',sans-serif" }}>
                                Recherche dans la base...
                              </div>
                            ) : editOptions.length === 0 ? (
                              <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"14px", color:"#aaa", textAlign:"center", padding:"16px" }}>
                                Aucune alternative trouvée dans la base pour {day.city}.
                              </div>
                            ) : (
                              <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"14px" }}>
                                {editOptions.map((alt, oi) => (
                                  <div key={oi} className="altcard" onClick={() => applyAlternative(alt)}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                      <div>
                                        <span style={{ fontSize:"18px" }}>{alt.icon || "🗺️"}</span>
                                        <span style={{ fontWeight:700, marginLeft:"8px", color:"#2c1a0e" }}>{alt.name}</span>
                                      </div>
                                      <span className="pbadge">{!alt.price || alt.price===0 ? "Gratuit" : `${alt.price} TND`}</span>
                                    </div>
                                    {alt.description && <div style={{ fontSize:"13px", color:"#888", marginTop:"6px" }}>{alt.description}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <button className="btn-secondary" style={{ fontSize:"12px", padding:"8px 18px" }} onClick={cancelEdit}>Annuler</button>
                          </div>
                        ) : (
                          <div className="acard">
                            <div style={{ fontSize:"28px", flexShrink:0 }}>{act.icon || "🗺️"}</div>
                            <div style={{ flex:1 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px" }}>
                                <div>
                                  <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"15px", fontWeight:700, color:"#2c1a0e" }}>{act.name}</div>
                                  <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa", marginTop:"2px" }}>
                                    🕐 {act.time} • {act.duration}
                                  </div>
                                </div>
                                <span className="pbadge" style={{ flexShrink:0 }}>
                                  {!act.price || act.price===0 ? "Gratuit" : `${act.price} TND`}
                                </span>
                              </div>
                              {act.description && (
                                <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#777", marginTop:"8px", lineHeight:1.5 }}>{act.description}</div>
                              )}
                            </div>
                            <button onClick={() => requestAlternatives(activeDay, ai)}
                              style={{ flexShrink:0, background:"none", border:"1px solid #e0d5c5", borderRadius:"6px", padding:"8px 14px", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa" }}
                              onMouseEnter={e=>{e.target.style.borderColor="#c8752a";e.target.style.color="#c8752a";}}
                              onMouseLeave={e=>{e.target.style.borderColor="#e0d5c5";e.target.style.color="#aaa";}}>
                              Modifier ✏️
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:"24px" }}>
                    <button className="btn-secondary" style={{ visibility:activeDay>0?"visible":"hidden" }} onClick={() => setActiveDay(activeDay-1)}>
                      ← Jour {activeDay}
                    </button>
                    {activeDay < itinerary.days.length-1 ? (
                      <button className="btn-primary" onClick={() => setActiveDay(activeDay+1)}>Jour {activeDay+2} →</button>
                    ) : (
                      <button className="btn-primary" onClick={() => setStep("checkout")}>Réserver 🎉</button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Barre récap */}
            <div style={{ marginTop:"40px", padding:"20px", background:"white", border:"1px solid #ede7d9", borderRadius:"10px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
              <div>
                <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa", textTransform:"uppercase", letterSpacing:"1px" }}>Total estimé</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#c8752a" }}>{totalPrice} TND</div>
              </div>
              <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#888" }}>
                {itinerary.days.length} jours • {selectedCities.join(", ")}
              </div>
              <button className="btn-primary" onClick={() => setStep("checkout")}>Finaliser →</button>
            </div>
          </div>
        )}

        {/* ══ CHECKOUT ══ */}
        {step === "checkout" && (
          <div className="fin">
            {!bookingConfirmed ? (
              <>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"34px", color:"#2c1a0e", marginBottom:"32px" }}>Confirmer la réservation</h1>
                <div style={{ background:"white", border:"1px solid #ede7d9", borderRadius:"10px", padding:"24px", marginBottom:"24px" }}>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px", color:"#2c1a0e", marginBottom:"20px" }}>Récapitulatif</h3>
                  {itinerary?.days.map((d, di) => (
                    <div key={di} style={{ padding:"14px 0", borderBottom:"1px solid #f0e8da" }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <div style={{ fontFamily:"'Lato',sans-serif", fontWeight:700, color:"#2c1a0e" }}>
                          {d.emoji||getCityEmoji(d.city)} Jour {d.day} — {d.city}
                        </div>
                        <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"13px", color:"#c8752a" }}>
                          {d.activities.reduce((s,a)=>s+(Number(a.price)||0),0)} TND
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#aaa", marginTop:"4px" }}>
                        {d.activities.map(a=>a.name).join(" • ")}
                      </div>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:"20px" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px", color:"#2c1a0e" }}>Total</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#c8752a" }}>{totalPrice} TND</div>
                  </div>
                </div>
                <div style={{ background:"white", border:"1px solid #ede7d9", borderRadius:"10px", padding:"24px", marginBottom:"24px" }}>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", color:"#2c1a0e", marginBottom:"20px" }}>Vos informations</h3>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
                    {["Prénom","Nom","Email","Téléphone"].map(f => (
                      <div key={f}>
                        <label style={{ fontFamily:"'Lato',sans-serif", fontSize:"11px", color:"#aaa", textTransform:"uppercase", letterSpacing:"1px", display:"block", marginBottom:"6px" }}>{f}</label>
                        <input type={f==="Email"?"email":"text"} placeholder={f}
                          style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e0d5c5", borderRadius:"6px", fontFamily:"'Lato',sans-serif", fontSize:"14px", outline:"none", color:"#333" }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <button className="btn-secondary" onClick={() => setStep("itineraire")}>← Modifier</button>
                  <button className="btn-primary" onClick={() => setBookingConfirmed(true)} style={{ padding:"16px 40px" }}>✅ Confirmer & Réserver</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:"center", paddingTop:"60px" }}>
                <div style={{ fontSize:"72px", marginBottom:"24px" }}>🎉</div>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"40px", color:"#2c1a0e", marginBottom:"16px" }}>Voyage confirmé !</h1>
                <p style={{ fontFamily:"'Lato',sans-serif", fontSize:"16px", color:"#888", marginBottom:"40px", lineHeight:1.7 }}>
                  Votre itinéraire de {itinerary?.days.length} jours en Tunisie est réservé.<br/>Confirmation envoyée par email.
                </p>
                <div style={{ background:"#f0f9f4", border:"1px solid #c0e8d0", borderRadius:"10px", padding:"24px", marginBottom:"40px", display:"inline-block" }}>
                  <div style={{ fontFamily:"'Lato',sans-serif", fontSize:"12px", color:"#2a7a4a", textTransform:"uppercase", letterSpacing:"1px" }}>N° de réservation</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"28px", color:"#2a7a4a", marginTop:"8px" }}>
                    TN-{Math.random().toString(36).substring(2,8).toUpperCase()}
                  </div>
                </div>
                <br/>
                <button className="btn-primary" onClick={resetAll}>Planifier un nouveau voyage</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}