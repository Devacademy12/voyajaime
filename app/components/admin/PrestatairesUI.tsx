"use client";

import { useState } from "react";
import {
  Search, MapPin, Phone, Star, Calendar, Users, Clock, CheckCircle,
  Pencil, Trash2, Map, AlertTriangle, Eye, X, Save,
  Globe, Hash, Building2, FileText, ExternalLink, Image as ImageIcon, ShieldCheck,
} from "lucide-react";

export interface PrestastaireUIProps {
  id: string;
  user_id: string;
  full_name: string | null;
  agency_name: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  avatar_url: string | null;
  is_validated: boolean;
  rating: number | null;
  created_at: string;
  excursion_count: number;
  excursion_active: number;
  // Champs vérification authenticité
  year_founded: number | null;
  patente: string | null;
  agency_photos: string[] | null;
  declaration_url: string | null;
  profil_complete: boolean | null;
}

// ── SEARCH BAR ──
export function SearchBar({ value, onChange, placeholder = "Rechercher..." }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
      <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
      <input
        className="fi"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: 34, width: "100%" }}
      />
    </div>
  );
}

// ── CITY FILTER ──
export function CityFilter({ value, onChange, cities }: {
  value: string;
  onChange: (v: string) => void;
  cities: string[];
}) {
  return (
    <div style={{ position: "relative", width: 175 }}>
      <MapPin size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
      <select
        className="fi"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingLeft: 32, cursor: "pointer", appearance: "none" }}
      >
        <option value="">Toutes les villes</option>
        {cities.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}

// ── FILTER TABS ──
export function FilterTabs({ 
  value, 
  onChange, 
  counts,
}: {
  value: "pending" | "validated" | "all";
  onChange: (v: "pending" | "validated" | "all") => void;
  counts: { pending: number; validated: number; all: number };
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {([
        { k: "pending" as const, label: "En attente", Icon: Clock },
        { k: "validated" as const, label: "Validés", Icon: CheckCircle },
        { k: "all" as const, label: "Tous", Icon: Users },
      ]).map(({ k, label, Icon }) => (
        <button
          key={k}
          className={`ptab ${value === k ? "on" : ""}`}
          onClick={() => onChange(k)}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            border: `1px solid ${value === k ? "#2B96A8" : "#E5E7EB"}`,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "all .2s",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: value === k ? "#2B96A8" : "white",
            color: value === k ? "white" : "#6B7280",
          }}
        >
          <Icon size={13} />
          {label}
          <span style={{
            fontSize: 11,
            borderRadius: 12,
            padding: "1px 7px",
            fontWeight: 800,
            background: value === k ? "rgba(255,255,255,.25)" : "#F3F4F6",
            color: value === k ? "white" : "#6B7280",
          }}>
            {counts[k]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── EMPTY STATE ──
export function EmptyPrestataires({ filter }: { filter: string }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 20px", background: "white", borderRadius: 16, border: "1px solid #F3F4F6" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        {filter === "pending" ? <CheckCircle size={24} color="#9CA3AF" /> : <Search size={24} color="#9CA3AF" />}
      </div>
      <p style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>
        {filter === "pending" ? "Aucun prestataire en attente" : "Aucun résultat"}
      </p>
      {filter === "pending" && <p style={{ color: "#9CA3AF", fontSize: 13, marginTop: 5 }}>Toutes les demandes ont été traitées !</p>}
    </div>
  );
}

// ── PRESTATAIRE CARD ──
export function PrestastaireCard({
  p,
  isLoading,
  onViewEdit,
  onValidate,
  onRevoke,
  onDelete,
}: {
  p: PrestastaireUIProps;
  isLoading: boolean;
  onViewEdit: () => void;
  onValidate: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}) {
  const name = p.agency_name || p.full_name || "Sans nom";

  return (
    <div
      className="pcard"
      style={{
        borderLeft: `3px solid ${p.is_validated ? "#2B96A8" : "#F59E0B"}`,
        cursor: "pointer",
      }}
      onClick={onViewEdit}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          background: p.is_validated ? "linear-gradient(135deg,#2B96A8,#4AABB8)" : "linear-gradient(135deg,#F59E0B,#FBBF24)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 800,
          fontSize: 17,
        }}
      >
        {p.avatar_url ? (
          <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          name[0].toUpperCase()
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{name}</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 18,
              fontSize: 11,
              fontWeight: 700,
              background: p.is_validated ? "#F0FDF4" : "#FFFBEB",
              color: p.is_validated ? "#15803D" : "#D97706",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {p.is_validated ? <CheckCircle size={10} /> : <Clock size={10} />}
            {p.is_validated ? "Validé" : "En attente"}
          </span>
          {p.excursion_count > 0 && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 18,
                fontSize: 11,
                fontWeight: 600,
                background: "rgba(43,150,168,.08)",
                color: "#2B96A8",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Map size={10} /> {p.excursion_active}/{p.excursion_count}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {p.full_name && p.agency_name && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={11} color="#9CA3AF" />
              {p.full_name}
            </span>
          )}
          {p.city && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={11} color="#9CA3AF" />
              {p.city}
            </span>
          )}
          {p.phone && (
            <span style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
              <Phone size={11} color="#9CA3AF" />
              {p.phone}
            </span>
          )}
          <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} color="#C4B8B0" />
            {new Date(p.created_at).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          className="pbtn pbtn-teal"
          onClick={onViewEdit}
          disabled={isLoading}
          style={{ padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(43,150,168,.1)", color: "#2B96A8" }}
        >
          <Pencil size={12} />
        </button>
        {!p.is_validated ? (
          <>
            <button
              className="pbtn pbtn-green"
              onClick={onValidate}
              disabled={isLoading}
              style={{ padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, background: "#F0FDF4", color: "#15803D" }}
            >
              <CheckCircle size={12} />
              {isLoading ? "..." : "Valider"}
            </button>
            <button
              className="pbtn pbtn-red"
              onClick={onDelete}
              disabled={isLoading}
              style={{ padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF2F2", color: "#DC2626" }}
            >
              <Trash2 size={12} />
            </button>
          </>
        ) : (
          <>
            <button
              className="pbtn pbtn-gray"
              onClick={onRevoke}
              disabled={isLoading}
style={{ padding: "7px 12px", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB" }}            >
              <AlertTriangle size={12} />
              {isLoading ? "..." : "Révoquer"}
            </button>
            <button
              className="pbtn pbtn-red"
              onClick={onDelete}
              disabled={isLoading}
              style={{ padding: "7px 12px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", transition: "all .2s", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5, background: "#FEF2F2", color: "#DC2626" }}
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── PRESTATAIRE DETAILS (View Mode) ──
export function PrestastaireDetails({
  p,
  loading,
  onEdit,
  onValidate,
  onRevoke,
  onDelete,
}: {
  p: PrestastaireUIProps;
  loading: boolean;
  onEdit: () => void;
  onValidate: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}) {
  const name = p.agency_name || p.full_name || "Sans nom";

  return (
    <div style={{ padding: "0 26px 26px" }}>
      {/* Avatar + nom */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #F0F0F0" }}>
          {p.avatar_url ? (
            <img src={p.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: p.is_validated ? "linear-gradient(135deg,#2B96A8,#4AABB8)" : "linear-gradient(135deg,#F59E0B,#FBBF24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 800,
                fontSize: 24,
              }}
            >
              {name[0].toUpperCase()}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 5 }}>{name}</h2>
          {p.full_name && p.agency_name && (
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 7, display: "flex", alignItems: "center", gap: 5 }}>
              <Users size={12} color="#9CA3AF" />
              {p.full_name}
            </p>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: 18,
                fontSize: 11,
                fontWeight: 700,
                background: p.is_validated ? "#F0FDF4" : "#FFFBEB",
                color: p.is_validated ? "#15803D" : "#D97706",
                border: `1px solid ${p.is_validated ? "#BBF7D0" : "#FDE68A"}`,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {p.is_validated ? <CheckCircle size={10} /> : <Clock size={10} />}
              {p.is_validated ? "Validé" : "En attente"}
            </span>
            {p.excursion_count > 0 && (
              <span style={{ padding: "3px 9px", borderRadius: 18, fontSize: 11, fontWeight: 600, background: "rgba(43,150,168,.08)", color: "#2B96A8", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Map size={10} />
                {p.excursion_active}/{p.excursion_count} excursions
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Détails de base */}
      <div style={{ marginBottom: 16 }}>
        {[
          { Icon: MapPin,    label: "Ville",         val: p.city    || "—" },
          { Icon: Building2, label: "Adresse",       val: p.address || "—" },
          { Icon: Phone,     label: "Téléphone",     val: p.phone   || "—" },
          { Icon: Globe,     label: "Site web",      val: p.website || "—", link: p.website },
          { Icon: Star,      label: "Note moyenne",  val: p.rating  ? `${p.rating}/5` : "—" },
          { Icon: Calendar,  label: "Inscrit le",    val: new Date(p.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none", fontSize: 13 }}>
            <span style={{ color: "#6B7280", display: "flex", alignItems: "center", gap: 7 }}>
              <row.Icon size={13} color="#9CA3AF" /> {row.label}
            </span>
            {'link' in row && row.link ? (
              <a href={row.link} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: "#2B96A8", display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                {row.val} <ExternalLink size={10} />
              </a>
            ) : (
              <span style={{ fontWeight: 700, color: "#111827", textAlign: "right", maxWidth: 220, wordBreak: "break-word" }}>{row.val}</span>
            )}
          </div>
        ))}
      </div>

      {/* Section vérification authenticité */}
      <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={12} color="#059669" /> Vérification d'authenticité
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "white", borderRadius: 9, padding: "10px 12px", border: "1px solid #D1FAE5" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Année d'ouverture</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{p.year_founded || "—"}</p>
          </div>
          <div style={{ background: "white", borderRadius: 9, padding: "10px 12px", border: "1px solid #D1FAE5" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Patente / RNE</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", fontFamily: "monospace", wordBreak: "break-all" }}>{p.patente || "—"}</p>
          </div>
        </div>

        {/* Déclaration d'entreprise */}
        {p.declaration_url ? (
          <div style={{ marginTop: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Déclaration d'entreprise</p>
            <a href={p.declaration_url} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px",
              background: "white", border: "1px solid #BBF7D0", borderRadius: 9,
              fontSize: 12, fontWeight: 700, color: "#059669", textDecoration: "none",
            }}>
              <FileText size={13} /> Voir le document <ExternalLink size={11} />
            </a>
          </div>
        ) : (
          <p style={{ marginTop: 10, fontSize: 12, color: "#D97706", fontWeight: 600 }}>⚠️ Aucune déclaration uploadée</p>
        )}
      </div>

      {/* Photos de l'agence */}
      {p.agency_photos && p.agency_photos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <ImageIcon size={11} /> Photos de l'agence
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
            {p.agency_photos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block", aspectRatio: "1", borderRadius: 9, overflow: "hidden", border: "1px solid #E5E7EB" }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {p.description && (
        <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Description</p>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{p.description}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        <button
          className="pbtn pbtn-teal"
          style={{ flex: 1, padding: "11px", borderRadius: 9, fontFamily: "inherit" }}
          onClick={onEdit}
        >
          <Pencil size={13} /> Modifier
        </button>
        {!p.is_validated ? (
          <button
            className="pbtn pbtn-green"
            style={{ flex: 1, padding: "11px", borderRadius: 9, fontFamily: "inherit" }}
            onClick={onValidate}
            disabled={loading}
          >
            <CheckCircle size={13} />
            {loading ? "..." : "Valider"}
          </button>
        ) : (
          <button
            className="pbtn pbtn-gray"
            style={{ flex: 1, padding: "11px", borderRadius: 9, fontFamily: "inherit" }}
            onClick={onRevoke}
            disabled={loading}
          >
            <AlertTriangle size={13} />
            {loading ? "..." : "Révoquer"}
          </button>
        )}
        <button
          className="pbtn pbtn-red"
          style={{ padding: "11px 16px", borderRadius: 9, fontFamily: "inherit" }}
          onClick={onDelete}
          disabled={loading}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ── PRESTATAIRE EDIT FORM ──
export function PrestastaireEditForm({
  p,
  editFullName, setEditFullName,
  editAgency,   setEditAgency,
  editCity,     setEditCity,
  editPhone,    setEditPhone,
  editDesc,     setEditDesc,
  editAddress,  setEditAddress,
  editWebsite,  setEditWebsite,
  editPatente,  setEditPatente,
  editYear,     setEditYear,
  editLoading,
  onSave, onCancel,
  cities: CITIES,
}: {
  p: PrestastaireUIProps;
  editFullName: string;   setEditFullName: (v: string) => void;
  editAgency: string;     setEditAgency:   (v: string) => void;
  editCity: string;       setEditCity:     (v: string) => void;
  editPhone: string;      setEditPhone:    (v: string) => void;
  editDesc: string;       setEditDesc:     (v: string) => void;
  editAddress: string;    setEditAddress:  (v: string) => void;
  editWebsite: string;    setEditWebsite:  (v: string) => void;
  editPatente: string;    setEditPatente:  (v: string) => void;
  editYear: string;       setEditYear:     (v: string) => void;
  editLoading: boolean;
  onSave: () => void;
  onCancel: () => void;
  cities: string[];
}) {
  const name = p.agency_name || p.full_name || "—";
  const lbl: React.CSSProperties = { display:"block", fontSize:11, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:".5px", marginBottom:5 };

  return (
    <div style={{ padding: "0 26px 26px" }}>
      <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 18 }}>
        Modification de <strong style={{ color: "#111827" }}>{name}</strong>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>

        {/* Nom complet + Agence */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { label:"Nom complet",    val:editFullName, set:setEditFullName, ph:"Prénom Nom" },
            { label:"Nom de l'agence", val:editAgency,   set:setEditAgency,   ph:"Agence..." },
          ].map(f => (
            <div key={f.label}>
              <label style={lbl}>{f.label}</label>
              <input className="fi" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width:"100%" }} />
            </div>
          ))}
        </div>

        {/* Ville + Téléphone */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <label style={lbl}>Ville</label>
            <select className="fi" value={editCity} onChange={e => setEditCity(e.target.value)} style={{ cursor:"pointer", appearance:"none", width:"100%" }}>
              <option value="">Sélectionnez</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Téléphone</label>
            <input className="fi" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+216 XX XXX XXX" type="tel" style={{ width:"100%" }} />
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label style={lbl}>Adresse physique</label>
          <textarea className="fi" rows={2} value={editAddress} onChange={e => setEditAddress(e.target.value)}
            placeholder="Rue, immeuble, étage..." style={{ resize:"none", width:"100%", fontFamily:"inherit" }} />
        </div>

        {/* Site web */}
        <div>
          <label style={lbl}>Site web / Réseaux sociaux</label>
          <input className="fi" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="https://..." style={{ width:"100%" }} />
        </div>

        {/* Patente + Année */}
        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"12px 14px" }}>
          <p style={{ fontSize:10, fontWeight:700, color:"#065F46", textTransform:"uppercase", letterSpacing:".8px", marginBottom:10, display:"flex", alignItems:"center", gap:5 }}>
            <ShieldCheck size={11} color="#059669" /> Vérification authenticité
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ ...lbl, color:"#374151" }}>Patente / RNE</label>
              <input className="fi" value={editPatente} onChange={e => setEditPatente(e.target.value)} placeholder="1234567A/P/M/000" style={{ width:"100%", fontFamily:"monospace" }} />
            </div>
            <div>
              <label style={{ ...lbl, color:"#374151" }}>Année d'ouverture</label>
              <input className="fi" value={editYear} onChange={e => setEditYear(e.target.value)} placeholder="Ex : 2015" type="number" min="1970" max={new Date().getFullYear()} style={{ width:"100%" }} />
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={lbl}>Description</label>
          <textarea className="fi" rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)}
            placeholder="Description de l'activité..." style={{ resize:"vertical", width:"100%", fontFamily:"inherit" }} />
        </div>

      </div>
      <div style={{ display:"flex", gap:8, marginTop:18 }}>
        <button onClick={onCancel} style={{ flex:1, padding:"11px", background:"#F3F4F6", color:"#374151", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <X size={14} /> Annuler
        </button>
        <button onClick={onSave} disabled={editLoading} style={{ flex:2, padding:"11px", background:editLoading?"#9CA3AF":"#2B96A8", color:"white", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:editLoading?"not-allowed":"pointer", fontFamily:"inherit", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <Save size={14} /> {editLoading ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

// ── PRESTATAIRE MODAL ──
export function PrestastaireModal({
  p, mode, onModeChange, onClose, loading,
  editFullName, setEditFullName,
  editAgency,   setEditAgency,
  editCity,     setEditCity,
  editPhone,    setEditPhone,
  editDesc,     setEditDesc,
  editAddress,  setEditAddress,
  editWebsite,  setEditWebsite,
  editPatente,  setEditPatente,
  editYear,     setEditYear,
  editLoading,
  onValidate, onRevoke, onDelete, onSave,
  cities: CITIES,
}: {
  p: PrestastaireUIProps;
  mode: "view" | "edit";
  onModeChange: (m: "view" | "edit") => void;
  onClose: () => void;
  loading: boolean;
  editFullName: string;   setEditFullName: (v: string) => void;
  editAgency: string;     setEditAgency:   (v: string) => void;
  editCity: string;       setEditCity:     (v: string) => void;
  editPhone: string;      setEditPhone:    (v: string) => void;
  editDesc: string;       setEditDesc:     (v: string) => void;
  editAddress: string;    setEditAddress:  (v: string) => void;
  editWebsite: string;    setEditWebsite:  (v: string) => void;
  editPatente: string;    setEditPatente:  (v: string) => void;
  editYear: string;       setEditYear:     (v: string) => void;
  editLoading: boolean;
  onValidate: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  onSave: () => void;
  cities: string[];
}) {
  return (
    <div
      className="overlay"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal fu"
        style={{
          background: "white",
          borderRadius: 24,
          width: "100%",
          maxWidth: 560,
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.2)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "22px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 7 }}>
            <button
              onClick={() => onModeChange("view")}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                background: mode === "view" ? "#111827" : "#F3F4F6",
                color: mode === "view" ? "white" : "#6B7280",
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Eye size={13} /> Profil
            </button>
            <button
              onClick={() => onModeChange("edit")}
              style={{
                padding: "7px 16px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                background: mode === "edit" ? "#2B96A8" : "#F3F4F6",
                color: mode === "edit" ? "white" : "#6B7280",
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Pencil size={13} /> Modifier
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#F3F4F6",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        {mode === "view" ? (
          <PrestastaireDetails p={p} loading={loading} onEdit={() => onModeChange("edit")} onValidate={onValidate} onRevoke={onRevoke} onDelete={onDelete} />
        ) : (
          <PrestastaireEditForm
            p={p}
            editFullName={editFullName}   setEditFullName={setEditFullName}
            editAgency={editAgency}       setEditAgency={setEditAgency}
            editCity={editCity}           setEditCity={setEditCity}
            editPhone={editPhone}         setEditPhone={setEditPhone}
            editDesc={editDesc}           setEditDesc={setEditDesc}
            editAddress={editAddress}     setEditAddress={setEditAddress}
            editWebsite={editWebsite}     setEditWebsite={setEditWebsite}
            editPatente={editPatente}     setEditPatente={setEditPatente}
            editYear={editYear}           setEditYear={setEditYear}
            editLoading={editLoading}
            onSave={onSave}
            onCancel={() => onModeChange("view")}
            cities={CITIES}
          />
        )}
      </div>
    </div>
  );
}