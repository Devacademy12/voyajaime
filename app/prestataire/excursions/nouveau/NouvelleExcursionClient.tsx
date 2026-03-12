"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import {
  ArrowLeft, FileText, ImageIcon, Settings2, Tag,
  AlertTriangle, CheckCircle2, Loader2, X, Plus,
  Save, Rocket, Info, Clock, Users, Banknote,
  Languages, Package,
} from "lucide-react";

const LANGUAGES  = ["Français","Anglais","Arabe","Allemand","Espagnol","Italien"];
const INCLUSIONS = ["Guide francophone","Transport","Repas","Eau minérale","Équipement","Photos","Billet d'entrée"];

function toggle(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

interface PhotoPreview { file: File; url: string; uploading: boolean; uploaded?: string; }
interface Ville      { id: string; nom: string; active: boolean; }
interface Categorie  { id: string; nom: string; couleur: string; }

export default function NouvelleExcursionClient({
  villes, categories: categoriesDB,
}: { villes: Ville[]; categories: Categorie[] }) {
  const supabase     = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [publish, setPublish] = useState(false);

  const [title, setTitle]           = useState("");
  const [city, setCity]             = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration]     = useState(2);
  const [price, setPrice]           = useState(50);
  const [maxPeople, setMaxPeople]   = useState(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [languages, setLanguages]   = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [photos, setPhotos]         = useState<PhotoPreview[]>([]);

  const chip = (selected: boolean, color = "#2B96A8") => ({
    padding: "6px 13px", borderRadius: 20,
    border: `1.5px solid ${selected ? color : "#E5E7EB"}`,
    background: selected ? `${color}14` : "white",
    color: selected ? color : "#6B7280",
    fontSize: 12, fontWeight: selected ? 700 : 400,
    cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
  } as React.CSSProperties);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newPhotos: PhotoPreview[] = [];
    Array.from(files).slice(0, 6 - photos.length).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      newPhotos.push({ file, url: URL.createObjectURL(file), uploading: false });
    });
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => { const n = [...prev]; URL.revokeObjectURL(n[idx].url); n.splice(idx, 1); return n; });
  };

  const uploadPhotos = async (userId: string): Promise<string[]> => {
    const urls: string[] = [];
    const updated = [...photos];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].uploaded) { urls.push(updated[i].uploaded!); continue; }
      updated[i].uploading = true; setPhotos([...updated]);
      const ext  = updated[i].file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${i}.${ext}`;
      const { data, error } = await supabase.storage.from("excursions-photos").upload(path, updated[i].file, { upsert: true });
      if (error) { console.error("Upload error:", error.message); continue; }
      const { data: { publicUrl } } = supabase.storage.from("excursions-photos").getPublicUrl(data.path);
      updated[i].uploading = false; updated[i].uploaded = publicUrl; urls.push(publicUrl);
    }
    setPhotos([...updated]);
    return urls;
  };

  const handleSubmit = async (pub: boolean) => {
    if (!title || !city || !description) { setError("Remplissez tous les champs obligatoires."); return; }
    setLoading(true); setPublish(pub); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée."); setLoading(false); return; }
    const photoUrls = photos.length > 0 ? await uploadPhotos(user.id) : [];
    const { error: err } = await supabase.from("excursions").insert({
      prestataire_id: user.id, title, city, description,
      duration_hours: duration, price_per_person: price,
      max_people: maxPeople, categories, languages, inclusions,
      photos: photoUrls, is_active: pub,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = "/prestataire/excursions"; }, 2000);
  };

  if (success) return (
    <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
      <CheckCircle2 size={52} color="#15803D" style={{ margin: "0 auto 16px" }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
        Excursion {publish ? "publiée" : "sauvegardée"} !
      </h2>
      <p style={{ color: "#6B7280" }}>Redirection vers vos excursions...</p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .nfi input,.nfi select,.nfi textarea{width:100%;padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;font-family:inherit;color:#111827;outline:none;transition:border-color .2s;background:#FAFAFA;box-sizing:border-box}
        .nfi input:focus,.nfi select:focus,.nfi textarea:focus{border-color:#2B96A8;background:white}
        .nfi label{display:block;font-size:11px;font-weight:700;color:#374151;letter-spacing:.4px;text-transform:uppercase;margin-bottom:5px}
        .ncard{background:white;border-radius:16px;border:1px solid #F0F0F0;padding:16px 18px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
        .ncard h3{font-size:12px;font-weight:700;color:#374151;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #F3F4F6;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.4px}
        .drop-z{border:2px dashed #D1D5DB;border-radius:12px;padding:18px;text-align:center;cursor:pointer;transition:all .2s;background:#FAFAFA}
        .drop-z:hover{border-color:#2B96A8;background:rgba(43,150,168,.04)}
      `}</style>

      <div style={{ maxWidth: 920 }}>
        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <a href="/prestataire/excursions" style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <ArrowLeft size={12} /> Mes excursions
          </a>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginTop: 4 }}>Nouvelle excursion</h1>
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* ── Layout 2 colonnes ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14, alignItems: "start" }}>

          {/* ── Colonne gauche ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Infos de base */}
            <div className="ncard">
              <h3><FileText size={12} /> Informations de base</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="nfi">
                  <label>Titre *</label>
                  <input placeholder="Ex: Médina de Tunis — Visite guidée" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="nfi">
                  <label>Ville *</label>
                  <select value={city} onChange={e => setCity(e.target.value)} style={{ appearance: "none" }}>
                    <option value="">Sélectionnez une ville</option>
                    {villes.map(v => <option key={v.id} value={v.nom}>{v.nom}</option>)}
                  </select>
                </div>
                <div className="nfi">
                  <label>Description *</label>
                  <textarea rows={3} placeholder="Décrivez votre excursion : points d'intérêt, expérience, ambiance..."
                    value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "vertical" }} />
                </div>
              </div>
            </div>

            {/* Détails pratiques */}
            <div className="ncard">
              <h3><Settings2 size={12} /> Détails pratiques</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div className="nfi">
                  <label style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> Durée (h)</label>
                  <input type="number" min={0.5} max={24} step={0.5} value={duration} onChange={e => setDuration(Number(e.target.value))} />
                </div>
                <div className="nfi">
                  <label style={{ display: "flex", alignItems: "center", gap: 4 }}><Banknote size={10} /> Prix (TND)</label>
                  <input type="number" min={1} value={price} onChange={e => setPrice(Number(e.target.value))} />
                </div>
                <div className="nfi">
                  <label style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={10} /> Pers. max</label>
                  <input type="number" min={1} max={100} value={maxPeople} onChange={e => setMaxPeople(Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="ncard">
              <h3><ImageIcon size={12} /> Photos <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF", textTransform: "none", letterSpacing: 0 }}>(max 6)</span></h3>
              {photos.length === 0 ? (
                <div className="drop-z" onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
                  <ImageIcon size={24} color="#D1D5DB" style={{ margin: "0 auto 6px" }} />
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 }}>Glissez vos photos ou cliquez</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>JPG, PNG, WebP · Max 5MB</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "4/3", borderRadius: 9, overflow: "hidden", background: "#F3F4F6" }}>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {p.uploading && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Loader2 size={16} style={{ animation: "spin .7s linear infinite", color: "#2B96A8" }} />
                        </div>
                      )}
                      {!p.uploading && (
                        <button type="button" onClick={() => removePhoto(i)}
                          style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,.55)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <X size={10} />
                        </button>
                      )}
                      {i === 0 && !p.uploading && (
                        <div style={{ position: "absolute", bottom: 4, left: 4, padding: "1px 5px", background: "#2B96A8", color: "white", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>
                          PRINCIPALE
                        </div>
                      )}
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <div style={{ aspectRatio: "4/3", borderRadius: 9, border: "2px dashed #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#FAFAFA" }}
                      onClick={() => fileInputRef.current?.click()}>
                      <Plus size={18} color="#D1D5DB" />
                    </div>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
            </div>
          </div>

          {/* ── Colonne droite ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Catégories */}
            <div className="ncard">
              <h3><Tag size={12} /> Catégories</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {categoriesDB.map(cat => (
                  <button key={cat.id} type="button" onClick={() => setCategories(toggle(categories, cat.nom))}
                    style={chip(categories.includes(cat.nom), cat.couleur)}>
                    {cat.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Langues */}
            <div className="ncard">
              <h3><Languages size={12} /> Langues</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => setLanguages(toggle(languages, l))}
                    style={chip(languages.includes(l), "#7C3AED")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Inclusions */}
            <div className="ncard">
              <h3><Package size={12} /> Ce qui est inclus</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {INCLUSIONS.map(inc => (
                  <button key={inc} type="button" onClick={() => setInclusions(toggle(inclusions, inc))}
                    style={chip(inclusions.includes(inc), "#059669")}>
                    {inc}
                  </button>
                ))}
              </div>
            </div>

            {/* Résumé commission */}
            <div style={{ padding: "12px 14px", background: "rgba(43,150,168,.06)", borderRadius: 12, border: "1px solid rgba(43,150,168,.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Info size={13} color="#2B96A8" />
                <span style={{ fontWeight: 700, fontSize: 12, color: "#2B96A8" }}>Résumé des gains</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#6B7280" }}>Prix affiché</span>
                  <strong>{price} TND</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#6B7280" }}>Commission (10%)</span>
                  <span style={{ color: "#DC2626" }}>−{Math.round(price * 0.1)} TND</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(43,150,168,.2)", paddingTop: 6, marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Vous recevez</span>
                  <strong style={{ color: "#059669", fontSize: 13 }}>{Math.round(price * 0.9)} TND</strong>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button type="button" onClick={() => handleSubmit(false)} disabled={loading}
                style={{ width: "100%", padding: "10px", background: "white", border: "1.5px solid #E5E7EB", color: "#374151", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: loading ? 0.7 : 1 }}>
                {loading && !publish ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Save size={14} />}
                Sauvegarder en brouillon
              </button>
              <button type="button" onClick={() => handleSubmit(true)} disabled={loading}
                style={{ width: "100%", padding: "10px", background: "#111827", color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: loading ? 0.7 : 1 }}>
                {loading && publish ? <Loader2 size={14} style={{ animation: "spin .7s linear infinite" }} /> : <Rocket size={14} />}
                {loading && publish ? "Publication..." : "Publier l'excursion"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}