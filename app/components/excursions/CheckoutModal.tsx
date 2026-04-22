"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  X, CalendarDays, Users, MapPin, Clock, Tag,
  Check, Minus, Plus, ShieldCheck, RefreshCcw, Lock,
  Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

interface DateDispo {
  date: string;  // "YYYY-MM-DD"
  slots: number;
}

interface Excursion {
  id: string;
  title: string;
  city: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  available_dates?: DateDispo[] | null;
}

interface Props {
  exc?: Excursion;
  excursion?: Excursion;
  userId?: string;
  onClose: () => void;
}

/* ── Helpers calendrier ───────────────────────────────────────── */
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  // lundi = 0 ... dimanche = 6
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

const genBookingCode = () =>
  "VJ-" + Date.now().toString(36).toUpperCase() + "-" +
  Math.random().toString(36).substring(2, 5).toUpperCase();

/* ── CSS ─────────────────────────────────────────────────────── */
const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .co-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:coFadeIn .2s ease}
  .co-modal{background:white;border-radius:24px;padding:28px;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;box-shadow:0 28px 80px rgba(0,0,0,0.28);animation:coSlideUp .28s cubic-bezier(0.34,1.56,0.64,1);font-family:'DM Sans',sans-serif}
  .co-modal::-webkit-scrollbar{width:4px}
  .co-modal::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}
  .co-close-btn{background:#F3F4F6;border:none;cursor:pointer;color:#9CA3AF;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
  .co-close-btn:hover{background:#E5E7EB;color:#6B7280}

  /* Calendrier */
  .cal-wrap{border:1.5px solid #E5E7EB;border-radius:16px;overflow:hidden;background:#fff;margin-bottom:14px}
  .cal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#F9FAFB;border-bottom:1px solid #F0F0F0}
  .cal-nav{background:none;border:none;cursor:pointer;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6B7280;transition:all .15s}
  .cal-nav:hover{background:#E5E7EB;color:#111827}
  .cal-month{font-size:14px;font-weight:700;color:#111827}
  .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:10px}
  .cal-day-label{text-align:center;font-size:10px;font-weight:700;color:#9CA3AF;padding:4px 0;text-transform:uppercase;letter-spacing:.5px}
  .cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:13px;font-weight:500;cursor:default;position:relative;transition:all .15s}
  .cal-day.empty{background:transparent}
  .cal-day.past{color:#D1D5DB}
  .cal-day.unavailable{color:#D1D5DB}
  .cal-day.available{cursor:pointer;color:#0F766E;background:#F0FDF4;font-weight:700}
  .cal-day.available:hover{background:#DCFCE7;transform:scale(1.08)}
  .cal-day.selected{background:#2B96A8 !important;color:white !important;font-weight:800;box-shadow:0 4px 12px rgba(43,150,168,.35)}
  .cal-day.low-slots{background:#FEF3C7;color:#92400E}
  .cal-day.low-slots:hover{background:#FDE68A}
  .cal-slots{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:800;white-space:nowrap}

  /* Légende */
  .cal-legend{display:flex;gap:12px;flex-wrap:wrap;padding:0 10px 10px;font-size:11px;color:#6B7280}
  .cal-legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}

  /* Counter */
  .co-counter-btn{width:42px;height:42px;border:none;background:#F3F4F6;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .co-counter-btn:hover:not(:disabled){background:#E5E7EB}
  .co-counter-btn:disabled{opacity:.35;cursor:not-allowed}

  /* CTA */
  .co-cta{width:100%;padding:15px;border:none;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
  .co-cta.active{background:#2B96A8;color:white}
  .co-cta.active:hover{background:#1e7a8a;transform:translateY(-1px);box-shadow:0 8px 20px rgba(43,150,168,.3)}
  .co-cta.disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed}
  .co-cta.loading{background:#7CC4D1;color:white;cursor:not-allowed}

  .co-textarea{width:100%;padding:11px 14px;min-height:72px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:13px;font-family:'DM Sans',sans-serif;color:#374151;resize:vertical;outline:none;transition:all .2s;background:#FAFAFA}
  .co-textarea:focus{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,.08)}

  @keyframes coFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes coSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes coSpin{to{transform:rotate(360deg)}}
`;

/* ═══════════════════════════════════════════════════════════════ */
export default function CheckoutModal({ exc, excursion, onClose }: Props) {
  const supabase = createClient();
  const data     = exc ?? excursion;

  // Dates dispos normalisées (triées)
  const availableDates: DateDispo[] = Array.isArray(data?.available_dates)
    ? (data!.available_dates as DateDispo[]).filter(d => d.date && d.slots > 0).sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const availableSet = new Set(availableDates.map(d => d.date));
  const slotsMap     = new Map(availableDates.map(d => [d.date, d.slots]));

  // Calendrier — mois initial = 1er mois avec dates disponibles (ou mois actuel)
  const firstAvailable = availableDates[0]?.date;
  const initDate       = firstAvailable ? new Date(firstAvailable) : new Date();
  const [calYear,  setCalYear]  = useState(initDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initDate.getMonth());

  const [selectedDate, setSelectedDate] = useState("");
  const [people,       setPeople]       = useState(1);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [status,       setStatus]       = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [bookingCode,  setBookingCode]  = useState("");

  if (!data) return null;

  const slotsForSelected = slotsMap.get(selectedDate) ?? 0;
  const maxPeople        = selectedDate ? Math.min(data.max_people, slotsForSelected) : data.max_people;

  // Reset people si on change de date et que le max change
  useEffect(() => {
    if (people > maxPeople) setPeople(Math.max(1, maxPeople));
  }, [selectedDate]);

  const totalPrice  = data.price_per_person * people;
  const platformFee = Math.round(totalPrice * 0.1);
  const grandTotal  = totalPrice + platformFee;
  const canSubmit   = !!selectedDate && status === "idle" && slotsForSelected >= people;

  /* ── Navigation calendrier ─────────────────────────────────── */
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  /* ── Rendu calendrier ─────────────────────────────────────── */
  const today       = new Date().toISOString().slice(0, 10);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDayOfMonth(calYear, calMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  /* ── Soumission ───────────────────────────────────────────── */
  const handleReserve = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setErrorMsg("Vous devez être connecté pour réserver.");
        setStatus("error"); return;
      }
      const code = genBookingCode();
      const result = await supabase.from("reservations").insert([{
        touriste_id:    user.id,
        excursion_id:   data.id,
        date:           selectedDate,
        people_count:   people,
        total_price:    grandTotal,
        platform_fee:   platformFee,
        status:         "pending",
        special_needs:  specialNeeds.trim() || null,
        booking_code:   code,
        payment_status: "unpaid",
        payment_method: null,
        special_notes:  null,
      }]).select();

      if (result.error) {
        const code23 = result.error.code;
        if (code23 === "23503") setErrorMsg("L'excursion n'existe plus.");
        else if (code23 === "23505") setErrorMsg("Cette réservation existe déjà.");
        else setErrorMsg(result.error.message || "Erreur lors de la réservation.");
        setStatus("error"); return;
      }
      setBookingCode(code);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
      setStatus("error");
    }
  };

  /* ── VUE SUCCÈS ─────────────────────────────────────────────── */
  if (status === "success") return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="co-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="co-modal" style={{ textAlign:"center", padding:"40px 32px" }}>
          <div style={{ width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#D1FAE5,#A7F3D0)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 8px 24px rgba(5,150,105,.2)" }}>
            <CheckCircle size={36} color="#059669" strokeWidth={2}/>
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:"#111827",marginBottom:8 }}>
            Réservation confirmée !
          </h2>
          <p style={{ fontSize:14,color:"#6B7280",marginBottom:24,lineHeight:1.65 }}>
            <strong style={{ color:"#111827" }}>{sanitizeText(data.title)}</strong><br/>
            le <strong style={{ color:"#111827" }}>
              {new Date(selectedDate).toLocaleDateString("fr-FR",{ day:"numeric",month:"long",year:"numeric" })}
            </strong> pour {people} personne{people > 1 ? "s" : ""}
          </p>
          <div style={{ background:"linear-gradient(135deg,#EFF9FB,#D0F0F5)",border:"1px solid rgba(43,150,168,.25)",borderRadius:16,padding:"18px 24px",marginBottom:22 }}>
            <p style={{ fontSize:11,fontWeight:700,color:"#2B96A8",textTransform:"uppercase",letterSpacing:"1px",margin:"0 0 6px" }}>N° de réservation</p>
            <p style={{ fontSize:22,fontWeight:900,color:"#111827",margin:0,letterSpacing:"2px",fontFamily:"'Playfair Display',serif" }}>{bookingCode}</p>
          </div>
          <div style={{ background:"#F9FAFB",borderRadius:12,padding:"14px 16px",marginBottom:22,textAlign:"left" }}>
            {([
              ["Date",        new Date(selectedDate).toLocaleDateString("fr-FR")],
              ["Personnes",   `${people} personne${people > 1 ? "s" : ""}`],
              ["Sous-total",  `${totalPrice} TND`],
              ["Frais (10%)", `${platformFee} TND`],
              ["Total",       `${grandTotal} TND`],
            ] as [string,string][]).map(([label, val], i, arr) => (
              <div key={label} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",borderBottom:i<arr.length-1?"1px solid #F0F0F0":"none" }}>
                <span style={{ color:"#9CA3AF" }}>{label}</span>
                <span style={{ fontWeight:i===arr.length-1?800:600,color:i===arr.length-1?"#2B96A8":"#111827" }}>{val}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12,color:"#9CA3AF",marginBottom:20 }}>Une confirmation vous sera envoyée par email.</p>
          <button className="co-cta active" onClick={onClose}><Check size={16}/> Fermer</button>
        </div>
      </div>
    </>
  );

  /* ── VUE FORMULAIRE ─────────────────────────────────────────── */
  return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="co-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="co-modal">

          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:"#111827",marginBottom:2 }}>Réserver</h2>
              <p style={{ fontSize:12,color:"#9CA3AF",margin:0 }}>Choisissez une date disponible</p>
            </div>
            <button className="co-close-btn" onClick={onClose}><X size={16}/></button>
          </div>

          {/* Résumé excursion */}
          <div style={{ background:"#F9FAFB",borderRadius:14,padding:"12px 14px",marginBottom:18,border:"1px solid #F0F0F0" }}>
            <p style={{ fontSize:14,fontWeight:700,color:"#111827",margin:"0 0 6px" }}>{sanitizeText(data.title)}</p>
            <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
              <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#6B7280" }}><MapPin size={11} color="#2B96A8"/>{sanitizeText(data.city)}</span>
              <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#6B7280" }}><Clock size={11}/>{data.duration_hours}h</span>
              <span style={{ display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#6B7280" }}><Tag size={11}/>{data.price_per_person} TND / pers.</span>
            </div>
          </div>

          {/* Erreur */}
          {status === "error" && (
            <div style={{ display:"flex",alignItems:"center",gap:8,padding:"11px 14px",background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:10,marginBottom:16,fontSize:13,color:"#DC2626",fontWeight:600 }}>
              <AlertCircle size={15}/>{errorMsg}
            </div>
          )}

          {/* ── Aucune date disponible ── */}
          {availableDates.length === 0 ? (
            <div style={{ textAlign:"center",padding:"32px 20px",background:"#FFF7ED",borderRadius:16,border:"1px solid #FED7AA",marginBottom:18 }}>
              <CalendarDays size={32} color="#F97316" style={{ marginBottom:10 }} />
              <p style={{ fontSize:14,fontWeight:700,color:"#9A3412",margin:"0 0 6px" }}>Aucune date disponible</p>
              <p style={{ fontSize:12,color:"#C2410C",margin:0 }}>Le prestataire n'a pas encore ajouté de dates. Revenez bientôt !</p>
            </div>
          ) : (
            <>
              {/* ── Calendrier ── */}
              <label style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:"#374151",letterSpacing:.5,textTransform:"uppercase",marginBottom:8 }}>
                <CalendarDays size={12} color="#2B96A8"/> Date souhaitée *
              </label>

              <div className="cal-wrap">
                {/* Navigation mois */}
                <div className="cal-header">
                  <button className="cal-nav" onClick={prevMonth}><ChevronLeft size={16}/></button>
                  <span className="cal-month">{MONTHS_FR[calMonth]} {calYear}</span>
                  <button className="cal-nav" onClick={nextMonth}><ChevronRight size={16}/></button>
                </div>

                {/* Jours de semaine */}
                <div className="cal-grid">
                  {DAYS_FR.map(d => (
                    <div key={d} className="cal-day-label">{d}</div>
                  ))}

                  {/* Cases */}
                  {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} className="cal-day empty" />;

                    const iso     = toISO(calYear, calMonth, day);
                    const isPast  = iso < today;
                    const isAvail = availableSet.has(iso);
                    const slots   = slotsMap.get(iso) ?? 0;
                    const isLow   = isAvail && slots <= 3;
                    const isSel   = iso === selectedDate;

                    let cls = "cal-day";
                    if (isPast)       cls += " past";
                    else if (!isAvail) cls += " unavailable";
                    else if (isLow)   cls += " low-slots";
                    else              cls += " available";
                    if (isSel)        cls += " selected";

                    return (
                      <div
                        key={iso}
                        className={cls}
                        onClick={() => isAvail && !isPast && setSelectedDate(isSel ? "" : iso)}
                        title={isAvail ? `${slots} place${slots > 1 ? "s" : ""} disponible${slots > 1 ? "s" : ""}` : ""}
                      >
                        {day}
                        {isAvail && !isPast && (
                          <span className="cal-slots" style={{ color: isSel ? "rgba(255,255,255,.8)" : isLow ? "#B45309" : "#0F766E" }}>
                            {slots}p
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Légende */}
                <div className="cal-legend">
                  <span style={{ display:"flex",alignItems:"center",gap:5 }}>
                    <span className="cal-legend-dot" style={{ background:"#F0FDF4",border:"1.5px solid #0F766E" }}/>
                    Disponible
                  </span>
                  <span style={{ display:"flex",alignItems:"center",gap:5 }}>
                    <span className="cal-legend-dot" style={{ background:"#FEF3C7",border:"1.5px solid #92400E" }}/>
                    Dernières places
                  </span>
                  <span style={{ display:"flex",alignItems:"center",gap:5 }}>
                    <span className="cal-legend-dot" style={{ background:"#2B96A8" }}/>
                    Sélectionnée
                  </span>
                </div>
              </div>

              {/* Date sélectionnée — résumé */}
              {selectedDate && (
                <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#EFF9FB",border:"1px solid rgba(43,150,168,.3)",borderRadius:12,marginBottom:14,fontSize:13 }}>
                  <Check size={14} color="#2B96A8" style={{ flexShrink:0 }}/>
                  <span style={{ fontWeight:600,color:"#0F4C5C" }}>
                    {new Date(selectedDate).toLocaleDateString("fr-FR",{ weekday:"long",day:"numeric",month:"long",year:"numeric" })}
                  </span>
                  <span style={{ marginLeft:"auto",fontSize:12,color:"#2B96A8",fontWeight:700 }}>
                    {slotsForSelected} place{slotsForSelected > 1 ? "s" : ""} disponible{slotsForSelected > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Personnes */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:"#374151",letterSpacing:.5,textTransform:"uppercase",marginBottom:8 }}>
                  <Users size={12} color="#2B96A8"/> Personnes
                </label>
                <div style={{ display:"flex",alignItems:"center",gap:14,padding:"8px 16px",border:"1.5px solid #E5E7EB",borderRadius:12,background:"#FAFAFA" }}>
                  <button type="button" className="co-counter-btn" onClick={() => setPeople(p => Math.max(1, p - 1))} disabled={people <= 1}>
                    <Minus size={15}/>
                  </button>
                  <span style={{ flex:1,textAlign:"center",fontSize:22,fontWeight:900,color:"#111827",fontFamily:"'Playfair Display',serif" }}>{people}</span>
                  <button type="button" className="co-counter-btn" onClick={() => setPeople(p => Math.min(maxPeople, p + 1))} disabled={people >= maxPeople}>
                    <Plus size={15}/>
                  </button>
                </div>
                <p style={{ fontSize:11,color:"#9CA3AF",marginTop:5,display:"flex",alignItems:"center",gap:4 }}>
                  <Users size={10}/>
                  {selectedDate
                    ? `Max ${maxPeople} personne${maxPeople > 1 ? "s" : ""} (${slotsForSelected} place${slotsForSelected > 1 ? "s" : ""} pour cette date)`
                    : `Max ${data.max_people} personnes`}
                </p>
              </div>

              {/* Besoins spéciaux */}
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:"#374151",letterSpacing:.5,textTransform:"uppercase",marginBottom:7 }}>
                  <Tag size={12} color="#2B96A8"/> Besoins spéciaux
                  <span style={{ color:"#9CA3AF",fontWeight:400,textTransform:"none",fontSize:11 }}>(optionnel)</span>
                </label>
                <textarea className="co-textarea" value={specialNeeds} onChange={e => setSpecialNeeds(e.target.value)} placeholder="Allergies, mobilité réduite, préférences alimentaires..."/>
              </div>

              {/* Récap prix */}
              <div style={{ background:"#F9FAFB",borderRadius:14,padding:"16px",marginBottom:20,border:"1px solid #F0F0F0" }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#6B7280",marginBottom:8 }}>
                  <span>{data.price_per_person} TND × {people} personne{people > 1 ? "s" : ""}</span>
                  <span style={{ fontWeight:600,color:"#374151" }}>{totalPrice} TND</span>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#6B7280",paddingBottom:12,borderBottom:"1px dashed #E5E7EB",marginBottom:12 }}>
                  <span>Frais de service (10%)</span>
                  <span style={{ fontWeight:600,color:"#374151" }}>{platformFee} TND</span>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:17,fontWeight:900,color:"#111827" }}>
                  <span>Total</span>
                  <span style={{ color:"#2B96A8",fontFamily:"'Playfair Display',serif" }}>{grandTotal} TND</span>
                </div>
              </div>

              {/* Bouton */}
              <button
                className={`co-cta ${!selectedDate ? "disabled" : status === "loading" ? "loading" : "active"}`}
                disabled={!canSubmit}
                onClick={handleReserve}
              >
                {status === "loading"
                  ? <><Loader2 size={16} style={{ animation:"coSpin .7s linear infinite" }}/> Réservation en cours...</>
                  : !selectedDate
                  ? <><CalendarDays size={15}/> Choisissez une date disponible</>
                  : <><Check size={16}/> Réserver — {grandTotal} TND</>
                }
              </button>

              {/* Garanties */}
              <div style={{ marginTop:16,display:"flex",flexDirection:"column",gap:7 }}>
                {[
                  { icon:<Lock size={12} color="#059669"/>,       text:"Paiement 100% sécurisé" },
                  { icon:<RefreshCcw size={12} color="#2563EB"/>, text:"Annulation gratuite 24h avant" },
                  { icon:<ShieldCheck size={12} color="#8B5CF6"/>,text:"Réservation confirmée instantanément" },
                ].map(g => (
                  <p key={g.text} style={{ fontSize:12,color:"#9CA3AF",display:"flex",alignItems:"center",gap:7,margin:0 }}>
                    {g.icon}{g.text}
                  </p>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}