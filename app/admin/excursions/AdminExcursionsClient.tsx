"use client";

import { useState } from "react";
import { useToast } from "../../../lib/useToast";
import { useCrudOperation } from "../../../lib/useCrudOperation";
import { apiPost } from "../../../lib/api";
import { Toast } from "../../components/ui";
import {
  ExcursionToolbar, ExcursionGridCard, ExcursionRow, EmptyExcursions,
} from "../../components/admin/ExcursionListUI";

interface Excursion {
  id: string; title: string; city: string; duration_hours: number;
  price_per_person: number; max_people: number; rating: number;
  reviews_count: number; is_active: boolean; prestataire_name: string;
  photos: string[]; categories: string[];
}

export default function AdminExcursionsClient({ excursions: initial }: { excursions: Excursion[] }) {
  const [excursions, setExcursions] = useState(initial);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const [view, setView]       = useState<"grid" | "list">("grid");
  
  const { execute } = useCrudOperation(initial, async (payload) => {
    return apiPost("/api/admin/manage-excursion", payload);
  });

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(id);
    try {
      await execute(id, {
        action: "toggle",
        id: id,
        value: { is_active: !current }
      }, {
        successMessage: !current ? "Excursion activée" : "Excursion désactivée",
        // ✅ Correction : onSuccess doit RETOURNER le nouveau tableau
        onSuccess: (prev) => prev.map(e => e.id === id ? { ...e, is_active: !current } : e)
      });
    } catch (e) {
      showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    setLoading(id);
    try {
      await execute(id, {
        action: "delete",
        id: id,
        value: { id }
      }, {
        confirmMessage: `Supprimer "${title}" ?`,
        successMessage: "Excursion supprimée",
        // ✅ Correction : onSuccess doit RETOURNER le nouveau tableau
        onSuccess: (prev) => prev.filter(e => e.id !== id)
      });
    } catch (e) {
      showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false);
    } finally {
      setLoading(null);
    }
  };

  const filtered = excursions.filter(e => {
    const mf = filter === "active" ? e.is_active : filter === "draft" ? !e.is_active : true;
    const q  = search.toLowerCase();
    const ms = !search || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.prestataire_name.toLowerCase().includes(q);
    return mf && ms;
  });

  const counts = { 
    all: excursions.length, 
    active: excursions.filter(e => e.is_active).length, 
    draft: excursions.filter(e => !e.is_active).length 
  };

  return (
    <>
      <Toast toast={toast} />

      <ExcursionToolbar 
        search={search} 
        setSearch={setSearch} 
        filter={filter} 
        setFilter={setFilter} 
        view={view} 
        setView={setView} 
        counts={counts} 
      />

      {filtered.length === 0 ? (
        <EmptyExcursions />
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {filtered.map(exc => (
            <ExcursionGridCard 
              key={exc.id} 
              exc={exc} 
              loading={loading} 
              onToggle={toggleActive} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #F3F4F6", overflow: "hidden" }}>
          {filtered.map(exc => (
            <ExcursionRow 
              key={exc.id} 
              exc={exc} 
              loading={loading} 
              onToggle={toggleActive} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </>
  );
}