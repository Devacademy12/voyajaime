"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "@/public/style/excursion-client.css";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";
import {
  Heart, MapPin, Clock, Users, Star, MessageCircle,
  ChevronLeft, ChevronRight, Check, Globe, Send, X,
  Lock, ShieldCheck, RefreshCcw, HeadphonesIcon,
  ThumbsUp, CalendarDays, Tag, Camera, ChevronDown, ChevronUp, Loader2,
  Sparkles, Award, ArrowRight, AlertCircle, Backpack, Ban, Info,
  Mountain, Baby, Navigation,
} from "lucide-react";
import TouristeNav from "@/app/components/touriste/TouristeNav";

interface Excursion {
  id: string;
  title: string;
  city: string;
  region: string | null;
  description: string;
  duration_hours: number;
  price_per_person: number;
  max_people: number;
  categories: string[];
  languages: string[];
  inclusions: string[];
  photos: string[];
  rating: number;
  reviews_count: number;
  is_active: boolean;
  prestataire_id: string;
  meeting_point: string | null;
  difficulty: string | null;
  min_age: number | null;
  what_to_bring: string | null;
  not_included: string | null;
  important_info: string | null;
  cancel_policy: string | null;
  available_dates: unknown[] | null;
  depart_time: string | null;
  created_at: string;
  updated_at: string;
}

interface Prestataire {
  user_id: string;
  full_name: string;
  agency_name: string | null;
  avatar_url: string | null;
  city: string | null;
  description: string | null;
  phone: string | null;
}

interface Avis {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  touriste_name: string;
  touriste_avatar: string | null;
  prestataire_response: string | null;
  likes_count: number;
}

interface Category {
  id: string;
  nom: string;
  couleur: string;
}

const STARS = [1, 2, 3, 4, 5];
const FALLBACK =
  "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1400&q=90&fit=crop";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").padEnd(6, "0");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function deriveCatStyle(couleur: string): {
  text: string;
  bg: string;
  border: string;
} {
  const hex = couleur.startsWith("#") ? couleur : "#0B4F6C";
  const { r, g, b } = hexToRgb(hex);
  return {
    text: hex,
    bg: `rgba(${r},${g},${b},0.08)`,
    border: `rgba(${r},${g},${b},0.22)`,
  };
}

const DIFFICULTY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  facile: {
    label: "Facile",
    color: "#065F46",
    bg: "#D1FAE5",
    border: "#A7F3D0",
  },
  modéré: {
    label: "Modéré",
    color: "#92400E",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  difficile: {
    label: "Difficile",
    color: "#991B1B",
    bg: "#FEE2E2",
    border: "#FECACA",
  },
  "très difficile": {
    label: "Très difficile",
    color: "#7C2D12",
    bg: "#FFEDD5",
    border: "#FED7AA",
  },
};

// ── Helper: safely format a date value of any type (handles jsonb from Supabase) ──
function formatDate(date: unknown): string {
  try {
    if (date === null || date === undefined) return "";

    let str: string;

    if (date instanceof Date) {
      // Native Date object
      str = date.toISOString();
    } else if (typeof date === "object") {
      // jsonb object from Supabase e.g. { date: "2025-06-15" } or a plain ISO string wrapped
      const obj = date as Record<string, unknown>;
      const inner = obj.date ?? obj.value ?? obj.day ?? Object.values(obj)[0];
      str = String(inner ?? "");
    } else {
      str = String(date);
    }

    // Extract YYYY-MM-DD part only (strip time/timezone)
    const datePart = str.split("T")[0];
    const [y, m, d] = datePart.split("-").map(Number);
    if (!y || !m || !d) return str;

    return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(date ?? "");
  }
}

export default function ExcursionClient({
  exc,
  prestataire,
  initialAvis,
  myLikedIds = [],
  categories = [],
}: {
  exc: Excursion;
  prestataire: Prestataire | null;
  initialAvis: Avis[];
  myLikedIds: string[];
  categories: Category[];
}) {
  const supabase = createClient();
  const [avis, setAvis] = useState(initialAvis);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set(myLikedIds));
  const [user, setUser] = useState<{
    id: string;
    full_name: string;
  } | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showPrestataire, setShowPrestataire] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [avisLoading, setAvisLoading] = useState(false);
  const [avisSuccess, setAvisSuccess] = useState(false);
  const [avisError, setAvisError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", uid)
        .single();
      setUser({
        id: uid,
        full_name:
          profile?.full_name ||
          data.user.email?.split("@")[0] ||
          "Touriste",
      });
      supabase
        .from("favoris")
        .select("id")
        .eq("touriste_id", uid)
        .eq("excursion_id", exc.id)
        .maybeSingle()
        .then(({ data: fav }) => {
          if (fav) {
            setIsFav(true);
            setFavId(fav.id);
          }
        });
      supabase
        .from("avis")
        .select("id")
        .eq("touriste_id", uid)
        .eq("excursion_id", exc.id)
        .maybeSingle()
        .then(({ data: ex }) => setAlreadyReviewed(!!ex));
    });
  }, [exc.id]);

  const photos =
    exc.photos?.filter(Boolean).length
      ? exc.photos.filter(Boolean)
      : [FALLBACK];
  const avgRating = avis.length
    ? (avis.reduce((s, a) => s + a.rating, 0) / avis.length).toFixed(1)
    : exc.rating
    ? exc.rating.toFixed(1)
    : null;
  const prestName =
    prestataire?.agency_name || prestataire?.full_name || "Prestataire";
  const LONG_DESC = exc.description?.length > 400;

  const catStyle = (catNom: string): { text: string; bg: string; border: string } => {
    const found = categories.find((c) => c.nom === catNom);
    if (found?.couleur) return deriveCatStyle(found.couleur);
    return { text: "#0B4F6C", bg: "#EBF5FA", border: "#B8D9E8" };
  };

  const diffConfig =
    exc.difficulty
      ? DIFFICULTY_CONFIG[exc.difficulty.toLowerCase()] || {
          label: sanitizeText(exc.difficulty),
          color: "#374151",
          bg: "#F3F4F6",
          border: "#E5E7EB",
        }
      : null;

  const toggleFav = async () => {
    if (!user) {
      sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`);
      window.location.href = "/auth";
      return;
    }
    if (isFav && favId) {
      await supabase.from("favoris").delete().eq("id", favId);
      setIsFav(false);
      setFavId(null);
    } else {
      const { data } = await supabase
        .from("favoris")
        .insert({ touriste_id: user.id, excursion_id: exc.id })
        .select("id")
        .single();
      if (data) {
        setIsFav(true);
        setFavId(data.id);
      }
    }
  };

  const toggleLike = async (avisId: string) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    const liked = likedIds.has(avisId);
    setLikedIds((prev) => {
      const n = new Set(prev);
      liked ? n.delete(avisId) : n.add(avisId);
      return n;
    });
    setAvis((prev) =>
      prev.map((a) =>
        a.id === avisId
          ? {
              ...a,
              likes_count: liked
                ? Math.max(0, a.likes_count - 1)
                : a.likes_count + 1,
            }
          : a
      )
    );
    if (liked) {
      await supabase
        .from("avis_likes")
        .delete()
        .eq("avis_id", avisId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("avis_likes")
        .insert({ avis_id: avisId, user_id: user.id });
    }
  };

  const submitAvis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    if (myRating === 0) {
      setAvisError("Choisissez une note.");
      return;
    }
    const cleanComment = sanitizeText(myComment.trim());
    if (!cleanComment) {
      setAvisError("Écrivez un commentaire.");
      return;
    }
    setAvisLoading(true);
    setAvisError(null);
    const { error } = await supabase.from("avis").insert({
      excursion_id: exc.id,
      touriste_id: user.id,
      rating: myRating,
      comment: cleanComment,
      reservation_id: null,
      is_moderated: false,
    });
    setAvisLoading(false);
    if (error) {
      setAvisError(
        error.code === "23505"
          ? "Vous avez déjà soumis un avis."
          : error.message
      );
      return;
    }
    setAvisSuccess(true);
    setAlreadyReviewed(true);
  };

  const sendMessage = async () => {
    if (!user) {
      sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`);
      window.location.href = "/auth";
      return;
    }
    const cleanMsg = sanitizeText(msgText.trim());
    if (!cleanMsg || !prestataire || msgSending) return;
    setMsgSending(true);
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("touriste_id", user.id)
      .eq("prestataire_id", exc.prestataire_id)
      .eq("excursion_id", exc.id)
      .maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          touriste_id: user.id,
          prestataire_id: exc.prestataire_id,
          excursion_id: exc.id,
          touriste_name: sanitizeText(user.full_name),
          prestataire_name: sanitizeText(
            prestataire.agency_name || prestataire.full_name
          ),
        })
        .select()
        .single();
      convId = newConv?.id;
    }
    if (convId) {
      await supabase.from("messages").insert({
        conversation_id: convId,
        expediteur_id: user.id,
        contenu: cleanMsg,
        lu: false,
      });
      setMsgSent(true);
      setMsgText("");
      setTimeout(() => {
        setShowMsgModal(false);
        setMsgSent(false);
      }, 2200);
    }
    setMsgSending(false);
  };

  // Parse what_to_bring and not_included into arrays (support newline or comma)
  const parseBulletList = (text: string | null): string[] => {
    if (!text) return [];
    return text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const whatToBringItems = parseBulletList(exc.what_to_bring);
  const notIncludedItems = parseBulletList(exc.not_included);

  return (
    <>
      <TouristeNav />
      <br />
      <div className="exc-breadcrumb">
        <div className="exc-breadcrumb-inner">
          <div className="exc-breadcrumb-links">
            <Link href="/excursions" className="exc-breadcrumb-link">
              <ChevronLeft size={13} /> Excursions
            </Link>
            <span className="exc-breadcrumb-sep">›</span>
            <span className="exc-breadcrumb-city">{sanitizeText(exc.city)}</span>
            <span className="exc-breadcrumb-sep">›</span>
            <span className="exc-breadcrumb-title">{sanitizeText(exc.title)}</span>
          </div>
        </div>
      </div>

      <div className="exc-container">

        {/* ── Title block ── */}
        <div className="exc-title-block">
          <div className="exc-title-inner">
            <div className="exc-categories">
              {exc.categories?.map((c) => {
                const cs = catStyle(c);
                return (
                  <span
                    key={c}
                    className="exc-category"
                    style={{
                      background: cs.bg,
                      color: cs.text,
                      border: `1px solid ${cs.border}`,
                    }}
                  >
                    {sanitizeText(c)}
                  </span>
                );
              })}
              {diffConfig && (
                <span
                  className="exc-category exc-difficulty-badge"
                  style={{
                    background: diffConfig.bg,
                    color: diffConfig.color,
                    border: `1px solid ${diffConfig.border}`,
                  }}
                >
                  <Mountain size={11} />
                  {diffConfig.label}
                </span>
              )}
            </div>
            <h1 className="exc-title">{sanitizeText(exc.title)}</h1>
            <div className="exc-meta">
              {[
                {
                  icon: <MapPin size={13} color="#7A7068" />,
                  label: exc.region
                    ? `${sanitizeText(exc.city)}, ${sanitizeText(exc.region)}`
                    : sanitizeText(exc.city),
                },
                {
                  icon: <Clock size={13} color="#7A7068" />,
                  label: `${exc.duration_hours}h de découverte`,
                },
                {
                  icon: <Users size={13} color="#7A7068" />,
                  label: `Max ${exc.max_people} personnes`,
                },
              ].map((m) => (
                <span key={m.label} className="exc-meta-item">
                  {m.icon}
                  {m.label}
                </span>
              ))}
              {exc.depart_time && (
                <span className="exc-meta-item">
                  <Clock size={13} color="#7A7068" />
                  Départ à {exc.depart_time.slice(0, 5)}
                </span>
              )}
              {exc.min_age && (
                <span className="exc-meta-item">
                  <Baby size={13} color="#7A7068" />
                  {exc.min_age}+ ans
                </span>
              )}
              {avgRating && (
                <span className="exc-rating-badge">
                  <Star
                    size={12}
                    fill="#E8A838"
                    color="#E8A838"
                    strokeWidth={0}
                  />
                  <span className="exc-rating-score">{avgRating}</span>
                  <span className="exc-rating-count">
                    ({avis.length} avis)
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="exc-grid">

          {/* ════════════════════════════════
              LEFT COLUMN
          ════════════════════════════════ */}
          <div className="exc-left">

            {/* Gallery */}
            <div>
              <div className="gallery-main">
                <img
                  src={photos[currentPhoto]}
                  alt={sanitizeText(exc.title)}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK;
                  }}
                />
                <div className="gallery-overlay" />

                {photos.length > 1 && (
                  <div className="gallery-counter">
                    <Camera size={12} />
                    {currentPhoto + 1} / {photos.length}
                  </div>
                )}

                <button onClick={toggleFav} className="gallery-fav-btn">
                  <Heart
                    size={19}
                    fill={isFav ? "#E11D48" : "none"}
                    color={isFav ? "#E11D48" : "white"}
                    strokeWidth={2}
                  />
                </button>

                <div className="gallery-city">
                  <p>
                    {exc.region
                      ? `${sanitizeText(exc.city)}, ${sanitizeText(exc.region)}`
                      : sanitizeText(exc.city)}
                  </p>
                </div>

                {photos.length > 1 && (
                  <>
                    <button
                      className="g-arrow"
                      style={{ left: 14 }}
                      onClick={() =>
                        setCurrentPhoto(
                          (p) => (p - 1 + photos.length) % photos.length
                        )
                      }
                    >
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <button
                      className="g-arrow"
                      style={{ right: 14 }}
                      onClick={() =>
                        setCurrentPhoto((p) => (p + 1) % photos.length)
                      }
                    >
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                  </>
                )}
              </div>

              {photos.length > 1 && (
                <div className="thumb-rail">
                  {photos.map((p, i) => (
                    <div
                      key={i}
                      className={`thumb ${currentPhoto === i ? "on" : ""}`}
                      onClick={() => setCurrentPhoto(i)}
                    >
                      <img
                        src={p}
                        alt=""
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK;
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats bar */}
            <div className="exc-stats-grid">
              {[
                {
                  icon: <Clock size={20} color="#0B4F6C" />,
                  label: "Durée",
                  val: `${exc.duration_hours}h`,
                  sub: "de visite",
                },
                {
                  icon: <Users size={20} color="#5B21B6" />,
                  label: "Groupe",
                  val: `${exc.max_people}`,
                  sub: "personnes max",
                },
                {
                  icon: (
                    <Star
                      size={20}
                      fill="#E8A838"
                      color="#E8A838"
                      strokeWidth={0}
                    />
                  ),
                  label: "Note",
                  val: avgRating ? `${avgRating}/5` : "Nouveau",
                  sub: `${avis.length} avis`,
                },
                {
                  icon: <Globe size={20} color="#065F46" />,
                  label: "Langues",
                  val: `${exc.languages?.length || 1}`,
                  sub: "disponibles",
                },
              ].map((s) => (
                <div key={s.label} className="stat-pill">
                  <div className="stat-icon-box">{s.icon}</div>
                  <div>
                    <p className="stat-value">{s.val}</p>
                    <p className="stat-label">{s.label}</p>
                    <p className="stat-sub">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="glass-card glass-card-padded">
              <h2 className="s-heading">À propos de cette excursion</h2>
              <p className="exc-description">
                {LONG_DESC && !descExpanded ? (
                  <>
                    {sanitizeText(exc.description.slice(0, 400))}
                    <span style={{ color: "#B5AFA9" }}>…</span>
                  </>
                ) : (
                  sanitizeText(exc.description)
                )}
              </p>
              {LONG_DESC && (
                <button
                  onClick={() => setDescExpanded((p) => !p)}
                  className="exc-desc-expand-btn"
                >
                  {descExpanded ? (
                    <>
                      <ChevronUp size={15} />Réduire
                    </>
                  ) : (
                    <>
                      <ChevronDown size={15} />Lire la suite
                    </>
                  )}
                </button>
              )}
            </div>

            {/* ── Informations pratiques ── */}
            {(exc.meeting_point ||
              exc.depart_time ||
              exc.difficulty ||
              exc.min_age ||
              exc.region) && (
              <div className="glass-card glass-card-padded">
                <h2 className="s-heading">Informations pratiques</h2>
                <div className="exc-info-grid">
                  {exc.meeting_point && (
                    <div className="exc-info-row">
                      <div className="exc-info-icon-wrap" style={{ background: "#EBF5FA" }}>
                        <Navigation size={14} color="#0B4F6C" />
                      </div>
                      <div>
                        <p className="exc-info-label">Point de rendez-vous</p>
                        <p className="exc-info-value">
                          {sanitizeText(exc.meeting_point)}
                        </p>
                      </div>
                    </div>
                  )}
                  {exc.depart_time && (
                    <div className="exc-info-row">
                      <div className="exc-info-icon-wrap" style={{ background: "#EDE9FE" }}>
                        <Clock size={14} color="#5B21B6" />
                      </div>
                      <div>
                        <p className="exc-info-label">Heure de départ</p>
                        <p className="exc-info-value">
                          {exc.depart_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  )}
                  {exc.difficulty && diffConfig && (
                    <div className="exc-info-row">
                      <div
                        className="exc-info-icon-wrap"
                        style={{ background: diffConfig.bg }}
                      >
                        <Mountain size={14} color={diffConfig.color} />
                      </div>
                      <div>
                        <p className="exc-info-label">Niveau de difficulté</p>
                        <p
                          className="exc-info-value"
                          style={{ color: diffConfig.color, fontWeight: 700 }}
                        >
                          {diffConfig.label}
                        </p>
                      </div>
                    </div>
                  )}
                  {exc.min_age != null && (
                    <div className="exc-info-row">
                      <div className="exc-info-icon-wrap" style={{ background: "#FEF3C7" }}>
                        <Baby size={14} color="#92400E" />
                      </div>
                      <div>
                        <p className="exc-info-label">Âge minimum requis</p>
                        <p className="exc-info-value">{exc.min_age} ans</p>
                      </div>
                    </div>
                  )}
                  {exc.region && (
                    <div className="exc-info-row">
                      <div className="exc-info-icon-wrap" style={{ background: "#D1FAE5" }}>
                        <Globe size={14} color="#065F46" />
                      </div>
                      <div>
                        <p className="exc-info-label">Région</p>
                        <p className="exc-info-value">
                          {sanitizeText(exc.region)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inclusions */}
            {exc.inclusions?.length > 0 && (
              <div className="glass-card glass-card-padded">
                <h2 className="s-heading">Ce qui est inclus</h2>
                <div className="exc-inclusions-grid">
                  {exc.inclusions.map((inc) => (
                    <div key={inc} className="inc-chip">
                      <div className="inc-chip-icon">
                        <Check size={12} color="white" strokeWidth={3} />
                      </div>
                      <span>{sanitizeText(inc)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Non inclus */}
            {notIncludedItems.length > 0 && (
              <div className="glass-card glass-card-padded">
                <h2 className="s-heading">Non inclus</h2>
                <div className="exc-inclusions-grid">
                  {notIncludedItems.map((item, i) => (
                    <div key={i} className="inc-chip inc-chip-excluded">
                      <div className="inc-chip-icon inc-chip-icon-excluded">
                        <X size={12} color="white" strokeWidth={3} />
                      </div>
                      <span>{sanitizeText(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ce qu'il faut apporter */}
            {whatToBringItems.length > 0 && (
              <div className="glass-card glass-card-padded">
                <h2 className="s-heading">Ce qu'il faut apporter</h2>
                <div className="exc-inclusions-grid">
                  {whatToBringItems.map((item, i) => (
                    <div key={i} className="inc-chip inc-chip-bring">
                      <div className="inc-chip-icon inc-chip-icon-bring">
                        <Backpack size={12} color="white" strokeWidth={2.5} />
                      </div>
                      <span>{sanitizeText(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {exc.languages?.length > 0 && (
              <div className="glass-card glass-card-padded">
                <h2 className="s-heading">Langues disponibles</h2>
                <div className="exc-lang-list">
                  {exc.languages.map((l) => (
                    <span key={l} className="exc-lang-item">
                      <Globe size={13} color="#0B4F6C" />
                      {sanitizeText(l)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Informations importantes */}
            {exc.important_info && (
              <div className="glass-card glass-card-padded">
                <h2 className="s-heading">Informations importantes</h2>
                <div className="exc-alert-box exc-alert-info">
                  <div className="exc-alert-icon">
                    <Info size={16} color="#0B4F6C" />
                  </div>
                  <p className="exc-alert-text">
                    {sanitizeText(exc.important_info)}
                  </p>
                </div>
              </div>
            )}

            {/* Politique d'annulation */}
            {exc.cancel_policy && (
              <div className="glass-card glass-card-padded">
                <h2 className="s-heading">Politique d'annulation</h2>
                <div className="exc-alert-box exc-alert-cancel">
                  <div className="exc-alert-icon">
                    <RefreshCcw size={16} color="#065F46" />
                  </div>
                  <p className="exc-alert-text">
                    {sanitizeText(exc.cancel_policy)}
                  </p>
                </div>
              </div>
            )}

          
            {/* ── REVIEWS SECTION ── */}
            <div>
              <div className="exc-reviews-header">
                <div className="exc-reviews-title-group">
                  <h2 className="exc-reviews-title">Avis des voyageurs</h2>
                  {avgRating && (
                    <div className="exc-rating-badge">
                      <Star
                        size={13}
                        fill="#E8A838"
                        color="#E8A838"
                        strokeWidth={0}
                      />
                      <span className="exc-rating-score">{avgRating}</span>
                      <span className="exc-rating-count">/ 5</span>
                    </div>
                  )}
                </div>
                <span className="exc-reviews-count">{avis.length} avis</span>
              </div>

              {/* Form avis */}
              {user && !alreadyReviewed && !avisSuccess && (
                <div className="glass-card review-form">
                  <div className="review-form-header">
                    <Sparkles size={16} color="#E8A838" />
                    <h3 className="review-form-title">
                      Partagez votre expérience
                    </h3>
                  </div>
                  {avisError && (
                    <div className="review-error">
                      <X size={14} />
                      {avisError}
                    </div>
                  )}
                  <form onSubmit={submitAvis}>
                    <div className="stars-row">
                      {STARS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="star-btn"
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setMyRating(s)}
                        >
                          <Star
                            size={30}
                            fill={
                              s <= (hoverRating || myRating)
                                ? "#E8A838"
                                : "none"
                            }
                            color={
                              s <= (hoverRating || myRating)
                                ? "#E8A838"
                                : "#D4C9BC"
                            }
                            strokeWidth={1.5}
                          />
                        </button>
                      ))}
                      {myRating > 0 && (
                        <span className="rating-label">
                          {
                            [
                              "",
                              "Très déçu",
                              "Décevant",
                              "Bien",
                              "Très bien",
                              "Excellent !",
                            ][myRating]
                          }
                        </span>
                      )}
                    </div>
                    <textarea
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      rows={4}
                      required
                      placeholder="Décrivez votre expérience..."
                      className="review-textarea"
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 12,
                      }}
                    >
                      <button
                        type="submit"
                        disabled={avisLoading || myRating === 0}
                        className={
                          myRating > 0
                            ? "review-submit-btn review-submit-btn-active"
                            : "review-submit-btn review-submit-btn-disabled"
                        }
                      >
                        {avisLoading ? (
                          <>
                            <Loader2 size={15} className="spin-anim" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Publier mon avis
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {avisSuccess && (
                <div className="review-success">
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#D1FAE5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={15} color="#059669" strokeWidth={3} />
                  </div>
                  Votre avis a été soumis ! Il sera publié après modération.
                </div>
              )}

              {alreadyReviewed && !avisSuccess && (
                <div className="review-already">
                  <Award size={14} />
                  Vous avez déjà soumis un avis pour cette excursion.
                </div>
              )}

              {!user && (
                <div className="review-login-prompt">
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--ink)",
                        marginBottom: 4,
                      }}
                    >
                      Vous avez vécu cette excursion ?
                    </p>
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>
                      Connectez-vous pour partager votre avis
                    </p>
                  </div>
                  <Link href="/auth" className="review-login-link">
                    Se connecter
                  </Link>
                </div>
              )}

              {/* Liste avis */}
              {avis.length === 0 ? (
                <div className="review-empty">
                  <div className="review-empty-icon">
                    <MessageCircle size={28} color="#B5AFA9" />
                  </div>
                  <p
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--ink)",
                      marginBottom: 6,
                    }}
                  >
                    Aucun avis pour le moment
                  </p>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>
                    Soyez le premier à partager votre expérience !
                  </p>
                </div>
              ) : (
                <div className="review-list">
                  {avis.map((a) => (
                    <div key={a.id} className="review-card">
                      <div className="review-header">
                        <div className="review-user">
                          <div className="review-avatar">
                            {a.touriste_avatar ? (
                              <img
                                src={a.touriste_avatar}
                                alt=""
                                className="review-avatar-img"
                              />
                            ) : (
                              (a.touriste_name?.[0] || "T").toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="review-name">
                              {sanitizeText(a.touriste_name || "Voyageur")}
                            </p>
                            <p className="review-date">
                              <CalendarDays size={10} />
                              {new Date(a.created_at).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="review-stars">
                          {STARS.map((s) => (
                            <Star
                              key={s}
                              size={13}
                              fill={s <= a.rating ? "#E8A838" : "#EAE5DE"}
                              color={s <= a.rating ? "#E8A838" : "#EAE5DE"}
                              strokeWidth={0}
                            />
                          ))}
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#92400E",
                              marginLeft: 4,
                            }}
                          >
                            {a.rating}/5
                          </span>
                        </div>
                      </div>

                      {a.comment && (
                        <p className="review-comment">
                          &ldquo;{sanitizeText(a.comment)}&rdquo;
                        </p>
                      )}

                      {a.prestataire_response && (
                        <div className="review-response">
                          <div className="review-response-header">
                            <div className="review-response-avatar">
                              {prestataire?.avatar_url ? (
                                <img
                                  src={prestataire.avatar_url}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                sanitizeText(prestName)[0].toUpperCase()
                              )}
                            </div>
                            <p className="review-response-name">
                              {sanitizeText(prestName)}
                            </p>
                            <span className="review-response-badge">
                              · Guide
                            </span>
                          </div>
                          <p className="review-response-text">
                            {sanitizeText(a.prestataire_response)}
                          </p>
                        </div>
                      )}

                      <div className="review-footer">
                        <button
                          className={`like-btn ${
                            likedIds.has(a.id) ? "on" : ""
                          }`}
                          onClick={() => toggleLike(a.id)}
                        >
                          <ThumbsUp
                            size={13}
                            fill={likedIds.has(a.id) ? "#E11D48" : "none"}
                            strokeWidth={2}
                          />
                          {a.likes_count > 0 && (
                            <span>{a.likes_count}</span>
                          )}
                          <span>Utile</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════
              RIGHT SIDEBAR
          ════════════════════════════════ */}
          <div className="exc-right">

            {/* Booking card */}
            <div className="glass-card booking-card">
              <div className="booking-price">
                <div className="booking-price-main">
                  <span className="booking-price-value">
                    {exc.price_per_person}
                  </span>
                  <div>
                    <span className="booking-price-currency">TND</span>
                    <p className="booking-price-per">par personne</p>
                  </div>
                </div>
                {avgRating && (
                  <div className="booking-rating">
                    {STARS.map((s) => (
                      <Star
                        key={s}
                        size={13}
                        fill={
                          s <= Math.round(Number(avgRating))
                            ? "#E8A838"
                            : "#EAE5DE"
                        }
                        color={
                          s <= Math.round(Number(avgRating))
                            ? "#E8A838"
                            : "#EAE5DE"
                        }
                        strokeWidth={0}
                      />
                    ))}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#92400E",
                        marginLeft: 4,
                      }}
                    >
                      {avgRating}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      · {avis.length} avis
                    </span>
                  </div>
                )}
              </div>

              <div className="booking-details">
                {[
                  {
                    icon: <Clock size={13} color="var(--muted)" />,
                    label: "Durée",
                    val: `${exc.duration_hours} heures`,
                  },
                  {
                    icon: <Users size={13} color="var(--muted)" />,
                    label: "Groupe",
                    val: `Max ${exc.max_people} pers.`,
                  },
                  {
                    icon: <MapPin size={13} color="var(--muted)" />,
                    label: "Ville",
                    val: sanitizeText(exc.city),
                  },
                  {
                    icon: <Tag size={13} color="var(--muted)" />,
                    label: "Type",
                    val: sanitizeText(exc.categories?.[0] || "—"),
                  },
                  ...(exc.depart_time
                    ? [
                        {
                          icon: <Clock size={13} color="var(--muted)" />,
                          label: "Départ",
                          val: exc.depart_time.slice(0, 5),
                        },
                      ]
                    : []),
                  ...(exc.difficulty
                    ? [
                        {
                          icon: <Mountain size={13} color="var(--muted)" />,
                          label: "Difficulté",
                          val: sanitizeText(exc.difficulty),
                        },
                      ]
                    : []),
                  ...(exc.min_age != null
                    ? [
                        {
                          icon: <Baby size={13} color="var(--muted)" />,
                          label: "Âge min.",
                          val: `${exc.min_age} ans`,
                        },
                      ]
                    : []),
                  ...(exc.meeting_point
                    ? [
                        {
                          icon: <Navigation size={13} color="var(--muted)" />,
                          label: "RDV",
                          val:
                            exc.meeting_point.length > 28
                              ? sanitizeText(
                                  exc.meeting_point.slice(0, 28)
                                ) + "…"
                              : sanitizeText(exc.meeting_point),
                        },
                      ]
                    : []),
                ].map((r, i, arr) => (
                  <div
                    key={r.label}
                    className="booking-detail-row"
                    style={{
                      borderBottom:
                        i < arr.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <span className="booking-detail-label">
                      {r.icon}
                      {r.label}
                    </span>
                    <span className="booking-detail-value">{r.val}</span>
                  </div>
                ))}
              </div>

              <button
                className="btn-book"
                onClick={() => {
                  if (!user) {
                    sessionStorage.setItem(
                      "redirect_after_login",
                      `/excursions/${exc.id}`
                    );
                    window.location.href = "/auth";
                    return;
                  }
                  setShowCheckout(true);
                }}
              >
                {user ? (
                  <>
                    <CalendarDays size={16} />
                    Réserver maintenant
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    Connexion pour réserver
                  </>
                )}
              </button>

              <div style={{ height: 8 }} />
              {prestataire && (
                <button
                  className="btn-msg"
                  onClick={() => {
                    if (!user) {
                      sessionStorage.setItem(
                        "redirect_after_login",
                        `/excursions/${exc.id}`
                      );
                      window.location.href = "/auth";
                      return;
                    }
                    setShowMsgModal(true);
                  }}
                >
                  <MessageCircle size={15} />
                  Contacter le guide
                </button>
              )}
              <div style={{ height: 7 }} />
              <button
                className={`btn-fav ${isFav ? "on" : ""}`}
                onClick={toggleFav}
              >
                <Heart
                  size={14}
                  fill={isFav ? "#E11D48" : "none"}
                  strokeWidth={2}
                />
                {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>

              <div className="booking-guarantees">
                {[
                  {
                    icon: <Lock size={12} color="#065F46" />,
                    text: "Paiement 100% sécurisé",
                    bg: "#F0FDF4",
                    c: "#065F46",
                  },
                  {
                    icon: <RefreshCcw size={12} color="#0B4F6C" />,
                    text: "Annulation gratuite 24h avant",
                    bg: "#EBF5FA",
                    c: "#0B4F6C",
                  },
                  {
                    icon: <HeadphonesIcon size={12} color="#5B21B6" />,
                    text: "Support disponible 7j/7",
                    bg: "#EDE9FE",
                    c: "#5B21B6",
                  },
                ].map((g) => (
                  <div
                    key={g.text}
                    className="guarantee-item"
                    style={{ background: g.bg }}
                  >
                    {g.icon}
                    <p style={{ fontSize: 12, color: g.c, fontWeight: 600 }}>
                      {g.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Guide card */}
            {prestataire && (
              <div className="glass-card glass-card-sm">
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#B5AFA9",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Votre guide
                </p>
                <div
                  className="guide-card"
                  onClick={() => setShowPrestataire(true)}
                >
                  <div className="guide-header">
                    <div className="guide-avatar">
                      {prestataire.avatar_url ? (
                        <img
                          src={prestataire.avatar_url}
                          alt={sanitizeText(prestName)}
                          className="guide-avatar-img"
                        />
                      ) : (
                        <div className="guide-avatar-placeholder">
                          {sanitizeText(prestName)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="guide-info">
                      <p className="guide-name">{sanitizeText(prestName)}</p>
                      {prestataire.city && (
                        <p className="guide-city">
                          <MapPin size={9} />
                          {sanitizeText(prestataire.city)}
                        </p>
                      )}
                      <p className="guide-verified">
                        <ShieldCheck size={11} />
                        Vérifié
                      </p>
                    </div>
                    <ArrowRight size={15} color="#B5AFA9" />
                  </div>
                  <p className="guide-view-link">Voir le profil complet →</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL MESSAGE ── */}
      {showMsgModal && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMsgModal(false);
              setMsgSent(false);
            }
          }}
        >
          <div className="modal fu">
            {msgSent ? (
              <div className="modal-success">
                <div className="modal-success-icon">
                  <Check size={28} color="#059669" strokeWidth={2.5} />
                </div>
                <h3 className="modal-success-title">Message envoyé !</h3>
                <p style={{ fontSize: 14, color: "var(--muted)" }}>
                  Redirection vers vos messages...
                </p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <div>
                    <h3 className="modal-title">Contacter le guide</h3>
                    <p className="modal-subtitle">
                      À propos de : {sanitizeText(exc.title)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowMsgModal(false);
                      setMsgText("");
                    }}
                    className="modal-close"
                  >
                    <X size={15} />
                  </button>
                </div>
                {prestataire && (
                  <div className="modal-guide-preview">
                    <div className="modal-guide-avatar">
                      {prestataire.avatar_url ? (
                        <img
                          src={prestataire.avatar_url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          alt=""
                        />
                      ) : (
                        sanitizeText(prestName)[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {sanitizeText(prestName)}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#065F46",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <ShieldCheck size={11} />
                        Prestataire vérifié
                      </p>
                    </div>
                  </div>
                )}
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Bonjour, j'aimerais avoir plus d'informations..."
                  className="modal-textarea"
                />
                <div className="modal-actions">
                  <button
                    onClick={() => {
                      setShowMsgModal(false);
                      setMsgText("");
                    }}
                    className="modal-cancel-btn"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!msgText.trim() || msgSending}
                    className={
                      msgText.trim()
                        ? "modal-send-btn modal-send-btn-active"
                        : "modal-send-btn modal-send-btn-disabled"
                    }
                  >
                    {msgSending ? (
                      <>
                        <Loader2 size={15} className="spin-anim" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL RESERVATION ── */}
      {showCheckout && (
        <CheckoutModal exc={exc} onClose={() => setShowCheckout(false)}
        />
      )}

      {/* ── MODAL PRESTATAIRE ── */}
      {showPrestataire && prestataire && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrestataire(false);
          }}
        >
          <div className="modal fu">
            <div className="prestataire-modal-header">
              <h2 className="prestataire-modal-title">Votre guide</h2>
              <button
                onClick={() => setShowPrestataire(false)}
                className="modal-close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="prestataire-profile">
              <div className="prestataire-avatar">
                {prestataire.avatar_url ? (
                  <img
                    src={prestataire.avatar_url}
                    alt={sanitizeText(prestName)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background:
                        "linear-gradient(135deg,#0B4F6C,#0D6B90)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 800,
                      fontSize: 30,
                    }}
                  >
                    {sanitizeText(prestName)[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="prestataire-info">
                <h3 className="prestataire-name">
                  {sanitizeText(prestName)}
                </h3>
                {prestataire.full_name && prestataire.agency_name && (
                  <p className="prestataire-fullname">
                    <Users size={12} />
                    {sanitizeText(prestataire.full_name)}
                  </p>
                )}
                <div className="prestataire-badges">
                  <span className="prestataire-badge prestataire-badge-verified">
                    <ShieldCheck size={11} />
                    Vérifié
                  </span>
                  {prestataire.city && (
                    <span className="prestataire-badge prestataire-badge-city">
                      <MapPin size={10} />
                      {sanitizeText(prestataire.city)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {prestataire.description && (
              <div className="prestataire-description">
                <p className="prestataire-desc-label">À propos</p>
                <p className="prestataire-desc-text">
                  {sanitizeText(prestataire.description)}
                </p>
              </div>
            )}
            <button
              onClick={() => setShowPrestataire(false)}
              className="btn-book"
              style={{ marginTop: 8 }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}