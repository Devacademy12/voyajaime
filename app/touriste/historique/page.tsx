"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  CalendarDays, MapPin, Clock, Users, CreditCard, CheckCircle,
  Ticket, Phone, Navigation, Download, ArrowLeft, History,
  Search, Filter, ChevronLeft, ChevronRight
} from "lucide-react";

interface HistoriqueReservation {
  id: string;
  booking_code: string;
  excursion_title: string;
  excursion_city: string;
  date: string;
  time: string;
  people_count: number;
  total_price: number;
  platform_fee: number;
  payment_method: string;
  payment_date: string;
}

export default function HistoriquePage() {
  const supabase = createClient();
  const [reservations, setReservations] = useState<HistoriqueReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchHistorique();
  }, []);

  async function fetchHistorique() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Récupérer les réservations payées/confirmées
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        id, booking_code, date, time, people_count, total_price, platform_fee,
        payment_method, payment_status, status,
        excursion:excursions(title, city)
      `)
      .eq("user_id", user.id)
      .in("status", ["confirmed", "completed"])
      .order("date", { ascending: false });

    if (!error && data) {
      const formatted = data.map((r: any) => ({
        id: r.id,
        booking_code: r.booking_code,
        excursion_title: r.excursion?.title || "Excursion",
        excursion_city: r.excursion?.city || "",
        date: r.date,
        time: r.time,
        people_count: r.people_count,
        total_price: r.total_price,
        platform_fee: r.platform_fee,
        payment_method: r.payment_method || "carte",
        payment_date: r.updated_at || r.created_at,
      }));
      setReservations(formatted);
    }
    setLoading(false);
  }

  // Filtrage et pagination
  const filtered = reservations.filter(r =>
    r.booking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.excursion_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.excursion_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  function formatPaymentDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B96A8]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/touriste/reservations" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#EFF9FB] rounded-xl">
              <History size={24} className="text-[#2B96A8]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historique des voyages</h1>
              <p className="text-gray-500 text-sm mt-1">
                {reservations.length} excursion{reservations.length > 1 ? "s" : ""} réalisée{reservations.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative mt-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par code, destination ou excursion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#2B96A8] focus:outline-none"
          />
        </div>
      </div>

      {/* Liste des réservations */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <History size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucun historique</h3>
          <p className="text-gray-500 mb-6">
            Vous n'avez pas encore de voyages confirmés.
          </p>
          <Link
            href="/excursions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B96A8] text-white rounded-xl hover:bg-[#1e7a8a] transition"
          >
            Découvrir les excursions
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-5">
            {paginated.map((resa) => (
              <div
                key={resa.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-5">
                  {/* En-tête de la carte */}
                  <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          #{resa.booking_code}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle size={12} />
                          Payée
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{resa.excursion_title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={14} /> {resa.excursion_city}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#2B96A8]">{resa.total_price} TND</p>
                      <p className="text-xs text-gray-400">payé le {formatPaymentDate(resa.payment_date)}</p>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Date</p>
                        <p className="text-sm font-medium">{formatDate(resa.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Heure</p>
                        <p className="text-sm font-medium">{resa.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Voyageurs</p>
                        <p className="text-sm font-medium">{resa.people_count} pers.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Paiement</p>
                        <p className="text-sm font-medium capitalize">{resa.payment_method}</p>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      <Download size={14} /> Télécharger le reçu
                    </button>
                    <Link
                      href={`/touriste/reservations/${resa.id}/details`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2B96A8] border border-[#2B96A8] rounded-lg hover:bg-[#EFF9FB] transition"
                    >
                      <Ticket size={14} /> Voir le billet
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}