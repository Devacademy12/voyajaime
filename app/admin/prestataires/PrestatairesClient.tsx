"use client";

import { useState } from "react";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui/Toast";
import {
  SearchBar,
  CityFilter,
  FilterTabs,
  EmptyPrestataires,
  PrestastaireCard,
  PrestastaireModal,
} from "../../components/admin/PrestatairesUI";

const CITIES = ["Tunis","Sfax","Sousse","Kairouan","Hammamet","Tozeur","Djerba","Tataouine","Gafsa","Douz"];

interface Prestataire {
  id: string; user_id: string; full_name: string | null;
  agency_name: string | null; city: string | null;
  description: string | null; phone: string | null;
  avatar_url: string | null; is_validated: boolean;
  rating: number | null; created_at: string;
  excursion_count: number; excursion_active: number;
}
type Filter = "pending" | "validated" | "all";

export default function PrestatairesClient({ prestataires: initial }: { prestataires: Prestataire[] }) {
  const [prestataires, setPrestataires] = useState(initial);
  const [filter, setFilter]     = useState<Filter>("pending");
  const [search, setSearch]     = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [loading, setLoading]   = useState<string | null>(null);
  const [selected, setSelected] = useState<Prestataire | null>(null);
  const [mode, setMode]         = useState<"view" | "edit">("view");
  const [editFullName, setEditFullName] = useState("");
  const [editAgency,   setEditAgency]   = useState("");
  const [editCity,     setEditCity]     = useState("");
  const [editPhone,    setEditPhone]    = useState("");
  const [editDesc,     setEditDesc]     = useState("");
  const [editLoading,  setEditLoading]  = useState(false);

  const { toast, showToast } = useToast();

  const openModal = (p: Prestataire, m: "view" | "edit" = "view") => {
    setSelected(p); setMode(m);
    setEditFullName(p.full_name || ""); setEditAgency(p.agency_name || "");
    setEditCity(p.city || ""); setEditPhone(p.phone || ""); setEditDesc(p.description || "");
  };

  const callApi = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/validate-prestataire", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Erreur"); }
  };

  const handleValidate = async (userId: string, name: string) => {
    setLoading(userId);
    try {
      await callApi(userId, "validate");
      setPrestataires(prev => prev.map(p => p.user_id === userId ? { ...p, is_validated: true } : p));
      if (selected?.user_id === userId) setSelected(s => s ? { ...s, is_validated: true } : null);
      showToast(`${name} validé avec succès`);
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleRevoke = async (userId: string, name: string) => {
    if (!confirm(`Révoquer l'accès de ${name} ?`)) return;
    setLoading(userId);
    try {
      await callApi(userId, "revoke");
      setPrestataires(prev => prev.map(p => p.user_id === userId ? { ...p, is_validated: false } : p));
      if (selected?.user_id === userId) setSelected(s => s ? { ...s, is_validated: false } : null);
      showToast(`Accès de ${name} révoqué`);
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Supprimer définitivement ${name} ? Irréversible.`)) return;
    setLoading(userId);
    try {
      await callApi(userId, "delete");
      setPrestataires(prev => prev.filter(p => p.user_id !== userId));
      setSelected(null);
      showToast(`${name} supprimé`);
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/update-prestataire", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.user_id,
          updates: { full_name: editFullName, agency_name: editAgency, city: editCity, phone: editPhone, description: editDesc },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = { ...selected, full_name: editFullName, agency_name: editAgency, city: editCity, phone: editPhone, description: editDesc };
      setPrestataires(prev => prev.map(p => p.user_id === selected.user_id ? updated : p));
      setSelected(updated); setMode("view");
      showToast("Profil mis à jour");
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setEditLoading(false);
  };

  const filtered = prestataires.filter(p => {
    const statusOk = filter === "pending" ? !p.is_validated : filter === "validated" ? p.is_validated : true;
    const name = (p.agency_name || p.full_name || "").toLowerCase();
    const searchOk = !search || name.includes(search.toLowerCase()) || (p.city||"").toLowerCase().includes(search.toLowerCase());
    const cityOk = !cityFilter || p.city === cityFilter;
    return statusOk && searchOk && cityOk;
  });

  const cities = [...new Set(prestataires.map(p => p.city).filter(Boolean))].sort() as string[];
  const counts = {
    pending:   prestataires.filter(p => !p.is_validated).length,
    validated: prestataires.filter(p => p.is_validated).length,
    all:       prestataires.length,
  };

  return (
    <>
      <Toast toast={toast} />

      {/* ── BARRE FILTRES ── */}
      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F3F4F6", padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, agence, ville..." />
          <CityFilter value={cityFilter} onChange={setCityFilter} cities={cities} />
          <div style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0 }} />
          <FilterTabs value={filter} onChange={setFilter} counts={counts} />
        </div>

        {/* Résumé actif */}
        {(search || cityFilter || filter !== "all") && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
            {(search || cityFilter) && (
              <button
                onClick={() => { setSearch(""); setCityFilter(""); }}
                style={{ fontSize: 11, color: "#2B96A8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, padding: 0, display: "flex", alignItems: "center", gap: 4 }}
              >
                ✕ Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── LISTE ── */}
      {filtered.length === 0 ? (
        <EmptyPrestataires filter={filter} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(p => (
            <PrestastaireCard
              key={p.user_id}
              p={p}
              isLoading={loading === p.user_id}
              onViewEdit={() => openModal(p, "view")}
              onValidate={() => {
                const name = p.agency_name || p.full_name || "Sans nom";
                handleValidate(p.user_id, name);
              }}
              onRevoke={() => {
                const name = p.agency_name || p.full_name || "Sans nom";
                handleRevoke(p.user_id, name);
              }}
              onDelete={() => {
                const name = p.agency_name || p.full_name || "Sans nom";
                handleDelete(p.user_id, name);
              }}
            />
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {selected && (
        <PrestastaireModal
          p={selected}
          mode={mode}
          onModeChange={setMode}
          onClose={() => setSelected(null)}
          loading={loading === selected.user_id}
          editFullName={editFullName}
          setEditFullName={setEditFullName}
          editAgency={editAgency}
          setEditAgency={setEditAgency}
          editCity={editCity}
          setEditCity={setEditCity}
          editPhone={editPhone}
          setEditPhone={setEditPhone}
          editDesc={editDesc}
          setEditDesc={setEditDesc}
          editLoading={editLoading}
          onValidate={() => {
            const name = selected.agency_name || selected.full_name || "—";
            handleValidate(selected.user_id, name);
          }}
          onRevoke={() => {
            const name = selected.agency_name || selected.full_name || "—";
            handleRevoke(selected.user_id, name);
          }}
          onDelete={() => {
            const name = selected.agency_name || selected.full_name || "—";
            handleDelete(selected.user_id, name);
          }}
          onSave={handleSaveEdit}
          cities={CITIES}
        />
      )}
    </>
  );
}