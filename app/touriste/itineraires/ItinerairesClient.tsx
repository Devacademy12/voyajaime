"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Map, Trash2, Pencil, ChevronDown, ChevronUp,
  MapPin, Clock, CalendarDays, Coins, Sunrise, Sun,
  Moon, Loader2, AlertCircle, FileText, ShoppingCart,
  Bot, PenLine, Image as ImageIcon, ExternalLink,
  Calendar, Flag,
} from "lucide-react";
import { ExcursionDetailModal } from "@/app/components/excursions/ExcursionDetailModal";

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
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TIME_ICON = {
  matin: <Sunrise size={11} color="#F59E0B" />,
  aprem: <Sun size={11} color="#2B96A8" />,
  soir: <Moon size={11} color="#8B5CF6" />,
};
const TIME_LABEL = { matin: "Matin", aprem: "Après-midi", soir: "Soir" };

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
            note: String(a.description || ""),
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

/**
 * Normalise un titre pour comparaison floue :
 * minuscules + sans accents + sans ponctuation + espaces normalisés
 */
function normalizeTitle(str: string): string {
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
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin   { to{transform:rotate(360deg)} }

  .it-wrap {
    font-family: 'DM Sans', system-ui, sans-serif;
    padding: 36px 48px 60px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
  .it-card { animation:fadeUp .22s ease both; transition:box-shadow .2s,transform .18s; }
  .it-card:hover { box-shadow:0 8px 28px -8px rgba(43,150,168,.2)!important; transform:translateY(-2px); }
  .it-btn { transition:all .15s; cursor:pointer; font-family:inherit; border:none; outline:none; }

  .it-reserve-all-btn {
    display:inline-flex; align-items:center; gap:6px;
    padding:8px 16px;
    background:linear-gradient(135deg,#2B96A8,#1e7a8a);
    color:white; border:none; border-radius:20px;
    font-size:12px; font-weight:700; cursor:pointer;
    font-family:'DM Sans',sans-serif; transition:all .18s;
    flex-shrink:0; white-space:nowrap;
  }
  .it-reserve-all-btn:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(43,150,168,.4); }
  .it-reserve-all-btn:disabled { background:#E5E7EB; color:#9CA3AF; cursor:not-allowed; transform:none; box-shadow:none; }

  .act-row {
    display:flex; align-items:flex-start; gap:10px;
    padding:12px 14px; background:#F9FAFB; border-radius:14px;
    margin-bottom:8px; border:1.5px solid #F3F4F6; transition:border .15s;
  }
  .act-row:hover { border-color:#2B96A8; background:#F8FAFF; }

  .act-photo {
    width:64px; height:64px; border-radius:12px; object-fit:cover;
    flex-shrink:0; border:1px solid #EEF2FF; cursor:pointer;
  }
  .act-photo-placeholder {
    width:64px; height:64px; border-radius:12px; flex-shrink:0;
    background:#EEF2FF; display:flex; align-items:center; justify-content:center;
    border:1px solid #DCE5FF; cursor:pointer;
  }
  .excursion-title { cursor:pointer; transition:color .15s; }
  .excursion-title:hover { color:#2B96A8; }
  .info-badge {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 8px; background:white; border-radius:20px;
    font-size:10px; font-weight:600; color:#374151; border:1px solid #E5E7EB;
  }
  .it-card-header {
    padding:20px 24px;
    display:flex; align-items:center; gap:14px;
    cursor:pointer;
  }
  .it-card-meta { flex:1; min-width:0; }
  .it-card-actions { display:flex; gap:8px; flex-shrink:0; align-items:center; }
  .it-page-header {
    display:flex; justify-content:space-between; align-items:flex-start;
    margin-bottom:32px;
  }

  @media (max-width: 900px) {
    .it-wrap { padding: 24px 24px 48px; }
  }
  @media (max-width: 640px) {
    .it-wrap { padding: 16px 12px 40px; }
    .it-card-header { flex-wrap:wrap; gap:10px; padding:14px 14px; }
    .it-card-actions {
      width:100%; flex-wrap:wrap; gap:6px;
      justify-content:flex-start; padding-top:4px;
    }
    .it-card-actions a,
    .it-card-actions button { font-size:11px !important; padding:6px 10px !important; }
    .it-reserve-all-btn { font-size:11px; padding:7px 12px; }
    .act-photo, .act-photo-placeholder { width:50px; height:50px; border-radius:10px; }
    .it-day-block { padding-left:10px !important; }
    .it-detail { padding: 0 14px 14px !important; }
  }
  @media (max-width: 380px) {
    .it-wrap { padding: 12px 8px 32px; }
    .it-card-header { padding: 12px 10px; }
    .it-reserve-all-btn { width:100%; justify-content:center; }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

export default function ItinerairesClient() {
  const sb = createClient();
  const [items, setItems] = useState<Itineraire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [excPhotos, setExcPhotos] = useState<Record<string, string[]>>({});
  const [excDetails, setExcDetails] = useState<Record<string, any>>({});
  // titre normalisé → UUID Supabase réel
  const [titleToId, setTitleToId] = useState<Record<string, string>>({});
  const [checkoutExcs, setCheckoutExcs] = useState<ExcursionForCheckout[] | null>(null);
  const [modalExcursion, setModalExcursion] = useState<any | null>(null);

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

      // ── Collecter IDs valides + villes du plan ──────────────────────────
      const candidateIds = new Set<string>();
      const planCities = new Set<string>();

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

      // ── Maps locaux ─────────────────────────────────────────────────────
      const photoMap: Record<string, string[]> = {};
      const detailsMap: Record<string, any> = {};
      const titleMap: Record<string, string> = {};

      // Indexe une excursion Supabase dans les 3 maps
      const indexExc = (e: any) => {
        photoMap[e.id] = e.photos || [];
        detailsMap[e.id] = {
          meeting_point: e.meeting_point,
          start_date: e.start_date,
          start_time: e.depart_time,
          city: e.city,
          title: e.title,
        };
        if (e.title) {
          // clé normalisée (robuste aux accents / casse / ponctuation)
          titleMap[normalizeTitle(e.title)] = e.id;
          // clé exacte minuscule (double sécurité)
          titleMap[e.title.trim().toLowerCase()] = e.id;
        }
      };

      // 1. Par UUIDs présents dans le plan (plan manuel ou IA avec bons IDs)
      if (candidateIds.size > 0) {
        const { data: excs } = await sb
          .from("excursions")
          .select("id, title, city, photos, meeting_point, start_date, depart_time")
          .in("id", Array.from(candidateIds));
        excs?.forEach(indexExc);
      }

      // 2. Par villes — charge TOUT le catalogue des villes du plan.
      //    Stratégie clé : le plan IA peut avoir de mauvais IDs ou des titres
      //    légèrement différents. En chargeant toutes les excursions des villes
      //    concernées, on peut ensuite matcher par titre normalisé.
      if (planCities.size > 0) {
        const { data: excsByCity } = await sb
          .from("excursions")
          .select("id, title, city, photos, meeting_point, start_date, depart_time")
          .in("city", Array.from(planCities));
        excsByCity?.forEach(indexExc);
      }

      setExcPhotos(photoMap);
      setExcDetails(detailsMap);
      setTitleToId(titleMap);
      setLoading(false);
    })();
  }, []);

  // ── Résolution UUID réel ───────────────────────────────────────────────────
  /**
   * Cascade :
   * 1. act.id  → UUID valide + connu en base
   * 2. act.excursion_id → UUID valide + connu en base
   * 3. Titre normalisé exact
   * 4. Titre exact minuscule
   * 5. Titre normalisé inclus dans une clé du map (ou vice-versa)
   * 6. Score de mots communs ≥ 60 %
   * 7. Dernier recours : UUID brut (même sans confirmation)
   */
  const resolveExcursionId = (act: ActivityItem): string | null => {
    if (isValidUUID(act.id) && excDetails[act.id]) return act.id;
    if (act.excursion_id && isValidUUID(act.excursion_id) && excDetails[act.excursion_id])
      return act.excursion_id;

    const title = act.excursion?.title;
    if (title) {
      const norm = normalizeTitle(title);
      const lower = title.trim().toLowerCase();

      if (titleToId[norm]) return titleToId[norm];
      if (titleToId[lower]) return titleToId[lower];

      const entries = Object.entries(titleToId);

      // Inclusion partielle
      const contained = entries.find(([key]) =>
        key.includes(norm) || norm.includes(key)
      );
      if (contained) return contained[1];

      // Score de mots communs
      const planWords = norm.split(" ").filter(w => w.length > 2);
      if (planWords.length > 0) {
        const best = entries
          .map(([key, id]) => {
            const dbWords = key.split(" ").filter(w => w.length > 2);
            const common = planWords.filter(w => dbWords.includes(w)).length;
            const score = common / Math.max(planWords.length, dbWords.length);
            return { id, score };
          })
          .filter(m => m.score >= 0.6)
          .sort((a, b) => b.score - a.score)[0];
        if (best) return best.id;
      }
    }

    // Dernier recours
    if (act.excursion_id && isValidUUID(act.excursion_id)) return act.excursion_id;
    if (isValidUUID(act.id)) return act.id;
    return null;
  };

  const getActPhoto = (act: ActivityItem): string | undefined => {
    const id = resolveExcursionId(act);
    return (id ? excPhotos[id]?.[0] : undefined) || act.excursion?.photos?.[0];
  };

  const getActDetails = (act: ActivityItem): any => {
    const id = resolveExcursionId(act);
    return id ? excDetails[id] : undefined;
  };

  const openExcursionDetails = async (act: ActivityItem) => {
    const id = resolveExcursionId(act);
    if (!id) {
      // fallback: open list page or do nothing
      return;
    }

    try {
      const { data: exc, error: eErr } = await sb
        .from("excursions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (eErr || !exc) {
        // fallback to opening the dedicated page if fetch fails
        window.open(`/excursions/${id}`, "_blank");
        return;
      }

      const excursionDetail = {
        id: exc.id,
        title: exc.title || "",
        city: exc.city || "",
        region: exc.region || null,
        description: exc.description || "",
        duration_hours: exc.duration_hours || exc.duration || 0,
        price_per_person: exc.price_per_person || exc.price || 0,
        max_people: exc.max_people || 0,
        categories: exc.categories || [],
        languages: exc.languages || [],
        inclusions: exc.inclusions || [],
        photos: exc.photos || [],
        rating: exc.rating || 0,
        reviews_count: exc.reviews_count || 0,
        meeting_point: exc.meeting_point || null,
        difficulty: exc.difficulty || null,
        min_age: exc.min_age || null,
        what_to_bring: exc.what_to_bring || null,
        not_included: exc.not_included || null,
        important_info: exc.important_info || null,
        cancel_policy: exc.cancel_policy || null,
        available_dates: exc.available_dates || null,
        depart_time: exc.depart_time || exc.start_time || null,
      };

      setModalExcursion(excursionDetail);
    } catch (e) {
      window.open(`/excursions/${id}`, "_blank");
    }
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const deleteIt = async (id: string) => {
    if (!confirm("Supprimer cet itinéraire ?")) return;
    setDeleting(id);
    const { error } = await sb.from("itineraires").delete().eq("id", id);
    if (!error) setItems(p => p.filter(i => i.id !== id));
    setDeleting(null);
  };

  const totAct = (raw: RawPlan) =>
    normalizePlan(raw).reduce((s, d) => s + (d.activities?.length || 0), 0);

  const totBudget = (raw: RawPlan) =>
    normalizePlan(raw).reduce(
      (s, d) => s + (d.activities || []).reduce((ss, a) => ss + (a.excursion?.price_per_person || 0), 0), 0
    );

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const isAssisted = (raw: RawPlan) =>
    !!raw && !Array.isArray(raw) && typeof raw === "object" && "days" in raw;

  const openItineraryCheckout = (it: Itineraire) => {
    const plan = normalizePlan(it.plan);
    const seen = new Set<string>();
    const excursions: ExcursionForCheckout[] = [];
    plan.forEach(day => {
      (day.activities || []).forEach(act => {
        if (!act.excursion?.price_per_person) return;
        const realId = resolveExcursionId(act);
        if (!realId || seen.has(realId)) return;
        seen.add(realId);
        excursions.push({
          id: realId,
          title: act.excursion.title,
          city: act.excursion.city,
          duration_hours: act.excursion.duration_hours,
          price_per_person: act.excursion.price_per_person,
          max_people: 20,
          available_dates: null,
        });
      });
    });
    if (excursions.length > 0) setCheckoutExcs(excursions);
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
            <h1 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, color: "#053366", margin: 0 }}>
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
          <div style={{ textAlign: "center", padding: "48px 16px", background: "#ffffff", borderRadius: 28, border: "1px solid #E5E7EB", boxShadow: "0 2px 12px rgba(0,0,0,.04)" }}>
            <Map size={52} color="#D1D5DB" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(18px,4vw,24px)", fontWeight: 900, color: "#111827", marginBottom: 10 }}>
              Aucun itinéraire sauvegardé
            </h2>
            <p style={{ fontSize: 14, color: "#9CA3AF", maxWidth: 320, margin: "0 auto 28px" }}>
              Planifiez votre voyage en Tunisie et sauvegardez votre itinéraire
            </p>
            <a href="/touriste/itineraire"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "#2B96A8", color: "white", borderRadius: 40, textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              <PenLine size={15} /> Créer mon premier itinéraire
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((it, idx) => {
              const plan = normalizePlan(it.plan);
              const acts = totAct(it.plan);
              const budget = totBudget(it.plan);
              const isOpen = expanded === it.id;
              const assisted = isAssisted(it.plan);
              const hasBookable = plan.some(d =>
                (d.activities || []).some(a => a.excursion?.price_per_person > 0)
              );

              return (
                <div key={it.id} className="it-card"
                  style={{ background: "white", borderRadius: 24, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,.05)", animationDelay: `${idx * .06}s` }}>

                  {/* Card header */}
                  <div className="it-card-header" onClick={() => setExpanded(isOpen ? null : it.id)}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: assisted ? "linear-gradient(135deg,rgba(2,175,207,.15),rgba(37,159,252,.1))" : "linear-gradient(135deg,#EFF9FB,#D0F0F5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${assisted ? "rgba(2,175,207,.25)" : "rgba(43,150,168,.15)"}` }}>
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
                        {it.villes_selectionnees?.slice(0, 2).map(v => (
                          <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>
                            <MapPin size={9} color="#9CA3AF" /> {v}
                          </span>
                        ))}
                        {(it.villes_selectionnees?.length || 0) > 2 && (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>+{it.villes_selectionnees.length - 2}</span>
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
                          <span style={{ color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            <Coins size={11} /> {budget} EUR
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="it-card-actions" onClick={e => e.stopPropagation()}>
                      <a href={`/touriste/itineraires/${it.id}`}
                        style={{ padding: "8px 14px", background: "#F3F4F6", color: "#374151", borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, transition: "all .15s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E5E7EB"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; }}>
                        <Pencil size={12} /> Modifier
                      </a>
                      <button className="it-btn"
                        onClick={() => deleteIt(it.id)} disabled={deleting === it.id}
                        style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                        {deleting === it.id
                          ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
                          : <Trash2 size={13} />}
                      </button>
                      <button className="it-reserve-all-btn" disabled={!hasBookable} onClick={() => openItineraryCheckout(it)}>
                        <ShoppingCart size={13} /> Réserver
                      </button>
                    </div>

                    <div style={{ color: "#D1D5DB", flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Détail expandé */}
                  {isOpen && (
                    <div className="it-detail" style={{ padding: "0 24px 20px", borderTop: "1px solid #F3F4F6" }}>
                      <div style={{ paddingTop: 18 }}>
                        {plan.length === 0 ? (
                          <p style={{ fontSize: 13, color: "#C4C9D0", fontStyle: "italic" }}>Aucune activité planifiée</p>
                        ) : plan.map((day, di) => (
                          <div key={di} className="it-day-block"
                            style={{ borderLeft: "3px solid #EEF2FF", paddingLeft: 14, marginBottom: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                              <MapPin size={12} color="#02AFCF" />
                              <p style={{ fontSize: 13, fontWeight: 800, color: "#053366", margin: 0 }}>
                                Jour {di + 1} — {day.city}
                              </p>
                            </div>

                            {(day.activities || []).length === 0 ? (
                              <p style={{ fontSize: 12, color: "#D1D5DB", fontStyle: "italic" }}>Journée libre</p>
                            ) : (day.activities || []).map((act, ai) => {
                              const photo = getActPhoto(act);
                              const details = getActDetails(act);
                              const startDate = act.date || details?.start_date || act.excursion?.start_date;
                              const startTime = act.excursion?.start_time || details?.start_time;
                              const meetingPoint = details?.meeting_point || act.excursion?.meeting_point;

                              return (
                                <div key={act.id || ai} className="act-row">

                                  {/* Photo */}
                                  {photo ? (
                                    <img
                                      src={photo}
                                      alt={act.excursion?.title || ""}
                                      className="act-photo"
                                      onClick={() => openExcursionDetails(act)}
                                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                    />
                                  ) : (
                                    <div className="act-photo-placeholder" onClick={() => openExcursionDetails(act)}>
                                      <ImageIcon size={20} color="#9CA3AF" strokeWidth={1.5} />
                                    </div>
                                  )}

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p
                                      className="excursion-title"
                                      onClick={() => openExcursionDetails(act)}
                                      style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                                      {act.excursion?.title || "—"}
                                      <ExternalLink size={12} color="#9CA3AF" />
                                    </p>

                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                                      {act.time && (
                                        <span className="info-badge">
                                          {TIME_ICON[act.time]} {TIME_LABEL[act.time]}
                                        </span>
                                      )}
                                      {act.excursion?.duration_hours && (
                                        <span className="info-badge">
                                          <Clock size={10} /> {act.excursion.duration_hours}h
                                        </span>
                                      )}
                                      {act.excursion?.price_per_person > 0 && (
                                        <span className="info-badge" style={{ color: "#02AFCF" }}>
                                          <Coins size={10} /> {act.excursion.price_per_person} EUR
                                        </span>
                                      )}
                                    </div>

                                    {(startDate || startTime) && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6, padding: "4px 8px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #D1FAE5" }}>
                                        <Calendar size={12} color="#059669" />
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#065F46" }}>
                                          {startDate && formatDate(startDate)}
                                          {startTime && ` à ${startTime}`}
                                        </span>
                                      </div>
                                    )}

                                    {meetingPoint && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6, padding: "4px 8px", background: "#FFF7ED", borderRadius: 8, border: "1px solid #FED7AA" }}>
                                        <Flag size={12} color="#EA580C" />
                                        <span style={{ fontSize: 11, fontWeight: 600, color: "#9A3412" }}>
                                          Rendez-vous : {meetingPoint}
                                        </span>
                                      </div>
                                    )}

                                    {act.excursion?.city && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                        <MapPin size={10} color="#9CA3AF" />
                                        <span style={{ fontSize: 11, color: "#6B7280" }}>{act.excursion.city}</span>
                                      </div>
                                    )}

                                    {act.note && (
                                      <p style={{ fontSize: 10, color: "#9CA3AF", margin: "6px 0 0", fontStyle: "italic", display: "flex", alignItems: "center", gap: 3 }}>
                                        <FileText size={9} /> {act.note}
                                      </p>
                                    )}

                                    <button
                                      onClick={() => openExcursionDetails(act)}
                                      style={{ marginTop: 10, padding: "6px 12px", background: "white", border: "1.5px solid #2B96A8", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "#2B96A8", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, transition: "all .15s" }}
                                      onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = "#2B96A8";
                                        (e.currentTarget as HTMLElement).style.color = "white";
                                      }}
                                      onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = "white";
                                        (e.currentTarget as HTMLElement).style.color = "#2B96A8";
                                      }}>
                                      <ExternalLink size={11} /> Voir détail
                                    </button>
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

        {/* Modal opened from 'Voir détail' */}
        {modalExcursion && (
          <ExcursionDetailModal
            excursion={modalExcursion}
            onClose={() => setModalExcursion(null)}
          />
        )}

        {/* Checkout modal */}
        {checkoutExcs && checkoutExcs.length > 0 && (
          <ExcursionDetailModal
            excursion={checkoutExcs[0] as any}
            onClose={() => setCheckoutExcs(null)}
          />
        )}
      </div>
    </>
  );
}