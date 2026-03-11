"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  ArrowLeft, FileText, ImageIcon, Settings2, Tag, Globe,
  CheckSquare, AlertTriangle, CheckCircle2, Loader2, X, Plus,
  Save, Rocket, Info, MapPin, Clock, Users, DollarSign,
} from "lucide-react";

interface Excursion {
  id: string; title: string; city: string; description: string;
  duration_hours: number; price_per_person: number; max_people: number;
  categories: string[]; languages: string[]; inclusions: string[];
  photos: string[]; is_active: boolean;
}
interface Ville     { id: string; nom: string; emoji: string; }
interface Categorie { id: string; nom: string; emoji: string; couleur: string; }
interface PhotoPreview { file?: File; url: string; uploading: boolean; uploaded?: string; existing?: boolean; }

const LANGUAGES  = ["Français","Anglais","Arabe","Allemand","Espagnol","Italien"];
const INCLUSIONS = ["Guide francophone","Transport","Repas","Eau minérale","Équipement","Photos","Billet d'entrée"];

function toggle(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12, paddingBottom:10, borderBottom:"1px solid #F3F4F6" }}>
      <div style={{ width:26, height:26, borderRadius:7, background:"rgba(43,150,168,.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon size={13} color="#2B96A8" />
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{label}</span>
    </div>
  );
}

function Chip({ label, selected, color = "#2B96A8", onClick }: { label: string; selected: boolean; color?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding:"5px 11px", borderRadius:20, cursor:"pointer", fontFamily:"inherit",
      fontSize:12, fontWeight: selected ? 600 : 400, transition:"all .15s",
      border:`1.5px solid ${selected ? color : "#E5E7EB"}`,
      background: selected ? `${color}15` : "white",
      color: selected ? color : "#6B7280",
    }}>{label}</button>
  );
}

export default function EditExcursionClient({
  exc, villes, categories: categoriesDB,
}: { exc: Excursion; villes: Ville[]; categories: Categorie[] }) {
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [title, setTitle]       = useState(exc.title);
  const [city, setCity]         = useState(exc.city);
  const [description, setDesc]  = useState(exc.description);
  const [duration, setDuration] = useState(exc.duration_hours);
  const [price, setPrice]       = useState(exc.price_per_person);
  const [maxPeople, setMax]     = useState(exc.max_people);
  const [cats, setCats]         = useState<string[]>(exc.categories || []);
  const [langs, setLangs]       = useState<string[]>(exc.languages || []);
  const [inclus, setInclus]     = useState<string[]>(exc.inclusions || []);
  const [photos, setPhotos]     = useState<PhotoPreview[]>(
    (exc.photos || []).filter(Boolean).map(url => ({ url, uploading: false, existing: true, uploaded: url }))
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 6 - photos.length).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      setPhotos(prev => [...prev, { file, url: URL.createObjectURL(file), uploading: false }]);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const n = [...prev];
      if (!n[idx].existing) URL.revokeObjectURL(n[idx].url);
      n.splice(idx, 1);
      return n;
    });
  };

  const uploadNewPhotos = async (userId: string): Promise<string[]> => {
    const result: string[] = [];
    const updated = [...photos];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].existing || updated[i].uploaded) { result.push(updated[i].uploaded || updated[i].url); continue; }
      if (!updated[i].file) continue;
      updated[i].uploading = true; setPhotos([...updated]);
      const ext  = updated[i].file!.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${i}.${ext}`;
      const { data, error: upErr } = await supabase.storage.from("excursions-photos").upload(path, updated[i].file!, { upsert: true });
      if (upErr) { console.error(upErr); continue; }
      const { data: { publicUrl } } = supabase.storage.from("excursions-photos").getPublicUrl(data.path);
      updated[i].uploading = false; updated[i].uploaded = publicUrl;
      setPhotos([...updated]); result.push(publicUrl);
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent, isActive: boolean) => {
    e.preventDefault();
    if (!title || !city || !description) { setError("Remplissez tous les champs obligatoires."); return; }
    setLoading(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée."); setLoading(false); return; }
    const photoUrls = await uploadNewPhotos(user.id);
    const { error: err } = await supabase.from("excursions").update({
      title, city, description,
      duration_hours: duration, price_per_person: price, max_people: maxPeople,
      categories: cats, languages: langs, inclusions: inclus,
      photos: photoUrls, is_active: isActive,
    }).eq("id", exc.id).eq("prestataire_id", user.id);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = `/prestataire/excursions/${exc.id}`; }, 1800);
  };

  if (success) return (
    <div style={{ maxWidth:520, margin:"0 auto", textAlign:"center", padding:"60px 20px" }}>
      <CheckCircle2 size={52} style={{ color:"#15803D", margin:"0 auto 16px" }} />
      <h2 style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:8 }}>Excursion mise à jour !</h2>
      <p style={{ color:"#6B7280" }}>Redirection…</p>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"9px 12px", border:"1.5px solid #E5E7EB", borderRadius:10,
    fontSize:13, fontFamily:"inherit", color:"#111827", outline:"none",
    transition:"border-color .2s, box-shadow .2s", background:"#FAFAFA", boxSizing:"border-box",
  };
  const labelStyle: React.CSSProperties = {
    display:"block", fontSize:11, fontWeight:700, color:"#6B7280",
    textTransform:"uppercase", letterSpacing:.5, marginBottom:5,
  };
  const cardStyle: React.CSSProperties = {
    background:"white", borderRadius:16, border:"1px solid #F3F4F6",
    padding:"16px", marginBottom:12, boxShadow:"0 1px 3px rgba(0,0,0,.04)",
  };

  return (
    <>
      <style>{`
        .exc-input:focus,.exc-select:focus{border-color:#2B96A8!important;background:white!important;box-shadow:0 0 0 3px rgba(43,150,168,.08)!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        .left-scroll::-webkit-scrollbar{width:3px}
        .left-scroll::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:3px}
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:16 }}>
        <Link href={`/prestataire/excursions/${exc.id}`}
          style={{ fontSize:12, color:"#9CA3AF", textDecoration:"none", fontWeight:500, display:"inline-flex", alignItems:"center", gap:4, marginBottom:6 }}>
          <ArrowLeft size={12} /> Retour
        </Link>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", lineHeight:1.2 }}>
              Modifier l&apos;excursion
            </h1>
            <p style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>{exc.title}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", background:"#F9FAFB", borderRadius:10, border:"1px solid #E5E7EB" }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background: exc.is_active ? "#10B981" : "#D1D5DB" }} />
            <span style={{ fontSize:12, fontWeight:600, color: exc.is_active ? "#065F46" : "#9CA3AF" }}>
              {exc.is_active ? "Publiée" : "Brouillon"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom:12, padding:"10px 14px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, fontSize:13, color:"#DC2626", display:"flex", alignItems:"center", gap:8 }}>
          <AlertTriangle size={14} style={{ flexShrink:0 }} /> {error}
        </div>
      )}

      {/* ── 2-column grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16, alignItems:"start" }}>

        {/* ══ LEFT — scrollable sections ══ */}
        <div className="left-scroll" style={{ overflowY:"auto", maxHeight:"calc(100vh - 190px)", paddingRight:2 }}>

          {/* Infos de base */}
          <div style={cardStyle}>
            <SectionTitle icon={FileText} label="Informations de base" />
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <label style={labelStyle}>Titre *</label>
                <input className="exc-input" style={inputStyle} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre de l'excursion" />
              </div>
              <div>
                <label style={labelStyle}>Ville *</label>
                <select className="exc-select" style={{ ...inputStyle, appearance:"none" }} value={city} onChange={e=>setCity(e.target.value)}>
                  <option value="">Sélectionnez une ville</option>
                  {villes.map(v => <option key={v.id} value={v.nom}>{v.emoji} {v.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Description *</label>
                <textarea className="exc-input" style={{ ...inputStyle, resize:"vertical", minHeight:80 }}
                  rows={3} value={description} onChange={e=>setDesc(e.target.value)} placeholder="Décrivez votre excursion…" />
              </div>
            </div>
          </div>

          {/* Détails pratiques */}
          <div style={cardStyle}>
            <SectionTitle icon={Settings2} label="Détails pratiques" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {[
                { label:"Durée (h)",      Icon:Clock,        val:duration, set:setDuration, min:.5, max:24, step:.5 },
                { label:"Prix (TND)",     Icon:DollarSign,   val:price,    set:setPrice,   min:1 },
                { label:"Max personnes",  Icon:Users,        val:maxPeople,set:setMax,     min:1, max:100 },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>
                    <f.Icon size={10} style={{ display:"inline", verticalAlign:"middle", marginRight:3 }} />
                    {f.label}
                  </label>
                  <input className="exc-input" type="number" style={inputStyle}
                    min={f.min} max={f.max} step={f.step} value={f.val}
                    onChange={e => f.set(Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div style={cardStyle}>
            <SectionTitle icon={Tag} label="Catégories" />
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {categoriesDB.map(c => (
                <Chip key={c.id} label={`${c.emoji} ${c.nom}`} selected={cats.includes(c.nom)} color={c.couleur} onClick={() => setCats(toggle(cats, c.nom))} />
              ))}
            </div>
          </div>

          {/* Langues */}
          <div style={cardStyle}>
            <SectionTitle icon={Globe} label="Langues" />
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {LANGUAGES.map(l => (
                <Chip key={l} label={l} selected={langs.includes(l)} color="#7C3AED" onClick={() => setLangs(toggle(langs, l))} />
              ))}
            </div>
          </div>

          {/* Inclusions */}
          <div style={{ ...cardStyle, marginBottom:0 }}>
            <SectionTitle icon={CheckSquare} label="Inclusions" />
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {INCLUSIONS.map(inc => (
                <Chip key={inc} label={inc} selected={inclus.includes(inc)} color="#059669" onClick={() => setInclus(toggle(inclus, inc))} />
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT — sticky sidebar ══ */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:0 }}>

          {/* Photos */}
          <div style={cardStyle}>
            <SectionTitle icon={ImageIcon} label={`Photos (${photos.length}/6)`} />
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              style={{ border:"2px dashed #E5E7EB", borderRadius:12, padding:"14px 10px", textAlign:"center", cursor:"pointer", background:"#FAFAFA", transition:"all .2s" }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor="#2B96A8"; el.style.background="rgba(43,150,168,.03)"; }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor="#E5E7EB"; el.style.background="#FAFAFA"; }}
            >
              <ImageIcon size={20} style={{ color:"#D1D5DB", margin:"0 auto 5px" }} />
              <p style={{ fontSize:12, fontWeight:600, color:"#374151", marginBottom:2 }}>Glissez ou cliquez</p>
              <p style={{ fontSize:11, color:"#9CA3AF" }}>JPG · PNG · max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)} />

            {photos.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginTop:10 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position:"relative", aspectRatio:"4/3", borderRadius:8, overflow:"hidden", background:"#F3F4F6" }}>
                    <img src={p.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                      onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />
                    {p.uploading && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,.75)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Loader2 size={14} style={{ animation:"spin .7s linear infinite", color:"#2B96A8" }} />
                      </div>
                    )}
                    {!p.uploading && (
                      <button type="button" onClick={() => removePhoto(i)}
                        style={{ position:"absolute", top:3, right:3, width:18, height:18, borderRadius:"50%", background:"rgba(0,0,0,.55)", color:"white", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <X size={9} />
                      </button>
                    )}
                    {i === 0 && (
                      <div style={{ position:"absolute", bottom:3, left:3, padding:"1px 5px", background:"#2B96A8", color:"white", borderRadius:4, fontSize:8, fontWeight:700 }}>
                        PRINCIPALE
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < 6 && (
                  <div onClick={() => fileRef.current?.click()}
                    style={{ aspectRatio:"4/3", borderRadius:8, border:"2px dashed #E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Plus size={16} style={{ color:"#D1D5DB" }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Résumé */}
          <div style={{ ...cardStyle, marginBottom:0 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
              {[
                { Icon:MapPin,      val: city || "—" },
                { Icon:Clock,       val: `${duration}h` },
                { Icon:Users,       val: `Max ${maxPeople} pers.` },
                { Icon:DollarSign,  val: `${price} TND / pers.` },
              ].map(({ Icon, val }) => (
                <span key={val} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#374151" }}>
                  <Icon size={12} color="#9CA3AF" style={{ flexShrink:0 }} /> {val}
                </span>
              ))}
            </div>

            {/* Commission recap */}
            <div style={{ padding:"10px 12px", background:"rgba(43,150,168,.05)", borderRadius:10, border:"1px solid rgba(43,150,168,.12)", fontSize:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:7, color:"#2B96A8", fontWeight:700, fontSize:11 }}>
                <Info size={11} /> Revenus estimés
              </div>
              {[
                { label:"Prix affiché",   value:`${price} TND`,              color:"#111827" },
                { label:"Commission 10%", value:`− ${Math.round(price*.1)} TND`, color:"#EF4444" },
                { label:"Vous recevez",   value:`${Math.round(price*.9)} TND`, color:"#059669" },
              ].map(row => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:"#6B7280" }}>{row.label}</span>
                  <span style={{ fontWeight:700, color:row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boutons action */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <button type="button" disabled={loading}
              onClick={e => handleSubmit(e as unknown as React.FormEvent, false)}
              style={{ width:"100%", padding:"10px", background:"white", border:"1.5px solid #E5E7EB", color:"#374151", borderRadius:12, fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all .2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#D1D5DB"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E5E7EB"}}
            >
              {loading ? <Loader2 size={14} style={{ animation:"spin .7s linear infinite" }} /> : <Save size={14} />}
              Brouillon
            </button>
            <button type="button" disabled={loading}
              onClick={e => handleSubmit(e as unknown as React.FormEvent, true)}
              style={{ width:"100%", padding:"11px", background:loading?"#9CA3AF":"#111827", color:"white", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7, transition:"all .2s", boxShadow:"0 2px 8px rgba(0,0,0,.15)" }}
              onMouseEnter={e=>{if(!loading)(e.currentTarget as HTMLElement).style.background="#1f2937"}}
              onMouseLeave={e=>{if(!loading)(e.currentTarget as HTMLElement).style.background="#111827"}}
            >
              {loading ? <Loader2 size={14} style={{ animation:"spin .7s linear infinite" }} /> : <Rocket size={14} />}
              {loading ? "Mise à jour…" : "Enregistrer et publier"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}