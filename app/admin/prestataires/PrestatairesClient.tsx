"use client";

import { useState } from "react";
import { useCrudOperation } from "../../../lib/useCrudOperation";
import { useListFiltering } from "../../../lib/useListFiltering";
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

// ✅ Définir le type localement
type FilterType = "pending" | "validated" | "all";

export default function PrestatairesClient({ prestataires: initial }: { prestataires: Prestataire[] }) {
  const { loading, data: prestataires, execute } = useCrudOperation(initial, async (payload) => {
    const res = await fetch("/api/admin/validate-prestataire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: payload.id, action: payload.action }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erreur");
    return json;
  });

  const [selected, setSelected] = useState<Prestataire | null>(null);
  const [mode, setMode]         = useState<"view" | "edit">("view");
  const [editFullName, setEditFullName] = useState("");
  const [editAgency,   setEditAgency]   = useState("");
  const [editCity,     setEditCity]     = useState("");
  const [editPhone,    setEditPhone]    = useState("");
  const [editDesc,     setEditDesc]     = useState("");
  const [editLoading,  setEditLoading]  = useState(false);

  const { toast, showToast } = useToast();

  // ✅ Utilise un seul type générique et caste les valeurs si nécessaire
  const {
    search,
    setSearch,
    filter,
    setFilter,
    cityFilter,
    setCityFilter,
    filtered,
    cities,
  } = useListFiltering<Prestataire>({
    data: prestataires,
    searchFields: ["agency_name", "full_name", "city"],
    filterFn: (item, value) =>
      value === "pending"
        ? !item.is_validated
        : value === "validated"
        ? item.is_validated
        : true,
    initialFilter: "pending",
  });

  // ✅ Fonction wrapper pour convertir le type
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  const openModal = (p: Prestataire, m: "view" | "edit" = "view") => {
    setSelected(p); setMode(m);
    setEditFullName(p.full_name || ""); setEditAgency(p.agency_name || "");
    setEditCity(p.city || ""); setEditPhone(p.phone || ""); setEditDesc(p.description || "");
  };

  const handleValidate = async (userId: string, name: string) => {
    await execute(userId, { id: userId, action: "validate" }, {
      onSuccess: (items) => {
        if (selected?.user_id === userId) {
          setSelected({ ...selected, is_validated: true });
        }
        return items.map((p) =>
          p.user_id === userId ? { ...p, is_validated: true } : p,
        );
      },
      successMessage: `${name} validé avec succès`,
      errorPrefix: "Validation",
    });
  };

  const handleRevoke = async (userId: string, name: string) => {
    await execute(userId, { id: userId, action: "revoke" }, {
      confirmMessage: `Révoquer l'accès de ${name} ?`,
      onSuccess: (items) => {
        if (selected?.user_id === userId) {
          setSelected({ ...selected, is_validated: false });
        }
        return items.map((p) =>
          p.user_id === userId ? { ...p, is_validated: false } : p,
        );
      },
      successMessage: `Accès de ${name} révoqué`,
      errorPrefix: "Révocation",
    });
  };

  const handleDelete = async (userId: string, name: string) => {
    await execute(userId, { id: userId, action: "delete" }, {
      confirmMessage: `Supprimer définitivement ${name} ? Irréversible.`,
      onSuccess: (items) => {
        if (selected?.user_id === userId) {
          setSelected(null);
        }
        return items.filter((p) => p.user_id !== userId);
      },
      successMessage: `${name} supprimé`,
      errorPrefix: "Suppression",
    });
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
      
      await execute(selected.user_id, { 
        id: selected.user_id, 
        action: "update",
        value: updated 
      }, {
        onSuccess: (items) => {
          return items.map(p => p.user_id === selected.user_id ? updated : p);
        },
        successMessage: "Profil mis à jour",
      });
      
      setSelected(updated);
      setMode("view");
    } catch (e) { 
      showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); 
    }
    setEditLoading(false);
  };

  const counts = {
    pending:   prestataires.filter(p => !p.is_validated).length,
    validated: prestataires.filter(p => p.is_validated).length,
    all:       prestataires.length,
  };

  return (
    <>
      <Toast toast={toast} />

      <div style={{ background: "white", borderRadius: 16, border: "1px solid #F3F4F6", padding: "16px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, agence, ville..." />
          <CityFilter value={cityFilter} onChange={setCityFilter} cities={cities} />
          <div style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0 }} />
          {/* ✅ Utilise handleFilterChange qui a le bon type */}
          <FilterTabs value={filter as FilterType} onChange={handleFilterChange} counts={counts} />
        </div>

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