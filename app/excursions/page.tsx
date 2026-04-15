"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { sanitizeText } from "@/app/lib/sanitize";
import {
  Search, MapPin, Clock, Star, Heart,
  Loader2, Mountain, UserPlus, LogIn, Calendar,
} from "lucide-react";
import TouristeNav from "@/app/components/touriste/TouristeNav";
import styles from "@/public/style/excursions.module.css";

type Excursion = {
  id: string; title: string; city: string;
  price_per_person: number; duration_hours: number;
  rating: number; reviews_count: number;
  categories: string[]; photos: string[]; is_active: boolean;
};

const FALLBACK = "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80&fit=crop";

const Skeleton = () => (
  <div className={styles.skeleton}>
    <div className={styles.skeletonImg} />
    <div className={styles.skeletonBody}>
      <div className={`${styles.skeletonLine} ${styles.skeletonLine1}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLine2}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLine3}`} />
    </div>
  </div>
);

export default function ExcursionsPage() {
  const [excursions, setExcursions] = useState<Excursion[]>([]);
  const [filtered,   setFiltered]   = useState<Excursion[]>([]);
  const [villes,     setVilles]     = useState<string[]>([]);
  const [cats,       setCats]       = useState<string[]>([]);

  const [selectedCities,     setSelectedCities]     = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [search,     setSearch]     = useState("");
  const [sort,       setSort]       = useState("popular");
  const [loading,    setLoading]    = useState(true);
  const [user,       setUser]       = useState<{ id: string } | null>(null);
  const [favorites,  setFavorites]  = useState<Set<string>>(new Set());
  const [loadingFav, setLoadingFav] = useState<string | null>(null);

  const [activeTab,      setActiveTab]      = useState<"ville" | "categorie" | "journee" | "heure" | null>(null);
  const [filterJournee,  setFilterJournee]  = useState(false);
  const [filterHeure,    setFilterHeure]    = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id });
        supabase.from("favoris").select("excursion_id").eq("touriste_id", data.user.id)
          .then(({ data: favs }) => {
            if (favs) setFavorites(new Set(favs.map((f: { excursion_id: string }) => f.excursion_id)));
          });
      }
    });
    supabase.from("excursions").select("*").eq("is_active", true)
      .then(({ data }) => { setExcursions((data as Excursion[]) || []); setLoading(false); });
    supabase.from("villes").select("nom").eq("active", true).order("nom")
      .then(({ data }) => { if (data) setVilles(data.map((v: { nom: string }) => v.nom)); });
    supabase.from("categories").select("nom").order("nom")
      .then(({ data }) => { if (data) setCats(data.map((c: { nom: string }) => c.nom)); });
  }, []);

  useEffect(() => {
    let list = [...excursions];
    if (selectedCities.length > 0)     list = list.filter(e => selectedCities.includes(e.city));
    if (selectedCategories.length > 0) list = list.filter(e => e.categories?.some(c => selectedCategories.includes(c)));
    const cleanSearch = sanitizeText(search);
    if (cleanSearch) list = list.filter(e =>
      e.title.toLowerCase().includes(cleanSearch.toLowerCase()) ||
      e.city.toLowerCase().includes(cleanSearch.toLowerCase())
    );
    if (filterJournee && !filterHeure) list = list.filter(e => e.duration_hours >= 8);
    if (filterHeure   && !filterJournee) list = list.filter(e => e.duration_hours < 4);

    if      (sort === "price_asc")  list.sort((a, b) => a.price_per_person - b.price_per_person);
    else if (sort === "price_desc") list.sort((a, b) => b.price_per_person - a.price_per_person);
    else if (sort === "rating")     list.sort((a, b) => b.rating - a.rating);
    else                            list.sort((a, b) => b.reviews_count - a.reviews_count);
    setFiltered(list);
  }, [excursions, selectedCities, selectedCategories, search, sort, filterJournee, filterHeure]);

  const toggleFav = async (excId: string) => {
    if (!user) {
      sessionStorage.setItem("redirect_after_login", "/excursions");
      window.location.href = "/auth";
      return;
    }
    setLoadingFav(excId);
    if (favorites.has(excId)) {
      await supabase.from("favoris").delete().eq("touriste_id", user.id).eq("excursion_id", excId);
      setFavorites(prev => { const n = new Set(prev); n.delete(excId); return n; });
    } else {
      await supabase.from("favoris").insert({ touriste_id: user.id, excursion_id: excId });
      setFavorites(prev => new Set([...prev, excId]));
    }
    setLoadingFav(null);
  };

  const toggleCity     = (v: string) => setSelectedCities(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleCategory = (c: string) => setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const resetAll = () => {
    setSelectedCities([]); setSelectedCategories([]);
    setFilterJournee(false); setFilterHeure(false);
    setSearch(""); setActiveTab(null);
  };

  const hasFilters = selectedCities.length > 0 || selectedCategories.length > 0 || filterJournee || filterHeure;

  const renderDropdown = () => {
    if (!activeTab || (activeTab !== "ville" && activeTab !== "categorie")) return null;
    const items    = activeTab === "ville" ? villes : cats;
    const selected = activeTab === "ville" ? selectedCities : selectedCategories;
    const toggle   = activeTab === "ville" ? toggleCity : toggleCategory;

    return (
      <div className={styles.dropdown}>
        {items.length === 0 && (
          <p className={styles.dropdownEmpty}>Aucun élément</p>
        )}
        {items.map(item => {
          const checked = selected.includes(item);
          return (
            <button
              key={item}
              onClick={e => { e.stopPropagation(); toggle(item); }}
              className={`${styles.dropdownItem} ${checked ? styles.dropdownItemChecked : ""}`}
            >
              <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ""}`}>
                {checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {item}
            </button>
          );
        })}
        {selected.length > 0 && (
          <div className={styles.dropdownFooter}>
            <button className={styles.applyBtn} onClick={() => setActiveTab(null)}>
              Appliquer ({selected.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  const villeLabel = selectedCities.length === 0
    ? "Ville"
    : selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} villes`;

  const catLabel = selectedCategories.length === 0
    ? "Catégorie"
    : selectedCategories.length === 1 ? selectedCategories[0] : `${selectedCategories.length} catégories`;

  return (
    <>
      <TouristeNav />
      <div className={styles.navSpacer} />

      <div className={styles.root}>
        {/* ── HERO ── */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>
              Découvrez des destinations<br />que vous adorerez
            </h1>

            {/* Search */}
            <div className={styles.searchWrapper}>
              <Search size={17} color="#9CA3AF" className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Rechercher une excursion, une ville…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filter tabs */}
            <div className={styles.filtersRow}>

              {/* Ville */}
              <div className={styles.filterDropdownWrapper}>
                <button
                  className={`${styles.tabBtn} ${selectedCities.length > 0 || activeTab === "ville" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab(prev => prev === "ville" ? null : "ville")}
                >
                  <MapPin size={13} />
                  {villeLabel}
                  {selectedCities.length > 0 && (
                    <span className={styles.tabBadge}>{selectedCities.length}</span>
                  )}
                </button>
                {activeTab === "ville" && renderDropdown()}
              </div>

              {/* Catégorie */}
              <div className={styles.filterDropdownWrapper}>
                <button
                  className={`${styles.tabBtn} ${selectedCategories.length > 0 || activeTab === "categorie" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab(prev => prev === "categorie" ? null : "categorie")}
                >
                  {catLabel}
                  {selectedCategories.length > 0 && (
                    <span className={styles.tabBadge}>{selectedCategories.length}</span>
                  )}
                </button>
                {activeTab === "categorie" && renderDropdown()}
              </div>

              {/* Journée */}
              <button
                className={`${styles.tabBtn} ${filterJournee ? styles.tabBtnActive : ""}`}
                onClick={() => setFilterJournee(prev => !prev)}
              >
                Excursion d'une journée
              </button>

              {/* Par heure */}
              <button
                className={`${styles.tabBtn} ${filterHeure ? styles.tabBtnActive : ""}`}
                onClick={() => setFilterHeure(prev => !prev)}
              >
                Par heure
              </button>

              {/* Reset */}
              {hasFilters && (
                <button
                  className={`${styles.tabBtn} ${styles.tabBtnReset}`}
                  onClick={resetAll}
                >
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className={styles.content}>

          {/* Count + Sort */}
          <div className={styles.sortBar}>
            <p className={styles.countText}>
              {loading ? "Chargement…" : (
                <>
                  <span className={styles.countBold}>{filtered.length}</span>
                  {" "}excursion{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
                </>
              )}
            </p>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="popular">Plus populaires</option>
              <option value="rating">Meilleures notes</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </div>

          {/* Skeletons */}
          {loading && (
            <div className={styles.excGrid}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Mountain size={30} color="#02AFCF" strokeWidth={1.5} />
              </div>
              <p className={styles.emptyTitle}>
                {excursions.length === 0 ? "Aucune excursion disponible" : "Aucune excursion trouvée"}
              </p>
              <p className={styles.emptySub}>
                {excursions.length === 0 ? "Revenez bientôt, de nouvelles aventures arrivent !" : "Essayez d'autres filtres"}
              </p>
              {hasFilters && (
                <button className={styles.resetBtn} onClick={resetAll}>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}

          {/* Cards grid */}
          {!loading && filtered.length > 0 && (
            <div className={styles.excGrid}>
              {filtered.map((exc, i) => (
                <div
                  key={exc.id}
                  className={styles.card}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => { window.location.href = `/excursions/${exc.id}`; }}
                >
                  {/* Image zone */}
                  <div className={styles.cardImgZone}>
                    <img
                      className={styles.cardImg}
                      src={exc.photos?.[0] || FALLBACK}
                      alt={sanitizeText(exc.title)}
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }}
                    />
                    {exc.categories?.[0] && (
                      <div className={styles.categoryBadge}>
                        {sanitizeText(exc.categories[0])}
                      </div>
                    )}
                    <button
                      className={styles.heartBtn}
                      onClick={e => { e.stopPropagation(); toggleFav(exc.id); }}
                    >
                      {loadingFav === exc.id
                        ? <Loader2 size={15} color="#9CA3AF" className={styles.spinIcon} />
                        : user
                          ? <Heart size={16} fill={favorites.has(exc.id) ? "#EF4444" : "none"} color={favorites.has(exc.id) ? "#EF4444" : "#374151"} strokeWidth={2.2} />
                          : <Heart size={13} color="#9CA3AF" />
                      }
                    </button>
                  </div>

                  {/* Card body */}
                  <div className={styles.cardBody}>
                    <div className={styles.cardRow1}>
                      <h3 className={styles.cardTitle}>{sanitizeText(exc.title)}</h3>
                      <div className={styles.cardPriceBox}>
                        <span className={styles.cardPrice}>{exc.price_per_person}</span>
                        <span className={styles.cardPriceCurrency}>TND</span>
                        <div className={styles.cardPriceUnit}>/ personne</div>
                      </div>
                    </div>

                    <p className={styles.cardCity}>
                      <MapPin size={12} color="#02AFCF" />
                      {sanitizeText(exc.city)}
                    </p>

                    <div className={styles.cardRow3}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardMetaItem}>
                          <Clock size={13} color="#9CA3AF" /> {exc.duration_hours}h
                        </span>
                        <span className={styles.cardMetaItem}>
                          <Star size={14} fill="#F59E0B" color="#F59E0B" strokeWidth={1.5} />
                          {exc.rating > 0
                            ? <>{exc.rating.toFixed(1)} <span className={styles.cardMetaMuted}>({exc.reviews_count})</span></>
                            : <span className={styles.cardMetaMuted}>Nouveau</span>
                          }
                        </span>
                      </div>

                      <button
                        className={`${styles.reserveBtn} ${user ? styles.reserveBtnActive : styles.reserveBtnLocked}`}
                        onClick={e => {
                          e.stopPropagation();
                          if (!user) {
                            sessionStorage.setItem("redirect_after_login", `/excursions/${exc.id}`);
                            window.location.href = "/auth";
                          } else {
                            window.location.href = `/excursions/${exc.id}`;
                          }
                        }}
                      >
                        <Calendar size={user ? 13 : 11} /> Réserver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Guest CTA */}
          {!user && !loading && (
            <div className={styles.guestCta}>
              <div>
                <h3 className={styles.guestCtaTitle}>Sauvegardez vos excursions préférées</h3>
                <p className={styles.guestCtaSub}>Favoris, réservations et paiements nécessitent un compte gratuit</p>
              </div>
              <div className={styles.guestCtaBtns}>
                <Link href="/auth" className={styles.btnRegister}>
                  <UserPlus size={15} /> Créer un compte
                </Link>
                <Link href="/auth" className={styles.btnLogin}>
                  <LogIn size={15} /> Se connecter
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdowns on outside click */}
      {activeTab && (
        <div className={styles.overlay} onClick={() => setActiveTab(null)} />
      )}
    </>
  );
}