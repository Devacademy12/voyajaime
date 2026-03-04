"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";

interface Excursion {
  id: string; title: string; city: string; description: string;
  duration_hours: number; price_per_person: number; max_people: number;
  categories: string[]; languages: string[]; inclusions: string[];
  photos: string[]; is_active: boolean;
}
interface Ville    { id: string; nom: string; emoji: string; }
interface Categorie { id: string; nom: string; emoji: string; couleur: string; }
interface PhotoPreview { file?: File; url: string; uploading: boolean; uploaded?: string; existing?: boolean; }

const LANGUAGES  = ["Français","Anglais","Arabe","Allemand","Espagnol","Italien"];
const INCLUSIONS = ["Guide francophone","Transport","Repas","Eau minérale","Équipement","Photos","Billet d'entrée"];

function toggle(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

export default function EditExcursionClient({
  exc, villes, categories: categoriesDB,
}: { exc: Excursion; villes: Ville[]; categories: Categorie[] }) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — pre-filled from exc
  const [title, setTitle]       = useState(exc.title);
  const [city, setCity]         = useState(exc.city);
  const [description, setDesc]  = useState(exc.description);
  const [duration, setDuration] = useState(exc.duration_hours);
  const [price, setPrice]       = useState(exc.price_per_person);
  const [maxPeople, setMax]     = useState(exc.max_people);
  const [cats, setCats]         = useState<string[]>(exc.categories || []);
  const [langs, setLangs]       = useState<string[]>(exc.languages || []);
  const [inclus, setInclus]     = useState<string[]>(exc.inclusions || []);
  const [publish, setPublish]   = useState(exc.is_active);

  // Photos: start with existing URLs
  const [photos, setPhotos] = useState<PhotoPreview[]>(
    (exc.photos || []).filter(Boolean).map(url => ({ url, uploading: false, existing: true, uploaded: url }))
  );

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
      if (updated[i].existing || updated[i].uploaded) {
        result.push(updated[i].uploaded || updated[i].url);
        continue;
      }
      if (!updated[i].file) continue;
      updated[i].uploading = true;
      setPhotos([...updated]);
      const ext  = updated[i].file!.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${i}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("excursions-photos").upload(path, updated[i].file!, { upsert: true });
      if (upErr) { console.error(upErr); continue; }
      const { data: { publicUrl } } = supabase.storage.from("excursions-photos").getPublicUrl(data.path);
      updated[i].uploading = false;
      updated[i].uploaded = publicUrl;
      setPhotos([...updated]);
      result.push(publicUrl);
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

    const { error: err } = await supabase
      .from("excursions")
      .update({
        title, city, description,
        duration_hours: duration, price_per_person: price, max_people: maxPeople,
        categories: cats, languages: langs, inclusions: inclus,
        photos: photoUrls,
        is_active: isActive,
      })
      .eq("id", exc.id)
      .eq("prestataire_id", user.id); // sécurité

    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => { window.location.href = `/prestataire/excursions/${exc.id}`; }, 1800);
  };

  if (success) return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
      <p style={{ fontSize: 52, marginBottom: 16 }}>✅</p>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Excursion mise à jour !</h2>
      <p style={{ color: "#6B7280" }}>Redirection...</p>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .fld label{display:block;font-size:12px;font-weight:700;color:#374151;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
        .fld input,.fld select,.fld textarea{width:100%;padding:12px 14px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;font-family:'DM Sans',sans-serif;color:#111827;outline:none;transition:all .2s;background:#FAFAFA}
        .fld input:focus,.fld select:focus,.fld textarea:focus{border-color:#2B96A8;background:white;box-shadow:0 0 0 4px rgba(43,150,168,.08)}
        .section{background:white;border-radius:20px;border:1px solid #F3F4F6;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.04)}
        .section h2{font-size:15px;font-weight:700;color:#111827;margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid #F3F4F6}
        .drop-zone{border:2px dashed #D1D5DB;border-radius:16px;padding:32px;text-align:center;cursor:pointer;transition:all .2s;background:#FAFAFA}
        .drop-zone:hover{border-color:#2B96A8;background:rgba(43,150,168,.04)}
        .photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
        .photo-item{position:relative;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background:#F3F4F6}
        .photo-item img{width:100%;height:100%;object-fit:cover}
        .photo-rm{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.55);color:white;border:none;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
        .photo-loading{position:absolute;inset:0;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;font-size:20px}
        .photo-main{position:absolute;bottom:6px;left:6px;padding:2px 8px;background:#2B96A8;color:white;borderRadius:6px;font-size:10px;font-weight:700}
      `}</style>

      <div style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 28 }}>
          <Link href={`/prestataire/excursions/${exc.id}`}
            style={{ fontSize: 13, color: "#9CA3AF", textDecoration: "none", fontWeight: 500 }}>
            ← Retour à l&apos;excursion
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginTop: 8, letterSpacing: "-0.5px" }}>
            Modifier l&apos;excursion
          </h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>{exc.title}</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626" }}>
            ⚠️ {error}
          </div>
        )}

        <form>
          {/* Infos de base */}
          <div className="section">
            <h2>📝 Informations de base</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="fld">
                <label>Titre *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Titre de l'excursion" />
              </div>
              <div className="fld">
                <label>Ville *</label>
                <select value={city} onChange={e => setCity(e.target.value)} required style={{ appearance: "none" }}>
                  <option value="">Sélectionnez une ville</option>
                  {villes.map(v => (
                    <option key={v.id} value={v.nom}>{v.emoji} {v.nom}</option>
                  ))}
                </select>
              </div>
              <div className="fld">
                <label>Description *</label>
                <textarea rows={4} value={description} onChange={e => setDesc(e.target.value)} required style={{ resize: "vertical" }} placeholder="Décrivez votre excursion..." />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="section">
            <h2>📸 Photos <span style={{ fontSize: 12, fontWeight: 400, color: "#9CA3AF" }}>(max 6)</span></h2>
            <div className="drop-zone" onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🖼️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 3 }}>Glissez ou cliquez pour ajouter des photos</p>
              <p style={{ fontSize: 12, color: "#9CA3AF" }}>JPG, PNG, WebP · Max 5MB par photo</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
              onChange={e => handleFiles(e.target.files)} />

            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <div key={i} className="photo-item">
                    <img src={p.url} alt="" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                    {p.uploading && <div className="photo-loading">⏳</div>}
                    {!p.uploading && (
                      <button type="button" className="photo-rm" onClick={() => removePhoto(i)}>✕</button>
                    )}
                    {i === 0 && (
                      <div style={{ position: "absolute", bottom: 6, left: 6, padding: "2px 8px", background: "#2B96A8", color: "white", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                        PRINCIPALE
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < 6 && (
                  <div style={{ aspectRatio: "4/3", borderRadius: 12, border: "2px dashed #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#FAFAFA" }}
                    onClick={() => fileRef.current?.click()}>
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
                { label: "Durée (heures)", value: duration, set: setDuration, min: 0.5, max: 24, step: 0.5 },
                { label: "Prix / personne (TND)", value: price, set: setPrice, min: 1 },
                { label: "Personnes max", value: maxPeople, set: setMax, min: 1, max: 100 },
              ].map(f => (
                <div className="fld" key={f.label}>
                  <label>{f.label}</label>
                  <input type="number" min={f.min} max={f.max} step={f.step} value={f.value}
                    onChange={e => f.set(Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>

          {/* Catégories */}
          <div className="section">
            <h2>🏷️ Catégories</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {categoriesDB.map(c => (
                <button key={c.id} type="button"
                  onClick={() => setCats(toggle(cats, c.nom))}
                  style={chip(cats.includes(c.nom), c.couleur)}>
                  {c.emoji} {c.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Langues */}
          <div className="section">
            <h2>🌍 Langues disponibles</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LANGUAGES.map(l => (
                <button key={l} type="button"
                  onClick={() => setLangs(toggle(langs, l))}
                  style={chip(langs.includes(l), "#7C3AED")}>
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
                <button key={inc} type="button"
                  onClick={() => setInclus(toggle(inclus, inc))}
                  style={chip(inclus.includes(inc), "#059669")}>
                  {inc}
                </button>
              ))}
            </div>
          </div>

          {/* Résumé prix */}
          <div style={{ padding: "14px 18px", background: "rgba(43,150,168,.06)", borderRadius: 12, marginBottom: 20, fontSize: 13, color: "#374151", border: "1px solid rgba(43,150,168,.15)" }}>
            💡 Prix affiché : <strong>{price} TND</strong> · Commission 10% : <strong>{Math.round(price * 0.1)} TND</strong> · Vous recevez : <strong style={{ color: "#059669" }}>{Math.round(price * 0.9)} TND</strong> / personne
          </div>

          {/* Statut actuel */}
          <div style={{ padding: "12px 16px", background: "#F9FAFB", borderRadius: 12, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 13, color: "#374151" }}>
              Statut actuel : <strong style={{ color: publish ? "#15803D" : "#9CA3AF" }}>{publish ? "● Publiée" : "● Brouillon"}</strong>
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" disabled={loading}
              onClick={e => handleSubmit(e as unknown as React.FormEvent, false)}
              style={{ flex: 1, padding: "13px", background: "white", border: "1.5px solid #E5E7EB", color: "#374151", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading ? "Sauvegarde..." : "💾 Enregistrer comme brouillon"}
            </button>
            <button type="button" disabled={loading}
              onClick={e => handleSubmit(e as unknown as React.FormEvent, true)}
              style={{ flex: 2, padding: "13px", background: loading ? "#9CA3AF" : "#111827", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .2s" }}>
              {loading ? "Mise à jour..." : "🚀 Enregistrer et publier"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}