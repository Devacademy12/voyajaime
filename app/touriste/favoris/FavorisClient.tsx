"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
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
  max_people: number; photos: string[]; categories: string[];
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
    setBooking("loading"); setBookingError("");
    try {
      const { error } = await supabase.from("reservations").insert({
        touriste_id: userId, excursion_id: modal.id,
        booking_code: genBookingCode(), date, time: "09:00",
        people_count: people, total_price: totalPrice,
        platform_fee: serviceFee, status: "pending",
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

  /* ── EMPTY STATE ── */
  if (!favoris.length) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-gray-100">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <Heart size={32} className="text-rose-300" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun favori pour l&apos;instant</h3>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm leading-relaxed">
        Parcourez les excursions et cliquez sur l&apos;icône cœur pour sauvegarder vos préférées
      </p>
      <Link href="/excursions"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#02AFCF] hover:bg-[#0299b5] text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-cyan-200">
        <Compass size={16} /> Découvrir les excursions <ArrowRight size={16} />
      </Link>
    </div>
  );

  return (
    <>
      {/* ── TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Heart size={14} className="text-rose-500 fill-rose-500" />
          <span className="font-bold text-gray-900">{favoris.length}</span>
          excursion{favoris.length > 1 ? "s" : ""} sauvegardée{favoris.length > 1 ? "s" : ""}
        </p>
        <div className="relative flex items-center">
          <SlidersHorizontal size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white cursor-pointer outline-none appearance-none focus:border-[#02AFCF]">
            <option value="default">Ordre d&apos;ajout</option>
            <option value="rating">Meilleures notes</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* ── GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map(f => {
          const exc = f.excursion;
          if (!exc) return null;
          return (
            <div key={f.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-250">

              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={exc.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80"}
                  alt={sanitizeText(exc.title)}
                  className="w-full h-full object-cover"
                />
                {/* Remove btn */}
                <button onClick={() => handleRemove(f.id)} disabled={removing === f.id}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50">
                  {removing === f.id
                    ? <Loader size={15} className="text-gray-400 animate-spin" />
                    : <Heart size={15} className="text-rose-500 fill-rose-500" />
                  }
                </button>
                {/* Category badge */}
                {exc.categories?.[0] && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                    {sanitizeText(exc.categories[0])}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{sanitizeText(exc.title)}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} strokeWidth={1.5} />{sanitizeText(exc.city)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-extrabold text-gray-900">{exc.price_per_person} <span className="text-xs font-medium">TND</span></p>
                    <p className="text-xs text-gray-400">/ pers.</p>
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={10} strokeWidth={1.5} className="text-gray-400" />{exc.duration_hours}h
                  </span>
                  {exc.rating > 0 && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {exc.rating} <span className="text-gray-400">({exc.reviews_count})</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href="/touriste/itineraire"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold border border-gray-200 transition-colors">
                    <Plus size={12} /> Ajouter au plan
                  </Link>
                  <button onClick={() => openModal(exc)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#02AFCF] hover:bg-[#0299b5] text-white rounded-xl text-xs font-bold transition-colors">
                    Réserver <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════ MODAL ══════════════ */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-5 animate-[fadeIn_.2s_ease]"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto animate-[slideUp_.25s_ease]">

            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-0">
              <h2 className="text-xl font-black text-gray-900">Réserver</h2>
              <button onClick={closeModal} disabled={booking === "loading"}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50">
                <X size={15} className="text-gray-500" />
              </button>
            </div>

            {booking === "success" ? (
              /* ── SUCCESS ── */
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={34} className="text-green-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">Réservation confirmée !</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-1">
                  Votre réservation pour <strong className="text-gray-900">{sanitizeText(modal.title)}</strong> a bien été enregistrée.
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  Elle apparaît dans vos réservations, en attente de confirmation.
                </p>
                <div className="flex gap-3">
                  <button onClick={closeModal}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors">
                    Fermer
                  </button>
                  <Link href="/touriste/reservations"
                    className="flex-[2] py-3 bg-[#02AFCF] hover:bg-[#0299b5] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-200">
                    <CalendarDays size={14} /> Voir mes réservations
                  </Link>
                </div>
              </div>
            ) : (
              /* ── FORM ── */
              <div className="p-5 space-y-4">

                {/* Mini card excursion */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                    <img src={modal.photos?.[0] || "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=200&q=80"}
                      alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate mb-1">{modal.title}</p>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={9} strokeWidth={1.5} />{sanitizeText(modal.city)}</span>
                      <span className="flex items-center gap-1"><Clock size={9} strokeWidth={1.5} />{modal.duration_hours}h</span>
                      <span className="flex items-center gap-1"><Tag size={9} strokeWidth={1.5} />{modal.price_per_person} TND</span>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <CalendarDays size={12} className="text-[#02AFCF]" strokeWidth={2} /> Date
                  </label>
                  <input type="date" value={date} min={todayISO()} onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-3 border-[1.5px] border-gray-200 rounded-xl text-sm text-gray-900 bg-gray-50 outline-none focus:border-[#02AFCF] focus:bg-white transition-colors" />
                </div>

                {/* Personnes */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <Users size={12} className="text-[#02AFCF]" strokeWidth={2} /> Personnes
                  </label>
                  <div className="flex items-center border-[1.5px] border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <button onClick={() => setPeople(p => Math.max(1, p - 1))} disabled={people <= 1}
                      className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 transition-colors border-r border-gray-200">
                      <Minus size={15} className="text-gray-600" />
                    </button>
                    <p className="flex-1 text-center text-xl font-extrabold text-gray-900">{people}</p>
                    <button onClick={() => setPeople(p => Math.min(modal.max_people || 99, p + 1))}
                      disabled={modal.max_people ? people >= modal.max_people : false}
                      className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 transition-colors border-l border-gray-200">
                      <Plus size={15} className="text-gray-600" />
                    </button>
                  </div>
                  {modal.max_people > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <Users size={10} strokeWidth={1.5} /> Max {modal.max_people} personnes
                    </p>
                  )}
                </div>

                {/* Prix */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{modal.price_per_person} TND × {people} pers.</span>
                    <span className="font-semibold text-gray-900">{basePrice} TND</span>
                  </div>
                  <div className="flex justify-between text-sm pb-3 border-b border-dashed border-gray-300">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Banknote size={12} strokeWidth={1.5} /> Frais de service (10%)
                    </span>
                    <span className="font-semibold text-gray-900">{serviceFee} TND</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-extrabold text-gray-900">Total</span>
                    <span className="text-xl font-black text-[#02AFCF]">{totalPrice} TND</span>
                  </div>
                </div>

                {/* Erreur */}
                {booking === "error" && bookingError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-red-600 font-medium">{bookingError}</span>
                  </div>
                )}

                {/* Bouton confirmer */}
                <button onClick={handleConfirm} disabled={booking === "loading" || !date}
                  className="w-full py-4 bg-gray-900 hover:bg-gray-800 disabled:opacity-55 disabled:cursor-not-allowed text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  {booking === "loading"
                    ? <><Loader size={16} className="animate-spin" /> Confirmation en cours...</>
                    : <><CheckCircle size={16} strokeWidth={2} /> Confirmer — {totalPrice} TND</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </>
  );
}