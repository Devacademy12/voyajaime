"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  X, Users, MapPin, Clock,
  Check, Minus, Plus, ShieldCheck, RefreshCcw, Lock,
  Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  MessageSquare,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface TimeSlot {
  time: string;
  language?: string;
  price: number;
  slots: number;
  groupPrice?: boolean;
  start_time?: string;
  end_time?: string;
}

interface Excursion {
  id: string;
  title: string;
  city: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  available_dates?: any[] | null;
}

interface Props {
  exc?: Excursion;
  excursion?: Excursion;
  excursions?: Excursion[];   // mode itinéraire
  userId?: string;
  onClose: () => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

const DAYS_FR   = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const genBookingCode = () =>
  "VJ-" + Date.now().toString(36).toUpperCase() + "-" +
  Math.random().toString(36).substring(2, 5).toUpperCase();

/** Build a map  dateStr → TimeSlot[]  from available_dates */
function buildDateMap(exc: Excursion): Map<string, TimeSlot[]> {
  const map = new Map<string, TimeSlot[]>();
  if (!exc.available_dates || !Array.isArray(exc.available_dates)) return map;
  exc.available_dates.forEach((item: any) => {
    const d = item.date; if (!d) return;
    if (!map.has(d)) map.set(d, []);
    const timeStr = item.time || `${item.start_time || "09:00"} – ${item.end_time || "17:00"}`;
    map.get(d)!.push({
      time: timeStr, language: item.language,
      price: item.price_per_person || exc.price_per_person,
      slots: item.slots ?? 0,
      groupPrice: item.group_discount_available || false,
      start_time: item.start_time, end_time: item.end_time,
    });
  });
  return map;
}

/* ─── CSS ────────────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .co2-overlay{
    position:fixed;inset:0;z-index:1000;
    display:flex;align-items:center;justify-content:center;
    padding:16px;
    background:rgba(10,20,35,0.65);
    backdrop-filter:blur(6px);
    animation:co2Fade .2s ease;
  }
  .co2-shell{
    background:#FAFBFC;
    border-radius:28px;
    width:100%;max-width:860px;
    box-shadow:0 32px 80px rgba(0,0,0,.32);
    overflow:hidden;
    display:flex;
    animation:co2Up .3s cubic-bezier(.34,1.4,.64,1);
    font-family:'DM Sans',sans-serif;
    max-height:96vh;
  }

  /* Left panel */
  .co2-left{
    width:340px;flex-shrink:0;
    background:linear-gradient(160deg,#0B3D52 0%,#0E5068 55%,#0B7EA3 100%);
    padding:32px 28px;
    display:flex;flex-direction:column;gap:20px;
    color:white;
    position:relative;overflow:hidden;
  }
  .co2-left::before{
    content:'';position:absolute;top:-60px;right:-60px;
    width:200px;height:200px;border-radius:50%;
    background:rgba(255,255,255,.06);
  }
  .co2-left::after{
    content:'';position:absolute;bottom:-40px;left:-40px;
    width:160px;height:160px;border-radius:50%;
    background:rgba(255,255,255,.04);
  }

  /* Right panel */
  .co2-right{
    flex:1;display:flex;flex-direction:column;
    overflow:hidden;
  }
  .co2-right-scroll{
    flex:1;overflow-y:auto;padding:28px 28px 0;
  }
  .co2-right-scroll::-webkit-scrollbar{width:3px}
  .co2-right-scroll::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:3px}
  .co2-right-footer{
    padding:20px 28px 24px;
    border-top:1px solid #F3F4F6;
    background:#FAFBFC;
  }

  /* Calendar */
  .cal-grid{
    display:grid;grid-template-columns:repeat(7,1fr);
    gap:4px;margin-top:8px;
  }
  .cal-day-btn{
    aspect-ratio:1;border-radius:10px;border:none;
    font-size:13px;font-weight:600;cursor:pointer;
    font-family:'DM Sans',sans-serif;
    transition:all .15s;position:relative;
    display:flex;align-items:center;justify-content:center;
    flex-direction:column;gap:1px;
  }
  .cal-day-btn.empty{background:transparent;cursor:default}
  .cal-day-btn.past{background:#F3F4F6;color:#D1D5DB;cursor:not-allowed;text-decoration:line-through}
  .cal-day-btn.unavailable{
    background:#F9FAFB;color:#9CA3AF;cursor:not-allowed;
    position:relative;
  }
  .cal-day-btn.unavailable::before{
    content:'';position:absolute;
    left:10%;right:10%;top:50%;
    height:1.5px;background:#D1D5DB;
    transform:rotate(-12deg);
    border-radius:2px;
  }
  .cal-day-btn.available{
    background:white;color:#111827;
    border:1.5px solid #E5E7EB;
  }
  .cal-day-btn.available:hover{
    background:#EFF9FB;border-color:#2B96A8;color:#2B96A8;
    transform:translateY(-1px);box-shadow:0 4px 12px rgba(43,150,168,.15);
  }
  .cal-day-btn.selected{
    background:#2B96A8!important;color:white!important;
    border-color:#2B96A8!important;
    box-shadow:0 4px 14px rgba(43,150,168,.35);
    transform:translateY(-1px);
  }
  .cal-day-btn.today-mark::after{
    content:'';position:absolute;bottom:3px;
    width:4px;height:4px;border-radius:50%;
    background:currentColor;opacity:.6;
  }
  .cal-dot{width:4px;height:4px;border-radius:50%;background:#10B981;flex-shrink:0}

  /* Slot rows */
  .slot-pill{
    display:flex;align-items:center;justify-content:space-between;
    padding:13px 16px;border-radius:14px;
    border:1.5px solid #E5E7EB;background:white;
    cursor:pointer;transition:all .15s;
    margin-bottom:8px;position:relative;
  }
  .slot-pill:last-child{margin-bottom:0}
  .slot-pill.sel{background:#EFF9FB;border-color:#2B96A8}
  .slot-pill.full{opacity:.55;cursor:not-allowed;border-color:#FEE2E2}
  .slot-pill:not(.full):not(.sel):hover{border-color:#2B96A8;background:#F8FDFE}

  /* Counter */
  .co2-counter-btn{
    width:36px;height:36px;border:none;border-radius:10px;
    background:#F3F4F6;cursor:pointer;
    display:flex;align-items:center;justify-content:center;
    transition:all .15s;font-family:'DM Sans',sans-serif;
  }
  .co2-counter-btn:hover:not(:disabled){background:#E5E7EB}
  .co2-counter-btn:disabled{opacity:.3;cursor:not-allowed}

  /* CTA */
  .co2-cta{
    width:100%;padding:15px;border:none;border-radius:14px;
    font-size:15px;font-weight:800;cursor:pointer;
    font-family:'DM Sans',sans-serif;transition:all .2s;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  .co2-cta.on{background:linear-gradient(135deg,#2B96A8,#1b7a90);color:white}
  .co2-cta.on:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(43,150,168,.35)}
  .co2-cta.off{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed}
  .co2-cta.spin{background:#7CC4D1;color:white;cursor:not-allowed}

  .co2-textarea{
    width:100%;padding:10px 13px;min-height:64px;
    border:1.5px solid #E5E7EB;border-radius:12px;
    font-size:13px;font-family:'DM Sans',sans-serif;
    color:#374151;resize:none;outline:none;
    background:#F9FAFB;box-sizing:border-box;transition:border .15s;
  }
  .co2-textarea:focus{border-color:#2B96A8;background:white}

  @keyframes co2Fade{from{opacity:0}to{opacity:1}}
  @keyframes co2Up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
  @keyframes coSpin{to{transform:rotate(360deg)}}
`;

/* ─── Sub-components ─────────────────────────────────────────────────── */

/** Mini calendar for one excursion */
function MiniCalendar({
  dateMap,
  selectedDate,
  onSelect,
}: {
  dateMap: Map<string, TimeSlot[]>;
  selectedDate: string;
  onSelect: (d: string) => void;
}) {
  const today = new Date(); today.setHours(0,0,0,0);

  // Determine displayed month
  const firstAvailable = Array.from(dateMap.keys()).sort()[0];
  const initDate = firstAvailable ? new Date(firstAvailable) : today;
  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday  = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button
          onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
          style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ChevronLeft size={15}/>
        </button>
        <span style={{ fontSize:14, fontWeight:700, color:"white" }}>
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <button
          onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}
          style={{ background:"rgba(255,255,255,.12)", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", color:"white", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ChevronRight size={15}/>
        </button>
      </div>

      {/* Day headers */}
      <div className="cal-grid" style={{ marginBottom:4 }}>
        {DAYS_FR.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", padding:"4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="cal-day-btn empty"/>;

          const dateStr   = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const cellDate  = new Date(viewYear, viewMonth, day);
          const isPast    = cellDate < today;
          const slots     = dateMap.get(dateStr);
          const hasSlots  = slots ? slots.some(s => s.slots > 0) : false;
          const isInMap   = dateMap.has(dateStr);
          const isSel     = dateStr === selectedDate;
          const isToday   = cellDate.getTime() === today.getTime();

          let cls = "cal-day-btn ";
          if (isPast)               cls += "past";
          else if (!isInMap)        cls += "unavailable";
          else if (!hasSlots)       cls += "unavailable";
          else if (isSel)           cls += "selected";
          else                      cls += "available";
          if (isToday && !isPast)   cls += " today-mark";

          return (
            <button
              key={i}
              className={cls}
              style={{ color: isSel ? "white" : undefined }}
              onClick={() => !isPast && isInMap && hasSlots && onSelect(dateStr)}
            >
              {day}
              {isInMap && hasSlots && !isSel && <span className="cal-dot"/>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
        {[
          { color:"#10B981", label:"Disponible" },
          { color:"rgba(255,255,255,.3)", label:"Indisponible", cross:true },
        ].map(l => (
          <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"rgba(255,255,255,.6)" }}>
            <div style={{ width:10, height:10, borderRadius:3, background:l.color, position:"relative" }}>
              {l.cross && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:"110%", height:1.5, background:"rgba(255,255,255,.5)", transform:"rotate(-12deg)" }}/>
              </div>}
            </div>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Slot list for a selected date */
function SlotList({
  slots,
  selected,
  onSelect,
}: {
  slots: TimeSlot[];
  selected: TimeSlot | null;
  onSelect: (s: TimeSlot) => void;
}) {
  return (
    <div>
      {slots.map((slot, i) => {
        const avail   = slot.slots > 0;
        const isSel   = selected === slot;
        const lowStock= avail && slot.slots <= 3;
        return (
          <div
            key={i}
            className={`slot-pill ${isSel ? "sel" : ""} ${!avail ? "full" : ""}`}
            onClick={() => avail && onSelect(slot)}
          >
            {!avail && (
              <span style={{ position:"absolute", top:-8, right:10, background:"#EF4444", color:"white", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>Complet</span>
            )}
            {lowStock && (
              <span style={{ position:"absolute", top:-8, right:10, background:"#F59E0B", color:"white", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>Dernières places !</span>
            )}

            <div>
              <span style={{ fontSize:14, fontWeight:800, color: avail ? "#111827" : "#9CA3AF" }}>{slot.time}</span>
              {slot.language && (
                <span style={{ marginLeft:8, fontSize:11, background:"#F3F4F6", color:"#6B7280", padding:"2px 7px", borderRadius:20, fontWeight:600 }}>{slot.language}</span>
              )}
              {slot.groupPrice && (
                <div style={{ fontSize:11, color:"#10B981", fontWeight:600, marginTop:3, display:"flex", alignItems:"center", gap:4 }}>
                  <Users size={10}/> Tarif groupe dispo
                </div>
              )}
            </div>

            <div style={{ textAlign:"right" }}>
              {avail ? (
                <>
                  <div style={{ fontSize:16, fontWeight:900, color:"#2B96A8" }}>
                    {slot.price} TND <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:500 }}>/pers.</span>
                  </div>
                  <div style={{ fontSize:11, color: lowStock ? "#F59E0B" : "#9CA3AF", fontWeight: lowStock ? 700 : 400 }}>
                    {slot.slots} place{slot.slots > 1 ? "s" : ""}
                  </div>
                </>
              ) : (
                <span style={{ fontSize:13, fontWeight:700, color:"#EF4444" }}>Complet</span>
              )}
            </div>

            {avail && (
              <div style={{ marginLeft:10, flexShrink:0 }}>
                <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${isSel ? "#2B96A8" : "#D1D5DB"}`, background: isSel ? "#2B96A8" : "white", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {isSel && <div style={{ width:8, height:8, borderRadius:"50%", background:"white" }}/>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main modal ─────────────────────────────────────────────────────── */

export default function CheckoutModal({ exc, excursion, excursions, onClose }: Props) {
  const supabase = createClient();

  // Determine if itinerary mode or single mode
  const isItinerary = !!(excursions && excursions.length > 1);
  const singleData  = exc ?? excursion ?? excursions?.[0];
  const allExc      = isItinerary ? excursions! : (singleData ? [singleData] : []);

  // Per-excursion state
  const [perExc, setPerExc] = useState(() =>
    allExc.map(e => ({
      exc: e,
      dateMap:      buildDateMap(e),
      selectedDate: "",
      selectedSlot: null as TimeSlot | null,
      people:       1,
      specialNeeds: "",
    }))
  );

  // For single mode, we work on perExc[0]
  const [activeIdx, setActiveIdx] = useState(0);

  const patch = (idx: number, p: Partial<typeof perExc[0]>) =>
    setPerExc(prev => prev.map((x, i) => i === idx ? { ...x, ...p } : x));

  // Derived totals
  const lineItems = perExc.map(p => ({
    title:    p.exc.title,
    subtotal: (p.selectedSlot?.price || 0) * p.people,
    selected: !!p.selectedSlot,
  }));
  const subtotal    = lineItems.reduce((s, l) => s + l.subtotal, 0);
  const platformFee = Math.round(subtotal * 0.1);
  const grandTotal  = subtotal + platformFee;

  const canSubmit =
    perExc.some(p => !!p.selectedSlot) &&
    perExc.every(p => !p.selectedSlot || p.selectedSlot.slots >= p.people) &&
    status === "idle";

  const [status,      setStatus]      = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg,    setErrorMsg]    = useState("");
  const [bookingCodes,setBookingCodes]= useState<string[]>([]);

  // Keep people within slot capacity
  useEffect(() => {
    perExc.forEach((p, i) => {
      const max = p.selectedSlot?.slots || p.exc.max_people || 1;
      if (p.people > max) patch(i, { people: Math.max(1, max) });
    });
  }, [perExc.map(p => p.selectedSlot).join(",")]);

  const handleReserve = async () => {
    if (!canSubmit) return;
    setStatus("loading"); setErrorMsg("");
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) { setErrorMsg("Vous devez être connecté."); setStatus("error"); return; }

      const codes: string[] = [];
      for (const p of perExc) {
        if (!p.selectedSlot) continue;
        const code = genBookingCode();
        const tot  = p.selectedSlot.price * p.people;
        const fee  = Math.round(tot * 0.1);
        const { error: insErr } = await supabase.from("reservations").insert([{
          touriste_id: user.id, excursion_id: p.exc.id,
          date: p.selectedDate, time: p.selectedSlot.time,
          people_count: p.people, total_price: tot + fee,
          platform_fee: fee, status: "pending",
          special_needs: p.specialNeeds.trim() || null,
          booking_code: code, payment_status: "unpaid",
          payment_method: null, special_notes: null,
        }]);
        if (insErr) { setErrorMsg(`Erreur : ${insErr.message}`); setStatus("error"); return; }
        await supabase.rpc("decrement_slot", { exc_id: p.exc.id, date_str: p.selectedDate, qty: p.people });
        codes.push(code);
      }
      setBookingCodes(codes);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
      setStatus("error");
    }
  };

  /* ── Success screen ── */
  if (status === "success") {
    return (
      <>
        <style>{CSS}</style>
        <div className="co2-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
          <div className="co2-shell" style={{ maxWidth:480, display:"block", padding:"40px 36px", textAlign:"center" }}>
            <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#D1FAE5,#A7F3D0)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 8px 24px rgba(5,150,105,.2)" }}>
              <CheckCircle size={36} color="#059669"/>
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:700, color:"#111827", marginBottom:8 }}>
              {isItinerary ? "Itinéraire réservé !" : "Réservation confirmée !"}
            </h2>
            <p style={{ fontSize:13, color:"#6B7280", marginBottom:22 }}>
              {perExc.filter(p => p.selectedSlot).length} excursion{perExc.filter(p=>p.selectedSlot).length>1?"s":""} confirmée{perExc.filter(p=>p.selectedSlot).length>1?"s":""}
            </p>
            {perExc.filter(p => p.selectedSlot).map((p, i) => (
              <div key={i} style={{ background:"linear-gradient(135deg,#EFF9FB,#D0F0F5)", border:"1px solid rgba(43,150,168,.25)", borderRadius:14, padding:"14px 18px", marginBottom:10, textAlign:"left" }}>
                <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:"#111827" }}>{sanitizeText(p.exc.title)}</p>
                <p style={{ margin:"0 0 6px", fontSize:12, color:"#6B7280" }}>
                  {new Date(p.selectedDate).toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})} · {p.selectedSlot!.time} · {p.people} pers.
                </p>
                <p style={{ margin:0, fontSize:11, fontWeight:700, color:"#2B96A8", letterSpacing:"1px", textTransform:"uppercase" }}>
                  N° {bookingCodes[i]}
                </p>
              </div>
            ))}
            <button className="co2-cta on" style={{ marginTop:16 }} onClick={onClose}><Check size={15}/> Fermer</button>
          </div>
        </div>
      </>
    );
  }

  const cur = perExc[activeIdx];
  const slotsForDate = cur.selectedDate ? (cur.dateMap.get(cur.selectedDate) || []) : [];
  const maxPeople    = cur.selectedSlot?.slots || cur.exc.max_people || 1;
  const curPrice     = cur.selectedSlot?.price || cur.exc.price_per_person || 0;
  const curTotal     = curPrice * cur.people;
  const curFee       = Math.round(curTotal * 0.1);
  const curGrand     = curTotal + curFee;

  /* ── Main layout ── */
  return (
    <>
      <style>{CSS}</style>
      <div className="co2-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="co2-shell">

          {/* ── LEFT : calendar + info ── */}
          <div className="co2-left">
            {/* Header */}
            <div style={{ position:"relative", zIndex:1 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"1.5px", margin:"0 0 6px" }}>
                {isItinerary ? "Itinéraire" : "Excursion"}
              </p>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:"white", margin:"0 0 10px", lineHeight:1.3 }}>
                {sanitizeText(isItinerary ? `${allExc.length} excursions` : cur.exc.title)}
              </h2>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,.7)", display:"flex", alignItems:"center", gap:4 }}>
                  <MapPin size={11}/> {sanitizeText(cur.exc.city)}
                </span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,.7)", display:"flex", alignItems:"center", gap:4 }}>
                  <Clock size={11}/> {cur.exc.duration_hours}h
                </span>
              </div>
            </div>

            {/* Excursion tabs (itinerary mode) */}
            {isItinerary && (
              <div style={{ display:"flex", flexDirection:"column", gap:6, position:"relative", zIndex:1 }}>
                {allExc.map((e, i) => (
                  <button
                    key={e.id}
                    onClick={() => setActiveIdx(i)}
                    style={{
                      background: i===activeIdx ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.07)",
                      border: `1px solid ${i===activeIdx ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.1)"}`,
                      borderRadius:10, padding:"8px 12px", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      color:"white", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:600,
                      transition:"all .15s",
                    }}>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"75%" }}>
                      {sanitizeText(e.title)}
                    </span>
                    {perExc[i].selectedSlot
                      ? <Check size={13} color="#10B981"/>
                      : <div style={{ width:13, height:13, borderRadius:"50%", border:"1.5px solid rgba(255,255,255,.35)" }}/>
                    }
                  </button>
                ))}
              </div>
            )}

            {/* Calendar */}
            <div style={{ position:"relative", zIndex:1 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:"1.5px", margin:"0 0 4px" }}>
                Choisissez une date
              </p>
              <MiniCalendar
                dateMap={cur.dateMap}
                selectedDate={cur.selectedDate}
                onSelect={d => patch(activeIdx, { selectedDate: d, selectedSlot: null })}
              />
            </div>

            {/* Price summary on left */}
            {subtotal > 0 && (
              <div style={{ marginTop:"auto", background:"rgba(255,255,255,.1)", borderRadius:14, padding:"14px 16px", position:"relative", zIndex:1 }}>
                {isItinerary ? (
                  <>
                    {lineItems.filter(l=>l.selected).map((l,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,.75)", marginBottom:4 }}>
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"65%" }}>{sanitizeText(l.title)}</span>
                        <span>{l.subtotal} TND</span>
                      </div>
                    ))}
                    <div style={{ height:1, background:"rgba(255,255,255,.2)", margin:"8px 0" }}/>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:800, color:"white" }}>
                      <span>Total</span><span>{grandTotal} TND</span>
                    </div>
                  </>
                ) : (
                  cur.selectedSlot && (
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:800, color:"white" }}>
                      <span>Total</span><span>{curGrand} TND</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT : slots + options ── */}
          <div className="co2-right">
            <div className="co2-right-scroll">
              {/* Close btn */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
                <div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:"#111827", margin:"0 0 2px" }}>
                    {cur.selectedDate
                      ? new Date(cur.selectedDate).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})
                      : "Sélectionnez une date"}
                  </h3>
                  <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>
                    {cur.selectedDate ? `${slotsForDate.length} créneau${slotsForDate.length>1?"x":""}` : "← sur le calendrier"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{ width:34, height:34, borderRadius:"50%", border:"none", background:"#F3F4F6", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF", flexShrink:0 }}>
                  <X size={16}/>
                </button>
              </div>

              {/* Error */}
              {status === "error" && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, marginBottom:16, fontSize:13, color:"#DC2626", fontWeight:600 }}>
                  <AlertCircle size={15}/>{errorMsg}
                </div>
              )}

              {/* Slots */}
              {!cur.selectedDate ? (
                <div style={{ textAlign:"center", padding:"40px 20px", background:"#F9FAFB", borderRadius:16, border:"1.5px dashed #E5E7EB", marginBottom:20 }}>
                  <p style={{ fontSize:13, color:"#9CA3AF", margin:0 }}>Choisissez une date sur le calendrier pour voir les créneaux disponibles</p>
                </div>
              ) : slotsForDate.length === 0 ? (
                <div style={{ textAlign:"center", padding:"30px 20px", background:"#FFF7ED", borderRadius:16, border:"1px solid #FED7AA", marginBottom:20 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#9A3412", margin:"0 0 4px" }}>Aucun créneau disponible</p>
                  <p style={{ fontSize:12, color:"#C2410C", margin:0 }}>Choisissez une autre date</p>
                </div>
              ) : (
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                    <Clock size={12} color="#2B96A8"/> Créneaux disponibles
                  </p>
                  <SlotList
                    slots={slotsForDate}
                    selected={cur.selectedSlot}
                    onSelect={s => patch(activeIdx, { selectedSlot: s })}
                  />
                </div>
              )}

              {/* People counter */}
              {cur.selectedSlot && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
                    <Users size={12} color="#2B96A8"/> Nombre de personnes
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 16px", border:"1.5px solid #E5E7EB", borderRadius:12, background:"white" }}>
                    <button className="co2-counter-btn" disabled={cur.people<=1} onClick={() => patch(activeIdx, { people: cur.people - 1 })}><Minus size={14}/></button>
                    <span style={{ flex:1, textAlign:"center", fontSize:22, fontWeight:900, color:"#111827", fontFamily:"'Cormorant Garamond',serif" }}>{cur.people}</span>
                    <button className="co2-counter-btn" disabled={cur.people>=maxPeople} onClick={() => patch(activeIdx, { people: cur.people + 1 })}><Plus size={14}/></button>
                  </div>
                  <p style={{ fontSize:11, color:"#9CA3AF", marginTop:5 }}>
                    Max {maxPeople} · {cur.selectedSlot.slots} place{cur.selectedSlot.slots>1?"s":""} dispo
                  </p>
                </div>
              )}

              {/* Special needs */}
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#374151", display:"flex", alignItems:"center", gap:5, marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>
                  <MessageSquare size={11} color="#2B96A8"/>
                  Besoins spéciaux
                  <span style={{ color:"#9CA3AF", fontWeight:400, textTransform:"none" }}>(optionnel)</span>
                </label>
                <textarea
                  className="co2-textarea"
                  value={cur.specialNeeds}
                  onChange={e => patch(activeIdx, { specialNeeds: e.target.value })}
                  placeholder="Allergies, mobilité réduite, préférences alimentaires…"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="co2-right-footer">
              {/* Single mode price recap */}
              {!isItinerary && cur.selectedSlot && (
                <div style={{ background:"#F9FAFB", borderRadius:12, padding:"12px 14px", marginBottom:14, border:"1px solid #F0F0F0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6B7280", marginBottom:5 }}>
                    <span>{curPrice} TND × {cur.people} pers.</span>
                    <span style={{ fontWeight:600, color:"#374151" }}>{curTotal} TND</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#6B7280", paddingBottom:10, borderBottom:"1px dashed #E5E7EB", marginBottom:10 }}>
                    <span>Frais de service (10%)</span>
                    <span style={{ fontWeight:600, color:"#374151" }}>{curFee} TND</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:900, color:"#111827" }}>
                    <span>Total</span>
                    <span style={{ color:"#2B96A8", fontFamily:"'Cormorant Garamond',serif" }}>{curGrand} TND</span>
                  </div>
                </div>
              )}

              <button
                className={`co2-cta ${!canSubmit ? "off" : status==="loading" ? "spin" : "on"}`}
                disabled={!canSubmit}
                onClick={handleReserve}
              >
                {status === "loading"
                  ? <><Loader2 size={15} style={{ animation:"coSpin .7s linear infinite" }}/> Réservation en cours…</>
                  : !canSubmit
                  ? "Choisissez un créneau"
                  : isItinerary
                  ? <><Check size={15}/> Réserver l'itinéraire — {grandTotal} TND</>
                  : <><Check size={15}/> Réserver — {curGrand} TND</>
                }
              </button>

              <div style={{ display:"flex", justifyContent:"center", gap:20, marginTop:12, flexWrap:"wrap" }}>
                {[
                  { icon:<Lock size={11} color="#059669"/>,        text:"Paiement sécurisé" },
                  { icon:<RefreshCcw size={11} color="#2563EB"/>,  text:"Annulation 24h" },
                  { icon:<ShieldCheck size={11} color="#8B5CF6"/>, text:"Confirmé instantanément" },
                ].map(g => (
                  <span key={g.text} style={{ fontSize:11, color:"#9CA3AF", display:"flex", alignItems:"center", gap:5 }}>
                    {g.icon}{g.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}