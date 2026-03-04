"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

const LANGUAGES = ["Français","Anglais","Arabe","Allemand","Espagnol","Italien"];
const INCLUSIONS = ["Guide francophone","Transport","Repas","Eau minérale","Équipement","Photos","Billet d'entrée"];

function toggle(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

interface PhotoPreview { file: File; url: string; uploading: boolean; uploaded?: string; }

interface Ville { id: string; nom: string; emoji: string; active: boolean; }
interface Categorie { id: string; nom: string; emoji: string; couleur: string; }

export default function NouvelleExcursionClient({
  villes, categories: categoriesDB,
}: {
  villes: Ville[];
  categories: Categorie[];
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(2);
  const [price, setPrice] = useState(50);
  const [maxPeople, setMaxPeople] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [publish, setPublish] = useState(false);

  const chip = (selected: boolean, color = "#2B96A8") => ({
    padding: "7px 14px", borderRadius: "20px",
    border: `1.5px solid ${selected ? color : "#E5E7EB"}`,
    background: selected ? `${color}12` : "white",
    color: selected ? color : "#6B7280",
    fontSize: "13px", fontWeight: selected ? 600 : 400,
    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
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
      updated[i].uploading = true;
      setPhotos([...updated]);
      const ext = updated[i].file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${i}.${ext}`;
      const { data, error } = await supabase.storage
        .from("excursions-photos")
        .upload(path, updated[i].file, { upsert: true });
      if (error) { console.error("Upload error:", error.message); continue; }
      const { data: { publicUrl } } = supabase.storage
        .from("excursions-photos").getPublicUrl(data.path);
      updated[i].uploading = false;
      updated[i].uploaded = publicUrl;
      urls.push(publicUrl);
    }
    setPhotos([...updated]);
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !city || !description) { setError("Remplissez tous les champs obligatoires."); return; }
    setLoading(true); setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée."); setLoading(false); return; }

    // Upload photos first
    const photoUrls = photos.length > 0 ? await uploadPhotos(user.id) : [];

    const { error: err } = await supabase.from("excursions").insert({
      prestataire_id: user.id, title, city, description,
      duration_hours: duration, price_per_person: price,
      max_people: maxPeople, categories, languages, inclusions,
      photos: photoUrls,
      is_active: publish,
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = "/prestataire/excursions"; }, 2000);
  };

  if (success) return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
      <p style={{ fontSize: 52, marginBottom: 16 }}>🎉</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
        Excursion {publish ? "publiée" : "sauvegardée"} !
      </h2>
      <p style={{ color: "#6B7280" }}>Redirection vers vos excursions...</p>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .fld label{display:block;font-size:12px;font-weight:700;color:#374151;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
        .fld input,.fld select,.fld textarea{width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:'DM Sans',sans-serif;color:#111827;outline:none;transition:all .2s;background:#FAFAFA}
        .fld input:focus,.fld select:focus,.fld textarea:focus{border-color:#2B96A8;background:white;box-shadow:0 0 0 4px rgba(43,150,168,.08)}
        .section{background:white;border-radius:20px;border:1px solid #F3F4F6;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .section h2{font-size:15px;font-weight:700;color:#111827;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid #F3F4F6}
        .drop-zone{border:2px dashed #D1D5DB;border-radius:16px;padding:32px;text-align:center;cursor:pointer;transition:all .2s;background:#FAFAFA}
        .drop-zone:hover,.drop-zone.drag{border-color:#2B96A8;background:rgba(43,150,168,.04)}
        .photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
        .photo-item{position:relative;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:#F3F4F6}
        .photo-item img{width:100%;height:100%;object-fit:cover}
        .photo-rm{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.55);color:white;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
        .photo-loading{position:absolute;inset:0;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;font-size:20px}
      `}</style>

      <div style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 28 }}>
          <a href="/prestataire/excursions" style={{ fontSize: 13, color: "#9CA3AF", textDecoration: "none", fontWeight: 500 }}>← Mes excursions</a>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginTop: 8, letterSpacing: "-0.5px" }}>Nouvelle excursion</h1>
        </div>

        {error && <div style={{ marginBottom: 16, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Infos de base */}
          <div className="section">
            <h2>📝 Informations de base *</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="fld">
                <label>Titre de l&apos;excursion *</label>
                <input placeholder="Ex: Médina de Tunis — Visite guidée" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="fld">
                <label>Ville *</label>
                <select value={city} onChange={e => setCity(e.target.value)} required style={{ appearance: "none" }}>
                  <option value="">Sélectionnez une ville</option>
                  {villes.map(v => <option key={v.id} value={v.nom}>{v.emoji} {v.nom}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>Description *</label>
                <textarea rows={4} placeholder="Décrivez votre excursion : points d'intérêt, expérience, ambiance..."
                  value={description} onChange={e => setDescription(e.target.value)} required style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="section">
            <h2>📸 Photos de l&apos;excursion <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3AF" }}>(max 6 photos, 5MB chacune)</span></h2>

            <div className="drop-zone" onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag"); }}
              onDragLeave={e => e.currentTarget.classList.remove("drag")}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("drag"); handleFiles(e.dataTransfer.files); }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                Glissez vos photos ici ou cliquez pour parcourir
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>JPG, PNG, WebP · Max 5MB par photo</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => handleFiles(e.target.files)} />

            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <div key={i} className="photo-item">
                    <img src={p.url} alt="" />
                    {p.uploading && <div className="photo-loading">⏳</div>}
                    {!p.uploading && <button type="button" className="photo-rm" onClick={() => removePhoto(i)}>✕</button>}
                    {i === 0 && !p.uploading && (
                      <div style={{ position: "absolute", bottom: 6, left: 6, padding: "2px 8px", background: "#2B96A8", color: "white", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                        PHOTO PRINCIPALE
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < 6 && (
                  <div style={{ aspectRatio: "4/3", borderRadius: 12, border: "2px dashed #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#FAFAFA" }}
                    onClick={() => fileInputRef.current?.click()}>
                    <span style={{ fontSize: 24, color: "#D1D5DB" }}>+</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Détails pratiques */}
          <div className="section">
            <h2>⚙️ Détails pratiques</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: "Durée (heures)", value: duration, onChange: (v: number) => setDuration(v), min: 0.5, max: 24, step: 0.5 },
                { label: "Prix / personne (TND)", value: price, onChange: (v: number) => setPrice(v), min: 1 },
                { label: "Personnes max", value: maxPeople, onChange: (v: number) => setMaxPeople(v), min: 1, max: 100 },
              ].map(f => (
                <div className="fld" key={f.label}>
                  <label>{f.label}</label>
                  <input type="number" min={f.min} max={f.max} step={f.step} value={f.value}
                    onChange={e => f.onChange(Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div className="section">
            <h2>🏷️ Catégories</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {categoriesDB.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategories(toggle(categories, cat.nom))}
                  style={chip(categories.includes(cat.nom), cat.couleur)}>
                  {cat.emoji} {cat.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Langues */}
          <div className="section">
            <h2>🌍 Langues disponibles</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LANGUAGES.map(l => (
                <button key={l} type="button" onClick={() => setLanguages(toggle(languages, l))} style={chip(languages.includes(l), "#7C3AED")}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Inclusions */}
          <div className="section">
            <h2>✅ Ce qui est inclus</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {INCLUSIONS.map(inc => (
                <button key={inc} type="button" onClick={() => setInclusions(toggle(inclusions, inc))} style={chip(inclusions.includes(inc), "#059669")}>
                  {inc}
                </button>
              ))}
            </div>
          </div>

          {/* Prix résumé */}
          <div style={{ padding: "14px 18px", background: "rgba(43,150,168,.06)", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#374151", border: "1px solid rgba(43,150,168,.15)" }}>
            💡 Prix affiché : <strong>{price} TND</strong> · Commission 10% : <strong>{Math.round(price * 0.1)} TND</strong> · Vous recevez : <strong style={{ color: "#059669" }}>{Math.round(price * 0.9)} TND</strong> / personne
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" onClick={() => setPublish(false)} disabled={loading}
              style={{ flex: 1, padding: "13px", background: "white", border: "1.5px solid #E5E7EB", color: "#374151", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading && !publish ? "Sauvegarde..." : "💾 Brouillon"}
            </button>
            <button type="submit" onClick={() => setPublish(true)} disabled={loading}
              style={{ flex: 2, padding: "13px", background: "#111827", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading && publish ? "Publication en cours..." : "🚀 Publier l'excursion"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}