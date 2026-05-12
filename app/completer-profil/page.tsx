"use client";

// ═══════════════════════════════════════════════════
//  app/completer-profil/page.tsx  (hors layout prestataire — accessible sans validation)
// ═══════════════════════════════════════════════════

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import {
  Building2, MapPin, Phone, FileText, CheckCircle2, Loader2,
  ArrowRight, User, Globe, Calendar, X, Image,
  ShieldCheck, Hash, AlertCircle, Paperclip, Trash2,
} from "lucide-react";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i);

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:".8px", marginBottom:7 }}>
        {label} {required && <span style={{ color:"#EF4444" }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize:11, color:"#9CA3AF", marginTop:5, lineHeight:1.5 }}>{hint}</p>}
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background:"white", borderRadius:16, border:"1px solid #E5E7EB", padding:"28px 32px", marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:24, paddingBottom:18, borderBottom:"1px solid #F3F4F6" }}>
        <div style={{ width:38, height:38, background:"#F8FAFC", borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #E5E7EB" }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize:15, fontWeight:700, color:"#0F172A", margin:"0 0 3px" }}>{title}</p>
          <p style={{ fontSize:12, color:"#6B7280", margin:0, lineHeight:1.5 }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = {
  width:"100%", padding:"11px 14px", border:"1.5px solid #E5E7EB",
  borderRadius:10, fontSize:14, fontFamily:"inherit", color:"#0F172A",
  background:"#FAFBFC", outline:"none", boxSizing:"border-box",
  transition:"border-color .2s",
};
const onFocus = (e: React.FocusEvent<any>) => (e.target.style.borderColor = "#2B96A8");
const onBlur  = (e: React.FocusEvent<any>) => (e.target.style.borderColor = "#E5E7EB");

function CompleterProfilContent() {
  const router   = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Section 1 — Identité
  const [fullName,   setFullName]   = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [city,       setCity]       = useState("");
  const [address,    setAddress]    = useState("");
  const [phone,      setPhone]      = useState("");
  const [website,    setWebsite]    = useState("");

  // Section 2 — Authenticité
  const [yearFounded, setYearFounded] = useState("");
  const [patente,     setPatente]     = useState("");
  const [description, setDescription] = useState("");

  // Section 3 — Photos
  const [agencyPhotos, setAgencyPhotos] = useState<{ file: File; url: string }[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Déclaration entreprise (PDF ou image)
  const [declarationFile, setDeclarationFile] = useState<File | null>(null);
  const declarationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (profile?.role !== "prestataire") { router.push("/"); return; }
      if (profile?.is_validated) { router.push("/prestataire/dashboard"); return; }
      setFullName(profile?.full_name    || "");
      setAgencyName(profile?.agency_name || "");
      setCity(profile?.city             || "");
      setAddress(profile?.address       || "");
      setPhone(profile?.phone           || "");
      setWebsite(profile?.website       || "");
      setYearFounded(profile?.year_founded ? String(profile.year_founded) : "");
      setPatente(profile?.patente       || "");
      setDescription(profile?.description || "");
      setLoading(false);
    })();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, 4 - agencyPhotos.length).map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setAgencyPhotos(prev => [...prev, ...toAdd]);
    e.target.value = "";
  };

  const removePhoto = (i: number) => {
    setAgencyPhotos(prev => { URL.revokeObjectURL(prev[i].url); return prev.filter((_, j) => j !== i); });
  };

  const validate = () => {
    if (!agencyName.trim())  return "Le nom de l'agence est obligatoire.";
    if (!city)               return "Veuillez sélectionner votre ville.";
    if (!address.trim())     return "L'adresse physique de l'agence est obligatoire.";
    if (!phone.trim())       return "Le numéro de téléphone est obligatoire.";
    if (!yearFounded)        return "L'année d'ouverture est obligatoire.";
    if (!patente.trim())     return "Le numéro de patente / RNE est obligatoire.";
    if (!declarationFile)    return "Le fichier de déclaration d'entreprise est obligatoire.";
    if (description.trim().length < 30) return "La description doit faire au moins 30 caractères.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate(); if (err) { setError(err); return; }
    setSaving(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée.");

      const uploadedUrls: string[] = [];
      for (const photo of agencyPhotos) {
        const ext  = photo.file.name.split(".").pop() || "jpg";
        const path = `${user.id}/agency-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: up, error: upErr } = await supabase.storage.from("avatars").upload(path, photo.file, { upsert: true });
        if (!upErr && up) {
          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(up.path);
          uploadedUrls.push(publicUrl);
        }
      }

      // Upload déclaration d'entreprise
      let declarationUrl: string | null = null;
      if (declarationFile) {
        const ext  = declarationFile.name.split(".").pop() || "pdf";
        const path = `${user.id}/declaration-${Date.now()}.${ext}`;
        const { data: up, error: upErr } = await supabase.storage
          .from("documents-prestataires")
          .upload(path, declarationFile, { upsert: true });
        if (!upErr && up) {
          const { data: { publicUrl } } = supabase.storage.from("documents-prestataires").getPublicUrl(up.path);
          declarationUrl = publicUrl;
        } else if (upErr) {
          throw new Error("Erreur lors de l'upload du document : " + upErr.message);
        }
      }

      const { error: updateErr } = await supabase.from("profiles").update({
        full_name: fullName.trim() || undefined,
        agency_name: agencyName.trim(),
        city, address: address.trim(),
        phone: phone.trim(),
        website: website.trim() || null,
        year_founded: Number(yearFounded),
        patente: patente.trim(),
        description: description.trim(),
        agency_photos: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        declaration_url: declarationUrl,
        profil_complete: true,
      }).eq("user_id", user.id);

      if (updateErr) throw updateErr;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <Loader2 size={30} color="#2B96A8" style={{ animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (success) return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ maxWidth:460, width:"100%", background:"white", borderRadius:20, padding:"48px 40px", textAlign:"center", boxShadow:"0 4px 24px rgba(0,0,0,0.07)", border:"1px solid #E5E7EB" }}>
        <div style={{ width:68, height:68, background:"#ECFDF5", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle2 size={32} color="#059669" />
        </div>
        <h2 style={{ fontSize:22, fontWeight:800, color:"#0F172A", marginBottom:10 }}>Dossier envoyé !</h2>
        <p style={{ fontSize:14, color:"#6B7280", lineHeight:1.7, marginBottom:24 }}>
          Notre équipe va examiner votre dossier et vous enverra un email sous <strong>24 à 48 heures</strong>.
        </p>
        <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:10, padding:"14px 18px", marginBottom:28 }}>
          <p style={{ fontSize:13, color:"#92400E", margin:0, lineHeight:1.7, fontWeight:600 }}>
            📬 Surveillez votre boîte mail — vous recevrez un email dès que votre compte est validé.
          </p>
        </div>
        <button onClick={() => router.push("/")} style={{ padding:"12px 32px", background:"#0F172A", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F3F4F6", padding:"32px 16px" }}>
      <div style={{ maxWidth:620, margin:"0 auto" }}>

        <div style={{ textAlign:"center", marginBottom:32 }}>
          <p style={{ fontSize:12, fontWeight:800, color:"#2B96A8", letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>VoyaJaime — Espace prestataire</p>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#0F172A", marginBottom:10, letterSpacing:"-.5px" }}>Complétez votre dossier agence</h1>
          <p style={{ fontSize:14, color:"#6B7280", lineHeight:1.7, maxWidth:480, margin:"0 auto" }}>
            Ces informations nous permettent de vérifier que votre agence est réelle avant de vous donner accès à la plateforme.
          </p>
        </div>

        {/* ── Section 1 : Informations de base ── */}
        <SectionCard icon={<User size={17} color="#1D4ED8" />} title="Informations de base" subtitle="Nom et coordonnées de votre agence">

          <Field label="Votre nom complet" required>
            <div style={{ position:"relative" }}>
              <User size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Prénom Nom" style={{ ...inp, paddingLeft:36 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </Field>

          <Field label="Nom de l'agence / société" required>
            <div style={{ position:"relative" }}>
              <Building2 size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
              <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Ex : TunisEscape Tours" style={{ ...inp, paddingLeft:36 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </Field>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Ville principale" required>
              <div style={{ position:"relative" }}>
                <MapPin size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", zIndex:1 }} />
                <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inp, paddingLeft:36, appearance:"none" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Sélectionner…</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Téléphone" required>
              <div style={{ position:"relative" }}>
                <Phone size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" type="tel" style={{ ...inp, paddingLeft:36 }} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </Field>
          </div>

          <Field label="Adresse physique de l'agence" required hint="Rue, numéro, immeuble — adresse vérifiable sur Google Maps">
            <div style={{ position:"relative" }}>
              <MapPin size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:13 }} />
              <textarea value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Ex : 12 Rue Habib Thameur, Immeuble Carthage, 2ème étage, Tunis"
                rows={2} style={{ ...inp, paddingLeft:36, resize:"none", lineHeight:1.6 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </Field>

          <Field label="Site web / Réseaux sociaux" hint="Optionnel — site internet, page Facebook ou Instagram">
            <div style={{ position:"relative" }}>
              <Globe size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://monagence.tn ou facebook.com/..." style={{ ...inp, paddingLeft:36 }} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </Field>
        </SectionCard>

        {/* ── Section 2 : Vérification authenticité ── */}
        <SectionCard icon={<ShieldCheck size={17} color="#059669" />} title="Vérification d'authenticité" subtitle="Prouve que votre agence est légalement enregistrée en Tunisie">

          <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"12px 15px", marginBottom:22, display:"flex", gap:9, alignItems:"flex-start" }}>
            <AlertCircle size={14} color="#1D4ED8" style={{ flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:12, color:"#1E40AF", margin:0, lineHeight:1.6 }}>
              Ces informations sont <strong>uniquement vues par notre équipe</strong> pour vérifier votre agence. Elles ne sont jamais affichées aux touristes.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Field label="Année d'ouverture" required hint="Depuis quand votre agence est-elle active ?">
              <div style={{ position:"relative" }}>
                <Calendar size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", zIndex:1 }} />
                <select value={yearFounded} onChange={e => setYearFounded(e.target.value)} style={{ ...inp, paddingLeft:36, appearance:"none" }} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Sélectionner…</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </Field>

            <Field label="N° Patente / RNE / Matricule fiscal" required hint="Numéro d'enregistrement officiel tunisien">
              <div style={{ position:"relative" }}>
                <Hash size={13} color="#9CA3AF" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }} />
                <input value={patente} onChange={e => setPatente(e.target.value)} placeholder="Ex : 1234567A/P/M/000" style={{ ...inp, paddingLeft:36 }} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </Field>
          </div>

          <Field label="Photos de l'agence / local" hint="Jusqu'à 4 photos — façade, bureau, véhicules, guides… Aide à confirmer votre activité réelle">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10 }}>
              {agencyPhotos.map((photo, i) => (
                <div key={i} style={{ position:"relative", aspectRatio:"1", borderRadius:10, overflow:"hidden", border:"1px solid #E5E7EB" }}>
                  <img src={photo.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  <button onClick={() => removePhoto(i)} style={{ position:"absolute", top:4, right:4, width:22, height:22, background:"rgba(0,0,0,0.6)", border:"none", borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <X size={11} color="white" />
                  </button>
                </div>
              ))}
              {agencyPhotos.length < 4 && (
                <button onClick={() => photoInputRef.current?.click()} style={{ aspectRatio:"1", borderRadius:10, border:"1.5px dashed #D1D5DB", background:"#FAFBFC", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor="#2B96A8")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor="#D1D5DB")}>
                  <Image size={20} color="#9CA3AF" />
                  <span style={{ fontSize:10, color:"#9CA3AF", fontWeight:600 }}>Ajouter</span>
                </button>
              )}
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handlePhotoChange} />
          </Field>

          {/* Déclaration d'entreprise */}
          <Field label="Déclaration d'entreprise" required hint="Document officiel prouvant l'enregistrement légal de votre agence — PDF, JPG ou PNG · max 10 Mo">
            {!declarationFile ? (
              <button
                onClick={() => declarationInputRef.current?.click()}
                style={{
                  width:"100%", padding:"20px 16px", border:"1.5px dashed #D1D5DB",
                  borderRadius:12, background:"#FAFBFC", cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:10,
                  fontFamily:"inherit", transition:"all .2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#2B96A8"; e.currentTarget.style.background="#F0F9FF"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#D1D5DB"; e.currentTarget.style.background="#FAFBFC"; }}
              >
                <div style={{ width:44, height:44, background:"#EFF6FF", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Paperclip size={20} color="#1D4ED8" />
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:700, color:"#374151" }}>
                    Cliquer pour sélectionner le document
                  </p>
                  <p style={{ margin:0, fontSize:11, color:"#9CA3AF" }}>
                    Patente, RNE, certificat d'immatriculation, ou tout document officiel · PDF / JPG / PNG
                  </p>
                </div>
              </button>
            ) : (
              <div style={{
                display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
                background:"#F0FDF4", border:"1.5px solid #86EFAC", borderRadius:12,
              }}>
                {/* Icône selon type */}
                <div style={{ width:40, height:40, background:"#DCFCE7", borderRadius:9, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {declarationFile.type === "application/pdf"
                    ? <FileText size={18} color="#16A34A" />
                    : <Image size={18} color="#16A34A" />
                  }
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:"#15803D", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {declarationFile.name}
                  </p>
                  <p style={{ margin:0, fontSize:11, color:"#16A34A" }}>
                    {(declarationFile.size / 1024 / 1024).toFixed(2)} Mo · {declarationFile.type === "application/pdf" ? "PDF" : "Image"}
                  </p>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <button
                    onClick={() => declarationInputRef.current?.click()}
                    style={{ padding:"6px 12px", background:"white", border:"1px solid #86EFAC", borderRadius:7, fontSize:11, fontWeight:700, color:"#15803D", cursor:"pointer", fontFamily:"inherit" }}
                  >
                    Changer
                  </button>
                  <button
                    onClick={() => setDeclarationFile(null)}
                    style={{ width:30, height:30, background:"white", border:"1px solid #86EFAC", borderRadius:7, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                  >
                    <Trash2 size={13} color="#DC2626" />
                  </button>
                </div>
              </div>
            )}
            <input
              ref={declarationInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display:"none" }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) { setError("Le fichier dépasse 10 Mo."); return; }
                setDeclarationFile(file);
                e.target.value = "";
              }}
            />
          </Field>
        </SectionCard>

        {/* ── Section 3 : Description ── */}
        <SectionCard icon={<FileText size={17} color="#7C3AED" />} title="Présentation de votre agence" subtitle="Décrivez votre activité et vos spécialités — visible par les touristes">
          <Field label="Description" required hint={`${description.length}/600 caractères — minimum 30`}>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Ex : Agence spécialisée dans les excursions dans le désert depuis 2010. Nous proposons des circuits en 4×4, des nuits sous les étoiles à Douz, et des visites guidées à Tozeur avec des guides certifiés par l'ONTT…"
              rows={5} maxLength={600} style={{ ...inp, resize:"vertical", lineHeight:1.7 }} onFocus={onFocus} onBlur={onBlur} />
          </Field>
        </SectionCard>

        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, marginBottom:20, fontSize:13, color:"#DC2626", fontWeight:600 }}>
            <AlertCircle size={15} style={{ flexShrink:0 }} /> {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving} style={{
          width:"100%", padding:"15px", background: saving ? "#9CA3AF" : "#2B96A8",
          color:"white", border:"none", borderRadius:13, fontSize:15, fontWeight:700,
          cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit",
          display:"flex", alignItems:"center", justifyContent:"center", gap:9,
          transition:"all .2s", marginBottom:14,
        }}>
          {saving
            ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Envoi en cours…</>
            : <>Envoyer mon dossier de validation <ArrowRight size={15} /></>
          }
        </button>

        <p style={{ textAlign:"center", fontSize:12, color:"#9CA3AF", lineHeight:1.6, paddingBottom:32 }}>
          Votre dossier sera examiné sous 24–48h · Vous recevrez un email dès la validation
        </p>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export default function CompleterProfilPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <Loader2 size={28} color="#2B96A8" style={{ animation:"spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <CompleterProfilContent />
    </Suspense>
  );
}