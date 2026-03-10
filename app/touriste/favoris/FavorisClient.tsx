"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Heart, Star, Clock, MapPin, ArrowRight,
  SlidersHorizontal, Loader, Plus, Compass,
  X, CalendarDays, Users, Minus, CheckCircle, AlertCircle,
  Banknote, Tag,
} from "lucide-react";

interface Excursion {
  id: string; title: string; city: string; price_per_person: number;
  duration_hours: number; rating: number; reviews_count: number;
  max_people: number;
  photos: string[]; categories: string[];
}
interface Favori { id: string; excursion: Excursion | null; }

function genBookingCode() {
  return "VJ-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function FavorisClient({ favoris: init, userId }: { favoris: Favori[]; userId: string }) {
  const supabase = createClient();
  const [favoris, setFavoris] = useState(init);
  const [removing, setRemoving] = useState<string | null>(null);
  const [sort, setSort] = useState<"default" | "price_asc" | "price_desc" | "rating">("default");

  const [modal, setModal] = useState<Excursion | null>(null);
  const [date, setDate] = useState(todayISO());
  const [people, setPeople] = useState(1);
  const [booking, setBooking] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState("");

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
    setModal(exc);
    setDate(todayISO());
    setPeople(1);
    setBooking("idle");
    setBookingError("");
  };

  const closeModal = () => {
    if (booking === "loading") return;
    setModal(null);
    setBooking("idle");
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
      const { error } = await supabase.from("reservations").insert({
        touriste_id:  userId,
        excursion_id: modal.id,
        booking_code: genBookingCode(),
        date:         date,
        time:         "09:00",
        people_count: people,
        total_price:  totalPrice,
        platform_fee: serviceFee,
        status:       "pending",
      });
      if (error) throw error;
      setBooking("success");
    } catch (e) {
      setBookingError(e instanceof Error ? e.message : "Une erreur est survenue.");
      setBooking("error");
    }
  };

  const sorted = [...favoris].sort((a, b) => {
    const ea = a.excursion, eb = b.excursion;
    if (!ea || !eb) return 0;
    if (sort === "price_asc")  return ea.price_per_person - eb.price_per_person;
    if (sort === "price_desc") return eb.price_per_person - ea.price_per_person;
    if (sort === "rating")     return eb.rating - ea.rating;
    return 0;
  });

  if (!favoris.length) return (
    <div style={{ textAlign: "center", padding: "80px 20px", background: "white", borderRadius: 24, border: "1px solid #F3F4F6" }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Heart size={32} color="#FDA4AF" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Aucun favori pour l&apos;instant</h3>
      <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
        Parcourez les excursions et cliquez sur l&apos;icône coeur pour sauvegarder vos préférées
      </p>
      <Link href="/excursions" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#2B96A8", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(43,150,168,0.35)" }}>
        <Compass size={16} /> Découvrir les excursions <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .fov{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(5px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease}
        .fom{background:white;border-radius:24px;width:100%;max-width:480px;box-shadow:0 32px 80px rgba(0,0,0,.22);animation:slideUp .25s ease;overflow:hidden;max-height:90vh;overflow-y:auto}
        .fi2{width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:15px;font-family:inherit;outline:none;transition:border-color .2s;color:#111827;background:#FAFAFA;box-sizing:border-box}
        .fi2:focus{border-color:#2B96A8;background:white}
        .fcb{width:44px;height:44px;border-radius:0;border:none;background:#FAFAFA;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;font-family:inherit;flex-shrink:0}
        .fcb:hover:not(:disabled){background:#F3F4F6}
        .fcb:disabled{opacity:.35;cursor:not-allowed}
        .fbb{width:100%;padding:16px;background:#111827;color:white;border:none;border-radius:14px;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all .2s;letter-spacing:.2px}
        .fbb:hover:not(:disabled){background:#1f2937;transform:translateY(-1px);box-shadow:0 8px 24px rgba(17,24,39,.3)}
        .fbb:disabled{opacity:.55;cursor:not-allowed;transform:none}
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
          <Heart size={14} color="#F43F5E" fill="#F43F5E" />
          <span style={{ fontWeight: 700, color: "#111827" }}>{favoris.length}</span> excursion{favoris.length > 1 ? "s" : ""} sauvegardée{favoris.length > 1 ? "s" : ""}
        </p>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <SlidersHorizontal size={13} color="#9CA3AF" style={{ position: "absolute", left: 12, pointerEvents: "none" }} />
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            style={{ padding: "8px 14px 8px 32px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#374151", background: "white", cursor: "pointer", outline: "none", appearance: "none" }}>
            <option value="default">Ordre d&apos;ajout</option>
            <option value="rating">Meilleures notes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {sorted.map(f => {
          const exc = f.excursion;
          if (!exc) return null;
          return (
            <div key={f.id}
              style={{ background: "white", borderRadius: 20, overflow: "hidden", border: "1px solid #F3F4F6", transition: "all 0.25s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 12px 36px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "none"; el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                <img src={exc.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80"} alt={exc.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => handleRemove(f.id)} disabled={removing === f.id}
                  style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
                  title="Retirer des favoris"
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}>
                  {removing === f.id ? <Loader size={16} color="#9CA3AF" style={{ animation: "spin 1s linear infinite" }} /> : <Heart size={16} color="#F43F5E" fill="#F43F5E" />}
                </button>
                {exc.categories?.[0] && (
                  <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "white" }}>
                    {exc.categories[0]}
                  </div>
                )}
              </div>

              <div style={{ padding: "18px 18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{exc.title}</h3>
                    <p style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={11} color="#C4B8B0" strokeWidth={1.5} />{exc.city}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{exc.price_per_person} <span style={{ fontSize: 11, fontWeight: 500 }}>TND</span></p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>/ pers.</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} color="#9CA3AF" strokeWidth={1.5} />{exc.duration_hours}h
                  </span>
                  {exc.rating > 0 && (
                    <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />{exc.rating}
                      <span style={{ color: "#9CA3AF" }}>({exc.reviews_count})</span>
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href="/touriste/itineraire"
                    style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "9px 0", background: "#F9FAFB", color: "#374151", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600, border: "1px solid #E5E7EB", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F3F4F6"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}>
                    <Plus size={13} /> Ajouter au plan
                  </Link>
                  <button onClick={() => openModal(exc)}
                    style={{ flex: 1, padding: "9px 0", background: "#2B96A8", color: "white", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#1e7a8a"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "#2B96A8"}>
                    Réserver <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════ MODAL ═══════ */}
      {modal && (
        <div className="fov" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="fom">

            <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>Réserver</h2>
              <button onClick={closeModal} disabled={booking === "loading"}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#6B7280" />
              </button>
            </div>

            {booking === "success" ? (
              <div style={{ padding: "28px 24px 28px", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <CheckCircle size={36} color="#22C55E" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Réservation confirmée !</h3>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 6 }}>
                  Votre réservation pour <strong style={{ color: "#111827" }}>{modal.title}</strong> a bien été enregistrée.
                </p>
                <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 28 }}>
                  Elle apparaît maintenant dans vos réservations, en attente de confirmation par le prestataire.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={closeModal}
                    style={{ flex: 1, padding: "12px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Fermer
                  </button>
                  <Link href="/touriste/reservations"
                    style={{ flex: 2, padding: "12px", background: "#2B96A8", color: "white", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 14px rgba(43,150,168,.35)" }}>
                    <CalendarDays size={15} /> Voir mes réservations
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ padding: "20px 24px 24px" }}>

                {/* Mini card excursion */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 14, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#E5E7EB" }}>
                    <img src={modal.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=200&q=80"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{modal.title}</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} color="#9CA3AF" strokeWidth={1.5} />{modal.city}</span>
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} color="#9CA3AF" strokeWidth={1.5} />{modal.duration_hours}h</span>
                      <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 3 }}><Tag size={10} color="#9CA3AF" strokeWidth={1.5} />{modal.price_per_person} TND/pers.</span>
                    </div>
                  </div>
                </div>

                {/* DATE */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    <CalendarDays size={12} color="#2B96A8" strokeWidth={2} /> Date
                  </label>
                  <input type="date" className="fi2" value={date} min={todayISO()} onChange={e => setDate(e.target.value)} />
                </div>

                {/* PERSONNES */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                    <Users size={12} color="#2B96A8" strokeWidth={2} /> Personnes
                  </label>
                  <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "#FAFAFA" }}>
                    <button className="fcb" onClick={() => setPeople(p => Math.max(1, p - 1))} disabled={people <= 1}>
                      <Minus size={15} color="#6B7280" />
                    </button>
                    <p style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: 800, color: "#111827", margin: 0, padding: "10px 0" }}>{people}</p>
                    <button className="fcb" onClick={() => setPeople(p => Math.min(modal.max_people || 99, p + 1))} disabled={modal.max_people ? people >= modal.max_people : false}>
                      <Plus size={15} color="#6B7280" />
                    </button>
                  </div>
                  {modal.max_people > 0 && (
                    <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={11} color="#C4B8B0" strokeWidth={1.5} /> Max {modal.max_people} personnes
                    </p>
                  )}
                </div>

                {/* PRIX */}
                <div style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{modal.price_per_person} TND × {people} pers.</span>
                    <span style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{basePrice} TND</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 12, borderBottom: "1px dashed #E5E7EB" }}>
                    <span style={{ fontSize: 13, color: "#6B7280", display: "flex", alignItems: "center", gap: 5 }}>
                      <Banknote size={13} color="#9CA3AF" strokeWidth={1.5} /> Frais de service (10%)
                    </span>
                    <span style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{serviceFee} TND</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "#2B96A8" }}>{totalPrice} TND</span>
                  </div>
                </div>

                {/* ERREUR */}
                {booking === "error" && bookingError && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, marginBottom: 14 }}>
                    <AlertCircle size={15} color="#DC2626" strokeWidth={1.5} />
                    <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 500 }}>{bookingError}</span>
                  </div>
                )}

                <button className="fbb" onClick={handleConfirm} disabled={booking === "loading" || !date}>
                  {booking === "loading"
                    ? <><Loader size={17} style={{ animation: "spin 1s linear infinite" }} /> Confirmation en cours...</>
                    : <><CheckCircle size={17} strokeWidth={2} /> Confirmer — {totalPrice} TND</>
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