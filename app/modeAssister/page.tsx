'use client';
import { useState } from 'react';

const VILLES = ['Tunis', 'Kairouan', 'Tozeur', 'Djerba', 'Hammamet', 
                 'Sousse', 'Tataouine', 'Sfax', 'Gafsa', 'Douz'];
const INTERETS = ['Archéologie', 'Nature', 'Gastronomie', 'Culture', 
                   'Aventure', 'Relaxation', 'Vie nocturne'];

export default function ModeAssiste() {
  const [jours, setJours] = useState(3);
  const [villes, setVilles] = useState<string[]>([]);
  const [interets, setInterets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [itineraire, setItineraire] = useState<any>(null);
  const [error, setError] = useState('');

  const toggle = (list: string[], item: string, setter: Function) => {
    setter((prev: string[]) =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const generer = async () => {
    if (villes.length === 0) {
      setError('Choisis au moins une ville');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jours, villes, interets }),
      });
      
      if (!res.ok) throw new Error('Erreur serveur');
      
      const data = await res.json();
      setItineraire(data);
    } catch (e) {
      setError('Impossible de générer l\'itinéraire. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 1 : Questionnaire
  if (!itineraire) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">
          Planifions ton voyage ✨
        </h1>
        
        {/* Slider jours */}
        <div className="mb-8">
          <label className="block text-sm text-gray-600 mb-2">
            Combien de jours ?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range" min={1} max={14} value={jours}
              onChange={e => setJours(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xl font-semibold w-16 text-center">
              {jours} {jours === 1 ? 'jour' : 'jours'}
            </span>
          </div>
        </div>

        {/* Multi-select villes */}
        <div className="mb-8">
          <label className="block text-sm text-gray-600 mb-2">
            Quelles villes ? (multi-sélection)
          </label>
          <div className="flex flex-wrap gap-2">
            {VILLES.map(ville => (
              <button
                key={ville}
                onClick={() => toggle(villes, ville, setVilles)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  villes.includes(ville)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {ville}
              </button>
            ))}
          </div>
        </div>

        {/* Checkboxes intérêts */}
        <div className="mb-8">
          <label className="block text-sm text-gray-600 mb-2">
            Vos intérêts ?
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERETS.map(i => (
              <button
                key={i}
                onClick={() => toggle(interets, i, setInterets)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  interets.includes(i)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={generer}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg
                     hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Génération en cours...' : 'Générer mon itinéraire →'}
        </button>
      </div>
    );
  }

  // Étape 2 : Afficher l'itinéraire
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Ton itinéraire</h1>
        <button
          onClick={() => setItineraire(null)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Recommencer
        </button>
      </div>

      <p className="text-gray-600 mb-6 italic">{itineraire.resume}</p>

      {itineraire.itineraire?.map((jour: any) => (
        <div key={jour.jour} className="mb-6 border rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-lg">
              Jour {jour.jour} — {jour.titre}
            </h2>
            <span className="text-sm text-gray-500">{jour.ville}</span>
          </div>
          
          {jour.excursions.map((exc: any) => (
            <div key={exc.id}
                 className="flex justify-between items-center p-3 bg-gray-50 
                            rounded-lg mb-2">
              <div>
                <p className="font-medium">{exc.titre}</p>
                <p className="text-sm text-gray-500">
                  {exc.heure_debut} · {exc.duree_heures}h
                </p>
              </div>
              <span className="font-semibold text-blue-600">
                {exc.prix_tnd} TND
              </span>
            </div>
          ))}
          
          <div className="text-right mt-2 text-sm text-gray-500">
            Total jour : {jour.prix_total_jour} TND
          </div>
        </div>
      ))}

      <div className="border-t pt-4 flex justify-between items-center">
        <span className="font-semibold text-lg">Total voyage</span>
        <span className="font-bold text-2xl text-blue-600">
          {itineraire.prix_total} TND
        </span>
      </div>

      <button className="w-full mt-6 bg-green-600 text-white py-4 rounded-xl 
                         font-semibold text-lg hover:bg-green-700 transition-colors">
        Réserver cet itinéraire →
      </button>
    </div>
  );
}