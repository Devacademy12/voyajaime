"use client";

import { useState } from "react";
import { useToast } from "../../../lib/useToast";
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

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

export default function AdminExcursionsClient({ excursions: initial }: { excursions: Excursion[] }) {
  const [excursions, setExcursions] = useState(initial);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const { toast, showToast } = useToast();
  const [view, setView]       = useState<"grid" | "list">("grid");

  const callApi = async (id: string, action: string, value?: boolean) => {
    const res = await fetch("/api/admin/manage-excursion", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excursionId: id, action, value }),
    });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setLoading(id);
    try {
      await callApi(id, "toggle", !current);
      setExcursions(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
      showToast(!current ? "Excursion activée" : "Excursion désactivée");
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    setLoading(id);
    try {
      await callApi(id, "delete");
      setExcursions(prev => prev.filter(e => e.id !== id));
      showToast("Excursion supprimée");
    } catch (e) { showToast(`Erreur : ${e instanceof Error ? e.message : "Erreur"}`, false); }
    setLoading(null);
  };

  const filtered = excursions.filter(e => {
    const mf = filter === "active" ? e.is_active : filter === "draft" ? !e.is_active : true;
    const q  = search.toLowerCase();
    const ms = !search || e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.prestataire_name.toLowerCase().includes(q);
    return mf && ms;
  });

  const counts = { all: excursions.length, active: excursions.filter(e => e.is_active).length, draft: excursions.filter(e => !e.is_active).length };

  return (
    <>
      <style>{`
        .etab{padding:8px 16px;border-radius:20px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s;border:1px solid #E5E7EB;display:inline-flex;align-items:center;gap:6px}
        .etab.on{background:#2B96A8;color:white;border-color:#2B96A8}
        .etab:not(.on){background:white;color:#6B7280}
        .etab:not(.on):hover{background:#F9FAFB}
        .ecard{border-radius:18px;overflow:hidden;background:white;border:1px solid #F0F0F0;transition:all .25s;position:relative}
        .ecard:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,.1)}
        .ecard-img{width:100%;height:190px;object-fit:cover;display:block;transition:transform .4s}
        .ecard:hover .ecard-img{transform:scale(1.04)}
        .ebtn{padding:7px 12px;border-radius:9px;border:1px solid #E5E7EB;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s;background:white;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
        .ebtn:disabled{opacity:.5;cursor:not-allowed}
        .erow{display:flex;align-items:center;gap:14px;padding:14px 18px;transition:background .15s;border-bottom:1px solid #F3F4F6;cursor:pointer}
        .erow:last-child{border-bottom:none}
        .erow:hover{background:#FAFAFA}
        .toast-w{position:fixed;top:24px;right:24px;z-index:999;padding:13px 20px;border-radius:14px;font-size:14px;font-weight:600;font-family:inherit;box-shadow:0 8px 30px rgba(0,0,0,.12);animation:tin .3s ease;display:flex;align-items:center;gap:8px}
        @keyframes tin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .badge-count{font-size:11px;border-radius:12px;padding:1px 7px;font-weight:800}
      `}</style>

      <Toast toast={toast} />

      {/* Toolbar */}
      <ExcursionToolbar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} view={view} setView={setView} counts={counts} />

      {filtered.length === 0 ? (
        <EmptyExcursions />
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {filtered.map(exc => (
            <ExcursionGridCard key={exc.id} exc={exc} loading={loading} onToggle={toggleActive} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #F3F4F6", overflow: "hidden" }}>
          {filtered.map(exc => (
            <ExcursionRow key={exc.id} exc={exc} loading={loading} onToggle={toggleActive} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  );
}