export default function HomeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

      *, *::before, *::after { margin:0; padding:0; box-sizing:border-box }

      :root {
        --brand:       #0B7A8A;
        --brand-light: #E6F4F6;
        --brand-mid:   #2B96A8;
        --navy:        #053366;
        --navy-light:  #EEF3FB;
        --ink:         #111827;
        --muted:       #6B7280;
        --border:      #E5E7EB;
        --surface:     #FFFFFF;
        --bg:          #F7F9FC;
        --bg-warm:     #FAFAF8;
        --shadow-sm:   0 1px 4px rgba(0,0,0,0.06);
        --shadow-md:   0 4px 20px rgba(0,0,0,0.07);
        --shadow-lg:   0 16px 48px rgba(0,0,0,0.09);
        --radius-sm:   10px;
        --radius-md:   16px;
        --radius-lg:   24px;
        --radius-xl:   32px;
      }

      body { font-family:'Plus Jakarta Sans',sans-serif; background:var(--bg); color:var(--ink) }

      /* ── Typography helpers ── */
      .section-eyebrow {
        display:inline-flex; align-items:center; gap:8px;
        font-size:11px; font-weight:800; letter-spacing:3px; color:var(--brand);
        text-transform:uppercase; margin-bottom:14px;
      }
      .section-eyebrow::before {
        content:''; width:20px; height:2px; background:var(--brand); border-radius:2px; display:block;
      }
      .section-title {
        font-family:'Cormorant Garamond', serif;
        font-size:clamp(30px,4vw,50px);
        font-weight:700; color:var(--navy);
        letter-spacing:-0.5px; line-height:1.1;
      }
      .section-title-light { color:white }

      /* ── Cards ── */
      .exc-card {
        border-radius:var(--radius-lg); overflow:hidden;
        background:var(--surface);
        border:1px solid var(--border);
        box-shadow:var(--shadow-sm);
        transition:all 0.28s ease;
        cursor:pointer; text-decoration:none; display:block; color:inherit
      }
      .exc-card:hover {
        transform:translateY(-5px);
        box-shadow:var(--shadow-lg);
        border-color:rgba(11,122,138,0.18)
      }
      .exc-card img { transition:transform 0.45s ease; display:block }
      .exc-card:hover img { transform:scale(1.05) }

      /* ── Path cards ── */
      .path-card {
        flex:1; padding:28px 24px; border-radius:var(--radius-lg);
        border:1.5px solid var(--border);
        background:var(--surface);
        cursor:pointer;
        transition:all 0.3s cubic-bezier(.16,1,.3,1);
        display:flex; flex-direction:column; gap:14px;
        box-shadow:var(--shadow-sm);
      }
      .path-card:hover {
        transform:translateY(-5px);
        box-shadow:var(--shadow-lg);
        border-color:var(--brand-mid);
      }
      .path-card-btn {
        display:inline-flex; align-items:center; gap:8px;
        padding:12px 20px; border-radius:var(--radius-sm);
        font-size:14px; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif;
        text-decoration:none; cursor:pointer; border:none;
        transition:all 0.2s; margin-top:auto;
      }

      /* ── Buttons ── */
      .btn-primary {
        display:inline-flex; align-items:center; gap:8px;
        padding:13px 26px; background:var(--brand); color:white;
        border-radius:var(--radius-sm); font-size:14px; font-weight:700;
        font-family:'Plus Jakarta Sans',sans-serif; border:2px solid var(--brand);
        cursor:pointer; text-decoration:none; transition:all 0.2s;
        box-shadow:0 4px 16px rgba(11,122,138,0.25);
      }
      .btn-primary:hover {
        background:transparent; color:var(--brand);
        transform:translateY(-1px); box-shadow:0 8px 24px rgba(11,122,138,0.15)
      }
      .btn-ghost {
        display:inline-flex; align-items:center; gap:8px;
        padding:13px 22px;
        background:rgba(255,255,255,0.92);
        backdrop-filter:blur(12px); border:1.5px solid white;
        color:var(--navy); border-radius:var(--radius-sm);
        font-size:14px; font-weight:600;
        font-family:'Plus Jakarta Sans',sans-serif;
        cursor:pointer; text-decoration:none; transition:all 0.2s;
        box-shadow:0 2px 12px rgba(0,0,0,0.1);
      }
      .btn-ghost:hover { background:white; transform:translateY(-1px) }
      .btn-outline {
        display:inline-flex; align-items:center; gap:8px;
        padding:11px 20px; background:var(--surface); border:1.5px solid var(--border);
        color:#374151; border-radius:var(--radius-sm); font-size:13px; font-weight:600;
        font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer; text-decoration:none; transition:all 0.2s;
      }
      .btn-outline:hover { border-color:var(--brand); color:var(--brand); background:var(--brand-light) }

      /* ── Presta banner ── */
      .presta-banner {
        display:flex; align-items:center; justify-content:space-between; gap:20px;
        padding:20px 28px; border-radius:var(--radius-md);
        background:var(--navy-light); border:1.5px solid rgba(5,51,102,0.12);
        margin-top:40px; cursor:pointer; transition:all 0.2s;
      }
      .presta-banner:hover { background:#E4EDF9; border-color:rgba(5,51,102,0.22) }

      .heart-btn {
        position:absolute; top:12px; right:12px; width:34px; height:34px;
        border-radius:50%; background:white; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition:transform 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.12); z-index:2
      }
      .heart-btn:hover { transform:scale(1.15) }

      @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
      .fu{animation:fadeUp 0.65s ease forwards;opacity:0}
      .fu1{animation-delay:0.1s}.fu2{animation-delay:0.22s}.fu3{animation-delay:0.34s}.fu4{animation-delay:0.46s}
      @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(6px)}}
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      @keyframes spin{to{transform:rotate(360deg)}}

      .categories-container { animation:fadeUp 0.5s ease forwards; opacity:0; animation-delay:0.3s; }

      @media(max-width:900px){
        .paths-container{flex-direction:column!important}
        .grid-3{grid-template-columns:1fr 1fr!important}
        .hero-content{left:20px!important;right:20px!important;max-width:none!important}
        .hero-buttons{flex-direction:column!important;align-items:flex-start!important}
        .section-pad{padding:56px 20px!important}
        .footer{flex-direction:column!important;gap:20px!important;padding:28px 20px!important;text-align:center!important}
        .presta-banner{flex-direction:column!important;text-align:center!important}
      }
      @media(max-width:600px){
        .grid-3{grid-template-columns:1fr!important}
      }
    `}</style>
  );
}
