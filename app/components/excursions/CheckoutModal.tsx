"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  X, CalendarDays, Users, MapPin, Clock, Tag,
  Check, Minus, Plus, ShieldCheck, RefreshCcw, Lock,
  Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  CreditCard, MessageSquare, Timer, History, ArrowRight, Phone, Navigation, Ticket
} from "lucide-react";

interface TimeSlot {
  time: string;
  language?: string;
  price: number;
  slots: number;
  groupPrice?: boolean;
  start_time?: string;
  end_time?: string;
}

interface DateDispo {
  date: string;
  dateObj: Date;
  dayName: string;
  slots: TimeSlot[];
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
  userId?: string;
  onClose: () => void;
}

const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDateLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  if (checkDate.getTime() === today.getTime()) {
    return "Aujourd'hui " + date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } else if (checkDate.getTime() === tomorrow.getTime()) {
    return "Demain " + date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } else {
    return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" });
  }
}

function TimeSlotPicker({ 
  dateObj, 
  slots, 
  selectedSlot, 
  onSelectSlot,
  currency = "TND"
}: { 
  dateObj: DateDispo;
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  currency?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div style={{ 
      border: "1px solid #E5E7EB", 
      borderRadius: 16, 
      overflow: "hidden",
      marginBottom: 16,
      background: "white"
    }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "#F9FAFB",
          borderBottom: expanded ? "1px solid #E5E7EB" : "none",
          cursor: "pointer",
          transition: "all .15s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarDays size={18} color="#2B96A8" />
          <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{dateObj.dayName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {slots.reduce((acc, s) => acc + s.slots, 0)} places disponibles
          </span>
          <ChevronRight 
            size={18} 
            style={{ 
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform .2s"
            }} 
          />
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "12px" }}>
          {slots.map((slot, idx) => {
            const isSelected = selectedSlot === slot;
            const isAvailable = slot.slots > 0;
            const isLowStock = slot.slots <= 3 && slot.slots > 0;
            
            return (
              <div
                key={idx}
                onClick={() => isAvailable && onSelectSlot(slot)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  marginBottom: idx < slots.length - 1 ? 8 : 0,
                  background: isSelected ? "#EFF9FB" : "white",
                  border: `1.5px solid ${isSelected ? "#2B96A8" : isAvailable ? "#E5E7EB" : "#FEE2E2"}`,
                  borderRadius: 12,
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  opacity: isAvailable ? 1 : 0.6,
                  transition: "all .15s",
                  position: "relative"
                }}
              >
                {!isAvailable && (
                  <div style={{
                    position: "absolute",
                    top: -8,
                    right: 12,
                    background: "#EF4444",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}>
                    Complet
                  </div>
                )}
                
                {isLowStock && isAvailable && (
                  <div style={{
                    position: "absolute",
                    top: -8,
                    right: 12,
                    background: "#F59E0B",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}>
                    Dernières places !
                  </div>
                )}

                <div style={{ flex: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ 
                      fontSize: 15, 
                      fontWeight: 800, 
                      color: isAvailable ? "#111827" : "#9CA3AF"
                    }}>
                      {slot.time}
                    </span>
                    {slot.language && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6B7280",
                        background: "#F3F4F6",
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}>
                        {slot.language}
                      </span>
                    )}
                  </div>
                  
                  {slot.groupPrice && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Users size={11} color="#10B981" />
                      <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>
                        Tarif de groupe disponible
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right" }}>
                  {isAvailable ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#2B96A8" }}>
                        {slot.price} {currency}
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>
                          /pers.
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: isLowStock ? "#F59E0B" : "#6B7280",
                        fontWeight: isLowStock ? 700 : 500,
                        marginTop: 2
                      }}>
                        {slot.slots} place{slot.slots > 1 ? "s" : ""} disponible{slot.slots > 1 ? "s" : ""}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#EF4444" }}>
                      Complet
                    </div>
                  )}
                </div>

                {isAvailable && (
                  <div style={{ marginLeft: 12, flexShrink: 0 }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#2B96A8" : "#D1D5DB"}`,
                      background: isSelected ? "#2B96A8" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {isSelected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "white" }} />}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .co-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);animation:coFadeIn .2s ease}
  .co-modal{background:white;border-radius:24px;padding:28px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 28px 80px rgba(0,0,0,0.28);animation:coSlideUp .28s cubic-bezier(0.34,1.56,0.64,1);font-family:'DM Sans',sans-serif}
  .co-modal::-webkit-scrollbar{width:4px}
  .co-modal::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}
  .co-close-btn{background:#F3F4F6;border:none;cursor:pointer;color:#9CA3AF;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
  .co-close-btn:hover{background:#E5E7EB;color:#6B7280}
  .co-counter-btn{width:42px;height:42px;border:none;background:#F3F4F6;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .co-counter-btn:hover:not(:disabled){background:#E5E7EB}
  .co-counter-btn:disabled{opacity:.35;cursor:not-allowed}
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

const genBookingCode = () =>
  "VJ-" + Date.now().toString(36).toUpperCase() + "-" +
  Math.random().toString(36).substring(2, 5).toUpperCase();

export default function CheckoutModal({ exc, excursion, onClose }: Props) {
  const supabase = createClient();
  const data = exc ?? excursion;
  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [people, setPeople] = useState(1);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [bookingCode, setBookingCode] = useState("");

  // Transformer les données disponibles
  const groupedDates = useMemo(() => {
    if (!data?.available_dates || !Array.isArray(data.available_dates)) return [];
    
    const groups = new Map<string, TimeSlot[]>();
    
    data.available_dates.forEach((item: any) => {
      const date = item.date;
      if (!date) return;
      
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      
      const timeStr = item.time || `${item.start_time || "09:00"} – ${item.end_time || "17:00"}`;
      
      groups.get(date)!.push({
        time: timeStr,
        language: item.language,
        price: item.price_per_person || data.price_per_person,
        slots: item.slots || 0,
        groupPrice: item.group_discount_available || false,
        start_time: item.start_time,
        end_time: item.end_time,
      });
    });
    
    return Array.from(groups.entries())
      .map(([date, slots]) => ({
        date,
        dateObj: new Date(date),
        dayName: formatDateLabel(new Date(date)),
        slots: slots.sort((a, b) => a.time.localeCompare(b.time))
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  // Mettre à jour le prix total
  const currentPrice = selectedSlot?.price || data?.price_per_person || 0;
  const totalPrice = currentPrice * people;
  const platformFee = Math.round(totalPrice * 0.1);
  const grandTotal = totalPrice + platformFee;
  
  const canSubmit = !!selectedSlot && selectedSlot.slots >= people && status === "idle";
  const maxPeopleForSlot = selectedSlot?.slots || data?.max_people || 1;

  useEffect(() => {
    if (people > maxPeopleForSlot) {
      setPeople(Math.max(1, maxPeopleForSlot));
    }
  }, [selectedSlot, maxPeopleForSlot, people]);

  const handleSelectSlot = (dateObj: DateDispo, slot: TimeSlot) => {
    setSelectedSlot(slot);
    setSelectedDate(dateObj.date);
  };

  const handleReserve = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");
    
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setErrorMsg("Vous devez être connecté pour réserver.");
        setStatus("error");
        return;
      }
      
      const code = genBookingCode();
      
      const result = await supabase.from("reservations").insert([{
        touriste_id: user.id,
        excursion_id: data!.id,
        date: selectedDate,
        time: selectedSlot?.time,
        people_count: people,
        total_price: grandTotal,
        platform_fee: platformFee,
        status: "pending",
        special_needs: specialNeeds.trim() || null,
        booking_code: code,
        payment_status: "unpaid",
        payment_method: null,
        special_notes: null,
      }]).select();

      if (result.error) {
        setErrorMsg(result.error.message || "Erreur lors de la réservation.");
        setStatus("error");
        return;
      }
      
      // Appeler la fonction RPC pour décrémenter les slots
      const { error: rpcError } = await supabase.rpc('decrement_slot', {
        exc_id: data!.id,
        date_str: selectedDate,
        qty: people
      });
      
      if (rpcError) {
        console.error("Erreur décrémentation:", rpcError);
        // La réservation est créée mais les slots n'ont pas été mis à jour
        // Vous pourriez vouloir annuler la réservation ici
      }
      
      setBookingCode(code);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <>
        <style>{MODAL_CSS}</style>
        <div className="co-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
          <div className="co-modal" style={{ textAlign: "center", padding: "40px 32px" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#D1FAE5,#A7F3D0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(5,150,105,.2)" }}>
              <CheckCircle size={36} color="#059669" strokeWidth={2}/>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#111827", marginBottom: 8 }}>
              Réservation confirmée !
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.65 }}>
              <strong style={{ color: "#111827" }}>{sanitizeText(data!.title)}</strong><br/>
              le <strong style={{ color: "#111827" }}>
                {new Date(selectedDate).toLocaleDateString("fr-FR",{ day:"numeric", month:"long", year:"numeric" })}
              </strong> à <strong>{selectedSlot?.time}</strong> pour {people} personne{people > 1 ? "s" : ""}
            </p>
            <div style={{ background: "linear-gradient(135deg,#EFF9FB,#D0F0F5)", border: "1px solid rgba(43,150,168,.25)", borderRadius: 16, padding: "18px 24px", marginBottom: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#2B96A8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 6px" }}>N° de réservation</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#111827", margin: 0, letterSpacing: "2px", fontFamily: "'Playfair Display',serif" }}>{bookingCode}</p>
            </div>
            <button className="co-cta active" onClick={onClose}><Check size={16}/> Fermer</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="co-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="co-modal">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 2 }}>Réserver</h2>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Choisissez votre créneau horaire</p>
            </div>
            <button className="co-close-btn" onClick={onClose}><X size={16}/></button>
          </div>

          <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "12px 14px", marginBottom: 18, border: "1px solid #F0F0F0" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>{sanitizeText(data!.title)}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B7280" }}><MapPin size={11} color="#2B96A8"/>{sanitizeText(data!.city)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B7280" }}><Clock size={11}/>{data!.duration_hours}h</span>
            </div>
          </div>

          {status === "error" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
              <AlertCircle size={15}/>{errorMsg}
            </div>
          )}

          {groupedDates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#FFF7ED", borderRadius: 16, border: "1px solid #FED7AA" }}>
              <CalendarDays size={32} color="#F97316" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#9A3412", margin: "0 0 6px" }}>Aucune date disponible</p>
              <p style={{ fontSize: 12, color: "#C2410C", margin: 0 }}>De nouvelles dates seront bientôt ajoutées</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
                  <CalendarDays size={14} color="#2B96A8" />
                  Choisissez votre créneau horaire
                </label>

                {groupedDates.map((dateGroup) => (
                  <TimeSlotPicker
                    key={dateGroup.date}
                    dateObj={dateGroup}
                    slots={dateGroup.slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={(slot) => handleSelectSlot(dateGroup, slot)}
                    currency="TND"
                  />
                ))}
              </div>

              {selectedSlot && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
                    <Users size={14} color="#2B96A8" />
                    Nombre de personnes
                  </label>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 16px", border: "1.5px solid #E5E7EB", borderRadius: 12, background: "white" }}>
                    <button
                      onClick={() => setPeople(p => Math.max(1, p - 1))}
                      disabled={people <= 1}
                      className="co-counter-btn"
                    >
                      <Minus size={15}/>
                    </button>
                    <span style={{ flex: 1, textAlign: "center", fontSize: 22, fontWeight: 900, color: "#111827", fontFamily: "'Playfair Display',serif" }}>
                      {people}
                    </span>
                    <button
                      onClick={() => setPeople(p => Math.min(maxPeopleForSlot, p + 1))}
                      disabled={people >= maxPeopleForSlot}
                      className="co-counter-btn"
                    >
                      <Plus size={15}/>
                    </button>
                  </div>
                  
                  <p style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
                    Maximum {maxPeopleForSlot} personne{maxPeopleForSlot > 1 ? "s" : ""}
                    {selectedSlot && ` · ${selectedSlot.slots} place${selectedSlot.slots > 1 ? "s" : ""} disponible${selectedSlot.slots > 1 ? "s" : ""}`}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: .5, textTransform: "uppercase", marginBottom: 7 }}>
                  <MessageSquare size={12} color="#2B96A8"/> Besoins spéciaux
                  <span style={{ color: "#9CA3AF", fontWeight: 400, textTransform: "none", fontSize: 11 }}>(optionnel)</span>
                </label>
                <textarea className="co-textarea" value={specialNeeds} onChange={e => setSpecialNeeds(e.target.value)} placeholder="Allergies, mobilité réduite, préférences alimentaires..."/>
              </div>

              <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "16px", marginBottom: 20, border: "1px solid #F0F0F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", marginBottom: 8 }}>
                  <span>{currentPrice} TND × {people} personne{people > 1 ? "s" : ""}</span>
                  <span style={{ fontWeight: 600, color: "#374151" }}>{totalPrice} TND</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6B7280", paddingBottom: 12, borderBottom: "1px dashed #E5E7EB", marginBottom: 12 }}>
                  <span>Frais de service (10%)</span>
                  <span style={{ fontWeight: 600, color: "#374151" }}>{platformFee} TND</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 900, color: "#111827" }}>
                  <span>Total</span>
                  <span style={{ color: "#2B96A8", fontFamily: "'Playfair Display',serif" }}>{grandTotal} TND</span>
                </div>
              </div>

              <button
                className={`co-cta ${!selectedSlot ? "disabled" : status === "loading" ? "loading" : "active"}`}
                disabled={!canSubmit}
                onClick={handleReserve}
              >
                {status === "loading"
                  ? <><Loader2 size={16} style={{ animation: "coSpin .7s linear infinite" }}/> Réservation en cours...</>
                  : !selectedSlot
                  ? <><CalendarDays size={15}/> Choisissez un créneau disponible</>
                  : <><Check size={16}/> Réserver — {grandTotal} TND</>
                }
              </button>

              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { icon:<Lock size={12} color="#059669"/>, text:"Paiement 100% sécurisé" },
                  { icon:<RefreshCcw size={12} color="#2563EB"/>, text:"Annulation gratuite 24h avant" },
                  { icon:<ShieldCheck size={12} color="#8B5CF6"/>, text:"Réservation confirmée instantanément" },
                ].map(g => (
                  <p key={g.text} style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 7, margin: 0 }}>
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