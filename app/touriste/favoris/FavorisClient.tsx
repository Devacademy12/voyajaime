"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import Link from "next/link";
import {
  Heart, Star, Clock, MapPin, ArrowRight,
  SlidersHorizontal, Loader, Plus, Compass,
  X, CalendarDays, Users, Minus, CheckCircle, AlertCircle,
  Banknote, Tag, Sparkles,
} from "lucide-react";

interface Excursion {
  id: string; title: string; city: string; price_per_person: number;
  duration_hours: number; rating: number; reviews_count: number;
  max_people: number; photos: string[]; categories: string[];
}

interface Favori {
  id: string;
  excursion: Excursion | Excursion[] | null;
}

/* ✅ Normalise toujours excursion tableau → objet unique */
function getExc(f: Favori): Excursion | null {
  if (!f.excursion) return null;
  if (Array.isArray(f.excursion)) return f.excursion[0] ?? null;
  return f.excursion;
}

function genBookingCode() {
  return "VJ-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function FavorisClient({ favoris: init, userId }: { favoris: Favori[]; userId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [favoris, setFavoris] = useState(init);
  const [removing, setRemoving] = useState<string | null>(null);
  const [sort, setSort] = useState<"default" | "price_asc" | "price_desc" | "rating">("default");
  const [modal, setModal] = useState<Excursion | null>(null);
  const [date, setDate] = useState(todayISO());
  const [people, setPeople] = useState(1);
  const [booking, setBooking] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState("");
  const [newReservationId, setNewReservationId] = useState<string | null>(null);

  const SERVICE_FEE_PCT = 0.10;
  const basePrice  = modal ? modal.price_per_person * people : 0;
  const serviceFee = Math.round(basePrice * SERVICE_FEE_PCT);
  const totalPrice = basePrice + serviceFee;

  const handleRemove = async (favId: string) => {
    setRemoving(favId);
    await supabase.from("favoris").delete().eq("id", favId).eq("touriste_id", userId);
    setFavoris(p => p.filter(f => f.id !== favId));
    setRemoving(null);
  };

  const openModal = (exc: Excursion) => {
    setModal(exc); setDate(todayISO()); setPeople(1);
    setBooking("idle"); setBookingError("");
  };

  const closeModal = () => {
    if (booking === "loading") return;
    setModal(null); setBooking("idle");
  };


const handleConfirm = async () => {
  if (!modal) return;
  if (!date) { setBookingError("Veuillez choisir une date."); return; }
  if (people < 1) { setBookingError("Minimum 1 personne."); return; }
  if (modal.max_people && people > modal.max_people) {
    setBookingError("Maximum " + modal.max_people + " personnes."); return;
  }
  
  setBooking("loading"); 
  setBookingError("");
  
  try {
    const code = genBookingCode();

    // 1. Récupérer l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error("Impossible de récupérer vos informations");
    
    const touriste_name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Touriste";
    const touriste_email = user?.email || "";
    
    if (!touriste_email) {
      throw new Error("Email non trouvé. Veuillez vous reconnecter.");
    }

    // 2. Insérer la réservation dans Supabase
    const { data: insertData, error: insertError } = await supabase.from("reservations").insert({
      touriste_id: userId,
      excursion_id: modal.id,
      booking_code: code,
      date,
      time: "09:00",
      people_count: people,
      total_price: totalPrice,
      platform_fee: serviceFee,
      status: "pending",
    }).select("id").single();
    
    if (insertError) throw insertError;

    // 3. Envoyer à n8n (ne bloque pas la réservation si erreur)
    try {
      const n8nResponse = await fetch("/api/n8n-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touriste_name,
          touriste_email,
          excursion_title: modal.title,
          excursion_city: modal.city,
          prestataire_name: modal.title || "Prestataire",
          prestataire_email: process.env.NEXT_PUBLIC_PRESTATAIRE_NOTIFY_EMAIL || "",
          booking_code: code,
          date,
          people_count: people,
          total_price: totalPrice,
        }),
      });
      
      if (!n8nResponse.ok) {
        console.warn("[n8n] Notification non envoyée:", await n8nResponse.text());
        // On continue malgré l'erreur n8n
      } else {
        console.log("[n8n] Notification envoyée avec succès");
      }
    } catch (n8nError) {
      console.warn("[n8n] Erreur réseau:", n8nError);
      // Ne pas bloquer la réservation
    }

    setBooking("success");
    setNewReservationId(insertData?.id || null);

    // 4. Redirection après 1.5s
    if (insertData?.id) {
      setTimeout(() => {
        router.push(`/touriste/reservations?pay=${insertData.id}`);
      }, 1500);
    }
    
  } catch (e) {
    console.error("[Réservation] Erreur:", e);
    setBookingError(e instanceof Error ? e.message : "Une erreur est survenue lors de la réservation.");
    setBooking("error");
  }
};

  const sorted = [...favoris].sort((a, b) => {
    const ea = getExc(a), eb = getExc(b);
    if (!ea || !eb) return 0;
    if (sort === "price_asc")  return ea.price_per_person - eb.price_per_person;
    if (sort === "price_desc") return eb.price_per_person - ea.price_per_person;
    if (sort === "rating")     return eb.rating - ea.rating;
    return 0;
  });

  /* ── EMPTY STATE ── */
  if (!favoris.length) return (
    <div className="empty-state" style={{ textAlign: "center", padding: "72px 24px" }}>
      <div className="empty-state-icon" style={{ background: "linear-gradient(135deg,#FEF2F2,#FFF0F3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(244,63,94,0.15)" }}>
        <Heart size={36} color="#FDA4AF" strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title" style={{ fontSize: 20, fontWeight: 800, color: "#053366", marginBottom: 8, letterSpacing: "-0.3px" }}>Aucun favori pour l&apos;instant</h3>
      <p className="empty-state-text" style={{ fontSize: 14, color: "#6B7280", marginBottom: 28, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 28px" }}>
        Parcourez les excursions et cliquez sur l&apos;icône cœur pour sauvegarder vos préférées
      </p>
      <Link href="/excursions" className="cta-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", width: "auto" }}>
        <Compass size={16} /> Découvrir les excursions <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }

        .fav-card {
          background:white; border-radius:20px; overflow:hidden;
          border:1px solid #EEF2FF; box-shadow:0 2px 12px rgba(5,51,102,0.05);
          transition:all 0.28s cubic-bezier(0.34,1.56,0.64,1);
          animation:cardIn 0.4s ease both;
        }
        .fav-card:hover { transform:translateY(-6px) scale(1.01); box-shadow:0 20px 48px rgba(5,51,102,0.13); border-color:#DCE5FF; }
        .fav-card:hover .card-img { transform:scale(1.07); }
        .card-img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s ease; display:block; }

        .remove-btn {
          position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%;
          background:rgba(255,255,255,0.95); border:none; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 12px rgba(0,0,0,0.15); transition:all 0.2s;
        }
        .remove-btn:hover { transform:scale(1.15); box-shadow:0 4px 16px rgba(239,68,68,0.25); }

        .plan-btn {
          flex:1; display:flex; align-items:center; justify-content:center; gap:6px;
          padding:10px 0; background:#F8FAFF; color:#053366;
          border-radius:12px; text-decoration:none; font-size:12px; font-weight:600;
          border:1px solid #DCE5FF; transition:all 0.18s;
        }
        .plan-btn:hover { background:#EEF2FF; border-color:#02AFCF; color:#02AFCF; }

        .reserve-btn {
          flex:1; padding:10px 0; background:linear-gradient(135deg,#02AFCF,#259FFC);
          color:white; border-radius:12px; border:none; font-size:12px; font-weight:700;
          cursor:pointer; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:6px;
          transition:all 0.18s; box-shadow:0 4px 12px rgba(2,175,207,0.3);
        }
        .reserve-btn:hover { box-shadow:0 6px 20px rgba(2,175,207,0.45); transform:translateY(-1px); }

        .sort-select {
          padding:9px 14px 9px 32px; border:1.5px solid #DCE5FF; border-radius:12px;
          font-size:13px; font-family:inherit; color:#053366;
          background:white; cursor:pointer; outline:none; appearance:none; transition:border 0.18s;
        }
        .sort-select:focus { border-color:#02AFCF; }

        .modal-overlay-custom {
          position:fixed; inset:0; background:rgba(5,51,102,0.5); backdrop-filter:blur(6px);
          z-index:1000; display:flex; align-items:flex-end; justify-content:center; padding:0;
          animation:fadeIn 0.2s ease;
        }
        @media(min-width:640px) { .modal-overlay-custom { align-items:center; padding:20px; } }

        .modal-box-custom {
          background:white; width:100%; max-width:480px;
          border-radius:28px 28px 0 0; box-shadow:0 -8px 40px rgba(5,51,102,0.15);
          overflow:hidden; max-height:92vh; overflow-y:auto;
          animation:slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1);
        }
        @media(min-width:640px) { .modal-box-custom { border-radius:28px; } }

        .modal-drag { width:40px; height:4px; background:#E5E7EB; border-radius:2px; margin:12px auto 0; }
        @media(min-width:640px) { .modal-drag { display:none; } }

        .date-input {
          width:100%; padding:12px 14px; border:1.5px solid #DCE5FF; border-radius:12px;
          font-size:14px; font-family:inherit; color:#053366;
          background:#F8FAFF; outline:none; transition:all 0.2s; box-sizing:border-box;
        }
        .date-input:focus { border-color:#02AFCF; background:white; box-shadow:0 0 0 3px rgba(2,175,207,0.1); }

        .counter-wrap-custom { display:flex; align-items:center; border:1.5px solid #DCE5FF; border-radius:12px; overflow:hidden; background:#F8FAFF; }
        .counter-btn-custom { width:48px; height:48px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#053366; transition:background 0.15s; }
        .counter-btn-custom:hover:not(:disabled) { background:#DCE5FF; }
        .counter-btn-custom:disabled { opacity:0.3; cursor:not-allowed; }

        .confirm-btn {
          width:100%; padding:15px; background:linear-gradient(135deg,#053366,#02AFCF);
          color:white; border:none; border-radius:14px; font-size:15px; font-weight:800;
          cursor:pointer; font-family:inherit; transition:all 0.2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 8px 24px rgba(2,175,207,0.35);
        }
        .confirm-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 12px 32px rgba(2,175,207,0.45); }
        .confirm-btn:disabled { opacity:0.55; cursor:not-allowed; transform:none; background:#E5E7EB; box-shadow:none; color:#9CA3AF; }
      `}</style>

      {/* ── TOOLBAR ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#FEF2F2,#FFF0F3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={15} color="#F43F5E" fill="#F43F5E" />
          </div>
          <p style={{ fontSize: 14, color: "#6B7280" }}>
            <span style={{ fontWeight: 800, color: "#053366" }}>{favoris.length}</span>
            {" "}excursion{favoris.length > 1 ? "s" : ""} sauvegardée{favoris.length > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <SlidersHorizontal size={13} color="#9CA3AF" style={{ position: "absolute", left: 11, pointerEvents: "none" }} />
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="sort-select">
            <option value="default">Ordre d&apos;ajout</option>
            <option value="rating">Meilleures notes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* ── GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
        {sorted.map((f, i) => {
          const exc = getExc(f);
          if (!exc) return null;
          return (
            <div key={f.id} className="fav-card" style={{ animationDelay: `${i * 0.06}s` }}>
              <div style={{ position: "relative", height: 210, overflow: "hidden", background: "#EEF2FF" }}>
                <img src={exc.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80"}
                  alt={sanitizeText(exc.title)} className="card-img" />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,51,102,0.4) 0%, transparent 55%)" }} />
                <button className="remove-btn" onClick={() => handleRemove(f.id)} disabled={removing === f.id}>
                  {removing === f.id
                    ? <Loader size={15} color="#9CA3AF" style={{ animation: "spin 1s linear infinite" }} />
                    : <Heart size={15} color="#F43F5E" fill="#F43F5E" />}
                </button>
                {exc.categories?.[0] && (
                  <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 11px", background: "rgba(5,51,102,0.7)", backdropFilter: "blur(8px)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "white" }}>
                    {sanitizeText(exc.categories[0])}
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 12, left: 12, padding: "5px 12px", background: "linear-gradient(135deg,#02AFCF,#259FFC)", borderRadius: 20, fontSize: 14, fontWeight: 800, color: "white", boxShadow: "0 4px 12px rgba(2,175,207,0.4)" }}>
                  {exc.price_per_person} <span style={{ fontSize: 11, fontWeight: 500 }}>TND</span>
                </div>
              </div>

              <div style={{ padding: "16px 18px 18px" }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: "#053366", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.2px" }}>
                    {sanitizeText(exc.title)}
                  </h3>
                  <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                    <MapPin size={11} color="#02AFCF" strokeWidth={2} />{sanitizeText(exc.city)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #EEF2FF" }}>
                  <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} color="#9CA3AF" strokeWidth={2} />{exc.duration_hours}h
                  </span>
                  {exc.rating > 0 && (
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" strokeWidth={0} />
                      <span style={{ fontWeight: 700, color: "#374151" }}>{exc.rating}</span>
                      <span style={{ color: "#D1D5DB" }}>({exc.reviews_count})</span>
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openModal(exc)} className="reserve-btn">Réserver <ArrowRight size={12} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══ MODAL ══ */}
      {modal && (
        <div className="modal-overlay-custom" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-box-custom">
            <div className="modal-drag" />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#053366", letterSpacing: "-0.4px" }}>Réserver</h2>
                <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Confirmez votre réservation</p>
              </div>
              <button onClick={closeModal} disabled={booking === "loading"}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} color="#6B7280" />
              </button>
            </div>

            {booking === "success" ? (
              <div style={{ padding: "32px 24px", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(34,197,94,0.2)" }}>
                  <CheckCircle size={36} color="#22C55E" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#053366", marginBottom: 8 }}>Réservation confirmée !</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 4 }}>
                  Votre réservation pour <strong style={{ color: "#053366" }}>{sanitizeText(modal.title)}</strong> a bien été enregistrée.
                </p>
                <p style={{ fontSize: 13, color: "#2B96A8", fontWeight: 600, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#2B96A8", animation: "pulse 1s infinite" }} />
                  Redirection vers le paiement en cours…
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={closeModal} style={{ flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
                  <Link href={newReservationId ? `/touriste/reservations?pay=${newReservationId}` : "/touriste/reservations"} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#053366,#02AFCF)", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 20px rgba(2,175,207,0.35)" }}>
                    <CalendarDays size={14} /> Aller au paiement →
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F8FAFF", border: "1px solid #DCE5FF", borderRadius: 16, padding: "12px 14px" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#DCE5FF" }}>
                    <img src={modal.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=200&q=80"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#053366", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sanitizeText(modal.title)}</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={9} color="#02AFCF" strokeWidth={2}/>{sanitizeText(modal.city)}</span>
                      <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} color="#9CA3AF" strokeWidth={2}/>{modal.duration_hours}h</span>
                      <span style={{ fontSize: 11, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}><Tag size={9} color="#9CA3AF" strokeWidth={2}/>{modal.price_per_person} TND</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    <CalendarDays size={12} color="#02AFCF" strokeWidth={2} /> Date
                  </label>
                  <input type="date" className="date-input" value={date} min={todayISO()} onChange={e => setDate(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    <Users size={12} color="#02AFCF" strokeWidth={2} /> Personnes
                  </label>
                  <div className="counter-wrap-custom">
                    <button className="counter-btn-custom" onClick={() => setPeople(p => Math.max(1, p - 1))} disabled={people <= 1}><Minus size={16} /></button>
                    <p style={{ flex: 1, textAlign: "center", fontSize: 22, fontWeight: 900, color: "#053366", margin: 0 }}>{people}</p>
                    <button className="counter-btn-custom" onClick={() => setPeople(p => Math.min(modal.max_people || 99, p + 1))} disabled={modal.max_people ? people >= modal.max_people : false}><Plus size={16} /></button>
                  </div>
                  {modal.max_people > 0 && (
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><Users size={10} strokeWidth={1.5} /> Max {modal.max_people} personnes</p>
                  )}
                </div>

                <div style={{ background: "#F8FAFF", border: "1px solid #DCE5FF", borderRadius: 16, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{modal.price_per_person} TND × {people} pers.</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{basePrice} TND</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: "1px dashed #DCE5FF" }}>
                    <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 5 }}><Banknote size={12} color="#9CA3AF" strokeWidth={1.5} /> Frais de service (10%)</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{serviceFee} TND</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#053366" }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: "#02AFCF" }}>{totalPrice} <span style={{ fontSize: 13, fontWeight: 600 }}>TND</span></span>
                  </div>
                </div>

                {booking === "error" && bookingError && (
                  <div className="alert alert-error" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={14} color="#DC2626" strokeWidth={1.5} />
                    <span>{bookingError}</span>
                  </div>
                )}

                <button className="confirm-btn" onClick={handleConfirm} disabled={booking === "loading" || !date}>
                  {booking === "loading"
                    ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Confirmation en cours...</>
                    : <><Sparkles size={16} /> Confirmer — {totalPrice} TND</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}