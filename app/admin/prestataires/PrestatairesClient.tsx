"use client";

import { useState } from "react";
import { useCrudOperation } from "../../../lib/useCrudOperation";
import { useListFiltering } from "../../../lib/useListFiltering";
import { useToast } from "../../../lib/useToast";
import { Toast } from "../../components/ui/Toast";
import { Search, X } from "lucide-react";
import {
  EmptyPrestataires,
  PrestastaireCard,
  PrestastaireModal,
} from "../../components/admin/PrestatairesUI";

const CITIES = [
  "Tunis","Sfax","Sousse","Kairouan","Hammamet",
  "Tozeur","Djerba","Tataouine","Gafsa","Douz",
];

interface Prestataire {
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
  year_founded: number | null;
  patente: string | null;
  agency_photos: string[] | null;
  declaration_url: string | null;
  profil_complete: boolean | null;
  // ── Email récupéré depuis auth.users côté serveur ──
  email?: string | null;
}

type FilterType = "pending" | "validated" | "all";

export default function PrestatairesClient({
  prestataires: initial,
}: {
  prestataires: Prestataire[];
}) {
  const { loading, data: prestataires, execute } = useCrudOperation(
    initial,
    async (payload) => {
      const res = await fetch("/api/admin/validate-prestataire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: payload.id, action: payload.action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      return json;
    }
  );

  const [selected, setSelected]           = useState<Prestataire | null>(null);
  const [mode, setMode]                   = useState<"view" | "edit">("view");

  // ── Champs d'édition profil ──────────────────────────────────────────
  const [editFullName,  setEditFullName]  = useState("");
  const [editAgency,    setEditAgency]    = useState("");
  const [editCity,      setEditCity]      = useState("");
  const [editPhone,     setEditPhone]     = useState("");
  const [editDesc,      setEditDesc]      = useState("");
  const [editAddress,   setEditAddress]   = useState("");
  const [editWebsite,   setEditWebsite]   = useState("");
  const [editPatente,   setEditPatente]   = useState("");
  const [editYear,      setEditYear]      = useState("");

  // ── Champ email (auth.users) ─────────────────────────────────────────
  const [editEmail,     setEditEmail]     = useState("");

  const [editLoading,   setEditLoading]   = useState(false);

  const { toast, showToast } = useToast();

  const {
    search, setSearch,
    filter, setFilter,
    cityFilter, setCityFilter,
    filtered, cities,
  } = useListFiltering<Prestataire>({
    data: prestataires,
    searchFields: ["agency_name", "full_name", "city"],
    filterFn: (item, value) =>
      value === "pending"   ? !item.is_validated :
      value === "validated" ?  item.is_validated : true,
    initialFilter: "pending",
  });

  const counts = {
    pending:   prestataires.filter(p => !p.is_validated).length,
    validated: prestataires.filter(p =>  p.is_validated).length,
    all:       prestataires.length,
  };

  // ── Ouvrir modal ─────────────────────────────────────────────────────
  const openModal = (p: Prestataire, m: "view" | "edit" = "view") => {
    setSelected(p);
    setMode(m);
    setEditFullName(p.full_name    || "");
    setEditAgency(p.agency_name    || "");
    setEditCity(p.city             || "");
    setEditPhone(p.phone           || "");
    setEditDesc(p.description      || "");
    setEditAddress(p.address       || "");
    setEditWebsite(p.website       || "");
    setEditPatente(p.patente       || "");
    setEditYear(p.year_founded ? String(p.year_founded) : "");
    setEditEmail(p.email           || "");  // ← initialiser l'email
  };

  // ── Valider ──────────────────────────────────────────────────────────
  const handleValidate = async (userId: string, name: string) => {
    await execute(userId, { id: userId, action: "validate" }, {
      onSuccess: (items) => {
        if (selected?.user_id === userId)
          setSelected({ ...selected, is_validated: true });
        return items.map(p =>
          p.user_id === userId ? { ...p, is_validated: true } : p
        );
      },
      successMessage: `${name} validé avec succès`,
      errorPrefix: "Validation",
    });
  };

  // ── Révoquer ─────────────────────────────────────────────────────────
  const handleRevoke = async (userId: string, name: string) => {
    await execute(userId, { id: userId, action: "revoke" }, {
      confirmMessage: `Révoquer l'accès de ${name} ?`,
      onSuccess: (items) => {
        if (selected?.user_id === userId)
          setSelected({ ...selected, is_validated: false });
        return items.map(p =>
          p.user_id === userId ? { ...p, is_validated: false } : p
        );
      },
      successMessage: `Accès de ${name} révoqué`,
      errorPrefix: "Révocation",
    });
  };

  // ── Supprimer ────────────────────────────────────────────────────────
  const handleDelete = async (userId: string, name: string) => {
    await execute(userId, { id: userId, action: "delete" }, {
      confirmMessage: `Supprimer définitivement ${name} ? Irréversible.`,
      onSuccess: (items) => {
        if (selected?.user_id === userId) setSelected(null);
        return items.filter(p => p.user_id !== userId);
      },
      successMessage: `${name} supprimé`,
      errorPrefix: "Suppression",
    });
  };

  // ── Sauvegarder les modifications ────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!selected) return;
    setEditLoading(true);
    try {
      // ── 1. Mettre à jour l'email dans auth.users si modifié ──────────
      const emailChanged =
        editEmail.trim() !== "" && editEmail.trim() !== (selected.email ?? "");

      if (emailChanged) {
        const emailRes = await fetch("/api/admin/update-prestataire-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selected.user_id,
            email:  editEmail.trim(),
          }),
        });
        if (!emailRes.ok) {
          const j = await emailRes.json();
          throw new Error(j.error || "Erreur mise à jour email");
        }
      }

      // ── 2. Mettre à jour le profil (table profiles) ──────────────────
      const res = await fetch("/api/admin/update-prestataire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.user_id,
          updates: {
            full_name:    editFullName,
            agency_name:  editAgency,
            city:         editCity,
            phone:        editPhone,
            description:  editDesc,
            address:      editAddress,
            website:      editWebsite,
            patente:      editPatente,
            year_founded: editYear ? Number(editYear) : null,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      const updated: Prestataire = {
        ...selected,
        full_name:    editFullName,
        agency_name:  editAgency,
        city:         editCity,
        phone:        editPhone,
        description:  editDesc,
        address:      editAddress,
        website:      editWebsite,
        patente:      editPatente,
        year_founded: editYear ? Number(editYear) : null,
        email:        emailChanged ? editEmail.trim() : selected.email,
      };

      await execute(
        selected.user_id,
        { id: selected.user_id, action: "update", value: updated },
        {
          onSuccess: (items) =>
            items.map(p => p.user_id === selected.user_id ? updated : p),
          successMessage: "Profil mis à jour",
        }
      );

      setSelected(updated);
      setMode("view");
    } catch (e) {
      showToast(
        `Erreur : ${e instanceof Error ? e.message : "Erreur inconnue"}`,
        "error"
      );
    }
    setEditLoading(false);
  };

  const hasActiveFilters = search || cityFilter;

  return (
    <>
      <style>{`
        /* ── Filter bar ── */
        .pbar {
          background: white; border-radius: 14px;
          border: 1px solid #EEF2FF; padding: 14px 16px;
          margin-bottom: 12px; box-shadow: 0 2px 8px rgba(5,51,102,.04);
        }

        /* ── Search input ── */
        .psearch-wrap { position: relative; flex: 1; min-width: 180px; }
        .psearch-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .psearch {
          width: 100%; padding: 8px 12px 8px 34px; border-radius: 9px;
          border: 1px solid #EEF2FF; font-size: 12px; font-family: inherit;
          color: #053366; background: #F8FAFF; outline: none;
          transition: border-color .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .psearch::placeholder { color: #9CA3AF; }
        .psearch:focus { border-color: #02AFCF; box-shadow: 0 0 0 3px rgba(2,175,207,.1); background: white; }

        /* ── City select ── */
        .pcity {
          padding: 8px 12px; border-radius: 9px;
          border: 1px solid #EEF2FF; font-size: 12px; font-family: inherit;
          color: #374151; background: #F8FAFF; outline: none; cursor: pointer;
          transition: border-color .2s;
        }
        .pcity:focus { border-color: #02AFCF; }

        /* ── Filter tabs ── */
        .ptab {
          padding: 6px 13px; border-radius: 8px; border: 1px solid #EEF2FF;
          cursor: pointer; font-size: 12px; font-weight: 700; font-family: inherit;
          transition: all .2s; display: inline-flex; align-items: center; gap: 6px;
          white-space: nowrap;
        }
        .ptab.on  { background: linear-gradient(135deg,#02AFCF,#259FFC); color: white; border-color: transparent; box-shadow: 0 2px 8px rgba(2,175,207,.3); }
        .ptab:not(.on) { background: white; color: #6B7280; }
        .ptab:not(.on):hover { background: #F8FAFF; border-color: #DCE5FF; color: #053366; }

        .ptab-count {
          font-size: 10px; border-radius: 10px; padding: 1px 6px; font-weight: 800;
        }

        /* ── Clear filters ── */
        .pclear {
          font-size: 11px; color: #259FFC; background: none; border: none;
          cursor: pointer; font-family: inherit; font-weight: 700; padding: 0;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .pclear:hover { color: #02AFCF; }

        /* ── Divider ── */
        .pdivider { width: 1px; height: 28px; background: #EEF2FF; flex-shrink: 0; }
      `}</style>

      <Toast toast={toast} />

      {/* ── Filter bar ── */}
      <div className="pbar">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>

          {/* Search */}
          <div className="psearch-wrap">
            <Search size={13} color="#9CA3AF" className="psearch-icon" />
            <input
              className="psearch"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, agence, ville…"
            />
          </div>

          {/* City filter */}
          {cities.length > 0 && (
            <select
              className="pcity"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
            >
              <option value="">Toutes les villes</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <div className="pdivider" />

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { key: "pending"   as FilterType, label: "En attente", count: counts.pending   },
              { key: "validated" as FilterType, label: "Validés",    count: counts.validated },
              { key: "all"       as FilterType, label: "Tous",       count: counts.all       },
            ]).map(({ key, label, count }) => (
              <button
                key={key}
                className={`ptab ${filter === key ? "on" : ""}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span
                  className="ptab-count"
                  style={{
                    background: filter === key ? "rgba(255,255,255,.25)" : "#EEF2FF",
                    color:      filter === key ? "white" : "#6B7280",
                  }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Résumé filtres actifs */}
        {(hasActiveFilters || filter !== "all") && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginTop: 12, paddingTop: 12, borderTop: "1px solid #EEF2FF",
          }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>
              {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <button
                className="pclear"
                onClick={() => { setSearch(""); setCityFilter(""); }}
              >
                <X size={11} /> Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Liste ── */}
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
              onValidate={() =>
                handleValidate(
                  p.user_id,
                  p.agency_name || p.full_name || "Sans nom"
                )
              }
              onRevoke={() =>
                handleRevoke(
                  p.user_id,
                  p.agency_name || p.full_name || "Sans nom"
                )
              }
              onDelete={() =>
                handleDelete(
                  p.user_id,
                  p.agency_name || p.full_name || "Sans nom"
                )
              }
            />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {selected && (
        <PrestastaireModal
          p={selected}
          mode={mode}
          onModeChange={setMode}
          onClose={() => setSelected(null)}
          loading={loading === selected.user_id}
          editFullName={editFullName}   setEditFullName={setEditFullName}
          editAgency={editAgency}       setEditAgency={setEditAgency}
          editCity={editCity}           setEditCity={setEditCity}
          editPhone={editPhone}         setEditPhone={setEditPhone}
          editDesc={editDesc}           setEditDesc={setEditDesc}
          editAddress={editAddress}     setEditAddress={setEditAddress}
          editWebsite={editWebsite}     setEditWebsite={setEditWebsite}
          editPatente={editPatente}     setEditPatente={setEditPatente}
          editYear={editYear}           setEditYear={setEditYear}
          editEmail={editEmail}         setEditEmail={setEditEmail}
          editLoading={editLoading}
          onValidate={() =>
            handleValidate(
              selected.user_id,
              selected.agency_name || selected.full_name || "—"
            )
          }
          onRevoke={() =>
            handleRevoke(
              selected.user_id,
              selected.agency_name || selected.full_name || "—"
            )
          }
          onDelete={() =>
            handleDelete(
              selected.user_id,
              selected.agency_name || selected.full_name || "—"
            )
          }
          onSave={handleSaveEdit}
          cities={CITIES}
        />
      )}
    </>
  );
}