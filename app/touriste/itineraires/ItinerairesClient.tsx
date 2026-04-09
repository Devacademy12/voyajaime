"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Map, Plus, Trash2, Pencil, ChevronDown, ChevronUp,
  MapPin, Clock, CalendarDays, Coins, Sunrise, Sun,
  Moon, Loader2, AlertCircle, FileText, ShoppingCart,
  Bot, PenLine, Star, Image as ImageIcon,
} from "lucide-react";
import CheckoutModal from "@/app/components/excursions/CheckoutModal";

type ActivityItem = {
  id: string;
  excursion: { title: string; city: string; price_per_person: number; duration_hours: number; photos: string[] };
  note: string;
  time: "matin" | "aprem" | "soir";
};
type DayPlan = { city: string; activities: ActivityItem[] };
type RawPlan = DayPlan[] | { title?: string; days?: unknown[] } | null | undefined;
type Itineraire = {
  id: string; nb_jours: number;
  villes_selectionnees: string[];
  categories_selectionnees?: string[];
  plan: RawPlan; created_at: string; updated_at: string;
};
type ExcursionForCheckout = {
  id: string; title: string; city: string;
  duration_hours: number; price_per_person: number; max_people: number;
};

const TIME_ICON  = {
  matin: <Sunrise size={11} color="#F59E0B"/>,
  aprem: <Sun     size={11} color="#2B96A8"/>,
  soir:  <Moon    size={11} color="#8B5CF6"/>,
};
const TIME_LABEL = { matin:"Matin", aprem:"Après-midi", soir:"Soir" };

function normalizePlan(raw: RawPlan): DayPlan[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as DayPlan[];
  if (typeof raw === "object" && Array.isArray((raw as { days?: unknown[] }).days)) {
    const days = (raw as { days: unknown[] }).days;
    return days.map((d: unknown) => {
      const dd = d as Record<string, unknown>;
      const acts: ActivityItem[] = Array.isArray(dd.activities)
        ? (dd.activities as Record<string, unknown>[]).map(a => ({
            id:   String(a.id || ""),
            note: String(a.description || ""),
            time: "matin" as const,
            excursion: {
              title:            String(a.name  || ""),
              city:             String(dd.city || ""),
              price_per_person: Number(a.price) || 0,
              duration_hours:   parseFloat(String(a.duration || "2")) || 2,
              photos:           [],
            },
          }))
        : [];
      return { city: String(dd.city || ""), activities: acts };
    });
  }
  return [];
}

export default function ItinerairesClient() {
  const sb = createClient();
  const [items,      setItems]      = useState<Itineraire[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [checkoutExc,setCheckoutExc]= useState<ExcursionForCheckout | null>(null);
  const [excPhotos,  setExcPhotos]  = useState<Record<string, string[]>>({});

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      const { data:{ user }, error:uErr } = await sb.auth.getUser();
      if (uErr || !user) { setError("Non connecté — " + (uErr?.message || "")); setLoading(false); return; }

      const { data, error:fErr } = await sb
        .from("itineraires").select("*").eq("user_id", user.id)
        .order("updated_at", { ascending:false });
      if (fErr) { setError(fErr.message); setLoading(false); return; }

      const itineraires: Itineraire[] = data || [];
      setItems(itineraires);

      // Collecter tous les IDs d'excursions (mode libre + mode IA)
      const ids = new Set<string>();
      itineraires.forEach(it =>
        normalizePlan(it.plan).forEach(day =>
          day.activities?.forEach(act => { if (act.id) ids.add(act.id); })
        )
      );

      if (ids.size > 0) {
        const { data: excs } = await sb
          .from("excursions").select("id, photos").in("id", Array.from(ids));
        if (excs) {
          const map: Record<string, string[]> = {};
          excs.forEach((e: { id:string; photos:string[] }) => { map[e.id] = e.photos || []; });
          setExcPhotos(map);
        }
      }
      setLoading(false);
    })();
  }, []);

  const deleteIt = async (id: string) => {
    if (!confirm("Supprimer cet itinéraire ?")) return;
    setDeleting(id);
    const { error } = await sb.from("itineraires").delete().eq("id", id);
    if (!error) setItems(p => p.filter(i => i.id !== id));
    setDeleting(null);
  };

  const totAct    = (raw: RawPlan) => normalizePlan(raw).reduce((s, d) => s + (d.activities?.length || 0), 0);
  const totBudget = (raw: RawPlan) => normalizePlan(raw).reduce(
    (s, d) => s + (d.activities||[]).reduce((ss, a) => ss + (a.excursion?.price_per_person||0), 0), 0
  );
  const fmt        = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
  const isAssisted = (raw: RawPlan) => !!raw && !Array.isArray(raw) && typeof raw === "object" && "days" in raw;

  const openCheckout = (act: ActivityItem) => {
    if (!act.excursion?.price_per_person) return;
    setCheckoutExc({ id:act.id, title:act.excursion.title, city:act.excursion.city, duration_hours:act.excursion.duration_hours, price_per_person:act.excursion.price_per_person, max_people:20 });
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"100px 0", color:"#9CA3AF", fontSize:14, fontFamily:"'DM Sans',system-ui" }}>
      <Loader2 size={22} color="#2B96A8" style={{ animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Chargement de vos itinéraires…
    </div>
  );

  if (error) return (
    <div style={{ margin:"40px 48px", padding:"18px 22px", background:"#FEF2F2", borderRadius:14, border:"1px solid #FCA5A5", display:"flex", alignItems:"center", gap:12 }}>
      <AlertCircle size={18} color="#DC2626"/>
      <div>
        <p style={{ fontSize:13, fontWeight:700, color:"#DC2626", margin:0 }}>Erreur de chargement</p>
        <p style={{ fontSize:12, color:"#EF4444", margin:"2px 0 0" }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", padding:"36px 48px 60px", maxWidth:1160, margin:"0 auto", width:"100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .it-card{animation:fadeUp .22s ease both;transition:box-shadow .2s,transform .18s}
        .it-card:hover{box-shadow:0 8px 28px -8px rgba(43,150,168,.2)!important;transform:translateY(-2px)}
        .it-btn{transition:all .15s;cursor:pointer;font-family:inherit;border:none;outline:none}
        .it-reserve-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;background:linear-gradient(135deg,#02AFCF,#259FFC);color:white;border:none;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;flex-shrink:0;white-space:nowrap}
        .it-reserve-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(2,175,207,.4)}
        .it-reserve-btn:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none}
        .act-row{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#F9FAFB;border-radius:14px;margin-bottom:8px;border:1.5px solid #F3F4F6;transition:border .15s}
        .act-row:hover{border-color:#DCE5FF;background:#F8FAFF}
        .act-photo{width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0;border:1px solid #EEF2FF}
        .act-photo-placeholder{width:48px;height:48px;border-radius:10px;flex-shrink:0;background:#EEF2FF;display:flex;align-items:center;justify-content:center;border:1px solid #DCE5FF}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:32 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
            <Map size={13} color="#2B96A8"/>
            <p style={{ fontSize:11, fontWeight:700, color:"#2B96A8", textTransform:"uppercase", letterSpacing:".08em", margin:0 }}>Mes voyages</p>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:"#111827", margin:0, lineHeight:1.1 }}>
            Mes itinéraires
          </h1>
          <p style={{ fontSize:13, color:"#9CA3AF", marginTop:8, display:"flex", alignItems:"center", gap:5 }}>
            <CalendarDays size={13}/>
            {items.length} itinéraire{items.length !== 1 ? "s" : ""} sauvegardé{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a href="/touriste/itineraire"
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 22px", background:"#2B96A8", color:"white", borderRadius:40, textDecoration:"none", fontSize:13, fontWeight:700, boxShadow:"0 6px 20px -6px rgba(43,150,168,.5)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="#1e7a8a"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="#2B96A8"}>
          <Plus size={15}/> Nouvel itinéraire
        </a>
      </div>

      {/* Empty */}
      {items.length === 0 ? (
        <div style={{ textAlign:"center", padding:"72px 24px", background:"#ffffff", borderRadius:28, border:"1px solid #E5E7EB", boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
          <Map size={52} color="#D1D5DB" style={{ margin:"0 auto 16px" }}/>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:"#111827", marginBottom:10 }}>Aucun itinéraire sauvegardé</h2>
          <p style={{ fontSize:14, color:"#9CA3AF", marginBottom:28, maxWidth:320, margin:"0 auto 28px" }}>Planifiez votre voyage en Tunisie et sauvegardez votre itinéraire</p>
          <a href="/touriste/itineraire" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"13px 28px", background:"#2B96A8", color:"white", borderRadius:40, textDecoration:"none", fontSize:14, fontWeight:700 }}>
            <PenLine size={15}/> Créer mon premier itinéraire
          </a>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {items.map((it, idx) => {
            const plan     = normalizePlan(it.plan);
            const acts     = totAct(it.plan);
            const budget   = totBudget(it.plan);
            const isOpen   = expanded === it.id;
            const assisted = isAssisted(it.plan);

            return (
              <div key={it.id} className="it-card"
                style={{ background:"white", borderRadius:24, border:"1px solid #E5E7EB", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,.05)", animationDelay:`${idx * .06}s` }}>

                {/* Card header */}
                <div style={{ padding:"20px 24px", display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}
                  onClick={() => setExpanded(isOpen ? null : it.id)}>

                  {/* Icône mode */}
                  <div style={{ width:50, height:50, borderRadius:16, background: assisted ? "linear-gradient(135deg,rgba(2,175,207,.15),rgba(37,159,252,.1))" : "linear-gradient(135deg,#EFF9FB,#D0F0F5)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${assisted ? "rgba(2,175,207,.25)" : "rgba(43,150,168,.15)"}` }}>
                    {assisted ? <Bot size={22} color="#02AFCF"/> : <PenLine size={22} color="#2B96A8"/>}
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                      <h3 style={{ fontSize:15, fontWeight:800, color:"#111827", margin:0 }}>
                        {it.nb_jours} jour{it.nb_jours > 1 ? "s" : ""} en Tunisie
                      </h3>
                      {/* Badge mode */}
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background: assisted ? "rgba(2,175,207,.1)" : "rgba(43,150,168,.08)", color: assisted ? "#02AFCF" : "#2B96A8" }}>
                        {assisted ? <><Bot size={10}/> Mode IA</> : <><PenLine size={10}/> Mode Libre</>}
                      </span>
                      {/* Villes — texte simple, sans emoji */}
                      {it.villes_selectionnees?.slice(0, 3).map(v => (
                        <span key={v} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:"#6B7280", background:"#F3F4F6", padding:"2px 8px", borderRadius:20, fontWeight:500 }}>
                          <MapPin size={9} color="#9CA3AF"/> {v}
                        </span>
                      ))}
                      {(it.villes_selectionnees?.length || 0) > 3 && (
                        <span style={{ fontSize:11, color:"#9CA3AF" }}>+{it.villes_selectionnees.length - 3}</span>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:16, fontSize:12, color:"#9CA3AF", flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <CalendarDays size={11}/> {fmt(it.updated_at)}
                      </span>
                      <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <MapPin size={11}/> {acts} activité{acts !== 1 ? "s" : ""}
                      </span>
                      {budget > 0 && (
                        <span style={{ color:"#059669", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                          <Coins size={11}/> {budget} TND
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:8, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                    <a href="/touriste/itineraire"
                      style={{ padding:"8px 14px", background:"#F3F4F6", color:"#374151", borderRadius:20, fontSize:12, fontWeight:700, textDecoration:"none", display:"flex", alignItems:"center", gap:5, transition:"all .15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="#E5E7EB"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#F3F4F6"; }}>
                      <Pencil size={12}/> Modifier
                    </a>
                    <button className="it-btn"
                      onClick={() => deleteIt(it.id)} disabled={deleting === it.id}
                      style={{ padding:"8px 14px", background:"#FEF2F2", color:"#DC2626", borderRadius:20, fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                      {deleting === it.id ? <Loader2 size={13} style={{ animation:"spin .8s linear infinite" }}/> : <Trash2 size={13}/>}
                    </button>
                  </div>

                  <div style={{ color:"#D1D5DB", flexShrink:0 }}>
                    {isOpen ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                  </div>
                </div>

                {/* Détail */}
                {isOpen && (
                  <div style={{ padding:"0 24px 20px", borderTop:"1px solid #F3F4F6" }}>
                    <div style={{ paddingTop:18 }}>
                      {plan.length === 0 ? (
                        <p style={{ fontSize:13, color:"#C4C9D0", fontStyle:"italic" }}>Aucune activité planifiée</p>
                      ) : plan.map((day, di) => (
                        <div key={di} style={{ borderLeft:"3px solid #EEF2FF", paddingLeft:14, marginBottom:18 }}>
                          {/* Jour header */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                            <MapPin size={12} color="#02AFCF"/>
                            <p style={{ fontSize:12, fontWeight:700, color:"#053366", margin:0 }}>
                              Jour {di + 1} — {day.city}
                            </p>
                          </div>

                          {(day.activities || []).length === 0 ? (
                            <p style={{ fontSize:12, color:"#D1D5DB", fontStyle:"italic" }}>Journée libre</p>
                          ) : (day.activities || []).map((act, ai) => {
                            // Photo : cherche dans excPhotos (mode IA) ou dans l'excursion directement (mode libre)
                            const photo = excPhotos[act.id]?.[0] || act.excursion?.photos?.[0];

                            return (
                              <div key={act.id || ai} className="act-row">

                                {/* Photo — identique pour mode IA et mode libre */}
                                {photo ? (
                                  <img src={photo} alt={act.excursion?.title || ""} className="act-photo"
                                    onError={e => { (e.target as HTMLImageElement).style.display="none"; }}/>
                                ) : (
                                  <div className="act-photo-placeholder">
                                    <ImageIcon size={18} color="#9CA3AF" strokeWidth={1.5}/>
                                  </div>
                                )}

                                {/* Infos */}
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ fontSize:13, fontWeight:700, color:"#111827", margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                    {act.excursion?.title || "—"}
                                  </p>
                                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                                    {act.time && (
                                      <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#6B7280" }}>
                                        {TIME_ICON[act.time]} {TIME_LABEL[act.time]}
                                      </span>
                                    )}
                                    {act.excursion?.duration_hours && (
                                      <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#6B7280" }}>
                                        <Clock size={10}/> {act.excursion.duration_hours}h
                                      </span>
                                    )}
                                    {act.excursion?.city && (
                                      <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"#6B7280" }}>
                                        <MapPin size={10}/> {act.excursion.city}
                                      </span>
                                    )}
                                    {act.excursion?.price_per_person > 0 && (
                                      <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700, color:"#02AFCF" }}>
                                        <Coins size={10}/> {act.excursion.price_per_person} TND
                                      </span>
                                    )}
                                  </div>
                                  {act.note && (
                                    <p style={{ fontSize:10, color:"#9CA3AF", margin:"3px 0 0", fontStyle:"italic", display:"flex", alignItems:"center", gap:3 }}>
                                      <FileText size={9}/> {act.note}
                                    </p>
                                  )}
                                </div>

                                {/* Bouton réserver */}
                                <button
                                  className="it-reserve-btn"
                                  disabled={!act.excursion?.price_per_person}
                                  onClick={e => { e.stopPropagation(); openCheckout(act); }}>
                                  <ShoppingCart size={11}/> Réserver
                                </button>

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

      {checkoutExc && (
        <CheckoutModal exc={checkoutExc} onClose={() => setCheckoutExc(null)}/>
      )}
    </div>
  );
}