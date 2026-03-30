"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  X, CalendarDays, Users, MapPin, Clock, Tag,
  Check, Minus, Plus, ShieldCheck, RefreshCcw, Lock,
  Loader2, CheckCircle, AlertCircle,
} from "lucide-react";

interface Excursion {
  id: string;
  title: string;
  city: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
}

interface Props {
  exc?: Excursion;
  excursion?: Excursion;
  userId?: string;
  onClose: () => void;
}

const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .co-overlay {
    position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;
    display:flex;align-items:center;justify-content:center;padding:20px;
    backdrop-filter:blur(4px);animation:coFadeIn 0.2s ease;
  }
  .co-modal {
    background:white;border-radius:24px;padding:28px;width:100%;max-width:460px;
    max-height:90vh;overflow-y:auto;box-shadow:0 28px 80px rgba(0,0,0,0.28);
    animation:coSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1);font-family:'DM Sans',sans-serif;
  }
  .co-modal::-webkit-scrollbar{width:4px}
  .co-modal::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}
  .co-counter-btn {
    width:42px;height:42px;border:none;background:#F3F4F6;border-radius:10px;
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    transition:all 0.15s;font-family:'DM Sans',sans-serif;
  }
  .co-counter-btn:hover:not(:disabled){background:#E5E7EB}
  .co-counter-btn:disabled{opacity:0.35;cursor:not-allowed}
  .co-cta {
    width:100%;padding:15px;border:none;border-radius:14px;font-size:15px;font-weight:800;
    cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;
    display:flex;align-items:center;justify-content:center;gap:8px;
  }
  .co-cta.active{background:#2B96A8;color:white}
  .co-cta.active:hover{background:#1e7a8a;transform:translateY(-1px);box-shadow:0 8px 20px rgba(43,150,168,0.3)}
  .co-cta.disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed}
  .co-cta.loading{background:#7CC4D1;color:white;cursor:not-allowed}
  .co-date-input {
    width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:12px;
    font-size:14px;font-family:'DM Sans',sans-serif;color:#111827;
    transition:all 0.2s;background:#FAFAFA;outline:none;
  }
  .co-date-input:focus{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,0.08)}
  .co-textarea {
    width:100%;padding:11px 14px;min-height:72px;border:1.5px solid #E5E7EB;
    border-radius:12px;font-size:13px;font-family:'DM Sans',sans-serif;
    color:#374151;resize:vertical;outline:none;transition:all 0.2s;background:#FAFAFA;
  }
  .co-textarea:focus{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,0.08)}
  .co-close-btn {
    background:#F3F4F6;border:none;cursor:pointer;color:#9CA3AF;
    width:34px;height:34px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;
  }
  .co-close-btn:hover{background:#E5E7EB;color:#6B7280}
  @keyframes coFadeIn  {from{opacity:0}to{opacity:1}}
  @keyframes coSlideUp {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes coSpin    {to{transform:rotate(360deg)}}
`;

const genBookingCode = () =>
  "VJ-" + Date.now().toString(36).toUpperCase() + "-" +
  Math.random().toString(36).substring(2, 5).toUpperCase();

export default function CheckoutModal({ exc, excursion, onClose }: Props) {
  const supabase = createClient();
  const data = exc ?? excursion;

  const [people,       setPeople]       = useState(1);
  const [date,         setDate]         = useState("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [status,       setStatus]       = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [bookingCode,  setBookingCode]  = useState("");

  if (!data) return null;

  const totalPrice  = data.price_per_person * people;
  const platformFee = Math.round(totalPrice * 0.1);
  const grandTotal  = totalPrice + platformFee;
  const canSubmit   = !!date && status === "idle";

  const handleReserve = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      // Check if user is authenticated
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      
      if (authErr) {
        console.error("Auth error details:", authErr);
        setErrorMsg("Erreur d'authentification. Veuillez vous reconnecter.");
        setStatus("error");
        return;
      }
      
      if (!user) {
        setErrorMsg("Vous devez être connecté pour réserver.");
        setStatus("error");
        return;
      }

      console.log("User authenticated:", user.id);

      // Validate date
      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) {
        setErrorMsg("Date invalide");
        setStatus("error");
        return;
      }

      const code = genBookingCode();
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log("Formatted date:", formattedDate);
      console.log("People count:", people);
      console.log("Total price:", grandTotal);
      console.log("Platform fee:", platformFee);

      // Prepare the data exactly matching your table schema
      const reservationData = {
        touriste_id: user.id,
        excursion_id: data.id,
        date: formattedDate,
        people_count: people,
        total_price: grandTotal,
        platform_fee: platformFee,
        status: "pending",
        special_needs: specialNeeds.trim() || null,
        booking_code: code,
        payment_status: "unpaid",
        payment_method: null,
        special_notes: null,
      };

      console.log("Attempting to insert:", JSON.stringify(reservationData, null, 2));

      // Try to insert with explicit error handling
      const result = await supabase
        .from("reservations")
        .insert([reservationData]) // Use array format
        .select();

      // Log the full result object
      console.log("Supabase response:", JSON.stringify(result, null, 2));

      if (result.error) {
        console.error("Detailed insert error:", {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          status: result.status,
          statusText: result.statusText
        });
        
        // Provide user-friendly error message based on error code
        if (result.error.code === "23503") {
          setErrorMsg("Erreur: L'excursion n'existe pas ou a été supprimée.");
        } else if (result.error.code === "23505") {
          setErrorMsg("Erreur: Cette réservation existe déjà.");
        } else if (result.error.code === "42703") {
          setErrorMsg("Erreur technique: Colonne incorrecte dans la base de données.");
        } else if (result.error.message) {
          setErrorMsg(`Erreur: ${result.error.message}`);
        } else {
          setErrorMsg("Une erreur est survenue lors de la réservation.");
        }
        
        setStatus("error");
        return;
      }

      console.log("Reservation created successfully:", result.data);
      setBookingCode(code);
      setStatus("success");

    } catch (err) {
      console.error("Unexpected error in reservation:", err);
      console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue lors de la réservation");
      setStatus("error");
    }
  };

  /* ── VUE SUCCÈS ── */
  if (status === "success") return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="co-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="co-modal" style={{ textAlign:"center", padding:"40px 32px" }}>

          <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#D1FAE5,#A7F3D0)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", boxShadow:"0 8px 24px rgba(5,150,105,.2)" }}>
            <CheckCircle size={36} color="#059669" strokeWidth={2}/>
          </div>

          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:"#111827", marginBottom:8 }}>
            Réservation confirmée !
          </h2>
          <p style={{ fontSize:14, color:"#6B7280", marginBottom:24, lineHeight:1.65 }}>
            <strong style={{ color:"#111827" }}>{sanitizeText(data.title)}</strong><br/>
            le <strong style={{ color:"#111827" }}>
              {new Date(date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
            </strong> pour {people} personne{people > 1 ? "s" : ""}
          </p>

          {/* Code réservation */}
          <div style={{ background:"linear-gradient(135deg,#EFF9FB,#D0F0F5)", border:"1px solid rgba(43,150,168,.25)", borderRadius:16, padding:"18px 24px", marginBottom:22 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#2B96A8", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 6px" }}>
              N° de réservation
            </p>
            <p style={{ fontSize:22, fontWeight:900, color:"#111827", margin:0, letterSpacing:"2px", fontFamily:"'Playfair Display',serif" }}>
              {bookingCode}
            </p>
          </div>

          {/* Récap lignes */}
          <div style={{ background:"#F9FAFB", borderRadius:12, padding:"14px 16px", marginBottom:22, textAlign:"left" }}>
            {([
              ["Date",       new Date(date).toLocaleDateString("fr-FR")],
              ["Personnes",  `${people} personne${people > 1 ? "s" : ""}`],
              ["Sous-total", `${totalPrice} TND`],
              ["Frais (10%)",`${platformFee} TND`],
              ["Total payé", `${grandTotal} TND`],
            ] as [string, string][]).map(([label, val], i, arr) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"6px 0", borderBottom: i < arr.length - 1 ? "1px solid #F0F0F0" : "none" }}>
                <span style={{ color:"#9CA3AF" }}>{label}</span>
                <span style={{ fontWeight: i === arr.length - 1 ? 800 : 600, color: i === arr.length - 1 ? "#2B96A8" : "#111827" }}>{val}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:20 }}>
            Une confirmation vous sera envoyée par email.
          </p>

          <button className="co-cta active" onClick={onClose}>
            <Check size={16}/> Fermer
          </button>
        </div>
      </div>
    </>
  );

  /* ── VUE FORMULAIRE ── */
  return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="co-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="co-modal">

          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#111827", marginBottom:2 }}>
                Réserver
              </h2>
              <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>Complétez votre réservation ci-dessous</p>
            </div>
            <button className="co-close-btn" onClick={onClose}><X size={16}/></button>
          </div>

          {/* Résumé excursion */}
          <div style={{ background:"#F9FAFB", borderRadius:14, padding:"14px 16px", marginBottom:20, border:"1px solid #F0F0F0" }}>
            <p style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:6, margin:"0 0 6px" }}>
              {sanitizeText(data.title)}
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
              <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#6B7280" }}>
                <MapPin size={11} color="#2B96A8"/>{sanitizeText(data.city)}
              </span>
              <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#6B7280" }}>
                <Clock size={11}/>{data.duration_hours}h
              </span>
              <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#6B7280" }}>
                <Tag size={11}/>{data.price_per_person} TND / pers.
              </span>
            </div>
          </div>

          {/* Erreur */}
          {status === "error" && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, marginBottom:16, fontSize:13, color:"#DC2626", fontWeight:600 }}>
              <AlertCircle size={15}/>{errorMsg || "Une erreur est survenue. Réessayez."}
            </div>
          )}

          {/* Date */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#374151", letterSpacing:0.5, textTransform:"uppercase", marginBottom:7 }}>
              <CalendarDays size={12} color="#2B96A8"/> Date souhaitée *
            </label>
            <input type="date" className="co-date-input" value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}/>
          </div>

          {/* Personnes */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#374151", letterSpacing:0.5, textTransform:"uppercase", marginBottom:7 }}>
              <Users size={12} color="#2B96A8"/> Personnes
            </label>
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"8px 16px", border:"1.5px solid #E5E7EB", borderRadius:12, background:"#FAFAFA" }}>
              <button type="button" className="co-counter-btn"
                onClick={() => setPeople(p => Math.max(1, p - 1))} disabled={people <= 1}>
                <Minus size={15}/>
              </button>
              <span style={{ flex:1, textAlign:"center", fontSize:22, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display',serif" }}>
                {people}
              </span>
              <button type="button" className="co-counter-btn"
                onClick={() => setPeople(p => Math.min(data.max_people, p + 1))} disabled={people >= data.max_people}>
                <Plus size={15}/>
              </button>
            </div>
            <p style={{ fontSize:11, color:"#9CA3AF", marginTop:5, display:"flex", alignItems:"center", gap:4 }}>
              <Users size={10}/> Max {data.max_people} personnes
            </p>
          </div>

          {/* Besoins spéciaux */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#374151", letterSpacing:0.5, textTransform:"uppercase", marginBottom:7 }}>
              <Tag size={12} color="#2B96A8"/> Besoins spéciaux <span style={{ color:"#9CA3AF", fontWeight:400, textTransform:"none", fontSize:11 }}>(optionnel)</span>
            </label>
            <textarea className="co-textarea" value={specialNeeds}
              onChange={e => setSpecialNeeds(e.target.value)}
              placeholder="Allergies, mobilité réduite, préférences alimentaires..."/>
          </div>

          {/* Récap prix */}
          <div style={{ background:"#F9FAFB", borderRadius:14, padding:"16px", marginBottom:20, border:"1px solid #F0F0F0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", marginBottom:8 }}>
              <span>{data.price_per_person} TND × {people} personne{people > 1 ? "s" : ""}</span>
              <span style={{ fontWeight:600, color:"#374151" }}>{totalPrice} TND</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", paddingBottom:12, borderBottom:"1px dashed #E5E7EB", marginBottom:12 }}>
              <span>Frais de service (10%)</span>
              <span style={{ fontWeight:600, color:"#374151" }}>{platformFee} TND</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:17, fontWeight:900, color:"#111827" }}>
              <span>Total</span>
              <span style={{ color:"#2B96A8", fontFamily:"'Playfair Display',serif" }}>{grandTotal} TND</span>
            </div>
          </div>

          {/* Bouton RÉSERVER */}
          <button
            className={`co-cta ${!date ? "disabled" : status === "loading" ? "loading" : "active"}`}
            disabled={!canSubmit}
            onClick={handleReserve}
          >
            {status === "loading"
              ? <><Loader2 size={16} style={{ animation:"coSpin .7s linear infinite" }}/> Réservation en cours...</>
              : !date
                ? <><CalendarDays size={15}/> Choisissez d&apos;abord une date</>
                : <><Check size={16}/> Réserver — {grandTotal} TND</>
            }
          </button>

          {/* Garanties */}
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:7 }}>
            {[
              { icon:<Lock size={12} color="#059669"/>,        text:"Paiement 100% sécurisé" },
              { icon:<RefreshCcw size={12} color="#2563EB"/>,  text:"Annulation gratuite 24h avant" },
              { icon:<ShieldCheck size={12} color="#8B5CF6"/>, text:"Réservation confirmée instantanément" },
            ].map(g => (
              <p key={g.text} style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:7, margin:0 }}>
                {g.icon}{g.text}
              </p>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}