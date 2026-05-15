"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
<<<<<<< HEAD
=======
import "@/public/style/excursion-client.css";
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";
import {
  Heart, MapPin, Clock, Users, Star, MessageCircle,
  ChevronLeft, ChevronRight, Check, Globe, Send, X,
<<<<<<< HEAD
  Minus, Plus, Lock, ShieldCheck, RefreshCcw, HeadphonesIcon,
  ThumbsUp, CalendarDays, Tag, Camera, ChevronDown, ChevronUp, Loader2,
=======
  Lock, ShieldCheck, RefreshCcw, HeadphonesIcon,
  ThumbsUp, CalendarDays, Tag, Camera, ChevronDown, ChevronUp, Loader2,
  Sparkles, Award, ArrowRight, AlertCircle, Backpack, Ban, Info,
  Mountain, Baby, Navigation,
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
} from "lucide-react";
import TouristeNav from "@/app/components/touriste/TouristeNav";

interface Excursion {
<<<<<<< HEAD
  id: string; title: string; city: string; description: string;
  duration_hours: number; price_per_person: number; max_people: number;
  categories: string[]; languages: string[]; inclusions: string[];
  photos: string[]; rating: number; reviews_count: number;
  is_active: boolean; prestataire_id: string;
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
}
interface Prestataire {
<<<<<<< HEAD
  user_id: string; full_name: string; agency_name: string | null;
  avatar_url: string | null; city: string | null;
  description: string | null; phone: string | null;
}
interface Avis {
  id: string; rating: number; comment: string; created_at: string;
  touriste_name: string; touriste_avatar: string | null;
  prestataire_response: string | null; likes_count: number;
}

const STARS = [1, 2, 3, 4, 5];
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1400&q=90&fit=crop";
const CAT_COLORS: Record<string, string> = {
  Culture:"#2B96A8", Archéologie:"#8B5CF6", Nature:"#059669",
  Gastronomie:"#D97706", Aventure:"#DC2626", Relaxation:"#2563EB",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#F8F9FA;color:#111827}
.star-btn{background:none;border:none;cursor:pointer;font-size:30px;line-height:1;transition:transform .12s;padding:1px 2px}
.star-btn:hover{transform:scale(1.18)}
.thumb-strip::-webkit-scrollbar{height:4px}
.thumb-strip::-webkit-scrollbar-track{background:transparent}
.thumb-strip::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:4px}
.thumb{width:80px;height:60px;border-radius:10px;overflow:hidden;cursor:pointer;border:2.5px solid transparent;transition:all .18s;flex-shrink:0}
.thumb.on{border-color:#2B96A8;box-shadow:0 0 0 3px rgba(43,150,168,.15)}
.thumb img{width:100%;height:100%;object-fit:cover}
.avis-item{background:white;border-radius:16px;border:1px solid #EBEBEB;padding:20px;transition:box-shadow .2s}
.avis-item:hover{box-shadow:0 6px 22px rgba(0,0,0,.07)}
.like-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;border:1.5px solid #E5E7EB;background:white;cursor:pointer;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;transition:all .2s}
.like-btn.on{background:#FEF2F2;border-color:#FECACA;color:#E11D48}
.like-btn:not(.on):hover{background:#F9FAFB;border-color:#D1D5DB}
.prest-card{cursor:pointer;transition:all .2s;border-radius:16px;padding:14px 16px;border:1.5px solid #F0F0F0;background:white}
.prest-card:hover{border-color:#2B96A8;box-shadow:0 4px 18px rgba(43,150,168,.12)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
.modal{background:white;border-radius:24px;padding:28px;width:100%;max-width:460px;max-height:88vh;overflow-y:auto;box-shadow:0 28px 80px rgba(0,0,0,.28)}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fu{animation:fadeUp .3s ease forwards}
.nav-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.9);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 14px rgba(0,0,0,.18);transition:all .18s;backdrop-filter:blur(6px)}
.nav-arrow:hover{background:white;transform:translateY(-50%) scale(1.08)}
.cta-primary{width:100%;padding:15px;background:#111827;color:white;border:none;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.cta-primary:hover:not(:disabled){background:#1f2937;transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.2)}
.cta-primary:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed}
.cta-sec{width:100%;padding:13px;background:white;color:#2B96A8;border:2px solid #B2E3EB;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px}
.cta-sec:hover{background:#EFF9FB}
.fav-btn{width:100%;padding:12px;background:#F9FAFB;color:#374151;border:1.5px solid #E5E7EB;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px}
.fav-btn.on{background:#FEF2F2;color:#DC2626;border-color:#FECACA}
.fav-btn:hover{border-color:#2B96A8;color:#2B96A8}
.counter-btn{width:42px;height:42px;border:none;background:#F3F4F6;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;font-family:'DM Sans',sans-serif}
.counter-btn:hover:not(:disabled){background:#E5E7EB}
.counter-btn:disabled{opacity:.4;cursor:not-allowed}
input:focus{border-color:#2B96A8!important;box-shadow:0 0 0 3px rgba(43,150,168,.08)!important;outline:none}
textarea:focus{border-color:#2B96A8!important;box-shadow:0 0 0 3px rgba(43,150,168,.08)!important;outline:none}
`;

export default function ExcursionClient({
  exc, prestataire, initialAvis = [], myLikedIds = [],
}: {
  exc: Excursion; prestataire: Prestataire | null;
  initialAvis?: Avis[]; myLikedIds?: string[];
}) {
  const supabase = createClient();
  const [avis,            setAvis]            = useState<Avis[]>(initialAvis || []);
  const [likedIds,        setLikedIds]        = useState<Set<string>>(new Set(myLikedIds || []));
  const [user,            setUser]            = useState<{ id: string; full_name: string } | null>(null);
  const [isFav,           setIsFav]           = useState(false);
  const [favId,           setFavId]           = useState<string | null>(null);
  const [currentPhoto,    setCurrentPhoto]    = useState(0);
  const [showPrestataire, setShowPrestataire] = useState(false);
  const [descExpanded,    setDescExpanded]    = useState(false);
  const [myRating,        setMyRating]        = useState(0);
  const [hoverRating,     setHoverRating]     = useState(0);
  const [myComment,       setMyComment]       = useState("");
  const [avisLoading,     setAvisLoading]     = useState(false);
  const [avisSuccess,     setAvisSuccess]     = useState(false);
  const [avisError,       setAvisError]       = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showMsgModal,    setShowMsgModal]    = useState(false);
  const [msgText,         setMsgText]         = useState("");
  const [msgSending,      setMsgSending]      = useState(false);
  const [msgSent,         setMsgSent]         = useState(false);
  const [showCheckout,    setShowCheckout]    = useState(false);
  const [people,          setPeople]          = useState(1);
  const [date,            setDate]            = useState("");
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
<<<<<<< HEAD
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", uid).single();
      setUser({ id: uid, full_name: profile?.full_name || data.user.email?.split("@")[0] || "Touriste" });
      supabase.from("favoris").select("id").eq("touriste_id", uid).eq("excursion_id", exc.id)
        .maybeSingle().then(({ data: fav }) => { if (fav) { setIsFav(true); setFavId(fav.id); } });
      supabase.from("avis").select("id").eq("touriste_id", uid).eq("excursion_id", exc.id)
        .maybeSingle().then(({ data: ex }) => setAlreadyReviewed(!!ex));
    });
  }, [exc.id]);

  const photos    = exc.photos?.filter(Boolean).length ? exc.photos.filter(Boolean) : [FALLBACK];
  const avgRating = avis && avis.length
    ? (avis.reduce((s, a) => s + a.rating, 0) / avis.length).toFixed(1)
    : exc.rating ? exc.rating.toFixed(1) : null;
  const totalPrice = exc.price_per_person * people;
  const commission = Math.round(totalPrice * 0.1);
  const prestName  = prestataire?.agency_name || prestataire?.full_name || "Prestataire";
  const catColor   = (cat: string) => CAT_COLORS[cat] || "#2B96A8";
  const avisCount = avis?.length || 0;

  const toggleFav = async () => {
    if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; return; }
    if (isFav && favId) {
      await supabase.from("favoris").delete().eq("id", favId);
      setIsFav(false); setFavId(null);
    } else {
      const { data } = await supabase.from("favoris").insert({ touriste_id: user.id, excursion_id: exc.id }).select("id").single();
      if (data) { setIsFav(true); setFavId(data.id); }
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
    }
  };

  const toggleLike = async (avisId: string) => {
<<<<<<< HEAD
    if (!user) { window.location.href = "/auth"; return; }
    const liked = likedIds.has(avisId);
    setLikedIds(prev => { const n = new Set(prev); liked ? n.delete(avisId) : n.add(avisId); return n; });
    setAvis(prev => prev.map(a => a.id === avisId
      ? { ...a, likes_count: liked ? Math.max(0, a.likes_count - 1) : a.likes_count + 1 } : a
    ));
    if (liked) {
      await supabase.from("avis_likes").delete().eq("avis_id", avisId).eq("user_id", user.id);
    } else {
      await supabase.from("avis_likes").insert({ avis_id: avisId, user_id: user.id });
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
    }
  };

  const submitAvis = async (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    if (!user) { window.location.href = "/auth"; return; }
    if (myRating === 0) { setAvisError("Choisissez une note."); return; }
    const cleanComment = sanitizeText(myComment.trim());
    if (!cleanComment) { setAvisError("Écrivez un commentaire."); return; }
    setAvisLoading(true); setAvisError(null);
    const { error } = await supabase.from("avis").insert({
      excursion_id: exc.id, touriste_id: user.id,
      rating: myRating, comment: cleanComment,
      reservation_id: null, is_moderated: false,
    });
    setAvisLoading(false);
    if (error) { setAvisError(error.code === "23505" ? "Vous avez déjà soumis un avis." : error.message); return; }
    setAvisSuccess(true); setAlreadyReviewed(true);
  };

  const sendMessage = async () => {
    if (!user) { sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`); window.location.href = "/auth"; return; }
    const cleanMsg = sanitizeText(msgText.trim());
    if (!cleanMsg || !prestataire || msgSending) return;
    setMsgSending(true);
    const { data: existing } = await supabase.from("conversations")
      .select("id").eq("touriste_id", user.id).eq("prestataire_id", exc.prestataire_id).eq("excursion_id", exc.id).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: newConv } = await supabase.from("conversations").insert({
        touriste_id: user.id, prestataire_id: exc.prestataire_id, excursion_id: exc.id,
        touriste_name: sanitizeText(user.full_name),
        prestataire_name: sanitizeText(prestataire.agency_name || prestataire.full_name),
      }).select().single();
      convId = newConv?.id;
    }
    if (convId) {
      await supabase.from("messages").insert({ conversation_id: convId, expediteur_id: user.id, contenu: cleanMsg, lu: false });
      setMsgSent(true); setMsgText("");
      setTimeout(() => { setShowMsgModal(false); setMsgSent(false); }, 2200);
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
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
<<<<<<< HEAD
            <div style={{ background:"white", borderRadius:20, border:"1px solid #EBEBEB", padding:"24px", marginBottom:16 }}>
              <h2 style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:3, height:18, background:"#2B96A8", borderRadius:2, display:"inline-block" }}/>
                À propos de cette excursion
              </h2>
              <p style={{ fontSize:14.5, color:"#374151", lineHeight:1.9 }}>
                {LONG_DESC && !descExpanded
                  ? <>{sanitizeText(exc.description.slice(0, 380))}<span style={{ color:"#9CA3AF" }}>…</span></>
                  : sanitizeText(exc.description)
                }
              </p>
              {LONG_DESC && (
                <button onClick={() => setDescExpanded(p => !p)}
                  style={{ marginTop:10, background:"none", border:"none", color:"#2B96A8", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"'DM Sans',sans-serif", padding:0 }}>
                  {descExpanded ? <><ChevronUp size={15}/>Réduire</> : <><ChevronDown size={15}/>Lire la suite</>}
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                </button>
              )}
            </div>

<<<<<<< HEAD
            {/* Inclusions */}
            {exc.inclusions?.length > 0 && (
              <div style={{ background:"white", borderRadius:20, border:"1px solid #EBEBEB", padding:"24px", marginBottom:16 }}>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:3, height:18, background:"#059669", borderRadius:2, display:"inline-block" }}/>
                  Ce qui est inclus
                </h2>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
                  {exc.inclusions.map(inc => (
                    <div key={inc} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13.5, color:"#374151", padding:"8px 12px", background:"#F0FDF4", borderRadius:10, border:"1px solid #DCFCE7" }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background:"#059669", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Check size={12} color="white" strokeWidth={3}/>
                      </div>
                      {sanitizeText(inc)}
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                    </div>
                  ))}
                </div>
              </div>
            )}

<<<<<<< HEAD
            {/* Langues */}
            {exc.languages?.length > 0 && (
              <div style={{ background:"white", borderRadius:20, border:"1px solid #EBEBEB", padding:"24px", marginBottom:28 }}>
                <h2 style={{ fontSize:17, fontWeight:800, color:"#111827", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:3, height:18, background:"#8B5CF6", borderRadius:2, display:"inline-block" }}/>
                  Langues disponibles
                </h2>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {exc.languages.map(l => (
                    <span key={l} style={{ padding:"8px 16px", background:"#F5F3FF", borderRadius:20, fontSize:13, fontWeight:700, color:"#6D28D9", border:"1px solid #EDE9FE", display:"flex", alignItems:"center", gap:6 }}>
                      <Globe size={13}/>{sanitizeText(l)}
                    </span>
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                  ))}
                </div>
              </div>
            )}

<<<<<<< HEAD
            {/* ══ AVIS ══ */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:"#111827", display:"flex", alignItems:"center", gap:10 }}>
                  Avis des voyageurs
                  {avgRating && (
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:16, color:"#374151", background:"#FFFBEB", padding:"4px 12px", borderRadius:20, border:"1px solid #FDE68A" }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>{avgRating}
                    </span>
                  )}
                </h2>
              </div>

              {user && !alreadyReviewed && !avisSuccess && (
                <div className="fu" style={{ background:"white", borderRadius:20, border:"1.5px solid #E5E7EB", padding:"24px", marginBottom:20 }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:"#111827", marginBottom:3 }}>Partagez votre expérience</h3>
                  <p style={{ fontSize:12, color:"#9CA3AF", marginBottom:16 }}>Votre avis sera publié après vérification</p>
                  {avisError && (
                    <div style={{ padding:"10px 14px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, fontSize:13, color:"#DC2626", marginBottom:14, display:"flex", alignItems:"center", gap:7 }}>
                      <X size={14}/>{avisError}
                    </div>
                  )}
                  <form onSubmit={submitAvis}>
                    <div style={{ display:"flex", alignItems:"center", gap:2, marginBottom:16 }}>
                      {STARS.map(s => (
                        <button key={s} type="button" className="star-btn"
                          onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setMyRating(s)}>
                          <Star size={28} fill={s<=(hoverRating||myRating)?"#F59E0B":"none"} color={s<=(hoverRating||myRating)?"#F59E0B":"#D1D5DB"} strokeWidth={1.5}/>
                        </button>
                      ))}
                      {myRating > 0 && (
                        <span style={{ marginLeft:10, fontSize:13, color:"#374151", fontWeight:700 }}>
                          {["","Très déçu","Décevant","Bien","Très bien","Excellent !"][myRating]}
                        </span>
                      )}
                    </div>
                    <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={4} required
                      placeholder="Décrivez votre expérience..."
                      style={{ width:"100%", padding:"13px 16px", border:"1.5px solid #E5E7EB", borderRadius:14, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"vertical", color:"#111827", background:"#FAFAFA", transition:"all .2s" }}
                    />
                    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:12 }}>
                      <button type="submit" disabled={avisLoading||myRating===0}
                        style={{ padding:"12px 26px", background:myRating>0?"#111827":"#E5E7EB", color:myRating>0?"white":"#9CA3AF", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:myRating>0?"pointer":"not-allowed", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", gap:7 }}>
                        {avisLoading ? <><Loader2 size={15} style={{ animation:"spin .65s linear infinite" }}/>Envoi...</> : <><Send size={14}/>Publier mon avis</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {avisSuccess && (
                <div style={{ padding:"16px 20px", background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:16, marginBottom:20, fontSize:14, color:"#15803D", fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                  <Check size={16} strokeWidth={3}/>Votre avis a été soumis ! Il sera publié après modération.
                </div>
              )}
              {alreadyReviewed && !avisSuccess && (
                <div style={{ padding:"12px 16px", background:"#EFF9FB", border:"1px solid #B2E3EB", borderRadius:14, marginBottom:20, fontSize:13, color:"#2B96A8", fontWeight:600, display:"flex", alignItems:"center", gap:7 }}>
                  <Check size={14} strokeWidth={3}/>Vous avez déjà soumis un avis pour cette excursion.
                </div>
              )}
              {!user && (
                <div style={{ padding:"20px 24px", background:"white", border:"1.5px solid #E5E7EB", borderRadius:18, marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <p style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:3 }}>Vous avez vécu cette excursion ?</p>
                    <p style={{ fontSize:13, color:"#9CA3AF" }}>Connectez-vous pour partager votre avis</p>
                  </div>
                  <Link href="/auth" style={{ padding:"11px 22px", background:"#2B96A8", color:"white", borderRadius:12, textDecoration:"none", fontSize:14, fontWeight:700 }}>Se connecter</Link>
                </div>
              )}

              {!avis || avis.length === 0 ? (
                <div style={{ textAlign:"center", padding:"48px 20px", background:"white", borderRadius:20, border:"1px solid #EBEBEB" }}>
                  <MessageCircle size={44} color="#D1D5DB" style={{ margin:"0 auto 12px" }}/>
                  <p style={{ fontSize:16, fontWeight:700, color:"#374151", marginBottom:6 }}>Aucun avis pour le moment</p>
                  <p style={{ fontSize:13, color:"#9CA3AF" }}>Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {avis.map(a => (
                    <div key={a.id} className="avis-item">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:42, height:42, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#2B96A8,#1e7a8a)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:15, fontWeight:800 }}>
                            {a.touriste_avatar
                              ? <img src={a.touriste_avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                              : (a.touriste_name?.[0]||"T").toUpperCase()
                            }
                          </div>
                          <div>
                            <p style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{sanitizeText(a.touriste_name||"Voyageur")}</p>
                            <p style={{ fontSize:11, color:"#9CA3AF", display:"flex", alignItems:"center", gap:4 }}>
                              <CalendarDays size={10}/>{new Date(a.created_at).toLocaleDateString("fr-FR",{ day:"numeric",month:"long",year:"numeric" })}
                            </p>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:2 }}>
                          {STARS.map(s => <Star key={s} size={13} fill={s<=a.rating?"#F59E0B":"#E5E7EB"} color={s<=a.rating?"#F59E0B":"#E5E7EB"} strokeWidth={0}/>)}
                        </div>
                      </div>
                      {a.comment && (
                        <p style={{ fontSize:14, color:"#374151", lineHeight:1.75, paddingLeft:52, marginBottom:12 }}>
                          &ldquo;{sanitizeText(a.comment)}&rdquo;
                        </p>
                      )}
                      {a.prestataire_response && (
                        <div style={{ marginLeft:52, padding:"10px 14px", background:"rgba(43,150,168,.06)", borderRadius:10, borderLeft:"3px solid #2B96A8", marginBottom:12 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                            <div style={{ width:24, height:24, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#2B96A8,#1e7a8a)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10, fontWeight:800 }}>
                              {prestataire?.avatar_url ? <img src={prestataire.avatar_url} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/> : sanitizeText(prestName)[0].toUpperCase()}
                            </div>
                            <p style={{ fontSize:12, fontWeight:800, color:"#2B96A8" }}>{sanitizeText(prestName)}</p>
                          </div>
                          <p style={{ fontSize:13, color:"#374151", lineHeight:1.65 }}>{sanitizeText(a.prestataire_response)}</p>
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", paddingTop:10, borderTop:"1px solid #F3F4F6", marginTop:4 }}>
                        <button className={`like-btn ${likedIds.has(a.id)?"on":""}`} onClick={() => toggleLike(a.id)}>
                          <ThumbsUp size={13} fill={likedIds.has(a.id)?"#E11D48":"none"} strokeWidth={2}/>
                          {a.likes_count > 0 && <span>{a.likes_count}</span>}
                          <span>Utile</span>
                        </button>
                      </div>
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

<<<<<<< HEAD
          {/* ─── RIGHT STICKY ─── */}
          <div style={{ position:"sticky", top:76, height:"fit-content" }}>
            <div style={{ background:"white", borderRadius:24, border:"1px solid #EBEBEB", padding:"26px", boxShadow:"0 12px 48px rgba(0,0,0,.1)" }}>
              <div style={{ marginBottom:20, paddingBottom:18, borderBottom:"1px solid #F3F4F6" }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                  <span style={{ fontSize:34, fontWeight:900, color:"#111827", fontFamily:"'Playfair Display',serif" }}>{exc.price_per_person}</span>
                  <span style={{ fontSize:15, fontWeight:600, color:"#374151" }}>TND</span>
                  <span style={{ fontSize:13, color:"#9CA3AF" }}>/ personne</span>
                </div>
                {avgRating && (
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:7 }}>
                    {STARS.map(s => <Star key={s} size={13} fill={s<=Math.round(Number(avgRating))?"#F59E0B":"#E5E7EB"} color={s<=Math.round(Number(avgRating))?"#F59E0B":"#E5E7EB"} strokeWidth={0}/>)}
                    <span style={{ fontSize:13, fontWeight:700, color:"#374151", marginLeft:3 }}>{avgRating}</span>
                    <span style={{ fontSize:12, color:"#9CA3AF" }}>({avisCount})</span>
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                  </div>
                )}
              </div>

<<<<<<< HEAD
              <div style={{ background:"#F9FAFB", borderRadius:14, padding:"13px 14px", marginBottom:18 }}>
                {[
                  { icon:<Clock size={13} color="#6B7280"/>,  label:"Durée",     val:`${exc.duration_hours}h` },
                  { icon:<Users size={13} color="#6B7280"/>,  label:"Max",       val:`${exc.max_people} personnes` },
                  { icon:<MapPin size={13} color="#6B7280"/>, label:"Lieu",      val:sanitizeText(exc.city) },
                  { icon:<Tag size={13} color="#6B7280"/>,    label:"Catégorie", val:sanitizeText(exc.categories?.[0]||"—") },
                ].map((r, i) => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:i<3?"1px solid #EBEBEB":"none" }}>
                    <span style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:6 }}>{r.icon}{r.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#111827" }}>{r.val}</span>
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                  </div>
                ))}
              </div>

<<<<<<< HEAD
              <button className="cta-primary" onClick={() => { if(!user){sessionStorage.setItem("redirect_after_login",`/excursions/${exc.id}`);window.location.href="/auth";return;} setShowCheckout(true); }}>
                {user ? <><CalendarDays size={16}/>Réserver maintenant</> : <><Lock size={15}/>Connexion pour réserver</>}
              </button>
              <div style={{ height:9 }}/>
              {prestataire && (
                <button className="cta-sec" onClick={() => { if(!user){sessionStorage.setItem("redirect_after_login",`/excursions/${exc.id}`);window.location.href="/auth";return;} setShowMsgModal(true); }}>
                  <MessageCircle size={15}/>Envoyer un message
                </button>
              )}
              <div style={{ height:9 }}/>
              <button className={`fav-btn ${isFav?"on":""}`} onClick={toggleFav}>
                <Heart size={15} fill={isFav?"#DC2626":"none"} strokeWidth={2}/>
                {isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              </button>

              {prestataire && (
                <div style={{ marginTop:18, paddingTop:16, borderTop:"1px solid #F3F4F6" }}>
                  <p style={{ fontSize:10, fontWeight:700, color:"#9CA3AF", letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Votre guide</p>
                  <div className="prest-card" onClick={() => setShowPrestataire(true)}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:"2px solid #F0F0F0" }}>
                        {prestataire.avatar_url
                          ? <img src={prestataire.avatar_url} alt={sanitizeText(prestName)} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                          : <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#2B96A8,#1e7a8a)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:17 }}>{sanitizeText(prestName)[0].toUpperCase()}</div>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:800, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sanitizeText(prestName)}</p>
                        {prestataire.city && <p style={{ fontSize:11, color:"#9CA3AF", marginTop:1, display:"flex", alignItems:"center", gap:3 }}><MapPin size={9}/>{sanitizeText(prestataire.city)}</p>}
                        <p style={{ fontSize:11, color:"#059669", fontWeight:700, marginTop:2, display:"flex", alignItems:"center", gap:4 }}><ShieldCheck size={11}/>Vérifié</p>
                      </div>
                      <ChevronRight size={16} color="#9CA3AF"/>
                    </div>
                    <p style={{ fontSize:11, color:"#2B96A8", fontWeight:600, marginTop:8, textAlign:"center" }}>Voir le profil complet</p>
                  </div>
                </div>
              )}

              <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #F3F4F6", display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { icon:<Lock size={12} color="#059669"/>,           text:"Paiement 100% sécurisé" },
                  { icon:<RefreshCcw size={12} color="#2563EB"/>,     text:"Annulation gratuite 24h avant" },
                  { icon:<HeadphonesIcon size={12} color="#8B5CF6"/>, text:"Support disponible 7j/7" },
                ].map(g => (
                  <p key={g.text} style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:7 }}>{g.icon}{g.text}</p>
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
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

<<<<<<< HEAD
      {/* ═══ MODAL MESSAGE ═══ */}
      {showMsgModal && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget){ setShowMsgModal(false); setMsgSent(false); } }}>
          <div className="modal fu">
            {msgSent ? (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ width:60, height:60, borderRadius:"50%", background:"#F0FDF4", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><Check size={28} color="#15803D" strokeWidth={2.5}/></div>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#111827", marginBottom:8 }}>Message envoyé !</h3>
                <p style={{ fontSize:14, color:"#6B7280" }}>Redirection vers vos messages...</p>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#111827", marginBottom:4 }}>Contacter le guide</h3>
                    <p style={{ fontSize:13, color:"#9CA3AF" }}>À propos de : {sanitizeText(exc.title)}</p>
                  </div>
                  <button onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    style={{ background:"#F3F4F6", border:"none", cursor:"pointer", color:"#9CA3AF", width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <X size={15}/>
                  </button>
                </div>
                {prestataire && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#F9FAFB", borderRadius:12, marginBottom:16 }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"linear-gradient(135deg,#2B96A8,#1e7a8a)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:14 }}>
                      {prestataire.avatar_url ? <img src={prestataire.avatar_url} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/> : sanitizeText(prestName)[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{sanitizeText(prestName)}</p>
                      <p style={{ fontSize:11, color:"#059669", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}><ShieldCheck size={11}/>Prestataire vérifié</p>
                    </div>
                  </div>
                )}
                <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder="Bonjour, j'aimerais avoir plus d'informations..."
                  style={{ width:"100%", height:110, padding:"12px 14px", border:"1.5px solid #E5E7EB", borderRadius:14, fontSize:14, fontFamily:"'DM Sans',sans-serif", resize:"none", color:"#111827", lineHeight:1.6, transition:"all .2s", background:"#FAFAFA" }}
                />
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <button onClick={() => { setShowMsgModal(false); setMsgText(""); }}
                    style={{ flex:1, padding:12, border:"1px solid #E5E7EB", borderRadius:12, background:"none", cursor:"pointer", fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"#374151" }}>
                    Annuler
                  </button>
                  <button onClick={sendMessage} disabled={!msgText.trim()||msgSending}
                    style={{ flex:1, padding:12, border:"none", borderRadius:12, background:msgText.trim()?"#2B96A8":"#E5E7EB", color:msgText.trim()?"white":"#9CA3AF", cursor:msgText.trim()?"pointer":"not-allowed", fontSize:14, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                    {msgSending ? <><Loader2 size={15} style={{ animation:"spin .65s linear infinite" }}/>Envoi...</> : <><Send size={14}/>Envoyer</>}
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

<<<<<<< HEAD
      {/* ═══ MODAL RÉSERVATION ═══ */}
      {showCheckout && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowCheckout(false); }}>
          <div className="modal fu">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#111827" }}>Réserver</h2>
              <button onClick={() => setShowCheckout(false)}
                style={{ background:"#F3F4F6", border:"none", cursor:"pointer", color:"#9CA3AF", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={{ background:"#F9FAFB", borderRadius:14, padding:"14px 16px", marginBottom:22 }}>
              <p style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:4 }}>{sanitizeText(exc.title)}</p>
              <p style={{ fontSize:12, color:"#6B7280", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><MapPin size={11}/>{sanitizeText(exc.city)}</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><Clock size={11}/>{exc.duration_hours}h</span>
                <span style={{ display:"flex", alignItems:"center", gap:4 }}><Tag size={11}/>{exc.price_per_person} TND/pers.</span>
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:22 }}>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:.5, textTransform:"uppercase", marginBottom:7 }}>
                  <CalendarDays size={12}/> Date
                </label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #E5E7EB", borderRadius:12, fontSize:14, fontFamily:"'DM Sans',sans-serif", color:"#111827", transition:"all .2s", background:"#FAFAFA" }}
                />
              </div>
              <div>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", letterSpacing:.5, textTransform:"uppercase", marginBottom:7 }}>
                  <Users size={12}/> Personnes
                </label>
                <div style={{ display:"flex", alignItems:"center", gap:14, padding:"8px 16px", border:"1.5px solid #E5E7EB", borderRadius:12, background:"#FAFAFA" }}>
                  <button className="counter-btn" type="button" onClick={() => setPeople(p => Math.max(1,p-1))} disabled={people<=1}><Minus size={15}/></button>
                  <span style={{ flex:1, textAlign:"center", fontSize:18, fontWeight:800, color:"#111827" }}>{people}</span>
                  <button className="counter-btn" type="button" onClick={() => setPeople(p => Math.min(exc.max_people,p+1))} disabled={people>=exc.max_people}><Plus size={15}/></button>
                </div>
                <p style={{ fontSize:11, color:"#9CA3AF", marginTop:5, display:"flex", alignItems:"center", gap:4 }}><Users size={10}/>Max {exc.max_people} personnes</p>
              </div>
            </div>
            <div style={{ background:"#F9FAFB", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", marginBottom:6 }}>
                <span>{exc.price_per_person} TND × {people} pers.</span><span>{totalPrice} TND</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#6B7280", marginBottom:10 }}>
                <span>Frais de service (10%)</span><span>{commission} TND</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:900, color:"#111827", borderTop:"1px solid #E5E7EB", paddingTop:10 }}>
                <span>Total</span><span style={{ color:"#2B96A8" }}>{totalPrice+commission} TND</span>
              </div>
            </div>
            <button className="cta-primary" disabled={!date}
              style={{ background:date?"#111827":"#E5E7EB", color:date?"white":"#9CA3AF", cursor:date?"pointer":"not-allowed" }}
              onClick={() => { alert("Paiement en cours d'intégration !"); setShowCheckout(false); }}>
              {date ? <><Check size={16}/>{`Confirmer — ${totalPrice+commission} TND`}</> : <><CalendarDays size={15}/>Choisissez d&apos;abord une date</>}
            </button>
          </div>
        </div>
      )}

      {/* ═══ MODAL PRESTATAIRE ═══ */}
      {showPrestataire && prestataire && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowPrestataire(false); }}>
          <div className="modal fu">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#111827" }}>Votre guide</h2>
              <button onClick={() => setShowPrestataire(false)}
                style={{ background:"#F3F4F6", border:"none", cursor:"pointer", color:"#9CA3AF", width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:20, paddingBottom:18, borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ width:76, height:76, borderRadius:"50%", overflow:"hidden", flexShrink:0, border:"3px solid #F0F0F0", boxShadow:"0 4px 16px rgba(0,0,0,.08)" }}>
                {prestataire.avatar_url
                  ? <img src={prestataire.avatar_url} alt={sanitizeText(prestName)} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                  : <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#2B96A8,#4AABB8)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:28 }}>{sanitizeText(prestName)[0].toUpperCase()}</div>
                }
              </div>
              <div>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#111827", marginBottom:4 }}>{sanitizeText(prestName)}</h3>
                {prestataire.full_name && prestataire.agency_name && (
                  <p style={{ fontSize:13, color:"#6B7280", marginBottom:6, display:"flex", alignItems:"center", gap:5 }}><Users size={12}/>{sanitizeText(prestataire.full_name)}</p>
                )}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span style={{ padding:"3px 10px", background:"#F0FDF4", color:"#15803D", borderRadius:20, fontSize:11, fontWeight:700, border:"1px solid #BBF7D0", display:"flex", alignItems:"center", gap:4 }}>
                    <ShieldCheck size={11}/>Vérifié
                  </span>
                  {prestataire.city && (
                    <span style={{ padding:"3px 10px", background:"#F3F4F6", color:"#374151", borderRadius:20, fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                      <MapPin size={10}/>{sanitizeText(prestataire.city)}
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
                    </span>
                  )}
                </div>
              </div>
            </div>
            {prestataire.description && (
<<<<<<< HEAD
              <div style={{ background:"#F9FAFB", borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:.5, marginBottom:7 }}>À propos</p>
                <p style={{ fontSize:14, color:"#374151", lineHeight:1.75 }}>{sanitizeText(prestataire.description)}</p>
              </div>
            )}
            {prestataire.phone && (
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13, padding:"10px 0", borderBottom:"1px solid #F9FAFB", marginBottom:10 }}>
                <span style={{ color:"#6B7280", display:"flex", alignItems:"center", gap:6 }}><HeadphonesIcon size={13}/>Téléphone</span>
                <span style={{ fontWeight:700, color:"#111827" }}>{sanitizeText(prestataire.phone)}</span>
              </div>
            )}
            <button onClick={() => setShowPrestataire(false)} className="cta-primary" style={{ marginTop:8 }}>Fermer</button>
=======
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
>>>>>>> 38c824b0e36a37388b4b353c9fdd88e5cff8c60e
          </div>
        </div>
      )}
    </>
  );
}