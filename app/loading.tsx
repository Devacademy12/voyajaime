/**
 * app/loading.tsx  (page d'accueil)
 * ──────────────────────────────────
 * Skeleton affiché pendant que la home charge.
 */
export default function HomeLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Nav */}
      <div style={{
        height: 64, background: "#fff",
        borderBottom: "1px solid #f0f0f0",
        display: "flex", alignItems: "center",
        padding: "0 32px", gap: 16,
      }}>
        <div className="skeleton-box" style={{ width: 130, height: 34 }} />
        <div style={{ flex: 1 }} />
        <div className="skeleton-box" style={{ width: 72, height: 34, borderRadius: 20 }} />
        <div className="skeleton-box" style={{ width: 72, height: 34, borderRadius: 20 }} />
      </div>

      {/* Hero slider placeholder */}
      <div className="skeleton-box" style={{ height: 520, borderRadius: 0 }} />

      {/* Section titre */}
      <div style={{ padding: "48px 32px 0", maxWidth: 1280, margin: "0 auto" }}>
        <div className="skeleton-box" style={{ height: 36, width: 280, borderRadius: 10, marginBottom: 12 }} />
        <div className="skeleton-box" style={{ height: 18, width: 420, borderRadius: 8, marginBottom: 40 }} />

        {/* Cards excursions populaires */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 16, overflow: "hidden",
              background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,.06)",
            }}>
              <div className="skeleton-box" style={{ height: 180 }} />
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton-box" style={{ height: 16, width: "75%", borderRadius: 6 }} />
                <div className="skeleton-box" style={{ height: 13, width: "50%", borderRadius: 6 }} />
                <div className="skeleton-box" style={{ height: 38, borderRadius: 10, marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
