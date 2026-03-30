"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  CalendarDays, MapPin, Clock, Users, Sparkles,
  CheckCircle, CreditCard, Wallet, Building2,
  ChevronRight, ChevronLeft, MessageSquare, X, Loader,
  ShieldCheck, ArrowRight, Ticket, Phone, Navigation,
  AlertCircle, Trash2, AlertTriangle,
} from "lucide-react";

interface Excursion {
  title: string; city: string; photos: string[];
  duration_hours: number; price_per_person: number;
  meeting_point?: string;
}
interface Reservation {
  id: string; booking_code: string; date: string; time: string;
  people_count: number; total_price: number; platform_fee: number;
  status: string; payment_status?: string | null;
  excursion: Excursion | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:   { label: "En attente", color: "#92400E", bg: "#FEF3C7", border: "#FDE68A", dot: "#F59E0B" },
  confirmed: { label: "Confirmée",  color: "#065F46", bg: "#D1FAE5", border: "#6EE7B7", dot: "#10B981" },
  completed: { label: "Terminée",   color: "#1E40AF", bg: "#DBEAFE", border: "#93C5FD", dot: "#3B82F6" },
  cancelled: { label: "Annulée",    color: "#991B1B", bg: "#FEE2E2", border: "#FCA5A5", dot: "#EF4444" },
};

type PayMethod = "card" | "cash" | "bank";

function fmtDate(d: string, short = false) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (short) return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ── Cancel Confirmation Modal ── */
function CancelConfirmModal({ 
  reservation, 
  onClose, 
  onConfirm 
}: { 
  reservation: Reservation; 
  onClose: () => void; 
  onConfirm: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleCancel = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Check if cancellation is allowed (24h before)
      const reservationDate = new Date(reservation.date + "T" + (reservation.time || "00:00:00"));
      const now = new Date();
      const hoursDiff = (reservationDate.getTime() - now.getTime()) / (1000 * 3600);
      
      if (hoursDiff < 24 && reservation.status !== "pending") {
        setError("Annulation impossible : moins de 24h avant l'excursion");
        setLoading(false);
        return;
      }
      
      const { error: updateErr } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservation.id);
      
      if (updateErr) throw updateErr;
      
      onConfirm(reservation.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
    }} onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: 400,
        padding: "28px 24px", textAlign: "center"
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "#FEE2E2",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px"
        }}>
          <AlertTriangle size={28} color="#DC2626" strokeWidth={1.5} />
        </div>
        
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
          Annuler la réservation
        </h3>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16, lineHeight: 1.5 }}>
          Êtes-vous sûr de vouloir annuler cette réservation pour<br/>
          <strong>{reservation.excursion?.title}</strong> du {fmtDate(reservation.date)} ?
        </p>
        
        {reservation.status === "pending" && (
          <div style={{
            background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12,
            padding: "10px 12px", marginBottom: 20, fontSize: 12, color: "#92400E"
          }}>
            <ShieldCheck size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
            Annulation gratuite (réservation en attente)
          </div>
        )}
        
        {error && (
          <div style={{
            display: "flex", gap: 8, padding: "10px 12px", background: "#FEF2F2",
            border: "1px solid #FCA5A5", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#DC2626"
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit"
            }}
          >
            Retour
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", background: "#DC2626", color: "white",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
            {loading ? "Annulation..." : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Checkout Modal (inchangé) ── */
function CheckoutModal({ reservation, onClose, onPaid }: {
  reservation: Reservation; onClose: () => void; onPaid: (id: string) => void;
}) {
  const supabase = createClient();
  const exc = reservation.excursion;
  const [step, setStep] = useState<1|2|3|4>(1);
  const [specialNote, setSpecialNote] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const base  = reservation.total_price - reservation.platform_fee;
  const fee   = reservation.platform_fee;
  const total = reservation.total_price;
  const STEPS = ["Revue", "Informations", "Paiement"];
  const PAY_METHODS = [
    { id: "card" as PayMethod, label: "Carte bancaire",    sub: "Visa · Mastercard · CIB", Icon: CreditCard },
    { id: "cash" as PayMethod, label: "Espèces sur place", sub: "Paiement à la rencontre", Icon: Wallet     },
    { id: "bank" as PayMethod, label: "Virement bancaire", sub: "RIB transmis par email",  Icon: Building2  },
  ];

  async function handlePay() {
    setLoading(true); setError("");
    try {
      const { error: e1 } = await supabase.from("reservations")
        .update({ payment_status: "paid", payment_method: payMethod, special_notes: specialNote || null })
        .eq("id", reservation.id);
      if (e1) {
        const { error: e2 } = await supabase.from("reservations").update({ status: "confirmed" }).eq("id", reservation.id);
        if (e2) throw e2;
      }
      setStep(4); onPaid(reservation.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du paiement.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(17,24,39,.7)",backdropFilter:"blur(8px)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px" }}
      onClick={e => { if (e.target === e.currentTarget && step !== 4) onClose(); }}>
      <div style={{ background:"#fff",borderRadius:24,width:"100%",maxWidth:520,maxHeight:"94vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,.35)" }}>

        {/* Sticky header */}
        <div style={{ position:"sticky",top:0,background:"white",zIndex:10,borderBottom:"1px solid #F3F4F6",padding:"20px 24px 16px" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:step!==4?20:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              {step>1&&step<4&&(
                <button onClick={()=>setStep(s=>(s-1) as 1|2|3|4)} style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid #E5E7EB",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <ChevronLeft size={16} color="#374151" />
                </button>
              )}
              <div>
                <p style={{ fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:1 }}>{step!==4?`Étape ${step} sur 3`:""}</p>
                <h2 style={{ fontSize:18,fontWeight:800,color:"#111827",lineHeight:1.2 }}>
                  {step===1&&"Revue de la réservation"}{step===2&&"Informations voyageur"}{step===3&&"Paiement"}{step===4&&"✓ Réservation confirmée"}
                </h2>
              </div>
            </div>
            {step!==4&&(
              <button onClick={onClose} style={{ width:32,height:32,borderRadius:"50%",border:"1.5px solid #E5E7EB",background:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <X size={15} color="#374151" />
              </button>
            )}
          </div>
          {step!==4&&(
            <div style={{ display:"flex",gap:6 }}>
              {STEPS.map((s,i)=>(
                <div key={s} style={{ flex:1,display:"flex",flexDirection:"column",gap:5 }}>
                  <div style={{ height:3,borderRadius:99,background:i<step?"#2B96A8":"#E5E7EB",transition:"background .3s" }} />
                  <span style={{ fontSize:10,fontWeight:600,color:i<step?"#2B96A8":i===step-1?"#111827":"#9CA3AF",textAlign:"center" }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:"24px" }}>
          {/* Step 1 */}
          {step===1&&(
            <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
              <div style={{ borderRadius:16,overflow:"hidden",height:180,background:"linear-gradient(135deg,#2B96A8,#0e7490)",position:"relative" }}>
                {exc?.photos?.[0]&&<img src={exc.photos[0]} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />}
                <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 50%)" }} />
                <div style={{ position:"absolute",bottom:14,left:14,right:14 }}>
                  <h3 style={{ fontSize:18,fontWeight:800,color:"white",marginBottom:4 }}>{exc?.title}</h3>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}><MapPin size={12} color="rgba(255,255,255,.8)" strokeWidth={2} /><span style={{ fontSize:13,color:"rgba(255,255,255,.9)",fontWeight:500 }}>{exc?.city}</span></div>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                {[{label:"Date",value:fmtDate(reservation.date,true),Icon:CalendarDays},{label:"Heure",value:reservation.time,Icon:Clock},{label:"Voyageurs",value:`${reservation.people_count} pers.`,Icon:Users},{label:"Durée",value:`${exc?.duration_hours??"–"}h`,Icon:Clock}].map(({label,value,Icon})=>(
                  <div key={label} style={{ background:"#F9FAFB",borderRadius:12,padding:"12px 14px",border:"1px solid #F3F4F6" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6 }}><Icon size={13} color="#9CA3AF" strokeWidth={1.5} /><span style={{ fontSize:11,fontWeight:600,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:.5 }}>{label}</span></div>
                    <p style={{ fontSize:14,fontWeight:700,color:"#111827" }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ border:"1.5px solid #E5E7EB",borderRadius:16,overflow:"hidden" }}>
                <div style={{ background:"#F9FAFB",padding:"14px 18px",borderBottom:"1px solid #E5E7EB" }}><p style={{ fontSize:12,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:.8 }}>Détail des frais</p></div>
                <div style={{ padding:"14px 18px",display:"flex",flexDirection:"column",gap:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ fontSize:14,color:"#374151" }}>{exc?.price_per_person} TND × {reservation.people_count} pers.</span><span style={{ fontSize:14,fontWeight:600,color:"#111827" }}>{base} TND</span></div>
                  <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ fontSize:14,color:"#374151" }}>Frais de service</span><span style={{ fontSize:14,fontWeight:600,color:"#111827" }}>{fee} TND</span></div>
                  <div style={{ height:1,background:"#E5E7EB" }} />
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><span style={{ fontSize:15,fontWeight:800,color:"#111827" }}>Total</span><span style={{ fontSize:20,fontWeight:900,color:"#2B96A8" }}>{total} TND</span></div>
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:"12px 14px",background:"#F0FDF4",borderRadius:12,border:"1px solid #BBF7D0" }}>
                <ShieldCheck size={16} color="#16A34A" strokeWidth={1.5} /><span style={{ fontSize:13,color:"#15803D",fontWeight:600 }}>Annulation gratuite jusqu'à 24h avant</span>
              </div>
              <button onClick={()=>setStep(2)} style={{ width:"100%",padding:"15px",background:"#111827",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                Continuer <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step===2&&(
            <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
              <div style={{ display:"flex",gap:12,alignItems:"center",background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:14,padding:"12px 14px" }}>
                <div style={{ width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0,background:"#E5E7EB" }}>{exc?.photos?.[0]&&<img src={exc.photos[0]} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />}</div>
                <div><p style={{ fontSize:13,fontWeight:700,color:"#111827" }}>{exc?.title}</p><p style={{ fontSize:12,color:"#6B7280" }}>{fmtDate(reservation.date)} · {reservation.people_count} pers.</p></div>
                <div style={{ marginLeft:"auto",textAlign:"right" }}><p style={{ fontSize:16,fontWeight:900,color:"#111827" }}>{total} <span style={{ fontSize:11,fontWeight:500 }}>TND</span></p></div>
              </div>
              <div>
                <label style={{ display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:700,color:"#111827",marginBottom:10 }}>
                  <MessageSquare size={14} color="#2B96A8" strokeWidth={2} />Besoins spéciaux<span style={{ fontSize:12,color:"#9CA3AF",fontWeight:400,marginLeft:4 }}>— optionnel</span>
                </label>
                <textarea value={specialNote} onChange={e=>setSpecialNote(e.target.value)} placeholder="Handicap, allergies, préférences particulières…" rows={4}
                  style={{ width:"100%",padding:"13px 14px",border:"1.5px solid #E5E7EB",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",color:"#111827",background:"#FAFAFA",boxSizing:"border-box",lineHeight:1.6,transition:"border-color .2s" }}
                  onFocus={e=>(e.target.style.borderColor="#2B96A8")} onBlur={e=>(e.target.style.borderColor="#E5E7EB")} />
              </div>
              <button onClick={()=>setStep(3)} style={{ width:"100%",padding:"15px",background:"#111827",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                Passer au paiement <ChevronRight size={17} />
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step===3&&(
            <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
              <div style={{ background:"linear-gradient(135deg,#0e7490,#2B96A8)",borderRadius:18,padding:"22px 24px",color:"white",textAlign:"center" }}>
                <p style={{ fontSize:13,opacity:.8,marginBottom:6,fontWeight:500 }}>Montant total à payer</p>
                <p style={{ fontSize:38,fontWeight:900,letterSpacing:"-1px" }}>{total} <span style={{ fontSize:18,fontWeight:600,opacity:.8 }}>TND</span></p>
                <p style={{ fontSize:12,opacity:.65,marginTop:6 }}>dont {fee} TND de frais de service</p>
              </div>
              <div>
                <p style={{ fontSize:13,fontWeight:700,color:"#111827",marginBottom:12 }}>Choisissez votre méthode de paiement</p>
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {PAY_METHODS.map(m=>(
                    <button key={m.id} onClick={()=>setPayMethod(m.id)}
                      style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 16px",border:`2px solid ${payMethod===m.id?"#2B96A8":"#E5E7EB"}`,borderRadius:14,background:payMethod===m.id?"#EFF9FB":"white",cursor:"pointer",textAlign:"left",transition:"all .15s",fontFamily:"inherit" }}>
                      <div style={{ width:42,height:42,borderRadius:12,background:payMethod===m.id?"#2B96A8":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s" }}>
                        <m.Icon size={18} color={payMethod===m.id?"white":"#6B7280"} strokeWidth={1.5} />
                      </div>
                      <div style={{ flex:1 }}><p style={{ fontSize:14,fontWeight:700,color:"#111827" }}>{m.label}</p><p style={{ fontSize:12,color:"#9CA3AF" }}>{m.sub}</p></div>
                      <div style={{ width:20,height:20,borderRadius:"50%",border:`2px solid ${payMethod===m.id?"#2B96A8":"#D1D5DB"}`,background:"white",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        {payMethod===m.id&&<div style={{ width:10,height:10,borderRadius:"50%",background:"#2B96A8" }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {error&&<div style={{ display:"flex",gap:8,padding:"11px 14px",background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:12 }}><AlertCircle size={15} color="#DC2626" strokeWidth={1.5} style={{ flexShrink:0,marginTop:1 }} /><span style={{ fontSize:13,color:"#DC2626" }}>{error}</span></div>}
              <button onClick={handlePay} disabled={loading}
                style={{ width:"100%",padding:"16px",background:"#2B96A8",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:loading?.7:1,boxShadow:"0 4px 16px rgba(43,150,168,.4)",transition:"all .2s" }}>
                {loading?<><Loader size={17} style={{ animation:"rspin 1s linear infinite" }} /> Traitement en cours…</>:<><CheckCircle size={17} strokeWidth={2.5} /> Confirmer le paiement · {total} TND</>}
              </button>
              <p style={{ textAlign:"center",fontSize:12,color:"#9CA3AF",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                <ShieldCheck size={12} color="#9CA3AF" strokeWidth={1.5} />Paiement 100% sécurisé · VoyajAime
              </p>
            </div>
          )}

          {/* Step 4 */}
          {step===4&&(
            <div style={{ display:"flex",flexDirection:"column",gap:20,paddingTop:8 }}>
              <div style={{ textAlign:"center",padding:"20px 0 10px" }}>
                <div style={{ width:72,height:72,borderRadius:"50%",background:"#D1FAE5",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",border:"4px solid #A7F3D0" }}>
                  <CheckCircle size={36} color="#10B981" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize:20,fontWeight:900,color:"#111827",marginBottom:6 }}>Paiement enregistré !</h3>
                <p style={{ fontSize:14,color:"#6B7280",lineHeight:1.7 }}>Votre réservation est confirmée. Retrouvez tous les détails ci-dessous.</p>
              </div>
              <div style={{ border:"2px solid #E5E7EB",borderRadius:20,overflow:"hidden" }}>
                <div style={{ background:"linear-gradient(135deg,#0e7490,#2B96A8)",padding:"20px 22px" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div><p style={{ fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4 }}>Excursion</p><p style={{ fontSize:17,fontWeight:800,color:"white" }}>{exc?.title}</p><p style={{ fontSize:13,color:"rgba(255,255,255,.8)",marginTop:4,display:"flex",alignItems:"center",gap:5 }}><MapPin size={11} strokeWidth={2} /> {exc?.city}</p></div>
                    <div style={{ textAlign:"right" }}><p style={{ fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:4 }}>Total payé</p><p style={{ fontSize:22,fontWeight:900,color:"white" }}>{total} TND</p></div>
                  </div>
                </div>
                <div style={{ padding:"18px 22px",display:"flex",flexDirection:"column",gap:14 }}>
                  {[{Icon:Ticket,label:"Code de réservation",value:reservation.booking_code},{Icon:CalendarDays,label:"Date & heure",value:`${fmtDate(reservation.date)} · ${reservation.time}`},{Icon:Users,label:"Voyageurs",value:`${reservation.people_count} personne${reservation.people_count>1?"s":""}`},{Icon:Navigation,label:"Lieu de rendez-vous",value:exc?.meeting_point||exc?.city||"Communiqué par le prestataire"},{Icon:Phone,label:"Contact d'urgence",value:"+216 70 000 000"}].map(({Icon,label,value})=>(
                    <div key={label} style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                      <div style={{ width:34,height:34,borderRadius:10,background:"#EFF9FB",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><Icon size={15} color="#2B96A8" strokeWidth={1.5} /></div>
                      <div><p style={{ fontSize:11,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:2 }}>{label}</p><p style={{ fontSize:14,fontWeight:700,color:"#111827" }}>{value}</p></div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",alignItems:"center",padding:"0 10px",borderTop:"2px dashed #E5E7EB" }}>
                  <div style={{ width:20,height:20,borderRadius:"50%",background:"#F3F4F6",border:"2px solid #E5E7EB",flexShrink:0,marginLeft:-20 }} /><div style={{ flex:1 }} /><div style={{ width:20,height:20,borderRadius:"50%",background:"#F3F4F6",border:"2px solid #E5E7EB",flexShrink:0,marginRight:-20 }} />
                </div>
                <div style={{ padding:"14px 22px 18px",background:"#F9FAFB",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}><div style={{ width:8,height:8,borderRadius:"50%",background:"#10B981" }} /><span style={{ fontSize:12,fontWeight:700,color:"#065F46" }}>Paiement confirmé</span></div>
                  <span style={{ fontSize:12,color:"#9CA3AF",fontFamily:"monospace" }}>#{reservation.booking_code}</span>
                </div>
              </div>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={onClose} style={{ flex:1,padding:"14px",background:"#F3F4F6",color:"#374151",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Fermer</button>
                <Link href="/touriste/reservations" onClick={onClose} style={{ flex:2,padding:"14px",background:"#111827",color:"white",borderRadius:14,textDecoration:"none",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                  <CalendarDays size={15} /> Mes réservations
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes rspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RESERVATION CARD — layout VERTICAL pour grille 3 col
───────────────────────────────────────────── */
function ReservationCard({ r, onPay, onCancel }: { r: Reservation; onPay: () => void; onCancel: () => void }) {
  const exc   = r.excursion;
  const s     = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
  const photo = exc?.photos?.[0];
  const paid  = r.payment_status === "paid" || r.status === "completed";
  const isCancelled = r.status === "cancelled";
  const canCancel = !isCancelled && (r.status === "pending" || r.status === "confirmed");

  return (
    <div style={{ 
      background:"white", borderRadius:20, border:"1px solid #E5E7EB", overflow:"hidden", 
      display:"flex", flexDirection:"column", boxShadow:"0 1px 4px rgba(0,0,0,.05)", 
      transition:"box-shadow .2s, transform .2s", opacity: isCancelled ? 0.7 : 1
    }}
      onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; if(!isCancelled){ el.style.boxShadow="0 10px 32px rgba(0,0,0,.1)"; el.style.transform="translateY(-2px)"; } }}
      onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; if(!isCancelled){ el.style.boxShadow="0 1px 4px rgba(0,0,0,.05)"; el.style.transform="none"; } }}
    >
      {/* ── Photo (haut) ── */}
      <div style={{ position:"relative", height:220, flexShrink:0, overflow:"hidden", background:"linear-gradient(135deg,#2B96A8,#0e7490)" }}>
        {photo
          ? <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CalendarDays size={32} color="rgba(255,255,255,.35)" />
            </div>
        }
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,.5) 0%, transparent 55%)" }} />

        {/* Status badge — haut gauche */}
        <span style={{ position:"absolute", top:12, left:12, display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background:s.bg, border:`1px solid ${s.border}`, borderRadius:99, fontSize:11, fontWeight:700, color:s.color }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, flexShrink:0 }} />{s.label}
        </span>

        {/* Paid badge — haut droit */}
        {paid && !isCancelled && (
          <span style={{ position:"absolute", top:12, right:12, display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", background:"#D1FAE5", border:"1px solid #6EE7B7", borderRadius:99, fontSize:11, fontWeight:700, color:"#065F46" }}>
            <CreditCard size={10} strokeWidth={2.5} /> Payée
          </span>
        )}

        {/* Titre + ville — bas */}
        <div style={{ position:"absolute", bottom:12, left:14, right:14 }}>
          <h3 style={{ fontSize:14, fontWeight:800, color:"white", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {exc?.title ?? "Excursion"}
          </h3>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.85)", display:"flex", alignItems:"center", gap:4 }}>
            <MapPin size={11} strokeWidth={1.5} /> {exc?.city}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding:"14px 16px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        {/* Meta */}
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:5 }}>
            <CalendarDays size={11} color="#9CA3AF" strokeWidth={1.5} style={{ flexShrink:0 }} />
            {fmtDate(r.date, true)} · {r.time}
          </span>
          <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:5 }}>
            <Users size={11} color="#9CA3AF" strokeWidth={1.5} style={{ flexShrink:0 }} />
            {r.people_count} pers.
            {exc?.duration_hours && <>
              <span style={{ color:"#E5E7EB", margin:"0 2px" }}>·</span>
              <Clock size={11} color="#9CA3AF" strokeWidth={1.5} style={{ flexShrink:0 }} />
              {exc.duration_hours}h
            </>}
          </span>
        </div>

        {/* Prix + code */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"auto", paddingTop:6 }}>
          <span style={{ fontSize:11, color:"#9CA3AF", fontFamily:"monospace", background:"#F9FAFB", padding:"3px 8px", borderRadius:6, border:"1px solid #E5E7EB" }}>
            #{r.booking_code}
          </span>
          <div style={{ textAlign:"right" }}>
            <span style={{ fontSize:20, fontWeight:900, color:"#111827" }}>{r.total_price}</span>
            <span style={{ fontSize:11, color:"#9CA3AF", marginLeft:3 }}>TND</span>
          </div>
        </div>
      </div>

      {/* ── Buttons (Pay & Cancel) ── */}
      {!isCancelled && (
        <div style={{ borderTop:"1px solid #F3F4F6", padding:"12px 16px", display:"flex", gap:8 }}>
          {!paid && (
            <button onClick={onPay}
              style={{ flex: 2, padding:"11px 16px", background:"#111827", color:"white", border:"none", borderRadius:12, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"background .2s" }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#1f2937"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#111827"}
            >
              <CreditCard size={13} strokeWidth={2} />
              Payer · {r.total_price} TND
              <ArrowRight size={13} />
            </button>
          )}
          {canCancel && (
            <button onClick={onCancel}
              style={{ flex: 1, padding:"11px 16px", background:"#FEE2E2", color:"#DC2626", border:"1px solid #FCA5A5", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all .2s" }}
              onMouseEnter={e=>{ const btn=e.currentTarget as HTMLElement; btn.style.background="#FECACA"; btn.style.borderColor="#F87171"; }}
              onMouseLeave={e=>{ const btn=e.currentTarget as HTMLElement; btn.style.background="#FEE2E2"; btn.style.borderColor="#FCA5A5"; }}
            >
              <Trash2 size={13} strokeWidth={1.5} />
              Annuler
            </button>
          )}
        </div>
      )}
      
      {/* Annulé badge if cancelled */}
      {isCancelled && (
        <div style={{ borderTop:"1px solid #F3F4F6", padding:"12px 16px", background:"#F9FAFB", textAlign:"center" }}>
          <span style={{ fontSize:12, color:"#9CA3AF", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <AlertCircle size={12} /> Réservation annulée
          </span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function ReservationsClient({
  reservations: init,
  total: _t0, pending: _p0, confirmed: _c0,
}: {
  reservations: Reservation[];
  total?: number; pending?: number; confirmed?: number;
}) {
  const [reservations, setReservations] = useState(init);
  const [checkout, setCheckout] = useState<Reservation | null>(null);
  const [cancelReservation, setCancelReservation] = useState<Reservation | null>(null);

  const total     = reservations.length;
  const pending   = reservations.filter(r => r.status === "pending").length;
  const confirmed = reservations.filter(r => r.status === "confirmed").length;

  function handlePaid(id: string) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, payment_status: "paid", status: "confirmed" } : r));
  }

  function handleCancelled(id: string) {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "cancelled" } : r));
  }

  return (
    <div>
      {/* Stats — ligne compacte */}
      {total > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, flexWrap:"wrap" }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:13, color:"#6B7280", fontWeight:500 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#2B96A8", flexShrink:0 }} />
            <span style={{ fontSize:14, fontWeight:800, color:"#2B96A8" }}>{total}</span>
            réservations
          </span>
          <span style={{ color:"#D1D5DB" }}>·</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:13, color:"#6B7280", fontWeight:500 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#F59E0B", flexShrink:0 }} />
            <span style={{ fontSize:14, fontWeight:800, color:"#D97706" }}>{pending}</span>
            en attente
          </span>
          <span style={{ color:"#D1D5DB" }}>·</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:13, color:"#6B7280", fontWeight:500 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", flexShrink:0 }} />
            <span style={{ fontSize:14, fontWeight:800, color:"#059669" }}>{confirmed}</span>
            confirmées
          </span>
        </div>
      )}

      {total === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"white", borderRadius:24, border:"1px solid #E5E7EB" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#EFF9FB", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <CalendarDays size={32} color="#2B96A8" strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:8 }}>Aucune réservation</h3>
          <p style={{ fontSize:14, color:"#6B7280", marginBottom:24, lineHeight:1.6 }}>Découvrez les excursions et planifiez votre prochain voyage en Tunisie</p>
          <Link href="/excursions" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 26px", background:"#2B96A8", color:"white", borderRadius:14, textDecoration:"none", fontSize:14, fontWeight:700, boxShadow:"0 4px 14px rgba(43,150,168,.35)" }}>
            <Sparkles size={16} /> Explorer les excursions <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        /* ── GRILLE 3 COLONNES ── */
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:20 }}>
          {reservations.map(r => (
            <ReservationCard 
              key={r.id} 
              r={r} 
              onPay={() => setCheckout(r)} 
              onCancel={() => setCancelReservation(r)}
            />
          ))}
        </div>
      )}

      {checkout && (
        <CheckoutModal reservation={checkout} onClose={() => setCheckout(null)} onPaid={handlePaid} />
      )}
      
      {cancelReservation && (
        <CancelConfirmModal 
          reservation={cancelReservation} 
          onClose={() => setCancelReservation(null)} 
          onConfirm={handleCancelled}
        />
      )}
    </div>
  );
}