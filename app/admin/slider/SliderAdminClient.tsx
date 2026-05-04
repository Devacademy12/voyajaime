"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Image, Video, Plus, Trash2, GripVertical, Save,
  Eye, EyeOff, Star, MapPin, Check, X, Loader2,
  Upload, Link as LinkIcon, ToggleLeft, ToggleRight,
  ArrowUp, ArrowDown, Monitor, Play, AlertCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";

type SlideType = "excursion" | "video" | "custom";

interface Slide {
  id?: string;
  position: number;
  type: SlideType;
  excursion_id?: string | null;
  video_url?: string | null;
  custom_image_url?: string | null;
  custom_title?: string | null;
  custom_subtitle?: string | null;
  custom_color?: string;
  is_active: boolean;
  // computed pour affichage
  _excursion?: { id: string; title: string; city: string; photos: string[]; categories: string[]; rating: number };
}

interface Excursion {
  id: string; title: string; city: string;
  photos: string[]; categories: string[]; rating: number;
}

const COLORS = ["#2B96A8","#D97706","#7C3AED","#059669","#E11D48","#0EA5E9","#B45309","#6366F1"];
const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=70";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',system-ui,sans-serif}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

  .slide-card{background:white;border-radius:18px;border:1.5px solid #E5E7EB;overflow:hidden;transition:all .2s;animation:fadeUp .25s ease both}
  .slide-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.08)}
  .slide-card.inactive{opacity:.65}

  .exc-option{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;cursor:pointer;border:1.5px solid transparent;transition:all .18s;background:white}
  .exc-option:hover{background:#F8FAFF;border-color:#DCE5FF}
  .exc-option.selected{background:rgba(2,175,207,.08);border-color:#02AFCF}

  .type-tab{display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;border:1.5px solid #E5E7EB;background:white;font-size:13px;font-weight:600;color:#374151;cursor:pointer;font-family:inherit;transition:all .18s}
  .type-tab.active{background:#053366;border-color:#053366;color:white}
  .type-tab:not(.active):hover{border-color:#053366;color:#053366}

  .save-btn{display:flex;align-items:center;gap:7px;padding:10px 22px;background:linear-gradient(135deg,#02AFCF,#053366);color:white;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 14px rgba(2,175,207,.3)}
  .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(2,175,207,.4)}
  .save-btn:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none}
  .save-btn.ok{background:linear-gradient(135deg,#059669,#047857)}

  .action-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;border:none;cursor:pointer;transition:all .15s;flex-shrink:0}
  .action-btn:hover{transform:scale(1.08)}

  .preview-hero{position:relative;height:420px;border-radius:16px;overflow:hidden;background:#0D1117}
  .preview-overlay1{position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.72) 0%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.06) 100%)}
  .preview-overlay2{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 55%)}

  .input-field{width:100%;padding:10px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:inherit;color:#111827;background:white;outline:none;transition:all .2s}
  .input-field:focus{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.08)}

  .color-dot{width:26px;height:26px;border-radius:50%;cursor:pointer;transition:all .18s;border:3px solid transparent;flex-shrink:0}
  .color-dot.selected{border-color:#111827;transform:scale(1.15)}

  .exc-search{width:100%;padding:9px 14px 9px 36px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:all .2s}
  .exc-search:focus{border-color:#02AFCF}

  .toggle-btn{position:relative;width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background .2s;flex-shrink:0}
  .toggle-knob{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:white;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}

  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}

  *::-webkit-scrollbar{width:4px;height:4px}
  *::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:2px}
`;

export default function SliderAdminClient({
  initialSlides,
  excursions,
}: {
  initialSlides: Slide[];
  excursions: Excursion[];
}) {
  const sb = createClient();
  const [slides,      setSlides]      = useState<Slide[]>(
    initialSlides.map(s => ({
      ...s,
      _excursion: excursions.find(e => e.id === s.excursion_id),
    }))
  );
  const [saving,      setSaving]      = useState(false);
  const [saveOk,      setSaveOk]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [addMode,     setAddMode]     = useState<SlideType | null>(null);
  const [excSearch,   setExcSearch]   = useState("");
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [previewIdx,  setPreviewIdx]  = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  // Form pour nouvelle slide
  const [newExcId,      setNewExcId]      = useState<string | null>(null);
  const [newVideoUrl,   setNewVideoUrl]   = useState("");
  const [newImgUrl,     setNewImgUrl]     = useState("");
  const [newTitle,      setNewTitle]      = useState("");
  const [newSubtitle,   setNewSubtitle]   = useState("");
  const [newColor,      setNewColor]      = useState(COLORS[0]);

  const activeSlides = slides.filter(s => s.is_active);

  /* ── Sauvegarder tout ── */
  const saveAll = async () => {
    setSaving(true); setSaveError(null);
    try {
      // 1. Récupérer tous les IDs existants en base
      const { data: existing, error: fetchErr } = await sb
        .from("home_slider")
        .select("id");

      if (fetchErr) throw new Error("Lecture échouée : " + fetchErr.message);

      // 2. Supprimer un par un si des enregistrements existent
      if (existing && existing.length > 0) {
        const ids = existing.map((r: { id: string }) => r.id);
        const { error: delErr } = await sb
          .from("home_slider")
          .delete()
          .in("id", ids);
        if (delErr) throw new Error("Suppression échouée : " + delErr.message);
      }

      // 3. Insérer les nouvelles slides (seulement si il y en a)
      if (slides.length > 0) {
        const toInsert = slides.map((s, i) => ({
          position:         i,
          type:             s.type,
          excursion_id:     s.excursion_id     || null,
          video_url:        s.video_url        || null,
          custom_image_url: s.custom_image_url || null,
          custom_title:     s.custom_title     || null,
          custom_subtitle:  s.custom_subtitle  || null,
          custom_color:     s.custom_color     || COLORS[0],
          is_active:        s.is_active,
        }));

        const { error: insErr } = await sb.from("home_slider").insert(toInsert);
        if (insErr) throw new Error("Insertion échouée : " + insErr.message);
      }

      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  /* ── Ajouter une slide ── */
  const addSlide = () => {
    if (addMode === "excursion" && !newExcId) return;
    if (addMode === "video"     && !newVideoUrl) return;
    if (addMode === "custom"    && !newImgUrl)   return;

    const exc = excursions.find(e => e.id === newExcId);
    const newSlide: Slide = {
      position:         slides.length,
      type:             addMode!,
      excursion_id:     addMode === "excursion" ? newExcId : null,
      video_url:        addMode === "video" ? newVideoUrl : null,
      custom_image_url: addMode === "custom" ? newImgUrl : null,
      custom_title:     newTitle || exc?.title || null,
      custom_subtitle:  newSubtitle || exc?.city || null,
      custom_color:     newColor,
      is_active:        true,
      _excursion:       exc,
    };
    setSlides(p => [...p, newSlide]);
    // Reset form
    setAddMode(null); setNewExcId(null); setNewVideoUrl(""); setNewImgUrl("");
    setNewTitle(""); setNewSubtitle(""); setNewColor(COLORS[0]); setExcSearch("");
  };

  /* ── Supprimer ── */
  const removeSlide = (idx: number) => setSlides(p => p.filter((_,i)=>i!==idx).map((s,i)=>({...s,position:i})));

  /* ── Toggle actif ── */
  const toggleActive = (idx: number) => setSlides(p => p.map((s,i)=>i===idx?{...s,is_active:!s.is_active}:s));

  /* ── Déplacer ── */
  const move = (idx: number, dir: "up" | "down") => {
    const n = [...slides];
    const target = dir === "up" ? idx-1 : idx+1;
    if (target < 0 || target >= n.length) return;
    [n[idx], n[target]] = [n[target], n[idx]];
    setSlides(n.map((s,i)=>({...s,position:i})));
  };

  /* ── Slide preview info ── */
  const getSlideInfo = (s: Slide) => {
    if (s.type === "excursion" && s._excursion) {
      return {
        img:   s._excursion.photos?.[0] || FALLBACK,
        title: s.custom_title || s._excursion.title,
        sub:   s.custom_subtitle || s._excursion.city,
        color: s.custom_color || COLORS[0],
        tag:   s._excursion.categories?.[0] || "Excursion",
      };
    }
    if (s.type === "video") {
      return { img:FALLBACK, title:s.custom_title||"Vidéo", sub:s.custom_subtitle||"", color:s.custom_color||COLORS[0], tag:"Vidéo" };
    }
    return { img:s.custom_image_url||FALLBACK, title:s.custom_title||"Slide", sub:s.custom_subtitle||"", color:s.custom_color||COLORS[0], tag:"Personnalisé" };
  };

  const filteredExc = excursions.filter(e => {
    const q = excSearch.toLowerCase();
    return !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
  });

  const previewSlide = activeSlides[previewIdx % Math.max(activeSlides.length, 1)];
  const previewInfo  = previewSlide ? getSlideInfo(previewSlide) : null;

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#F8FAFF", minHeight:"100vh" }}>
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <div style={{ background:"white", borderBottom:"1px solid #E5E7EB", padding:"18px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:50 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#053366", margin:0 }}>
            Gestion du Slider
          </h1>
          <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>
            {slides.length} slide{slides.length>1?"s":""} · {activeSlides.length} active{activeSlides.length>1?"s":""}
          </p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {saveError && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px", background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, fontSize:12, color:"#DC2626", fontWeight:600 }}>
              <AlertCircle size={13}/> {saveError}
            </div>
          )}
          <button
            onClick={() => { setShowPreview(p=>!p); setPreviewIdx(0); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", background:"#F3F4F6", border:"1px solid #E5E7EB", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", color:"#374151", fontFamily:"inherit" }}>
            <Monitor size={14}/> {showPreview ? "Masquer" : "Aperçu"}
          </button>
          <button className={`save-btn ${saveOk?"ok":""}`} onClick={saveAll} disabled={saving||saveOk}>
            {saving ? <><Loader2 size={14} style={{ animation:"spin .7s linear infinite" }}/> Enregistrement…</>
             : saveOk ? <><Check size={14}/> Enregistré !</>
             : <><Save size={14}/> Enregistrer</>}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 32px 80px", display:"grid", gridTemplateColumns: showPreview ? "1fr 420px" : "1fr", gap:24 }}>

        {/* ── GAUCHE : gestion slides ── */}
        <div>

          {/* Slides list */}
          {slides.length === 0 ? (
            <div style={{ textAlign:"center", padding:"64px 20px", background:"white", borderRadius:20, border:"1.5px dashed #DCE5FF" }}>
              <Image size={44} color="#DCE5FF" style={{ marginBottom:14 }}/>
              <p style={{ fontSize:15, fontWeight:700, color:"#374151", marginBottom:6 }}>Aucune slide configurée</p>
              <p style={{ fontSize:13, color:"#9CA3AF" }}>Ajoutez une excursion, une vidéo ou une image personnalisée</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              {slides.map((slide, idx) => {
                const info = getSlideInfo(slide);
                const isExpanded = expandedId === `${idx}`;
                return (
                  <div key={idx} className={`slide-card ${!slide.is_active?"inactive":""}`} style={{ animationDelay:`${idx*.04}s` }}>
                    {/* Card header */}
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px" }}>
                      {/* Drag handle visuel */}
                      <GripVertical size={16} color="#D1D5DB" style={{ flexShrink:0, cursor:"grab" }}/>

                      {/* Miniature */}
                      <div style={{ width:64, height:48, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#F3F4F6", position:"relative" }}>
                        {slide.type === "video" ? (
                          <div style={{ width:"100%", height:"100%", background:"#111827", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Play size={20} color="white" fill="white"/>
                          </div>
                        ) : (
                          <img src={info.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                            onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}/>
                        )}
                        {/* Position badge */}
                        <div style={{ position:"absolute", bottom:2, right:2, background:"rgba(0,0,0,.6)", color:"white", fontSize:9, fontWeight:800, borderRadius:4, padding:"1px 5px" }}>
                          #{idx+1}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", margin:0 }}>
                            {info.title}
                          </p>
                          <span className="badge" style={{
                            background: slide.type==="excursion" ? "rgba(2,175,207,.1)" : slide.type==="video" ? "rgba(139,92,246,.1)" : "rgba(5,150,105,.1)",
                            color: slide.type==="excursion" ? "#02AFCF" : slide.type==="video" ? "#7C3AED" : "#059669",
                          }}>
                            {slide.type==="excursion" ? <><Star size={9}/> Excursion</> : slide.type==="video" ? <><Video size={9}/> Vidéo</> : <><Image size={9}/> Custom</>}
                          </span>
                        </div>
                        <p style={{ fontSize:11, color:"#9CA3AF", margin:0, display:"flex", alignItems:"center", gap:4 }}>
                          <MapPin size={9}/> {info.sub}
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                        {/* Toggle actif */}
                        <button className="toggle-btn"
                          onClick={() => toggleActive(idx)}
                          style={{ background: slide.is_active ? "#02AFCF" : "#E5E7EB" }}>
                          <div className="toggle-knob" style={{ left: slide.is_active ? "23px" : "3px" }}/>
                        </button>

                        {/* Monter */}
                        <button className="action-btn" onClick={() => move(idx,"up")} disabled={idx===0}
                          style={{ background:"#F3F4F6", color: idx===0?"#D1D5DB":"#374151" }}>
                          <ArrowUp size={13}/>
                        </button>
                        {/* Descendre */}
                        <button className="action-btn" onClick={() => move(idx,"down")} disabled={idx===slides.length-1}
                          style={{ background:"#F3F4F6", color: idx===slides.length-1?"#D1D5DB":"#374151" }}>
                          <ArrowDown size={13}/>
                        </button>

                        {/* Expand détails */}
                        <button className="action-btn"
                          onClick={() => setExpandedId(isExpanded ? null : `${idx}`)}
                          style={{ background:"#EEF2FF", color:"#053366" }}>
                          {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                        </button>

                        {/* Supprimer */}
                        <button className="action-btn"
                          onClick={() => removeSlide(idx)}
                          style={{ background:"#FEF2F2", color:"#DC2626" }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>

                    {/* Détails expandés */}
                    {isExpanded && (
                      <div style={{ padding:"14px 16px", borderTop:"1px solid #F3F4F6", background:"#FAFBFF", display:"flex", flexDirection:"column", gap:12 }}>
                        {/* Couleur accent */}
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Couleur d'accent</p>
                          <div style={{ display:"flex", gap:8 }}>
                            {COLORS.map(c => (
                              <div key={c} className={`color-dot ${slide.custom_color===c?"selected":""}`}
                                style={{ background:c }}
                                onClick={() => setSlides(p => p.map((s,i)=>i===idx?{...s,custom_color:c}:s))}/>
                            ))}
                          </div>
                        </div>
                        {/* Titre personnalisé */}
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Titre affiché</p>
                          <input className="input-field" value={slide.custom_title||""} placeholder="Titre de la slide…"
                            onChange={e => setSlides(p => p.map((s,i)=>i===idx?{...s,custom_title:e.target.value}:s))}/>
                        </div>
                        {/* Sous-titre */}
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Sous-titre / ville</p>
                          <input className="input-field" value={slide.custom_subtitle||""} placeholder="Ville ou description courte…"
                            onChange={e => setSlides(p => p.map((s,i)=>i===idx?{...s,custom_subtitle:e.target.value}:s))}/>
                        </div>
                        {/* URL vidéo si type video */}
                        {slide.type === "video" && (
                          <div>
                            <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>URL de la vidéo</p>
                            <input className="input-field" value={slide.video_url||""} placeholder="https://…"
                              onChange={e => setSlides(p => p.map((s,i)=>i===idx?{...s,video_url:e.target.value}:s))}/>
                          </div>
                        )}
                        {/* URL image si type custom */}
                        {slide.type === "custom" && (
                          <div>
                            <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>URL de l'image</p>
                            <input className="input-field" value={slide.custom_image_url||""} placeholder="https://…"
                              onChange={e => setSlides(p => p.map((s,i)=>i===idx?{...s,custom_image_url:e.target.value}:s))}/>
                          </div>
                        )}
                        {/* Aperçu preview */}
                        <button onClick={() => { setPreviewIdx(activeSlides.findIndex((_,i)=>i===idx)); setShowPreview(true); }}
                          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#F3F4F6", border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", color:"#374151", fontFamily:"inherit", alignSelf:"flex-start" }}>
                          <Eye size={13}/> Prévisualiser
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Ajouter une slide ── */}
          {!addMode ? (
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <button className="type-tab" onClick={() => setAddMode("excursion")}>
                <Star size={14}/> Ajouter une excursion
              </button>
              <button className="type-tab" onClick={() => setAddMode("video")}>
                <Video size={14}/> Ajouter une vidéo
              </button>
              <button className="type-tab" onClick={() => setAddMode("custom")}>
                <Image size={14}/> Image personnalisée
              </button>
            </div>
          ) : (
            <div style={{ background:"white", borderRadius:18, border:"1.5px solid #DCE5FF", padding:"20px" }}>
              {/* Header du form */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div style={{ display:"flex", gap:8 }}>
                  {(["excursion","video","custom"] as SlideType[]).map(t => (
                    <button key={t} className={`type-tab ${addMode===t?"active":""}`} onClick={() => setAddMode(t)}>
                      {t==="excursion" ? <><Star size={12}/> Excursion</> : t==="video" ? <><Video size={12}/> Vidéo</> : <><Image size={12}/> Image</>}
                    </button>
                  ))}
                </div>
                <button onClick={() => setAddMode(null)}
                  style={{ background:"#F3F4F6", border:"none", width:30, height:30, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#9CA3AF" }}>
                  <X size={14}/>
                </button>
              </div>

              {/* Form excursion */}
              {addMode === "excursion" && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ position:"relative" }}>
                    <Star size={13} color="#9CA3AF" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                    <input className="exc-search" value={excSearch} onChange={e=>setExcSearch(e.target.value)} placeholder="Rechercher une excursion…"/>
                  </div>
                  <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                    {filteredExc.length === 0 ? (
                      <p style={{ textAlign:"center", padding:"20px", fontSize:13, color:"#9CA3AF" }}>Aucun résultat</p>
                    ) : filteredExc.map(exc => (
                      <div key={exc.id} className={`exc-option ${newExcId===exc.id?"selected":""}`}
                        onClick={() => { setNewExcId(exc.id); setNewTitle(exc.title); setNewSubtitle(exc.city); }}>
                        <img src={exc.photos?.[0]||FALLBACK} alt=""
                          style={{ width:48, height:36, borderRadius:8, objectFit:"cover", flexShrink:0 }}
                          onError={e => { (e.target as HTMLImageElement).src=FALLBACK; }}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", margin:0 }}>{exc.title}</p>
                          <p style={{ fontSize:11, color:"#9CA3AF", margin:0, display:"flex", alignItems:"center", gap:3 }}>
                            <MapPin size={9}/>{exc.city}
                            {exc.rating > 0 && <><span>·</span><Star size={9} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>{exc.rating}</>}
                          </p>
                        </div>
                        {newExcId===exc.id && <Check size={16} color="#02AFCF"/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form vidéo */}
              {addMode === "video" && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>URL de la vidéo</p>
                    <input className="input-field" value={newVideoUrl} onChange={e=>setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/… ou /videos/hero.mp4"/>
                  </div>
                </div>
              )}

              {/* Form image custom */}
              {addMode === "custom" && (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>URL de l'image</p>
                    <input className="input-field" value={newImgUrl} onChange={e=>setNewImgUrl(e.target.value)} placeholder="https://images.unsplash.com/…"/>
                    {newImgUrl && (
                      <div style={{ marginTop:8, height:80, borderRadius:10, overflow:"hidden", border:"1px solid #EEF2FF" }}>
                        <img src={newImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Champs communs */}
              <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Titre</p>
                    <input className="input-field" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Titre de la slide"/>
                  </div>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Sous-titre</p>
                    <input className="input-field" value={newSubtitle} onChange={e=>setNewSubtitle(e.target.value)} placeholder="Ville ou description"/>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Couleur d'accent</p>
                  <div style={{ display:"flex", gap:8 }}>
                    {COLORS.map(c => (
                      <div key={c} className={`color-dot ${newColor===c?"selected":""}`}
                        style={{ background:c }} onClick={() => setNewColor(c)}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bouton ajouter */}
              <button onClick={addSlide}
                disabled={(addMode==="excursion"&&!newExcId)||(addMode==="video"&&!newVideoUrl)||(addMode==="custom"&&!newImgUrl)}
                style={{ marginTop:16, display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:"linear-gradient(135deg,#02AFCF,#053366)", color:"white", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:((addMode==="excursion"&&!newExcId)||(addMode==="video"&&!newVideoUrl)||(addMode==="custom"&&!newImgUrl))?0.5:1, transition:"opacity .2s" }}>
                <Plus size={14}/> Ajouter au slider
              </button>
            </div>
          )}

          {/* Note table SQL */}
          <div style={{ marginTop:20, padding:"12px 16px", background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12, fontSize:12, color:"#92400E" }}>
            <strong>Table Supabase requise :</strong> <code>home_slider</code> avec colonnes{" "}
            <code>id, position, type, excursion_id, video_url, custom_image_url, custom_title, custom_subtitle, custom_color, is_active, created_at</code>
          </div>
        </div>

        {/* ── DROITE : Aperçu ── */}
        {showPreview && (
          <div style={{ position:"sticky", top:80 }}>
            <div style={{ background:"white", borderRadius:20, border:"1px solid #E5E7EB", padding:"16px", boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <p style={{ fontSize:13, fontWeight:800, color:"#053366" }}>Aperçu Hero</p>
                <div style={{ display:"flex", gap:6 }}>
                  {activeSlides.map((_,i) => (
                    <button key={i} onClick={() => setPreviewIdx(i)}
                      style={{ width: i===previewIdx?28:8, height:6, borderRadius:3, background: i===previewIdx?"#02AFCF":"#E5E7EB", border:"none", cursor:"pointer", transition:"all .2s" }}/>
                  ))}
                </div>
              </div>

              {activeSlides.length === 0 ? (
                <div style={{ height:280, borderRadius:14, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, color:"#9CA3AF" }}>
                  <EyeOff size={28}/>
                  <p style={{ fontSize:13 }}>Aucune slide active</p>
                </div>
              ) : previewInfo && (
                <div className="preview-hero">
                  {previewSlide?.type === "video" ? (
                    <div style={{ position:"absolute", inset:0, background:"#111827", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Play size={28} color="white" fill="white"/>
                      </div>
                    </div>
                  ) : (
                    <img src={previewInfo.img} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e=>{(e.target as HTMLImageElement).src=FALLBACK}}/>
                  )}
                  <div className="preview-overlay1"/>
                  <div className="preview-overlay2"/>
                  {/* Content preview */}
                  <div style={{ position:"absolute", top:"50%", left:24, transform:"translateY(-50%)", maxWidth:260 }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, background:previewInfo.color+"28", border:`1px solid ${previewInfo.color}55`, marginBottom:10 }}>
                      <MapPin size={10} color="white"/>
                      <span style={{ fontSize:10, fontWeight:700, color:"white", letterSpacing:1, textTransform:"uppercase" }}>{previewInfo.sub}</span>
                    </div>
                    <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"white", lineHeight:1.1, marginBottom:8, textShadow:"0 2px 12px rgba(0,0,0,.3)" }}>
                      {previewInfo.title}
                    </h2>
                    <div style={{ display:"flex", gap:7 }}>
                      <div style={{ padding:"6px 12px", background:"#2B96A8", borderRadius:8, fontSize:11, fontWeight:700, color:"white" }}>Planifier</div>
                      <div style={{ padding:"6px 12px", background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.35)", borderRadius:8, fontSize:11, fontWeight:600, color:"white" }}>Voir</div>
                    </div>
                  </div>
                  {/* Dots preview */}
                  <div style={{ position:"absolute", bottom:12, left:24, display:"flex", gap:6 }}>
                    {activeSlides.map((_,i) => (
                      <div key={i} style={{ width: i===previewIdx?22:5, height:5, borderRadius:3, background: i===previewIdx?previewInfo.color:"rgba(255,255,255,.35)", transition:"all .2s" }}/>
                    ))}
                  </div>
                </div>
              )}
              <p style={{ fontSize:11, color:"#9CA3AF", marginTop:10, textAlign:"center" }}>
                Aperçu simplifié · {activeSlides.length} slide{activeSlides.length>1?"s":""} active{activeSlides.length>1?"s":""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}