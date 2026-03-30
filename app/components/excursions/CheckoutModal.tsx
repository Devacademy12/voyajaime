"use client";

import { useState } from "react";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  X, CalendarDays, Users, MapPin, Clock, Tag,
  Check, Minus, Plus, ShieldCheck, RefreshCcw, Lock,
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
  exc?: Excursion;        // utilisé dans ExcursionClient
  excursion?: Excursion;  // utilisé dans FavorisClient
  userId?: string;
  onClose: () => void;
}

// ─── Styles autonomes — le modal fonctionne sur n'importe quelle page ───────
const MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .co-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(4px);
    animation: coFadeIn 0.2s ease;
  }
  .co-modal {
    background: white;
    border-radius: 24px;
    padding: 28px;
    width: 100%;
    max-width: 460px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 28px 80px rgba(0,0,0,0.28);
    animation: coSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1);
    font-family: 'DM Sans', sans-serif;
  }
  .co-modal::-webkit-scrollbar { width: 4px; }
  .co-modal::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }

  .co-counter-btn {
    width: 42px;
    height: 42px;
    border: none;
    background: #F3F4F6;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .co-counter-btn:hover:not(:disabled) { background: #E5E7EB; }
  .co-counter-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .co-cta {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .co-cta.active {
    background: #111827;
    color: white;
  }
  .co-cta.active:hover {
    background: #1f2937;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
  }
  .co-cta.disabled {
    background: #E5E7EB;
    color: #9CA3AF;
    cursor: not-allowed;
  }

  .co-date-input {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid #E5E7EB;
    border-radius: 12px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #111827;
    transition: all 0.2s;
    background: #FAFAFA;
    outline: none;
  }
  .co-date-input:focus {
    border-color: #2B96A8;
    box-shadow: 0 0 0 3px rgba(43,150,168,0.08);
  }

  .co-close-btn {
    background: #F3F4F6;
    border: none;
    cursor: pointer;
    color: #9CA3AF;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .co-close-btn:hover { background: #E5E7EB; color: #6B7280; }

  @keyframes coFadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes coSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
`;

export default function CheckoutModal({ exc, excursion, onClose }: Props) {
  const data = exc ?? excursion;

  const [people, setPeople] = useState(1);
  const [date,   setDate]   = useState("");

  if (!data) return null;

  const totalPrice = data.price_per_person * people;
  const commission = Math.round(totalPrice * 0.1);
  const grandTotal = totalPrice + commission;

  return (
    <>
      <style>{MODAL_CSS}</style>

      <div
        className="co-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="co-modal">

          {/* ── Header ── */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#111827", marginBottom:2 }}>
                Réserver
              </h2>
              <p style={{ fontSize:12, color:"#9CA3AF" }}>Confirmez votre réservation ci-dessous</p>
            </div>
            <button className="co-close-btn" onClick={onClose}>
              <X size={16}/>
            </button>
          </div>

          {/* ── Résumé excursion ── */}
          <div style={{ background:"#F9FAFB", borderRadius:14, padding:"14px 16px", marginBottom:22, border:"1px solid #F0F0F0" }}>
            <p style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:6 }}>
              {sanitizeText(data.title)}
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"10px" }}>
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

          {/* ── Date ── */}
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#374151", letterSpacing:0.5, textTransform:"uppercase", marginBottom:7 }}>
              <CalendarDays size={12} color="#2B96A8"/> Date souhaitée
            </label>
            <input
              type="date"
              className="co-date-input"
              value={date}
              onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* ── Personnes ── */}
          <div style={{ marginBottom:22 }}>
            <label style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color:"#374151", letterSpacing:0.5, textTransform:"uppercase", marginBottom:7 }}>
              <Users size={12} color="#2B96A8"/> Nombre de personnes
            </label>
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"8px 16px", border:"1.5px solid #E5E7EB", borderRadius:12, background:"#FAFAFA" }}>
              <button
                type="button"
                className="co-counter-btn"
                onClick={() => setPeople(p => Math.max(1, p - 1))}
                disabled={people <= 1}
              >
                <Minus size={15}/>
              </button>
              <span style={{ flex:1, textAlign:"center", fontSize:22, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display',serif" }}>
                {people}
              </span>
              <button
                type="button"
                className="co-counter-btn"
                onClick={() => setPeople(p => Math.min(data.max_people, p + 1))}
                disabled={people >= data.max_people}
              >
                <Plus size={15}/>
              </button>
            </div>
            <p style={{ fontSize:11, color:"#9CA3AF", marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
              <Users size={10}/>Max {data.max_people} personnes par réservation
            </p>
          </div>

          {/* ── Récap prix ── */}
          <div style={{ background:"#F9FAFB", borderRadius:14, padding:"16px", marginBottom:20, border:"1px solid #F0F0F0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", marginBottom:8 }}>
              <span>{data.price_per_person} TND × {people} personne{people > 1 ? "s" : ""}</span>
              <span style={{ fontWeight:600, color:"#374151" }}>{totalPrice} TND</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", paddingBottom:12, borderBottom:"1px dashed #E5E7EB", marginBottom:12 }}>
              <span>Frais de service (10%)</span>
              <span style={{ fontWeight:600, color:"#374151" }}>{commission} TND</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:17, fontWeight:900, color:"#111827" }}>
              <span>Total</span>
              <span style={{ color:"#2B96A8", fontFamily:"'Playfair Display',serif" }}>{grandTotal} TND</span>
            </div>
          </div>

          {/* ── CTA ── */}
          <button
            className={`co-cta ${date ? "active" : "disabled"}`}
            disabled={!date}
            onClick={() => {
              if (!date) return;
              alert("Paiement en cours d'intégration !");
              onClose();
            }}
          >
            {date
              ? <><Check size={16}/>Confirmer — {grandTotal} TND</>
              : <><CalendarDays size={15}/>Choisissez d&apos;abord une date</>
            }
          </button>

          {/* ── Garanties ── */}
          <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:7 }}>
            {[
              { icon:<Lock size={12} color="#059669"/>,       text:"Paiement 100% sécurisé" },
              { icon:<RefreshCcw size={12} color="#2563EB"/>, text:"Annulation gratuite 24h avant" },
              { icon:<ShieldCheck size={12} color="#8B5CF6"/>,text:"Réservation confirmée instantanément" },
            ].map(g => (
              <p key={g.text} style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", gap:7 }}>
                {g.icon}{g.text}
              </p>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}