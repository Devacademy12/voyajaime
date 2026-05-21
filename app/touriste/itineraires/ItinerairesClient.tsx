"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  Map, Trash2, Pencil, ChevronDown, ChevronUp,
  MapPin, Clock, CalendarDays, Coins, Sunrise, Sun,
  Moon, Loader2, AlertCircle, FileText, ShoppingCart,
  Bot, PenLine, Image as ImageIcon, ExternalLink,
  Calendar, Flag, Users, Star, ArrowRight, CreditCard,
  CheckCircle2, BanknoteIcon,
} from "lucide-react";
import CheckoutModalItineraire from "@/app/components/itineraire/Checkoutmodalitineraire";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityItem = {
  id: string;
  excursion_id?: string;
  excursion: {
    title: string;
    city: string;
    price_per_person: number;
    duration_hours: number;
    photos: string[];
    meeting_point?: string;
    start_date?: string;
    start_time?: string;
  };
  note: string;
  time: "matin" | "aprem" | "soir";
  date?: string;
};

type DayPlan = { city: string; activities: ActivityItem[] };
type RawPlan = DayPlan[] | { title?: string; days?: unknown[] } | null | undefined;

type Itineraire = {
  id: string;
  nb_jours: number;
  villes_selectionnees: string[];
  categories_selectionnees?: string[];
  plan: RawPlan;
  created_at: string;
  updated_at: string;
};

type ExcursionForCheckout = {
  id: string;
  title: string;
  city: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  available_dates?: any[] | null;
  plan_date?: string;
  plan_time?: "matin" | "aprem" | "soir";
  plan_day?: number;
};

type PendingReservation = {
  id: string;
  excursion_id: string;
  payment_status: string;
  status: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TIME_CONFIG = {
  matin: { icon: <Sunrise size={12} />, label: "Matin",      color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  aprem: { icon: <Sun size={12} />,     label: "Après-midi", color: "#2B96A8", bg: "#EFF9FB", border: "#BAE6FD" },
  soir:  { icon: <Moon size={12} />,    label: "Soir",       color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizePlan(raw: RawPlan): DayPlan[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as DayPlan[];
  if (typeof raw === "object" && Array.isArray((raw as { days?: unknown[] }).days)) {
    const days = (raw as { days: unknown[] }).days;
    return days.map((d: unknown) => {
      const dd = d as Record<string, unknown>;
      const acts: ActivityItem[] = Array.isArray(dd.activities)
        ? (dd.activities as Record<string, unknown>[]).map(a => ({
            id: String(a.id || a.excursion_id || ""),
            excursion_id: String(a.excursion_id || a.id || ""),
            note: String(a.description || a.note || ""),
            time: (a.time as "matin" | "aprem" | "soir") || "matin",
            date: String(a.date || dd.date || ""),
            excursion: {
              title: String(a.name || a.title || ""),
              city: String(a.city || dd.city || ""),
              price_per_person: Number(a.price) || Number(a.price_per_person) || 0,
              duration_hours: parseFloat(String(a.duration || a.duration_hours || "2")) || 2,
              photos: Array.isArray(a.photos) ? (a.photos as string[]) : [],
              meeting_point: String(a.meeting_point || a.lieu_depart || ""),
              start_date: String(a.start_date || a.date || ""),
              start_time: String(a.start_time || ""),
            },
          }))
        : [];
      return { city: String(dd.city || ""), activities: acts };
    });
  }
  return [];
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const RESPONSIVE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes slideDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

  *, *::before, *::after { box-sizing: border-box; }

  .it-wrap {
    font-family: inherit'DM Sans', system-ui, sans-serif;
    padding: 36px 0 80px;
    width: 100%;
  }

  .it-card {
    animation: fadeUp .28s cubic-bezier(.16,1,.3,1) both;
    background: #ffffff;
    border-radius: 24px;
    border: 1.5px solid #E5E7EB;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,.04);
    transition: box-shadow .22s, transform .22s;
  }
  .it-card:hover { box-shadow: 0 10px 36px -8px rgba(43,150,168,.18); transform: translateY(-2px); }

  .it-card-header {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    user-select: none;
  }
  .it-card-meta  { flex: 1; min-width: 0; }
  .it-card-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; flex-wrap: wrap; }

  .it-btn { transition: all .15s; cursor: pointer; font-family: inheritinherit; border: none; outline: none; }

  /* Bouton Réserver */
  .it-reserve-all-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px;
    background: linear-gradient(135deg,#2B96A8,#1e7a8a);
    color: white; border: none; border-radius: 22px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: inherit'DM Sans',sans-serif; transition: all .18s;
    flex-shrink: 0; white-space: nowrap;
    box-shadow: 0 2px 10px rgba(43,150,168,.3);
  }
  .it-reserve-all-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(43,150,168,.45); }
  .it-reserve-all-btn:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; transform: none; box-shadow: none; }

  /* Bouton Payer */
  .it-pay-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px;
    background: linear-gradient(135deg,#059669,#047857);
    color: white; border: none; border-radius: 22px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: inherit'DM Sans',sans-serif; transition: all .18s;
    flex-shrink: 0; white-space: nowrap;
    box-shadow: 0 2px 10px rgba(5,150,105,.35);
    animation: fadeIn .25s ease;
  }
  .it-pay-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(5,150,105,.5); }
  .it-pay-btn:disabled { background: #E5E7EB; color: #9CA3AF; cursor: not-allowed; transform: none; box-shadow: none; }

  /* Badge "Tout payé" — non cliquable */
  .it-paid-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px;
    background: #F0FDF4;
    color: #059669; border: 1.5px solid #86EFAC; border-radius: 22px;
    font-size: 12px; font-weight: 800;
    flex-shrink: 0; white-space: nowrap;
    cursor: default;
  }

  .it-day-section {
    animation: slideDown .22s ease both;
    margin-bottom: 28px;
  }
  .it-day-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
    padding: 10px 14px;
    background: linear-gradient(90deg, #F0FDFF, #F8FEFF);
    border-radius: 14px;
    border-left: 4px solid #2B96A8;
  }

  .exc-card {
    display: flex;
    gap: 0;
    background: #fff;
    border-radius: 18px;
    border: 1.5px solid #E5E7EB;
    overflow: hidden;
    margin-bottom: 12px;
    transition: border-color .2s, box-shadow .2s, transform .2s;
    animation: fadeUp .25s ease both;
  }
  .exc-card:hover {
    border-color: #2B96A8;
    box-shadow: 0 6px 28px -6px rgba(43,150,168,.2);
    transform: translateY(-2px);
  }

  .exc-img-panel {
    position: relative;
    width: 180px;
    min-width: 180px;
    flex-shrink: 0;
    overflow: hidden;
    background: #EEF2FF;
    cursor: pointer;
  }
  .exc-img-panel img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform .4s cubic-bezier(.25,.46,.45,.94);
    display: block;
  }
  .exc-card:hover .exc-img-panel img { transform: scale(1.06); }

  .exc-img-placeholder {
    width: 100%; height: 100%; min-height: 160px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
    cursor: pointer;
  }

  .exc-time-badge {
    position: absolute; top: 10px; left: 10px;
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px;
    font-size: 10px; font-weight: 700;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.4);
  }

  .exc-price-badge {
    position: absolute; bottom: 10px; right: 10px;
    background: rgba(0,0,0,.65);
    color: white;
    padding: 4px 10px; border-radius: 12px;
    font-size: 11px; font-weight: 800;
    backdrop-filter: blur(6px);
    letter-spacing: .3px;
  }

  .exc-content {
    flex: 1; min-width: 0;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .exc-title {
    font-size: 15px; font-weight: 800; color: #0F172A;
    margin: 0 0 6px;
    cursor: pointer;
    transition: color .15s;
    line-height: 1.3;
    display: flex; align-items: flex-start; gap: 6px;
  }
  .exc-title:hover { color: #2B96A8; }

  .exc-city-row {
    display: flex; align-items: center; gap: 4px;
    font-size: 11px; color: #6B7280; font-weight: 500;
    margin-bottom: 10px;
  }

  .exc-chips {
    display: flex; flex-wrap: wrap; gap: 6px;
    margin-bottom: 10px;
  }
  .exc-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px;
    background: #F8FAFC; border: 1px solid #E2E8F0;
    border-radius: 20px; font-size: 11px; font-weight: 600;
    color: #374151; white-space: nowrap;
  }
  .exc-chip.green { background: #F0FDF4; border-color: #BBF7D0; color: #065F46; }
  .exc-chip.blue  { background: #EFF9FB; border-color: #BAE6FD; color: #0369A1; }

  .exc-info-row {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 10px; border-radius: 10px;
    font-size: 11px; font-weight: 600;
    margin-bottom: 6px;
  }
  .exc-info-row.date  { background: #F0FDF4; color: #065F46; border: 1px solid #D1FAE5; }
  .exc-info-row.place { background: #FFF7ED; color: #9A3412; border: 1px solid #FED7AA; }

  .exc-note {
    font-size: 11px; color: #9CA3AF; font-style: italic;
    display: flex; align-items: flex-start; gap: 4px;
    margin-top: 4px; line-height: 1.5;
  }

  .exc-footer {
    margin-top: auto; padding-top: 12px;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid #F3F4F6;
  }

  .btn-voir-detail {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px;
    background: white; border: 1.5px solid #2B96A8;
    border-radius: 22px; font-size: 11px; font-weight: 700;
    color: #2B96A8; cursor: pointer; text-decoration: none;
    transition: all .18s; font-family: inherit'DM Sans', sans-serif;
  }
  .btn-voir-detail:hover { background: #2B96A8; color: white; box-shadow: 0 3px 12px rgba(43,150,168,.35); transform: translateY(-1px); }
  .btn-voir-detail:disabled,
  .btn-voir-detail[data-unavailable="true"] { border-color: #E5E7EB; color: #D1D5DB; cursor: not-allowed; transform: none; }
  .btn-voir-detail[data-unavailable="true"]:hover { background: white; color: #D1D5DB; box-shadow: none; }

  .it-page-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 32px;
  }

  @media (max-width: 768px) {
    .it-wrap { padding: 16px 14px 60px; }
    .it-card-header { padding: 14px 16px; flex-wrap: wrap; }
    .it-card-actions { width: 100%; justify-content: flex-start; padding-top: 4px; }

    .exc-card { flex-direction: column; }
    .exc-img-panel { width: 100%; min-width: 100%; height: 180px; }
    .exc-img-placeholder { min-height: 140px; }
    .exc-content { padding: 14px 14px 14px; }
    .exc-title { font-size: 14px; }
    .exc-footer { flex-wrap: wrap; gap: 8px; }

    .it-detail { padding: 0 14px 16px !important; }
    .it-day-header { padding: 8px 12px; border-radius: 12px; }
    .it-reserve-all-btn, .it-pay-btn { font-size: 11px; padding: 8px 14px; }
  }

  @media (max-width: 480px) {
    .it-wrap { padding: 12px 10px 48px; }
    .exc-img-panel { height: 160px; }
    .it-card-actions button, .it-card-actions a {
      font-size: 11px !important;
      padding: 7px 12px !important;
    }
    .it-reserve-all-btn, .it-pay-btn, .it-paid-badge { width: 100%; justify-content: center; }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function ItinerairesClient() {
  const sb     = createClient();
  const router = useRouter();

  const [items,    setItems]    = useState<Itineraire[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [excPhotos,  setExcPhotos]  = useState<Record<string, string[]>>({});
  const [excDetails, setExcDetails] = useState<Record<string, any>>({});
  const [titleToId,  setTitleToId]  = useState<Record<string, string>>({});

  // Map itineraireId → réservations groupées par statut
  const [resByItinId, setResByItinId] = useState<
    Record<string, { pending: PendingReservation[]; paid: PendingReservation[] }>
  >({});

  const [checkoutItineraire, setCheckoutItineraire] = useState<{
    excursions: ExcursionForCheckout[];
    itineraireId: string;
  } | null>(null);
  const [loadingItinId, setLoadingItinId] = useState<string | null>(null);

  // ── Chargement initial ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      const { data: { user }, error: uErr } = await sb.auth.getUser();
      if (uErr || !user) {
        setError("Non connecté — " + (uErr?.message || ""));
        setLoading(false);
        return;
      }

      const { data, error: fErr } = await sb
        .from("itineraires")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (fErr) { setError(fErr.message); setLoading(false); return; }

      const itineraires: Itineraire[] = data || [];
      setItems(itineraires);

      // ── Charger toutes les réservations liées (pending ET paid)
      if (itineraires.length > 0) {
        const itinIds = itineraires.map(i => i.id);
        const { data: resRows } = await sb
          .from("reservations")
          .select("id, excursion_id, payment_status, status, itineraire_id")
          .eq("touriste_id", user.id)
          .in("itineraire_id", itinIds)
          .neq("status", "cancelled");

        if (resRows && resRows.length > 0) {
          const map: Record<string, { pending: PendingReservation[]; paid: PendingReservation[] }> = {};
          resRows.forEach((r: any) => {
            if (!map[r.itineraire_id]) map[r.itineraire_id] = { pending: [], paid: [] };
            const obj: PendingReservation = {
              id: r.id,
              excursion_id: r.excursion_id,
              payment_status: r.payment_status,
              status: r.status,
            };
            if (r.payment_status === "paid") {
              map[r.itineraire_id].paid.push(obj);
            } else if (r.status === "pending") {
              map[r.itineraire_id].pending.push(obj);
            }
          });
          setResByItinId(map);
        }
      }

      // ── Charger les photos / détails des excursions ──
      const candidateIds = new Set<string>();
      const planCities   = new Set<string>();

      itineraires.forEach(it => {
        it.villes_selectionnees?.forEach(v => { if (v?.trim()) planCities.add(v.trim()); });
        normalizePlan(it.plan).forEach(day => {
          if (day.city?.trim()) planCities.add(day.city.trim());
          day.activities?.forEach(act => {
            if (act.id && isValidUUID(act.id)) candidateIds.add(act.id);
            if (act.excursion_id && isValidUUID(act.excursion_id)) candidateIds.add(act.excursion_id);
            if (act.excursion?.city?.trim()) planCities.add(act.excursion.city.trim());
          });
        });
      });

      const photoMap:   Record<string, string[]> = {};
      const detailsMap: Record<string, any>      = {};
      const titleMap:   Record<string, string>   = {};

      const indexExc = (e: any) => {
        photoMap[e.id]   = e.photos || [];
        detailsMap[e.id] = {
          meeting_point: e.meeting_point,
          start_date:    e.start_date,
          start_time:    e.depart_time,
          city:          e.city,
          title:         e.title,
        };
        if (e.title) {
          titleMap[normalizeStr(e.title)]        = e.id;
          titleMap[e.title.trim().toLowerCase()] = e.id;
        }
      };

      if (candidateIds.size > 0) {
        const { data: excs } = await sb
          .from("excursions")
          .select("id, title, city, photos, meeting_point, start_date, depart_time")
          .in("id", Array.from(candidateIds));
        excs?.forEach(indexExc);
      }
      if (planCities.size > 0) {
        const { data: excsByCity } = await sb
          .from("excursions")
          .select("id, title, city, photos, meeting_point, start_date, depart_time")
          .in("city", Array.from(planCities));
        excsByCity?.forEach(indexExc);
      }
      const { data: allExcs } = await sb
        .from("excursions")
        .select("id, title, city, photos, meeting_point, start_date, depart_time")
        .limit(500);
      allExcs?.forEach(indexExc);

      setExcPhotos(photoMap);
      setExcDetails(detailsMap);
      setTitleToId(titleMap);
      setLoading(false);
    })();
  }, []);

  // ── Résolution ID ─────────────────────────────────────────────────────────
  const resolveExcursionId = (act: ActivityItem): string | null => {
    if (isValidUUID(act.id) && excDetails[act.id]) return act.id;
    if (act.excursion_id && isValidUUID(act.excursion_id) && excDetails[act.excursion_id])
      return act.excursion_id;
    const title = act.excursion?.title;
    if (title) {
      const norm  = normalizeStr(title);
      const lower = title.trim().toLowerCase();
      if (titleToId[norm])  return titleToId[norm];
      if (titleToId[lower]) return titleToId[lower];
      const entries   = Object.entries(titleToId);
      const contained = entries.find(([key]) => key.includes(norm) || norm.includes(key));
      if (contained) return contained[1];
      const planWords = norm.split(" ").filter(w => w.length > 2);
      if (planWords.length > 0) {
        const best = entries
          .map(([key, id]) => {
            const dbWords = key.split(" ").filter(w => w.length > 2);
            const common  = planWords.filter(w => dbWords.includes(w)).length;
            const score   = common / Math.max(planWords.length, dbWords.length);
            return { id, score };
          })
          .filter(m => m.score >= 0.5)
          .sort((a, b) => b.score - a.score)[0];
        if (best) return best.id;
      }
    }
    if (act.excursion_id && isValidUUID(act.excursion_id)) return act.excursion_id;
    if (isValidUUID(act.id)) return act.id;
    return null;
  };

  const getActPhoto   = (act: ActivityItem) => {
    const id = resolveExcursionId(act);
    return (id ? excPhotos[id]?.[0] : undefined) || act.excursion?.photos?.[0];
  };

  const getActDetails = (act: ActivityItem) => {
    const id = resolveExcursionId(act);
    return id ? excDetails[id] : undefined;
  };

  const navigateToExcursion = (act: ActivityItem) => {
    const resolvedId = resolveExcursionId(act);
    if (resolvedId) { router.push(`/excursions/${resolvedId}`); return; }
    const rawId = act.excursion_id || act.id;
    if (rawId && isValidUUID(rawId)) { router.push(`/excursions/${rawId}`); return; }
    alert(`Impossible de trouver l'excursion « ${act.excursion?.title || "inconnue"} ».`);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const deleteIt = async (id: string) => {
    if (!confirm("Supprimer cet itinéraire ?")) return;
    setDeleting(id);
    const { error } = await sb.from("itineraires").delete().eq("id", id);
    if (!error) setItems(p => p.filter(i => i.id !== id));
    setDeleting(null);
  };

  const totAct    = (raw: RawPlan) => normalizePlan(raw).reduce((s, d) => s + (d.activities?.length || 0), 0);
  const totBudget = (raw: RawPlan) => normalizePlan(raw).reduce(
    (s, d) => s + (d.activities || []).reduce((ss, a) => ss + (a.excursion?.price_per_person || 0), 0), 0
  );
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  const isAssisted = (raw: RawPlan) => !!raw && !Array.isArray(raw) && typeof raw === "object" && "days" in raw;

  // ── Détermine l'état de paiement d'un itinéraire ──────────────────────────
  // "paid"    → toutes les réservations actives sont payées
  // "partial" → certaines payées, d'autres en attente
  // "pending" → réservations en attente de paiement, aucune payée
  // "none"    → aucune réservation
  const getItinPayState = (itinId: string): "paid" | "partial" | "pending" | "none" => {
    const res = resByItinId[itinId];
    if (!res) return "none";
    const hasPaid    = res.paid.length > 0;
    const hasPending = res.pending.length > 0;
    if (hasPaid && !hasPending) return "paid";
    if (hasPaid && hasPending)  return "partial";
    if (!hasPaid && hasPending) return "pending";
    return "none";
  };

  // ── Checkout ──────────────────────────────────────────────────────────────
  const openItineraryCheckout = async (it: Itineraire) => {
    // ── GARDE : vérifier si l'itinéraire est déjà entièrement payé ──
    const payState = getItinPayState(it.id);
    if (payState === "paid") {
      alert("Cet itinéraire est déjà entièrement payé. Vous pouvez consulter vos réservations.");
      return;
    }

    setLoadingItinId(it.id);
    try {
      const plan = normalizePlan(it.plan);
      type ActMeta = { planAct: ActivityItem; dayIndex: number };
      const allActs: ActMeta[] = [];
      plan.forEach((day, di) => {
        (day.activities || []).forEach(act => allActs.push({ planAct: act, dayIndex: di }));
      });
      if (allActs.length === 0) { alert("Cet itinéraire ne contient aucune activité."); return; }

      const resolvedByUUID: Record<string, ActMeta> = {};
      allActs.forEach(meta => {
        const dbId = resolveExcursionId(meta.planAct);
        if (dbId && !resolvedByUUID[dbId]) resolvedByUUID[dbId] = meta;
      });
      const unresolvedActs = allActs.filter(meta => !resolveExcursionId(meta.planAct));
      let extraDbExcs: any[] = [];
      const extraCities = [...new Set(unresolvedActs.map(({ planAct, dayIndex }) =>
        planAct.excursion?.city?.trim() || plan[dayIndex]?.city?.trim() || "").filter(Boolean))];
      if (extraCities.length > 0) {
        const { data } = await sb.from("excursions")
          .select("id, title, city, duration_hours, price_per_person, max_people, available_dates, photos")
          .in("city", extraCities);
        if (data) extraDbExcs = data;
      }
      if (extraDbExcs.length === 0 && unresolvedActs.length > 0) {
        const { data } = await sb.from("excursions")
          .select("id, title, city, duration_hours, price_per_person, max_people, available_dates, photos")
          .limit(500);
        if (data) extraDbExcs = data;
      }
      const localTitleToId: Record<string, string> = { ...titleToId };
      extraDbExcs.forEach((e: any) => {
        if (e.title) { localTitleToId[normalizeStr(e.title)] = e.id; localTitleToId[e.title.trim().toLowerCase()] = e.id; }
      });
      const resolvedByTitle: Record<string, { meta: ActMeta; dbRow: any }> = {};
      unresolvedActs.forEach(meta => {
        const title = meta.planAct.excursion?.title;
        if (!title) return;
        const norm  = normalizeStr(title);
        const lower = title.trim().toLowerCase();
        let foundId: string | null = localTitleToId[norm] || localTitleToId[lower] || null;
        if (!foundId) {
          const contained = Object.entries(localTitleToId).find(([key]) => key.includes(norm) || norm.includes(key));
          if (contained) foundId = contained[1];
        }
        if (!foundId) {
          const planWords = norm.split(" ").filter(w => w.length > 2);
          if (planWords.length > 0) {
            const best = Object.entries(localTitleToId).map(([key, id]) => {
              const dbWords = key.split(" ").filter(w => w.length > 2);
              const common  = planWords.filter(w => dbWords.includes(w)).length;
              return { id, score: common / Math.max(planWords.length, dbWords.length) };
            }).filter(m => m.score >= 0.5).sort((a, b) => b.score - a.score)[0];
            if (best) foundId = best.id;
          }
        }
        if (foundId && !resolvedByUUID[foundId] && !resolvedByTitle[foundId]) {
          resolvedByTitle[foundId] = { meta, dbRow: extraDbExcs.find((e: any) => e.id === foundId) || null };
        }
      });
      const uuidIds = Object.keys(resolvedByUUID);
      let uuidDbRows: any[] = [];
      if (uuidIds.length > 0) {
        const { data } = await sb.from("excursions")
          .select("id, title, city, duration_hours, price_per_person, max_people, available_dates, photos")
          .in("id", uuidIds);
        if (data) uuidDbRows = data;
      }

      // ── Récupérer les IDs déjà payés pour CET itinéraire ──
      const alreadyPaidExcIds = new Set(
        (resByItinId[it.id]?.paid || []).map(r => r.excursion_id)
      );
      // ── Récupérer les IDs en attente (déjà réservés mais pas payés) ──
      const alreadyPendingExcIds = new Set(
        (resByItinId[it.id]?.pending || []).map(r => r.excursion_id)
      );

      const excursionsMap: Record<string, ExcursionForCheckout> = {};

      uuidDbRows.forEach((row: any) => {
        // ── GARDE : ignorer les excursions déjà payées ──
        if (alreadyPaidExcIds.has(row.id)) return;
        const meta = resolvedByUUID[row.id];
        if (!meta) return;
        excursionsMap[row.id] = {
          id: row.id, title: row.title, city: row.city,
          duration_hours: row.duration_hours || meta.planAct.excursion?.duration_hours || 2,
          price_per_person: row.price_per_person || meta.planAct.excursion?.price_per_person || 0,
          max_people: row.max_people || 20, available_dates: row.available_dates ?? null,
          plan_date: meta.planAct.date || meta.planAct.excursion?.start_date || undefined,
          plan_time: meta.planAct.time || undefined, plan_day: meta.dayIndex + 1,
        };
      });

      Object.entries(resolvedByTitle).forEach(([dbId, { meta, dbRow }]) => {
        // ── GARDE : ignorer les excursions déjà payées ──
        if (alreadyPaidExcIds.has(dbId)) return;
        if (excursionsMap[dbId]) return;
        const row = dbRow || extraDbExcs.find((e: any) => e.id === dbId);
        if (!row) return;
        excursionsMap[dbId] = {
          id: row.id, title: row.title, city: row.city,
          duration_hours: row.duration_hours || meta.planAct.excursion?.duration_hours || 2,
          price_per_person: row.price_per_person || meta.planAct.excursion?.price_per_person || 0,
          max_people: row.max_people || 20, available_dates: row.available_dates ?? null,
          plan_date: meta.planAct.date || meta.planAct.excursion?.start_date || undefined,
          plan_time: meta.planAct.time || undefined, plan_day: meta.dayIndex + 1,
        };
      });

      const excursions = Object.values(excursionsMap);

      // Cas particulier : tout est déjà payé (race condition)
      if (excursions.length === 0 && alreadyPaidExcIds.size > 0) {
        alert("Toutes les excursions de cet itinéraire sont déjà payées !");
        return;
      }

      if (excursions.length === 0) {
        const seen = new Set<string>();
        const fallback: ExcursionForCheckout[] = [];
        allActs.forEach(({ planAct, dayIndex }) => {
          const excId = resolveExcursionId(planAct) || planAct.excursion_id || planAct.id;
          // ── GARDE fallback ──
          if (excId && alreadyPaidExcIds.has(excId)) return;
          const key = normalizeStr(planAct.excursion?.title || planAct.id || String(dayIndex));
          if (seen.has(key)) return;
          seen.add(key);
          fallback.push({
            id: planAct.excursion_id || planAct.id || `fallback-${dayIndex}`,
            title: planAct.excursion?.title || "Excursion", city: planAct.excursion?.city || "",
            duration_hours: planAct.excursion?.duration_hours || 2,
            price_per_person: planAct.excursion?.price_per_person || 0,
            max_people: 20, available_dates: null,
            plan_date: planAct.date || planAct.excursion?.start_date || undefined,
            plan_time: planAct.time || undefined, plan_day: dayIndex + 1,
          });
        });
        setCheckoutItineraire({ excursions: fallback, itineraireId: it.id });
        return;
      }

      setCheckoutItineraire({ excursions, itineraireId: it.id });
    } catch (e) {
      console.error("openItineraryCheckout error:", e);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoadingItinId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "100px 0", color: "#9CA3AF", fontSize: 14, fontFamily: "'DM Sans',system-ui" }}>
      <Loader2 size={22} color="#2B96A8" style={{ animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Chargement de vos itinéraires…
    </div>
  );

  if (error) return (
    <div style={{ margin: "40px 16px", padding: "18px 22px", background: "#FEF2F2", borderRadius: 14, border: "1px solid #FCA5A5", display: "flex", alignItems: "center", gap: 12 }}>
      <AlertCircle size={18} color="#DC2626" />
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", margin: 0 }}>Erreur de chargement</p>
        <p style={{ fontSize: 12, color: "#EF4444", margin: "2px 0 0" }}>{error}</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div className="it-wrap">

        {/* Page header */}
        <div className="it-page-header">
          <div>
            <h1 style={{ fontSize: "clamp(20px,4vw,28px)", fontWeight: 800, color: "#053366", margin: 0, fontFamily: "'Playfair Display',serif" }}>
              Mes itinéraires
            </h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <CalendarDays size={13} />
              {items.length} itinéraire{items.length !== 1 ? "s" : ""} sauvegardé{items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 16px", background: "#ffffff", borderRadius: 28, border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <Map size={52} color="#D1D5DB" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "#111827", marginBottom: 10 }}>
              Aucun itinéraire sauvegardé
            </h2>
            <p style={{ fontSize: 14, color: "#9CA3AF", maxWidth: 320, margin: "0 auto 28px" }}>
              Planifiez votre voyage en Tunisie et sauvegardez votre itinéraire
            </p>
            <a href="/touriste/itineraire"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "linear-gradient(135deg,#2B96A8,#1e7a8a)", color: "white", borderRadius: 40, textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 16px rgba(43,150,168,.35)" }}>
              <PenLine size={15} /> Créer mon premier itinéraire
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((it, idx) => {
              const plan          = normalizePlan(it.plan);
              const acts          = totAct(it.plan);
              const budget        = totBudget(it.plan);
              const isOpen        = expanded === it.id;
              const assisted      = isAssisted(it.plan);
              const isThisLoading = loadingItinId === it.id;

              const itinRes       = resByItinId[it.id] || { pending: [], paid: [] };
              const payState      = getItinPayState(it.id);
              const pendingCount  = itinRes.pending.length;
              const paidCount     = itinRes.paid.length;

              return (
                <div key={it.id} className="it-card" style={{ animationDelay: `${idx * .07}s` }}>

                  {/* ── Card header ── */}
                  <div className="it-card-header" onClick={() => setExpanded(isOpen ? null : it.id)}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: assisted ? "linear-gradient(135deg,rgba(2,175,207,.15),rgba(37,159,252,.1))" : "linear-gradient(135deg,#EFF9FB,#D0F0F5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${assisted ? "rgba(2,175,207,.25)" : "rgba(43,150,168,.15)"}`,
                    }}>
                      {assisted ? <Bot size={20} color="#02AFCF" /> : <PenLine size={20} color="#2B96A8" />}
                    </div>

                    <div className="it-card-meta">
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "clamp(13px,3vw,15px)", fontWeight: 800, color: "#111827", margin: 0 }}>
                          {it.nb_jours} jour{it.nb_jours > 1 ? "s" : ""} en Tunisie
                        </h3>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: assisted ? "rgba(2,175,207,.1)" : "rgba(43,150,168,.08)", color: assisted ? "#02AFCF" : "#2B96A8" }}>
                          {assisted ? <><Bot size={10} /> Mode IA</> : <><PenLine size={10} /> Mode Libre</>}
                        </span>

                        {/* ── Badge statut paiement ── */}
                        {payState === "paid" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#F0FDF4", color: "#059669", border: "1px solid #86EFAC" }}>
                            <CheckCircle2 size={9} /> Payé
                          </span>
                        )}
                        {payState === "partial" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>
                            <BanknoteIcon size={9} /> {paidCount} payée{paidCount > 1 ? "s" : ""} · {pendingCount} en attente
                          </span>
                        )}
                        {payState === "pending" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(5,150,105,.1)", color: "#059669", border: "1px solid rgba(5,150,105,.2)" }}>
                            <CreditCard size={9} /> {pendingCount} à payer
                          </span>
                        )}

                        {it.villes_selectionnees?.slice(0, 3).map(v => (
                          <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>
                            <MapPin size={9} color="#9CA3AF" /> {v}
                          </span>
                        ))}
                        {(it.villes_selectionnees?.length || 0) > 3 && (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>+{it.villes_selectionnees.length - 3}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#9CA3AF", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CalendarDays size={11} /> {fmt(it.updated_at)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <MapPin size={11} /> {acts} activité{acts !== 1 ? "s" : ""}
                        </span>
                        {budget > 0 && (
                          <span style={{ color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            <Coins size={11} /> {budget} EUR
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="it-card-actions" onClick={e => e.stopPropagation()}>
                      <a href={`/touriste/itineraires/${it.id}`}
                        style={{ padding: "8px 14px", background: "#F3F4F6", color: "#374151", borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E5E7EB"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}>
                        <Pencil size={12} /> Modifier
                      </a>
                      <button className="it-btn"
                        onClick={() => deleteIt(it.id)}
                        disabled={deleting === it.id}
                        style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                        {deleting === it.id
                          ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
                          : <Trash2 size={13} />}
                      </button>

                      {/* ── Bouton CTA selon état paiement ── */}
                      {payState === "paid" ? (
                        /* Tout payé → badge non cliquable */
                        <span className="it-paid-badge">
                          <CheckCircle2 size={13} /> Tout payé
                        </span>
                      ) : payState === "pending" || payState === "partial" ? (
                        /* Réservations en attente → Payer */
                        <button
                          className="it-pay-btn"
                          disabled={isThisLoading}
                          onClick={e => { e.stopPropagation(); openItineraryCheckout(it); }}
                          title={`${pendingCount} réservation(s) en attente de paiement`}
                        >
                          {isThisLoading
                            ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} /> Chargement…</>
                            : <><CreditCard size={13} /> Payer ({pendingCount})</>
                          }
                        </button>
                      ) : (
                        /* Aucune réservation → Réserver */
                        <button
                          className="it-reserve-all-btn"
                          disabled={isThisLoading}
                          onClick={e => { e.stopPropagation(); openItineraryCheckout(it); }}
                        >
                          {isThisLoading
                            ? <><Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} /> Chargement…</>
                            : <><ShoppingCart size={13} /> Réserver</>
                          }
                        </button>
                      )}
                    </div>

                    <div style={{ color: "#D1D5DB", flexShrink: 0, marginLeft: 4 }}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* ── Détail expandé ── */}
                  {isOpen && (
                    <div className="it-detail" style={{ padding: "0 20px 20px", borderTop: "1px solid #F3F4F6" }}>
                      <div style={{ paddingTop: 20 }}>
                        {plan.length === 0 ? (
                          <p style={{ fontSize: 13, color: "#C4C9D0", fontStyle: "italic" }}>Aucune activité planifiée</p>
                        ) : plan.map((day, di) => (
                          <div key={di} className="it-day-section">

                            <div className="it-day-header">
                              <div style={{ width: 30, height: 30, borderRadius: 10, background: "linear-gradient(135deg,#2B96A8,#02AFCF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>{di + 1}</span>
                              </div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 800, color: "#053366", margin: 0 }}>
                                  Jour {di + 1} — {day.city}
                                </p>
                                <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
                                  {(day.activities || []).length} activité{(day.activities || []).length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>

                            {(day.activities || []).length === 0 ? (
                              <p style={{ fontSize: 12, color: "#D1D5DB", fontStyle: "italic", paddingLeft: 8 }}>Journée libre</p>
                            ) : (day.activities || []).map((act, ai) => {
                              const photo        = getActPhoto(act);
                              const details      = getActDetails(act);
                              const startDate    = act.date || details?.start_date || act.excursion?.start_date;
                              const startTime    = act.excursion?.start_time || details?.start_time;
                              const meetingPoint = details?.meeting_point || act.excursion?.meeting_point;
                              const resolvedId   = resolveExcursionId(act);
                              const canNavigate  = !!resolvedId || isValidUUID(act.excursion_id || "") || isValidUUID(act.id);
                              const timeCfg      = act.time ? TIME_CONFIG[act.time] : null;

                              // Statut de paiement de cette activité
                              const actPaid    = resolvedId
                                ? itinRes.paid.some(pr => pr.excursion_id === resolvedId)
                                : false;
                              const actPending = resolvedId
                                ? itinRes.pending.some(pr => pr.excursion_id === resolvedId)
                                : false;

                              return (
                                <div
                                  key={act.id || ai}
                                  className="exc-card"
                                  style={{
                                    animationDelay: `${ai * .05}s`,
                                    borderColor: actPaid ? "#86EFAC" : actPending ? "#BAE6FD" : undefined,
                                    background:   actPaid ? "#F0FFF4" : actPending ? "#EFF9FB" : undefined,
                                  }}
                                >
                                  {/* ── Image panel ── */}
                                  <div
                                    className="exc-img-panel"
                                    onClick={() => canNavigate && navigateToExcursion(act)}
                                    style={{ cursor: canNavigate ? "pointer" : "default" }}
                                  >
                                    {photo ? (
                                      <img
                                        src={photo}
                                        alt={act.excursion?.title || ""}
                                        onError={e => {
                                          const parent = (e.target as HTMLImageElement).parentElement;
                                          if (parent) {
                                            (e.target as HTMLImageElement).style.display = "none";
                                            const ph = parent.querySelector(".exc-img-placeholder") as HTMLElement;
                                            if (ph) ph.style.display = "flex";
                                          }
                                        }}
                                      />
                                    ) : null}
                                    {!photo && (
                                      <div className="exc-img-placeholder">
                                        <ImageIcon size={28} color="#9CA3AF" strokeWidth={1.5} />
                                        <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Pas de photo</span>
                                      </div>
                                    )}

                                    {timeCfg && (
                                      <span
                                        className="exc-time-badge"
                                        style={{ background: timeCfg.bg, color: timeCfg.color, border: `1px solid ${timeCfg.border}` }}
                                      >
                                        {timeCfg.icon} {timeCfg.label}
                                      </span>
                                    )}

                                    {act.excursion?.price_per_person > 0 && (
                                      <span className="exc-price-badge">
                                        {act.excursion.price_per_person} EUR
                                      </span>
                                    )}

                                    {/* Badge statut sur l'image */}
                                    {actPaid && (
                                      <span style={{
                                        position: "absolute", top: 10, right: 10,
                                        background: "#059669", color: "white",
                                        fontSize: 9, fontWeight: 800, padding: "3px 8px",
                                        borderRadius: 12, letterSpacing: .3,
                                        display: "flex", alignItems: "center", gap: 3,
                                      }}>
                                        <CheckCircle2 size={9} /> Payé
                                      </span>
                                    )}
                                    {actPending && !actPaid && (
                                      <span style={{
                                        position: "absolute", top: 10, right: 10,
                                        background: "#2B96A8", color: "white",
                                        fontSize: 9, fontWeight: 800, padding: "3px 8px",
                                        borderRadius: 12, letterSpacing: .3,
                                        display: "flex", alignItems: "center", gap: 3,
                                      }}>
                                        <CreditCard size={9} /> À payer
                                      </span>
                                    )}
                                  </div>

                                  {/* ── Content panel ── */}
                                  <div className="exc-content">

                                    <p
                                      className="exc-title"
                                      onClick={() => canNavigate && navigateToExcursion(act)}
                                      style={{ cursor: canNavigate ? "pointer" : "default" }}
                                    >
                                      {act.excursion?.title || "—"}
                                      {canNavigate && <ExternalLink size={13} color="#CBD5E1" style={{ flexShrink: 0, marginTop: 1 }} />}
                                    </p>

                                    {act.excursion?.city && (
                                      <div className="exc-city-row">
                                        <MapPin size={11} color="#9CA3AF" />
                                        {act.excursion.city}
                                      </div>
                                    )}

                                    <div className="exc-chips">
                                      {act.excursion?.duration_hours && (
                                        <span className="exc-chip blue">
                                          <Clock size={10} /> {act.excursion.duration_hours}h
                                        </span>
                                      )}
                                      {act.excursion?.price_per_person > 0 && (
                                        <span className="exc-chip green">
                                          <Coins size={10} /> {act.excursion.price_per_person} EUR / pers.
                                        </span>
                                      )}
                                    </div>

                                    {(startDate || startTime) && (
                                      <div className="exc-info-row date">
                                        <Calendar size={12} color="#059669" />
                                        <span>
                                          {startDate && formatDate(startDate)}
                                          {startTime && ` à ${startTime}`}
                                        </span>
                                      </div>
                                    )}

                                    {meetingPoint && (
                                      <div className="exc-info-row place">
                                        <Flag size={12} color="#EA580C" />
                                        <span>RDV : {meetingPoint}</span>
                                      </div>
                                    )}

                                    {act.note && (
                                      <p className="exc-note">
                                        <FileText size={10} style={{ flexShrink: 0, marginTop: 2 }} />
                                        {act.note}
                                      </p>
                                    )}

                                    <div className="exc-footer">
                                      <button
                                        className="btn-voir-detail"
                                        data-unavailable={!canNavigate ? "true" : undefined}
                                        disabled={!canNavigate}
                                        onClick={e => { e.stopPropagation(); if (canNavigate) navigateToExcursion(act); }}
                                        title={canNavigate ? `Voir ${act.excursion?.title}` : "Excursion introuvable"}
                                      >
                                        {canNavigate
                                          ? <><ArrowRight size={11} /> Voir l'excursion</>
                                          : <><AlertCircle size={11} /> Introuvable</>
                                        }
                                      </button>

                                      <span style={{ fontSize: 10, color: "#D1D5DB", fontWeight: 600 }}>
                                        J{di + 1} · #{ai + 1}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal checkout */}
        {checkoutItineraire && checkoutItineraire.excursions.length > 0 && (
          <CheckoutModalItineraire
            excursions={checkoutItineraire.excursions}
            itineraireId={checkoutItineraire.itineraireId}
            onClose={() => setCheckoutItineraire(null)}
          />
        )}
      </div>
    </>
  );
}