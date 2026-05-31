export default async function TouristeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#FAFAF9",
        fontFamily: "Poppins, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="touriste-container">
          {children}
        </div>
      </main>

      <style>{`
        .touriste-container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 24px;
          padding-right: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 1024px) {
          .touriste-container { padding-left: 20px; padding-right: 20px; }
        }
        @media (max-width: 640px) {
          .touriste-container { padding-left: 16px; padding-right: 16px; }
        }
        .touriste-container > .messages-page-wrapper,
        .touriste-container > .ma2-page,
        .touriste-container > .mlp-page {
          width: calc(100% + 48px);
          margin-left: -24px;
          margin-right: -24px;
          max-width: none;
        }
        @media (max-width: 640px) {
          .touriste-container > .messages-page-wrapper,
          .touriste-container > .ma2-page,
          .touriste-container > .mlp-page {
            width: calc(100% + 32px);
            margin-left: -16px;
            margin-right: -16px;
          }
        }
      `}</style>
    </div>
  );
}
