"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  Image, Video, Plus, Trash2, GripVertical, Save,
  Eye, EyeOff, Star, MapPin, Check, X, Loader2,
  Play, AlertCircle, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Monitor,
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
  @keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}

  /* ── Cards ── */
  .slide-card{background:white;border-radius:18px;border:1.5px solid #E5E7EB;overflow:hidden;transition:all .2s;animation:fadeUp .25s ease both}
  .slide-card:hover{box-shadow:0 8px 24px rgba(0,0,0,.08)}
  .slide-card.inactive{opacity:.65}

  /* ── Add form ── */
  .add-form-container{background:white;border-radius:18px;border:1.5px solid #DCE5FF;overflow:hidden;animation:slideDown .22s ease both;margin-bottom:16px}

  /* ── Type selector bar ── */
  .type-selector-bar{
    display:flex;gap:0;background:#F8FAFF;border-bottom:1.5px solid #E5E7EB;
  }
  .type-selector-tab{
    flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
    padding:13px 8px;border:none;background:transparent;
    font-size:13px;font-weight:700;color:#9CA3AF;
    cursor:pointer;font-family:inherit;transition:all .18s;
    border-bottom:2px solid transparent;margin-bottom:-2px;
    white-space:nowrap;
  }
  .type-selector-tab.active{color:#053366;border-bottom-color:#02AFCF;background:white}
  .type-selector-tab:hover:not(.active){color:#374151;background:#F0F4FF}

  /* ── Add trigger buttons ── */
  .add-trigger-bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
  .add-trigger-btn{
    display:flex;align-items:center;gap:7px;
    padding:10px 18px;border-radius:14px;
    border:1.5px dashed #CBD5E1;background:white;
    font-size:13px;font-weight:700;color:#64748B;
    cursor:pointer;font-family:inherit;transition:all .2s;
    flex:1;min-width:120px;justify-content:center;
  }
  .add-trigger-btn:hover{border-color:#02AFCF;color:#053366;background:#F0FBFF;border-style:solid}
  .add-trigger-btn.active{border-color:#053366;background:#053366;color:white;border-style:solid}

  /* ── Excursion option ── */
  .exc-option{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;cursor:pointer;border:1.5px solid transparent;transition:all .18s;background:white}
  .exc-option:hover{background:#F8FAFF;border-color:#DCE5FF}
  .exc-option.selected{background:rgba(2,175,207,.08);border-color:#02AFCF}

  /* ── Buttons ── */
  .save-btn{display:flex;align-items:center;gap:7px;padding:10px 22px;background:linear-gradient(135deg,#02AFCF,#053366);color:white;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 14px rgba(2,175,207,.3)}
  .save-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(2,175,207,.4)}
  .save-btn:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none;box-shadow:none}
  .save-btn.ok{background:linear-gradient(135deg,#059669,#047857)}

  .action-btn{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;border:none;cursor:pointer;transition:all .15s;flex-shrink:0}
  .action-btn:hover{transform:scale(1.08)}

  /* ── Preview ── */
  .preview-hero{position:relative;height:360px;border-radius:16px;overflow:hidden;background:#0D1117}
  .preview-overlay1{position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.72) 0%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.06) 100%)}
  .preview-overlay2{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 55%)}

  /* ── Fields ── */
  .input-field{width:100%;padding:10px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:inherit;color:#111827;background:white;outline:none;transition:all .2s}
  .input-field:focus{border-color:#02AFCF;box-shadow:0 0 0 3px rgba(2,175,207,.08)}

  .color-dot{width:26px;height:26px;border-radius:50%;cursor:pointer;transition:all .18s;border:3px solid transparent;flex-shrink:0}
  .color-dot.selected{border-color:#111827;transform:scale(1.15)}

  .exc-search{width:100%;padding:9px 14px 9px 36px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:all .2s}
  .exc-search:focus{border-color:#02AFCF}

  /* ── Toggle ── */
  .toggle-btn{position:relative;width:44px;height:24px;border-radius:12px;border:none;cursor:pointer;transition:background .2s;flex-shrink:0}
  .toggle-knob{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:white;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}

  .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700}

  /* ══ Layout ══ */
  .layout-grid{display:grid;gap:24px}
  .layout-grid.with-preview{grid-template-columns:1fr 400px}
  .layout-grid.no-preview{grid-template-columns:1fr}

  /* ══ Preview sheet (mobile) ══ */
  .preview-sheet-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100}
  .preview-sheet{
    position:fixed;bottom:0;left:0;right:0;
    background:white;border-radius:24px 24px 0 0;
    max-height:90vh;overflow-y:auto;z-index:101;
    animation:slideUp .3s cubic-bezier(.32,1,.6,1);
    padding-bottom:env(safe-area-inset-bottom,16px)
  }
  .preview-sheet-handle{width:40px;height:4px;background:#E5E7EB;border-radius:2px;margin:12px auto 8px}

  /* ══ Responsive ≤ 900px ══ */
  @media (max-width:900px){
    .layout-grid.with-preview{grid-template-columns:1fr !important}
    .preview-col{display:none !important}
  }

  /* ══ Responsive ≤ 600px ══ */
  @media (max-width:600px){
    .topbar{padding:12px 14px !important}
    .topbar-title h1{font-size:17px !important}
    .topbar-title p{display:none !important}
    .topbar-actions .preview-toggle-label{display:none !important}
    .save-btn{padding:9px 14px !important;font-size:13px !important}
    .main-area{padding:14px 14px 80px !important}

    .add-trigger-btn{font-size:12px !important;padding:9px 12px !important;min-width:0}
    .add-trigger-btn span{display:none}

    .type-selector-tab{font-size:12px !important;padding:11px 6px !important}
    .type-selector-tab span{display:none}

    .slide-card-actions{gap:4px !important}
    .slide-card-actions .action-btn{width:28px !important;height:28px !important}
    .move-btns{display:none !important}

    .fields-grid-2{grid-template-columns:1fr !important}
    .color-dot{width:22px !important;height:22px !important}
    .input-field{font-size:16px !important}
    .exc-search{font-size:16px !important}
  }

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
  const [slides, setSlides] = useState<Slide[]>(
    initialSlides.map(s => ({ ...s, _excursion: excursions.find(e => e.id === s.excursion_id) }))
  );
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addMode,   setAddMode]   = useState<SlideType | null>(null);
  const [excSearch, setExcSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const [newExcId,    setNewExcId]    = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newImgUrl,   setNewImgUrl]   = useState("");
  const [newTitle,    setNewTitle]    = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newColor,    setNewColor]    = useState(COLORS[0]);

  const activeSlides = slides.filter(s => s.is_active);

  /* ── Save ── */
  const saveAll = async () => {
    setSaving(true); setSaveError(null);
    try {
      const { data: existing, error: fetchErr } = await sb.from("home_slider").select("id");
      if (fetchErr) throw new Error("Lecture échouée : " + fetchErr.message);
      if (existing?.length) {
        const ids = existing.map((r: { id: string }) => r.id);
        const { error: delErr } = await sb.from("home_slider").delete().in("id", ids);
        if (delErr) throw new Error("Suppression échouée : " + delErr.message);
      }
      if (slides.length > 0) {
        const toInsert = slides.map((s, i) => ({
          position: i, type: s.type,
          excursion_id: s.excursion_id || null, video_url: s.video_url || null,
          custom_image_url: s.custom_image_url || null, custom_title: s.custom_title || null,
          custom_subtitle: s.custom_subtitle || null, custom_color: s.custom_color || COLORS[0],
          is_active: s.is_active,
        }));
        const { error: insErr } = await sb.from("home_slider").insert(toInsert);
        if (insErr) throw new Error("Insertion échouée : " + insErr.message);
      }
      setSaveOk(true); setTimeout(() => setSaveOk(false), 2500);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally { setSaving(false); }
  };

  /* ── Add slide ── */
  const addSlide = () => {
    if (addMode === "excursion" && !newExcId) return;
    if (addMode === "video" && !newVideoUrl) return;
    if (addMode === "custom" && !newImgUrl) return;
    const exc = excursions.find(e => e.id === newExcId);
    const newSlide: Slide = {
      position: slides.length, type: addMode!,
      excursion_id: addMode === "excursion" ? newExcId : null,
      video_url: addMode === "video" ? newVideoUrl : null,
      custom_image_url: addMode === "custom" ? newImgUrl : null,
      custom_title: newTitle || exc?.title || null,
      custom_subtitle: newSubtitle || exc?.city || null,
      custom_color: newColor, is_active: true, _excursion: exc,
    };
    setSlides(p => [...p, newSlide]);
    setAddMode(null); setNewExcId(null); setNewVideoUrl(""); setNewImgUrl("");
    setNewTitle(""); setNewSubtitle(""); setNewColor(COLORS[0]); setExcSearch("");
  };

  const removeSlide  = (idx: number) => setSlides(p => p.filter((_,i)=>i!==idx).map((s,i)=>({...s,position:i})));
  const toggleActive = (idx: number) => setSlides(p => p.map((s,i)=>i===idx?{...s,is_active:!s.is_active}:s));
  const move = (idx: number, dir: "up"|"down") => {
    const n = [...slides]; const t = dir==="up"?idx-1:idx+1;
    if (t<0||t>=n.length) return;
    [n[idx],n[t]]=[n[t],n[idx]];
    setSlides(n.map((s,i)=>({...s,position:i})));
  };

  const getSlideInfo = (s: Slide) => {
    if (s.type==="excursion"&&s._excursion) return { img:s._excursion.photos?.[0]||FALLBACK, title:s.custom_title||s._excursion.title, sub:s.custom_subtitle||s._excursion.city, color:s.custom_color||COLORS[0], tag:s._excursion.categories?.[0]||"Excursion" };
    if (s.type==="video") return { img:FALLBACK, title:s.custom_title||"Vidéo", sub:s.custom_subtitle||"", color:s.custom_color||COLORS[0], tag:"Vidéo" };
    return { img:s.custom_image_url||FALLBACK, title:s.custom_title||"Slide", sub:s.custom_subtitle||"", color:s.custom_color||COLORS[0], tag:"Personnalisé" };
  };

  const filteredExc = excursions.filter(e => {
    const q = excSearch.toLowerCase();
    return !q || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q);
  });

  const canAdd = addMode==="excursion"?!!newExcId : addMode==="video"?!!newVideoUrl : addMode==="custom"?!!newImgUrl : false;

  const previewSlide = activeSlides[previewIdx % Math.max(activeSlides.length,1)];
  const previewInfo  = previewSlide ? getSlideInfo(previewSlide) : null;

  /* ── Preview panel ── */
  const PreviewPanel = () => (
    <div style={{ background:"white", borderRadius:20, border:"1px solid #E5E7EB", padding:16, boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <p style={{ fontSize:13, fontWeight:800, color:"#053366" }}>Aperçu Hero</p>
        <div style={{ display:"flex", gap:6 }}>
          {activeSlides.map((_,i) => (
            <button key={i} onClick={()=>setPreviewIdx(i)}
              style={{ width:i===previewIdx?28:8, height:6, borderRadius:3, background:i===previewIdx?"#02AFCF":"#E5E7EB", border:"none", cursor:"pointer", transition:"all .2s" }}/>
          ))}
        </div>
      </div>
      {activeSlides.length===0 ? (
        <div style={{ height:260, borderRadius:14, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10, color:"#9CA3AF" }}>
          <EyeOff size={28}/><p style={{ fontSize:13 }}>Aucune slide active</p>
        </div>
      ) : previewInfo && (
        <div className="preview-hero">
          {previewSlide?.type==="video" ? (
            <div style={{ position:"absolute", inset:0, background:"#111827", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Play size={28} color="white" fill="white"/>
              </div>
            </div>
          ) : (
            <img src={previewInfo.img} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK}}/>
          )}
          <div className="preview-overlay1"/><div className="preview-overlay2"/>
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
          <div style={{ position:"absolute", bottom:12, left:24, display:"flex", gap:6 }}>
            {activeSlides.map((_,i) => (
              <div key={i} style={{ width:i===previewIdx?22:5, height:5, borderRadius:3, background:i===previewIdx?previewInfo.color:"rgba(255,255,255,.35)", transition:"all .2s" }}/>
            ))}
          </div>
        </div>
      )}
      <p style={{ fontSize:11, color:"#9CA3AF", marginTop:10, textAlign:"center" }}>
        Aperçu simplifié · {activeSlides.length} slide{activeSlides.length>1?"s":""} active{activeSlides.length>1?"s":""}
      </p>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:"#F8FAFF", minHeight:"100vh" }}>
      <style>{CSS}</style>

      {/* ── Topbar ── */}
      <div className="topbar" style={{ background:"white", borderBottom:"1px solid #E5E7EB", padding:"18px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:50, gap:10 }}>
        <div className="topbar-title">
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#053366", margin:0 }}>
            Gestion du Slider
          </h1>
          <p style={{ fontSize:12, color:"#9CA3AF", margin:0 }}>
            {slides.length} slide{slides.length>1?"s":""} · {activeSlides.length} active{activeSlides.length>1?"s":""}
          </p>
        </div>
        <div className="topbar-actions" style={{ display:"flex", gap:8, alignItems:"center" }}>
          {saveError && (
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, fontSize:12, color:"#DC2626", fontWeight:600, maxWidth:200, overflow:"hidden" }}>
              <AlertCircle size={13} style={{ flexShrink:0 }}/>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{saveError}</span>
            </div>
          )}
          <button
            onClick={() => setShowPreview(p => !p)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", background:"#F3F4F6", border:"1px solid #E5E7EB", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", color:"#374151", fontFamily:"inherit" }}>
            <Monitor size={14}/>
            <span className="preview-toggle-label">{showPreview?"Masquer":"Aperçu"}</span>
          </button>
          <button className={`save-btn ${saveOk?"ok":""}`} onClick={saveAll} disabled={saving||saveOk}>
            {saving  ? <><Loader2 size={14} style={{ animation:"spin .7s linear infinite" }}/> Enreg…</>
            : saveOk ? <><Check size={14}/> Enregistré !</>
            :           <><Save size={14}/> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* ── Layout ── */}
      <div
        className={`main-area layout-grid ${showPreview?"with-preview":"no-preview"}`}
        style={{ maxWidth:1100, margin:"0 auto", padding:"28px 32px 80px" }}
      >
        {/* ══ LEFT ══ */}
        <div>

          {/* ① ADD TRIGGER BUTTONS — always visible at top */}
          <div className="add-trigger-bar">
            <button
              className={`add-trigger-btn ${addMode==="excursion"?"active":""}`}
              onClick={() => setAddMode(addMode==="excursion"?null:"excursion")}
            >
              <Star size={15}/>
              <span>Excursion</span>
            </button>
            <button
              className={`add-trigger-btn ${addMode==="video"?"active":""}`}
              onClick={() => setAddMode(addMode==="video"?null:"video")}
            >
              <Video size={15}/>
              <span>Vidéo</span>
            </button>
            <button
              className={`add-trigger-btn ${addMode==="custom"?"active":""}`}
              onClick={() => setAddMode(addMode==="custom"?null:"custom")}
            >
              <Image size={15}/>
              <span>Image</span>
            </button>
          </div>

          {/* ② ADD FORM — expanded inline below triggers */}
          {addMode && (
            <div className="add-form-container">
              {/* Tab switcher inside form */}
              <div className="type-selector-bar">
                {(["excursion","video","custom"] as SlideType[]).map(t => (
                  <button
                    key={t}
                    className={`type-selector-tab ${addMode===t?"active":""}`}
                    onClick={() => setAddMode(t)}
                  >
                    {t==="excursion" ? <><Star size={14}/><span>Excursion</span></>
                    : t==="video"    ? <><Video size={14}/><span>Vidéo</span></>
                    :                  <><Image size={14}/><span>Image</span></>}
                  </button>
                ))}
                {/* Close */}
                <button
                  onClick={() => setAddMode(null)}
                  style={{ padding:"0 14px", border:"none", background:"transparent", cursor:"pointer", color:"#9CA3AF", display:"flex", alignItems:"center" }}
                >
                  <X size={16}/>
                </button>
              </div>

              <div style={{ padding:18 }}>
                {/* Excursion picker */}
                {addMode==="excursion" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ position:"relative" }}>
                      <Star size={13} color="#9CA3AF" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                      <input className="exc-search" value={excSearch} onChange={e=>setExcSearch(e.target.value)} placeholder="Rechercher une excursion…"/>
                    </div>
                    <div style={{ maxHeight:240, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
                      {filteredExc.length===0 ? (
                        <p style={{ textAlign:"center", padding:20, fontSize:13, color:"#9CA3AF" }}>Aucun résultat</p>
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
                              {exc.rating>0 && <><span>·</span><Star size={9} fill="#F59E0B" color="#F59E0B" strokeWidth={0}/>{exc.rating}</>}
                            </p>
                          </div>
                          {newExcId===exc.id && <Check size={16} color="#02AFCF"/>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {addMode==="video" && (
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>URL de la vidéo</p>
                    <input className="input-field" value={newVideoUrl} onChange={e=>setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/… ou /videos/hero.mp4"/>
                  </div>
                )}

                {/* Custom image */}
                {addMode==="custom" && (
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>URL de l'image</p>
                    <input className="input-field" value={newImgUrl} onChange={e=>setNewImgUrl(e.target.value)} placeholder="https://images.unsplash.com/…"/>
                    {newImgUrl && (
                      <div style={{ marginTop:8, height:80, borderRadius:10, overflow:"hidden", border:"1px solid #EEF2FF" }}>
                        <img src={newImgUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                      </div>
                    )}
                  </div>
                )}

                {/* Common fields */}
                <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:10 }}>
                  <div className="fields-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Titre</p>
                      <input className="input-field" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Titre de la slide"/>
                    </div>
                    <div>
                      <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Sous-titre</p>
                      <input className="input-field" value={newSubtitle} onChange={e=>setNewSubtitle(e.target.value)} placeholder="Ville ou description"/>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>Couleur d'accent</p>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {COLORS.map(c => (
                        <div key={c} className={`color-dot ${newColor===c?"selected":""}`} style={{ background:c }} onClick={()=>setNewColor(c)}/>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={addSlide}
                  disabled={!canAdd}
                  style={{
                    marginTop:16, display:"flex", alignItems:"center", gap:7,
                    padding:"11px 22px", background:"linear-gradient(135deg,#02AFCF,#053366)",
                    color:"white", border:"none", borderRadius:12, fontSize:13, fontWeight:700,
                    cursor:canAdd?"pointer":"not-allowed", fontFamily:"inherit",
                    opacity:canAdd?1:.45, transition:"opacity .2s",
                  }}
                >
                  <Plus size={14}/> Ajouter au slider
                </button>
              </div>
            </div>
          )}

          {/* ③ SLIDE LIST */}
          {slides.length===0 ? (
            <div style={{ textAlign:"center", padding:"64px 20px", background:"white", borderRadius:20, border:"1.5px dashed #DCE5FF" }}>
              <Image size={44} color="#DCE5FF" style={{ marginBottom:14 }}/>
              <p style={{ fontSize:15, fontWeight:700, color:"#374151", marginBottom:6 }}>Aucune slide configurée</p>
              <p style={{ fontSize:13, color:"#9CA3AF" }}>Utilisez les boutons ci-dessus pour ajouter des slides</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {slides.map((slide, idx) => {
                const info = getSlideInfo(slide);
                const isExpanded = expandedId===`${idx}`;
                return (
                  <div key={idx} className={`slide-card ${!slide.is_active?"inactive":""}`} style={{ animationDelay:`${idx*.04}s` }}>
                    {/* Card header */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
                      <GripVertical size={16} color="#D1D5DB" style={{ flexShrink:0, cursor:"grab" }}/>

                      {/* Thumbnail */}
                      <div style={{ width:60, height:46, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#F3F4F6", position:"relative" }}>
                        {slide.type==="video" ? (
                          <div style={{ width:"100%", height:"100%", background:"#111827", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Play size={18} color="white" fill="white"/>
                          </div>
                        ) : (
                          <img src={info.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.target as HTMLImageElement).src=FALLBACK}}/>
                        )}
                        <div style={{ position:"absolute", bottom:2, right:2, background:"rgba(0,0,0,.6)", color:"white", fontSize:9, fontWeight:800, borderRadius:4, padding:"1px 5px" }}>
                          #{idx+1}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
                          <p style={{ fontSize:13, fontWeight:700, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", margin:0, maxWidth:180 }}>
                            {info.title}
                          </p>
                          <span className="badge" style={{
                            background:slide.type==="excursion"?"rgba(2,175,207,.1)":slide.type==="video"?"rgba(139,92,246,.1)":"rgba(5,150,105,.1)",
                            color:slide.type==="excursion"?"#02AFCF":slide.type==="video"?"#7C3AED":"#059669",
                          }}>
                            {slide.type==="excursion"?<><Star size={9}/> Excursion</>:slide.type==="video"?<><Video size={9}/> Vidéo</>:<><Image size={9}/> Custom</>}
                          </span>
                        </div>
                        <p style={{ fontSize:11, color:"#9CA3AF", margin:0, display:"flex", alignItems:"center", gap:3 }}>
                          <MapPin size={9}/>{info.sub}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="slide-card-actions" style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                        <button className="toggle-btn" onClick={()=>toggleActive(idx)}
                          style={{ background:slide.is_active?"#02AFCF":"#E5E7EB" }}>
                          <div className="toggle-knob" style={{ left:slide.is_active?"23px":"3px" }}/>
                        </button>
                        <div className="move-btns" style={{ display:"flex", gap:4 }}>
                          <button className="action-btn" onClick={()=>move(idx,"up")} disabled={idx===0}
                            style={{ background:"#F3F4F6", color:idx===0?"#D1D5DB":"#374151" }}><ArrowUp size={13}/></button>
                          <button className="action-btn" onClick={()=>move(idx,"down")} disabled={idx===slides.length-1}
                            style={{ background:"#F3F4F6", color:idx===slides.length-1?"#D1D5DB":"#374151" }}><ArrowDown size={13}/></button>
                        </div>
                        <button className="action-btn"
                          onClick={()=>setExpandedId(isExpanded?null:`${idx}`)}
                          style={{ background:"#EEF2FF", color:"#053366" }}>
                          {isExpanded?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
                        </button>
                        <button className="action-btn" onClick={()=>removeSlide(idx)}
                          style={{ background:"#FEF2F2", color:"#DC2626" }}><Trash2 size={13}/></button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ padding:"14px 16px", borderTop:"1px solid #F3F4F6", background:"#FAFBFF", display:"flex", flexDirection:"column", gap:12 }}>
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:8 }}>Couleur d'accent</p>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {COLORS.map(c => (
                              <div key={c} className={`color-dot ${slide.custom_color===c?"selected":""}`}
                                style={{ background:c }}
                                onClick={()=>setSlides(p=>p.map((s,i)=>i===idx?{...s,custom_color:c}:s))}/>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Titre affiché</p>
                          <input className="input-field" value={slide.custom_title||""} placeholder="Titre de la slide…"
                            onChange={e=>setSlides(p=>p.map((s,i)=>i===idx?{...s,custom_title:e.target.value}:s))}/>
                        </div>
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Sous-titre / ville</p>
                          <input className="input-field" value={slide.custom_subtitle||""} placeholder="Ville ou description courte…"
                            onChange={e=>setSlides(p=>p.map((s,i)=>i===idx?{...s,custom_subtitle:e.target.value}:s))}/>
                        </div>
                        {slide.type==="video" && (
                          <div>
                            <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>URL de la vidéo</p>
                            <input className="input-field" value={slide.video_url||""} placeholder="https://…"
                              onChange={e=>setSlides(p=>p.map((s,i)=>i===idx?{...s,video_url:e.target.value}:s))}/>
                          </div>
                        )}
                        {slide.type==="custom" && (
                          <div>
                            <p style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>URL de l'image</p>
                            <input className="input-field" value={slide.custom_image_url||""} placeholder="https://…"
                              onChange={e=>setSlides(p=>p.map((s,i)=>i===idx?{...s,custom_image_url:e.target.value}:s))}/>
                          </div>
                        )}
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                          <button onClick={()=>move(idx,"up")} disabled={idx===0}
                            style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", background:"#F3F4F6", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:idx===0?"#D1D5DB":"#374151" }}>
                            <ArrowUp size={12}/> Monter
                          </button>
                          <button onClick={()=>move(idx,"down")} disabled={idx===slides.length-1}
                            style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", background:"#F3F4F6", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:idx===slides.length-1?"#D1D5DB":"#374151" }}>
                            <ArrowDown size={12}/> Descendre
                          </button>
                          <button onClick={()=>{ setPreviewIdx(activeSlides.findIndex((_,i)=>i===idx)); setShowPreview(true); }}
                            style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", background:"#EEF2FF", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", color:"#053366" }}>
                            <Eye size={12}/> Aperçu
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══ RIGHT — Desktop preview sidebar ══ */}
        {showPreview && (
          <div className="preview-col" style={{ position:"sticky", top:80 }}>
            <PreviewPanel/>
          </div>
        )}
      </div>

      {/* ══ MOBILE preview sheet ══ */}
      {showPreview && (
        <>
          <style>{`
            @media (min-width:901px){
              .mobile-preview-backdrop,.mobile-preview-sheet{display:none !important}
            }
          `}</style>
          <div className="mobile-preview-backdrop preview-sheet-backdrop" onClick={()=>setShowPreview(false)}/>
          <div className="mobile-preview-sheet preview-sheet">
            <div className="preview-sheet-handle"/>
            <div style={{ padding:"0 16px 24px" }}>
              <PreviewPanel/>
            </div>
          </div>
        </>
      )}
    </div>
  );
}