export default function Loading() {
  return (
    <main className="page-loading" aria-live="polite" aria-busy="true">
      <div className="page-loading-panel">
        <div className="page-loading-mark" />
        <div className="page-loading-lines">
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}
