"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, Building2, Check, X } from "lucide-react";

const TEAL = "#0BBEC9";
const TEAL_LIGHT = "#E0F7F8";
const TEAL_DARK = "#062830";

const initCategories = [
  { id: 1, nom: "Culture & Histoire", emoji: "🏛️", excursions: 48 },
  { id: 2, nom: "Nature & Randonnée", emoji: "🌲", excursions: 35 },
  { id: 3, nom: "Sport & Aventure", emoji: "🏄", excursions: 29 },
  { id: 4, nom: "Gastronomie", emoji: "🍽️", excursions: 22 },
  { id: 5, nom: "Artisanat", emoji: "🏺", excursions: 17 },
  { id: 6, nom: "Bien-être & Spa", emoji: "🧘", excursions: 14 },
];

const initVilles = [
  { id: 1, nom: "Tunis", region: "Grand Tunis", excursions: 87, active: true },
  { id: 2, nom: "Sfax", region: "Sfax", excursions: 43, active: true },
  { id: 3, nom: "Sousse", region: "Sahel", excursions: 61, active: true },
  { id: 4, nom: "Hammamet", region: "Cap Bon", excursions: 38, active: true },
  { id: 5, nom: "Djerba", region: "Médenine", excursions: 52, active: true },
  { id: 6, nom: "Tabarka", region: "Jendouba", excursions: 27, active: false },
  { id: 7, nom: "Nabeul", region: "Cap Bon", excursions: 34, active: true },
  { id: 8, nom: "Bizerte", region: "Bizerte", excursions: 19, active: false },
];

function EditableRow({
  value, onSave, onCancel,
}: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex items-center gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)}
        className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
        style={{ border: `1px solid ${TEAL}`, color: TEAL_DARK }}
        autoFocus />
      <button onClick={() => onSave(v)} className="p-1.5 rounded-lg" style={{ background: "#D1FAE5", color: "#059669" }}>
        <Check size={14} />
      </button>
      <button onClick={onCancel} className="p-1.5 rounded-lg" style={{ background: "#FEE2E2", color: "#DC2626" }}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function ConfigurationPage() {
  const [tab, setTab] = useState<"categories" | "villes">("categories");
  const [categories, setCategories] = useState(initCategories);
  const [villes, setVilles] = useState(initVilles);
  const [editingCat, setEditingCat] = useState<number | null>(null);
  const [editingVille, setEditingVille] = useState<number | null>(null);
  const [newCat, setNewCat] = useState(false);
  const [newVille, setNewVille] = useState(false);
  const [newCatVal, setNewCatVal] = useState("");
  const [newVilleVal, setNewVilleVal] = useState("");

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEAL_DARK, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Configurer l'Application
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
          Gérez les catégories et les villes disponibles sur Voyajaime
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: TEAL_LIGHT }}>
        {[{ key: "categories", label: "Catégories", icon: Tag }, { key: "villes", label: "Villes", icon: Building2 }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as "categories" | "villes")}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: tab === key ? TEAL : "transparent", color: tab === key ? "white" : TEAL }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(11,190,201,0.1)", boxShadow: "0 2px 12px rgba(11,190,201,0.04)" }}>
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(11,190,201,0.1)" }}>
            <p className="font-bold text-sm" style={{ color: TEAL_DARK }}>{categories.length} catégories</p>
            <button onClick={() => setNewCat(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${TEAL}, #089AA8)` }}>
              <Plus size={15} /> Ajouter
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(11,190,201,0.06)" }}>
            {newCat && (
              <div className="p-4 flex items-center gap-4" style={{ background: TEAL_LIGHT }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "white" }}>❓</div>
                <div className="flex-1">
                  <EditableRow value="" onSave={(v) => {
                    setCategories([...categories, { id: Date.now(), nom: v, emoji: "📌", excursions: 0 }]);
                    setNewCat(false);
                  }} onCancel={() => setNewCat(false)} />
                </div>
              </div>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: TEAL_LIGHT }}>
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  {editingCat === cat.id ? (
                    <EditableRow value={cat.nom}
                      onSave={(v) => { setCategories(categories.map((c) => c.id === cat.id ? { ...c, nom: v } : c)); setEditingCat(null); }}
                      onCancel={() => setEditingCat(null)} />
                  ) : (
                    <>
                      <p className="font-semibold text-sm" style={{ color: TEAL_DARK }}>{cat.nom}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{cat.excursions} excursions</p>
                    </>
                  )}
                </div>
                {editingCat !== cat.id && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setEditingCat(cat.id)}
                      className="p-2 rounded-lg transition-all hover:bg-blue-50"
                      style={{ color: "#3B82F6" }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setCategories(categories.filter((c) => c.id !== cat.id))}
                      className="p-2 rounded-lg transition-all hover:bg-red-50"
                      style={{ color: "#EF4444" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Villes Tab */}
      {tab === "villes" && (
        <div className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(11,190,201,0.1)", boxShadow: "0 2px 12px rgba(11,190,201,0.04)" }}>
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(11,190,201,0.1)" }}>
            <p className="font-bold text-sm" style={{ color: TEAL_DARK }}>{villes.length} villes · {villes.filter((v) => v.active).length} actives</p>
            <button onClick={() => setNewVille(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${TEAL}, #089AA8)` }}>
              <Plus size={15} /> Ajouter
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(11,190,201,0.06)" }}>
            {newVille && (
              <div className="p-4 flex items-center gap-4" style={{ background: TEAL_LIGHT }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "white" }}>
                  <Building2 size={18} style={{ color: TEAL }} />
                </div>
                <div className="flex-1">
                  <EditableRow value="" onSave={(v) => {
                    setVilles([...villes, { id: Date.now(), nom: v, region: "—", excursions: 0, active: true }]);
                    setNewVille(false);
                  }} onCancel={() => setNewVille(false)} />
                </div>
              </div>
            )}
            {villes.map((ville) => (
              <div key={ville.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: ville.active ? TEAL_LIGHT : "#F1F5F9" }}>
                  <Building2 size={18} style={{ color: ville.active ? TEAL : "#94a3b8" }} />
                </div>
                <div className="flex-1 min-w-0">
                  {editingVille === ville.id ? (
                    <EditableRow value={ville.nom}
                      onSave={(v) => { setVilles(villes.map((vl) => vl.id === ville.id ? { ...vl, nom: v } : vl)); setEditingVille(null); }}
                      onCancel={() => setEditingVille(null)} />
                  ) : (
                    <>
                      <p className="font-semibold text-sm" style={{ color: TEAL_DARK }}>{ville.nom}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{ville.region} · {ville.excursions} excursions</p>
                    </>
                  )}
                </div>
                {editingVille !== ville.id && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle actif/inactif */}
                    <button onClick={() => setVilles(villes.map((vl) => vl.id === ville.id ? { ...vl, active: !vl.active } : vl))}
                      className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                      style={{ background: ville.active ? TEAL : "#E2E8F0" }}>
                      <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                        style={{ left: ville.active ? "calc(100% - 18px)" : "2px" }} />
                    </button>
                    <button onClick={() => setEditingVille(ville.id)}
                      className="p-2 rounded-lg transition-all hover:bg-blue-50"
                      style={{ color: "#3B82F6" }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setVilles(villes.filter((vl) => vl.id !== ville.id))}
                      className="p-2 rounded-lg transition-all hover:bg-red-50"
                      style={{ color: "#EF4444" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}