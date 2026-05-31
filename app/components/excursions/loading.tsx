/**
 * app/excursions/loading.tsx
 * ─────────────────────────
 * Affiché instantanément par Next.js App Router pendant le chargement
 * de la page excursions. Évite l'écran blanc.
 *
 * Copier ce pattern pour chaque route principale :
 *   app/excursions/[id]/loading.tsx
 *   app/about/loading.tsx
 *   app/touriste/reservations/loading.tsx
 *   etc.
 */
export default function ExcursionsLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Nav skeleton */}
      <div style={{
        height: 64, background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: 16,
      }}>
        <div className="skeleton-box" style={{ width: 120, height: 32, borderRadius: 8 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton-box" style={{ width: 80, height: 32, borderRadius: 20 }} />
        <div className="skeleton-box" style={{ width: 80, height: 32, borderRadius: 20 }} />
      </div>

      {/* Hero / search bar skeleton */}
      <div style={{ padding: "32px 24px 0", maxWidth: 1280, margin: "0 auto" }}>
        <div className="skeleton-box" style={{ height: 52, borderRadius: 14, marginBottom: 24 }} />

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
          {[100, 80, 120, 90, 110].map((w, i) => (
            <div key={i} className="skeleton-box" style={{ width: w, height: 36, borderRadius: 20 }} />
          ))}
        </div>

        {/* Cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24,
        }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 16, overflow: "hidden",
              background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.06)",
            }}>
              <div className="skeleton-box" style={{ height: 200 }} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton-box" style={{ height: 16, width: "80%", borderRadius: 6 }} />
                <div className="skeleton-box" style={{ height: 13, width: "55%", borderRadius: 6 }} />
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <div className="skeleton-box" style={{ height: 13, width: "35%", borderRadius: 6 }} />
                  <div className="skeleton-box" style={{ height: 13, width: "25%", borderRadius: 6 }} />
                </div>
                <div className="skeleton-box" style={{ height: 38, borderRadius: 10, marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
