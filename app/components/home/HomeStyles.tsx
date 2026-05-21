export default function HomeStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
      *, *::before, *::after { margin:0; padding:0; box-sizing:border-box }
      body { font-family:'DM Sans',sans-serif; background:#FAFAF9; color:#111827 }

      .slide-bg { position:absolute; inset:0; background-size:cover; background-position:center; transition:opacity 0.6s ease, transform 0.6s ease }

      .section-eyebrow {
        display:inline-flex; align-items:center; gap:8px;
        font-size:11px; font-weight:800; letter-spacing:3px; color:#2B96A8;
        text-transform:uppercase; margin-bottom:16px;
      }
      .section-eyebrow::before {
        content:''; width:24px; height:2px; background:#2B96A8; border-radius:2px; display:block;
      }
      .section-title {
        font-family:'Playfair Display',serif;
        font-size:clamp(32px,4vw,52px);
        font-weight:900; color:#053366;
        letter-spacing:-1.5px; line-height:1.1;
      }
      .section-title-light { color:white }

      .exc-card { border-radius:20px; overflow:hidden; background:white; border:1px solid #F0F0F0; transition:all 0.25s ease; cursor:pointer; text-decoration:none; display:block; color:inherit }
      .exc-card:hover { transform:translateY(-6px); box-shadow:0 20px 56px rgba(0,0,0,0.1) }
      .exc-card img { transition:transform 0.45s ease; display:block }
      .exc-card:hover img { transform:scale(1.06) }

      .path-card {
        flex:1; padding:32px 28px; border-radius:24px; border:1.5px solid;
        cursor:pointer; transition:all 0.3s; backdrop-filter:blur(16px);
        display:flex; flex-direction:column; gap:14px;
      }
      .path-card:hover { transform:translateY(-5px); filter:brightness(1.12) }
      .path-card-btn {
        display:inline-flex; align-items:center; gap:8px;
        padding:13px 22px; border-radius:14px;
        font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif;
        text-decoration:none; cursor:pointer; border:none;
        transition:all 0.2s; margin-top:auto;
      }
      .path-card-btn:hover { transform:translateY(-1px) }

      .btn-primary {
        display:inline-flex; align-items:center; gap:8px;
        padding:14px 28px; background:#2B96A8; color:white;
        border-radius:14px; font-size:15px; font-weight:700;
        font-family:'DM Sans',sans-serif; border:2px solid #2B96A8; cursor:pointer;
        text-decoration:none; transition:all 0.2s;
        box-shadow:0 6px 24px rgba(43,150,168,0.35);
      }
      .btn-primary:hover { background:transparent; color:#2B96A8; transform:translateY(-1px); box-shadow:0 10px 32px rgba(43,150,168,0.2) }
      .btn-ghost {
        display:inline-flex; align-items:center; gap:8px;
        padding:14px 24px; background:rgba(255,255,255,0.13);
        backdrop-filter:blur(12px); border:2px solid rgba(255,255,255,0.8);
        color:white; border-radius:14px; font-size:15px; font-weight:600;
        font-family:'DM Sans',sans-serif; cursor:pointer; text-decoration:none; transition:all 0.2s;
      }
      .btn-ghost:hover { background:white; color:#053366; border-color:white }
      .btn-outline {
        display:inline-flex; align-items:center; gap:8px;
        padding:13px 22px; background:white; border:1.5px solid #E5E7EB;
        color:#374151; border-radius:14px; font-size:14px; font-weight:600;
        font-family:'DM Sans',sans-serif; cursor:pointer; text-decoration:none; transition:all 0.2s;
      }
      .btn-outline:hover { border-color:#2B96A8; color:#2B96A8 }

      .presta-banner {
        display:flex; align-items:center; justify-content:space-between; gap:20px;
        padding:22px 32px; border-radius:18px;
        background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15);
        margin-top:48px; cursor:pointer; transition:background 0.2s;
      }
      .presta-banner:hover { background:rgba(255,255,255,0.12) }

      .heart-btn { position:absolute; top:12px; right:12px; width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.95); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:transform 0.2s; box-shadow:0 2px 10px rgba(0,0,0,0.15); z-index:2 }
      .heart-btn:hover { transform:scale(1.15) }

      @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      .fu{animation:fadeUp 0.7s ease forwards;opacity:0}
      .fu1{animation-delay:0.1s}.fu2{animation-delay:0.25s}.fu3{animation-delay:0.4s}.fu4{animation-delay:0.55s}
      @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      @keyframes spin{to{transform:rotate(360deg)}}

      .categories-container { animation:fadeUp 0.5s ease forwards; opacity:0; animation-delay:0.35s; }

      @media(max-width:900px){
        .paths-container{flex-direction:column!important}
        .grid-3{grid-template-columns:1fr 1fr!important}
        .hero-content{left:24px!important;right:24px!important;max-width:none!important}
        .hero-buttons{flex-direction:column!important;align-items:flex-start!important}
        .section-pad{padding:64px 24px!important}
        .footer{flex-direction:column!important;gap:24px!important;padding:32px 24px!important;text-align:center!important}
        .guest-cta{flex-direction:column!important;text-align:center!important}
        .presta-banner{flex-direction:column!important;text-align:center!important}
      }
      @media(max-width:600px){
        .grid-3{grid-template-columns:1fr!important}
      }
    `}</style>
  );
}