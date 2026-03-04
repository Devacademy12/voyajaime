"use client";

import { useState } from "react";

interface Ville {
  id: string; nom: string; emoji: string;
  region: string; description: string; active: boolean; created_at: string;
}
interface Categorie {
  id: string; nom: string; emoji: string; couleur: string; created_at: string;
}

const COULEURS_PRESET = [
  "#2B96A8","#E25B45","#F59E0B","#10B981","#8B5CF6",
  "#EC4899","#0EA5E9","#F97316","#6366F1","#14B8A6",
];
const EMOJI_VILLES = ["🏙️","🏖️","🌴","🏜️","🕌","⛰️","🌊","🌿","🏛️","🐪"];
const EMOJI_CATS   = ["🏔️","🌊","🏜️","🕌","🌿","🦁","🏊","🎭","🍽️","🚗","⛵","🎒","🌅","🏕️","🦅"];

const DEFAULT_VILLE: Partial<Ville> = { nom:"", emoji:"🏙️", region:"Tunisie", description:"", active:true };
const DEFAULT_CAT: Partial<Categorie> = { nom:"", emoji:"🏔️", couleur:"#2B96A8" };

export default function CatalogueClient({
  villes: initV, categories: initC
}: { villes: Ville[]; categories: Categorie[] }) {
  const [tab, setTab] = useState<"villes"|"categories">("villes");

  // ── VILLES state ──
  const [villes, setVilles] = useState(initV);
  const [villeModal, setVilleModal] = useState<Partial<Ville> | null>(null);
  const [villeLoading, setVilleLoading] = useState<string|null>(null);

  // ── CATÉGORIES state ──
  const [categories, setCategories] = useState(initC);
  const [catModal, setCatModal] = useState<Partial<Categorie> | null>(null);
  const [catLoading, setCatLoading] = useState<string|null>(null);

  const [toast, setToast] = useState<{ msg:string; ok:boolean }|null>(null);
  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  // ────────────────────── VILLES CRUD ──────────────────────
  const callVille = async (body: object) => {
    const r = await fetch("/api/admin/villes", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    if (!r.ok) throw new Error((await r.json()).error);
    return r.json();
  };

  const saveVille = async () => {
    if (!villeModal?.nom?.trim()) { showToast("❌ Le nom est requis", false); return; }
    setVilleLoading("save");
    try {
      if (villeModal.id) {
        const updated = await callVille({ action:"update", id:villeModal.id, nom:villeModal.nom, emoji:villeModal.emoji, region:villeModal.region, description:villeModal.description, active:villeModal.active });
        setVilles(p => p.map(v => v.id===villeModal.id ? updated : v));
        showToast("✅ Ville mise à jour");
      } else {
        const created = await callVille({ action:"create", nom:villeModal.nom, emoji:villeModal.emoji, region:villeModal.region, description:villeModal.description, active:villeModal.active });
        setVilles(p => [...p, created].sort((a,b)=>a.nom.localeCompare(b.nom)));
        showToast("✅ Ville ajoutée");
      }
      setVilleModal(null);
    } catch(e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setVilleLoading(null);
  };

  const deleteVille = async (id:string, nom:string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    setVilleLoading(id);
    try {
      await callVille({ action:"delete", id });
      setVilles(p => p.filter(v=>v.id!==id));
      showToast("🗑️ Ville supprimée");
    } catch(e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setVilleLoading(null);
  };

  const toggleVille = async (v:Ville) => {
    setVilleLoading(v.id);
    try {
      const updated = await callVille({ action:"toggle", id:v.id, active:!v.active });
      setVilles(p => p.map(x => x.id===v.id ? updated : x));
    } catch(e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setVilleLoading(null);
  };

  // ────────────────────── CATÉGORIES CRUD ──────────────────────
  const callCat = async (body: object) => {
    const r = await fetch("/api/admin/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    if (!r.ok) throw new Error((await r.json()).error);
    return r.json();
  };

  const saveCat = async () => {
    if (!catModal?.nom?.trim()) { showToast("❌ Le nom est requis", false); return; }
    setCatLoading("save");
    try {
      if (catModal.id) {
        const updated = await callCat({ action:"update", id:catModal.id, nom:catModal.nom, emoji:catModal.emoji, couleur:catModal.couleur });
        setCategories(p => p.map(c => c.id===catModal.id ? updated : c));
        showToast("✅ Catégorie mise à jour");
      } else {
        const created = await callCat({ action:"create", nom:catModal.nom, emoji:catModal.emoji, couleur:catModal.couleur });
        setCategories(p => [...p, created].sort((a,b)=>a.nom.localeCompare(b.nom)));
        showToast("✅ Catégorie ajoutée");
      }
      setCatModal(null);
    } catch(e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setCatLoading(null);
  };

  const deleteCat = async (id:string, nom:string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return;
    setCatLoading(id);
    try {
      await callCat({ action:"delete", id });
      setCategories(p => p.filter(c=>c.id!==id));
      showToast("🗑️ Catégorie supprimée");
    } catch(e) { showToast(`❌ ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setCatLoading(null);
  };

  return (
    <>
      <style>{`
        .ctab{padding:9px 20px;border-radius:20px;border:1px solid #E5E7EB;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s}
        .ctab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .ctab:not(.on){background:white;color:#6B7280}
        .ctab:not(.on):hover{background:#F9FAFB}
        .ccard{background:white;border-radius:14px;border:1px solid #F0F0F0;padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all .2s}
        .ccard:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);border-color:#E5E7EB}
        .cbtn{padding:7px 13px;border-radius:9px;border:1px solid #E5E7EB;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s;background:white;white-space:nowrap}
        .cbtn:disabled{opacity:.5;cursor:not-allowed}
        .fi{width:100%;padding:10px 13px;border:1.5px solid #E5E7EB;border-radius:11px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s;background:#FAFAFA;color:#111827}
        .fi:focus{border-color:#2B96A8;background:white}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px}
        .modal{background:white;border-radius:22px;width:100%;max-width:480px;box-shadow:0 24px 72px rgba(0,0,0,.18)}
        .toast-c{position:fixed;top:22px;right:22px;z-index:9999;padding:12px 18px;border-radius:13px;font-size:14px;font-weight:600;font-family:inherit;box-shadow:0 8px 28px rgba(0,0,0,.12);animation:tin .3s ease}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .emoji-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
        .emoji-opt{width:36px;height:36px;border-radius:8px;border:1.5px solid #E5E7EB;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:all .2s;background:white}
        .emoji-opt.on{border-color:#2B96A8;background:rgba(43,150,168,.08)}
        .color-swatch{width:28px;height:28px;border-radius:8px;cursor:pointer;transition:all .2s;border:2.5px solid transparent}
        .color-swatch.on{border-color:#111827;transform:scale(1.15)}
      `}</style>

      {toast && (
        <div className="toast-c" style={{background:toast.ok?"#F0FDF4":"#FEF2F2",color:toast.ok?"#15803D":"#DC2626",border:`1px solid ${toast.ok?"#BBF7D0":"#FECACA"}`}}>
          {toast.msg}
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:8,marginBottom:24}}>
        <button className={`ctab ${tab==="villes"?"on":""}`} onClick={()=>setTab("villes")}>
          🏙️ Villes ({villes.length})
        </button>
        <button className={`ctab ${tab==="categories"?"on":""}`} onClick={()=>setTab("categories")}>
          🏷️ Catégories ({categories.length})
        </button>
      </div>

      {/* ── VILLES ── */}
      {tab === "villes" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <p style={{fontSize:13,color:"#6B7280"}}>{villes.filter(v=>v.active).length} actives · {villes.filter(v=>!v.active).length} inactives</p>
            <button className="cbtn" onClick={()=>setVilleModal({...DEFAULT_VILLE})}
              style={{background:"#2B96A8",color:"white",borderColor:"#2B96A8",padding:"9px 18px",fontSize:13}}>
              + Ajouter une ville
            </button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:10}}>
            {villes.map(v => (
              <div key={v.id} className="ccard" style={{borderLeft:`3px solid ${v.active?"#2B96A8":"#E5E7EB"}`}}>
                {/* Emoji */}
                <div style={{width:44,height:44,borderRadius:12,background:v.active?"rgba(43,150,168,.1)":"#F3F4F6",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  {v.emoji}
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:800,color:"#111827"}}>{v.nom}</span>
                    <span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10,background:v.active?"#F0FDF4":"#F9FAFB",color:v.active?"#15803D":"#9CA3AF"}}>
                      {v.active?"Actif":"Inactif"}
                    </span>
                  </div>
                  <p style={{fontSize:12,color:"#9CA3AF"}}>{v.region}{v.description ? ` · ${v.description.slice(0,40)}${v.description.length>40?"…":""}` : ""}</p>
                </div>
                {/* Actions */}
                <div style={{display:"flex",gap:6,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <button className="cbtn" disabled={villeLoading===v.id} onClick={()=>toggleVille(v)}
                    style={{color:v.active?"#6B7280":"#15803D",background:v.active?"white":"#F0FDF4",borderColor:v.active?"#E5E7EB":"#BBF7D0"}}>
                    {villeLoading===v.id?"...":(v.active?"⏸":"▶")}
                  </button>
                  <button className="cbtn" disabled={villeLoading===v.id}
                    onClick={()=>setVilleModal({...v})}
                    style={{color:"#2B96A8",borderColor:"rgba(43,150,168,.3)",background:"rgba(43,150,168,.05)"}}>
                    ✏️
                  </button>
                  <button className="cbtn" disabled={villeLoading===v.id}
                    onClick={()=>deleteVille(v.id,v.nom)}
                    style={{color:"#DC2626",borderColor:"#FECACA",background:"#FEF2F2"}}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {villes.length === 0 && (
            <div style={{textAlign:"center",padding:"48px",background:"white",borderRadius:16,border:"1px solid #F3F4F6"}}>
              <p style={{fontSize:36,marginBottom:12}}>🏙️</p>
              <p style={{fontWeight:700,color:"#374151"}}>Aucune ville</p>
              <p style={{fontSize:13,color:"#9CA3AF",marginTop:4}}>Ajoutez votre première ville</p>
            </div>
          )}
        </div>
      )}

      {/* ── CATÉGORIES ── */}
      {tab === "categories" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <p style={{fontSize:13,color:"#6B7280"}}>{categories.length} catégorie{categories.length!==1?"s":""}</p>
            <button className="cbtn" onClick={()=>setCatModal({...DEFAULT_CAT})}
              style={{background:"#2B96A8",color:"white",borderColor:"#2B96A8",padding:"9px 18px",fontSize:13}}>
              + Ajouter une catégorie
            </button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
            {categories.map(c => (
              <div key={c.id} className="ccard" style={{borderLeft:`3px solid ${c.couleur}`}}>
                {/* Badge couleur + emoji */}
                <div style={{width:44,height:44,borderRadius:12,background:`${c.couleur}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  {c.emoji}
                </div>
                {/* Info */}
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                    <span style={{fontSize:14,fontWeight:800,color:"#111827"}}>{c.nom}</span>
                    <span style={{width:12,height:12,borderRadius:"50%",background:c.couleur,display:"inline-block",flexShrink:0}}/>
                  </div>
                  <p style={{fontSize:11,color:"#9CA3AF",fontFamily:"monospace"}}>{c.couleur}</p>
                </div>
                {/* Actions */}
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button className="cbtn" disabled={catLoading===c.id}
                    onClick={()=>setCatModal({...c})}
                    style={{color:"#2B96A8",borderColor:"rgba(43,150,168,.3)",background:"rgba(43,150,168,.05)"}}>
                    ✏️
                  </button>
                  <button className="cbtn" disabled={catLoading===c.id}
                    onClick={()=>deleteCat(c.id,c.nom)}
                    style={{color:"#DC2626",borderColor:"#FECACA",background:"#FEF2F2"}}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div style={{textAlign:"center",padding:"48px",background:"white",borderRadius:16,border:"1px solid #F3F4F6"}}>
              <p style={{fontSize:36,marginBottom:12}}>🏷️</p>
              <p style={{fontWeight:700,color:"#374151"}}>Aucune catégorie</p>
              <p style={{fontSize:13,color:"#9CA3AF",marginTop:4}}>Ajoutez votre première catégorie</p>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL VILLE ── */}
      {villeModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setVilleModal(null)}}>
          <div className="modal">
            <div style={{padding:"22px 26px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontSize:18,fontWeight:800,color:"#111827"}}>{villeModal.id?"Modifier la ville":"Ajouter une ville"}</h2>
              <button onClick={()=>setVilleModal(null)} style={{background:"#F3F4F6",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{padding:"0 26px 26px",display:"flex",flexDirection:"column",gap:14}}>
              {/* Nom */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Nom de la ville *</label>
                <input className="fi" value={villeModal.nom||""} onChange={e=>setVilleModal(p=>({...p!,nom:e.target.value}))} placeholder="Ex: Tunis" />
              </div>
              {/* Région */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Région</label>
                <input className="fi" value={villeModal.region||""} onChange={e=>setVilleModal(p=>({...p!,region:e.target.value}))} placeholder="Ex: Grand Tunis" />
              </div>
              {/* Description */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Description</label>
                <textarea className="fi" rows={2} value={villeModal.description||""} onChange={e=>setVilleModal(p=>({...p!,description:e.target.value}))} placeholder="Courte description..." style={{resize:"vertical"}} />
              </div>
              {/* Emoji */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Emoji</label>
                <div className="emoji-grid">
                  {EMOJI_VILLES.map(em=>(
                    <button key={em} type="button" className={`emoji-opt ${villeModal.emoji===em?"on":""}`} onClick={()=>setVilleModal(p=>({...p!,emoji:em}))}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              {/* Active */}
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:"#F9FAFB",borderRadius:10,border:"1px solid #E5E7EB"}}>
                <input type="checkbox" checked={villeModal.active!==false} onChange={e=>setVilleModal(p=>({...p!,active:e.target.checked}))} style={{width:16,height:16,accentColor:"#2B96A8"}} />
                <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>Ville active (visible pour les prestataires)</span>
              </label>
              {/* Buttons */}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>setVilleModal(null)} style={{flex:1,padding:"11px",background:"#F3F4F6",color:"#374151",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  Annuler
                </button>
                <button onClick={saveVille} disabled={villeLoading==="save"}
                  style={{flex:2,padding:"11px",background:villeLoading?"#9CA3AF":"#2B96A8",color:"white",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
                  {villeLoading==="save"?"Sauvegarde...":(villeModal.id?"💾 Enregistrer":"➕ Ajouter")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CATÉGORIE ── */}
      {catModal && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)setCatModal(null)}}>
          <div className="modal">
            <div style={{padding:"22px 26px 0",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h2 style={{fontSize:18,fontWeight:800,color:"#111827"}}>{catModal.id?"Modifier la catégorie":"Ajouter une catégorie"}</h2>
              <button onClick={()=>setCatModal(null)} style={{background:"#F3F4F6",border:"none",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{padding:"0 26px 26px",display:"flex",flexDirection:"column",gap:14}}>
              {/* Nom */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Nom de la catégorie *</label>
                <input className="fi" value={catModal.nom||""} onChange={e=>setCatModal(p=>({...p!,nom:e.target.value}))} placeholder="Ex: Randonnée" />
              </div>
              {/* Emoji */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Emoji</label>
                <div className="emoji-grid">
                  {EMOJI_CATS.map(em=>(
                    <button key={em} type="button" className={`emoji-opt ${catModal.emoji===em?"on":""}`} onClick={()=>setCatModal(p=>({...p!,emoji:em}))}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              {/* Couleur */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Couleur</label>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  {COULEURS_PRESET.map(col=>(
                    <button key={col} type="button" className={`color-swatch ${catModal.couleur===col?"on":""}`}
                      style={{background:col}} onClick={()=>setCatModal(p=>({...p!,couleur:col}))} />
                  ))}
                  <input type="color" value={catModal.couleur||"#2B96A8"} onChange={e=>setCatModal(p=>({...p!,couleur:e.target.value}))}
                    style={{width:32,height:28,border:"1.5px solid #E5E7EB",borderRadius:8,cursor:"pointer",padding:2}} />
                </div>
                {/* Prévisualisation */}
                <div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:`${catModal.couleur}15`,border:`1px solid ${catModal.couleur}40`}}>
                  <span style={{fontSize:14}}>{catModal.emoji||"🏷️"}</span>
                  <span style={{fontSize:12,fontWeight:700,color:catModal.couleur}}>{catModal.nom||"Aperçu"}</span>
                </div>
              </div>
              {/* Buttons */}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>setCatModal(null)} style={{flex:1,padding:"11px",background:"#F3F4F6",color:"#374151",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  Annuler
                </button>
                <button onClick={saveCat} disabled={catLoading==="save"}
                  style={{flex:2,padding:"11px",background:catLoading?"#9CA3AF":"#2B96A8",color:"white",border:"none",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
                  {catLoading==="save"?"Sauvegarde...":(catModal.id?"💾 Enregistrer":"➕ Ajouter")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}