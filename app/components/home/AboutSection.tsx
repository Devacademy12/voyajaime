"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Globe, Star, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const ICON_MAP: Record<string, React.ReactNode> = {
  heart:  <Heart  size={20} strokeWidth={1.8} />,
  shield: <ShieldCheck size={20} strokeWidth={1.8} />,
  globe:  <Globe  size={20} strokeWidth={1.8} />,
  star:   <Star   size={20} strokeWidth={1.8} />,
  map:    <MapPin size={20} strokeWidth={1.8} />,
  users:  <Users  size={20} strokeWidth={1.8} />,
};
const COLORS = ["#02AFCF", "#7C3AED", "#059669", "#E11D48"];

interface MissionData {
  title: string | null;
  subtitle: string | null;
  content: string | null;
}

interface StatItem {
  value: string;
  label: string;
}

interface StatsData {
  meta: { items?: StatItem[] };
}

interface ValueItem {
  icon: string;
  title: string;
  text: string;
}

interface ValuesData {
  title: string | null;
  meta: { items?: ValueItem[] };
}

interface AboutSectionProps {
  mission?: MissionData | null;
  stats?: StatsData | null;
  values?: ValuesData | null;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .about-stat-card{
    text-align:center;padding:24px 16px;border-radius:18px;
    background:white;border:1.5px solid #EEF2FF;
    transition:all .22s;position:relative;overflow:hidden;
  }
  .about-stat-card::before{
    content:'';position:absolute;top:0;left:0;right:0;height:3px;
    background:linear-gradient(90deg,#02AFCF,#053366);
  }
  .about-stat-card:hover{transform:translateY(-4px);box-shadow:0 10px 28px rgba(2,175,207,.12)}

  .about-value-card{
    border-radius:16px;padding:20px 22px;border:1.5px solid #EEF2FF;
    background:white;transition:all .22s;
    display:flex;align-items:flex-start;gap:14px;
  }
  .about-value-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.07)}

  .about-link{
    display:inline-flex;align-items:center;gap:7px;
    font-size:14px;font-weight:700;color:#02AFCF;
    text-decoration:none;transition:gap .18s;
  }
  .about-link:hover{gap:12px}

  .rich-preview p{margin-bottom:12px;line-height:1.78;font-size:15px;color:#374151}
  .rich-preview strong{font-weight:700;color:#111827}
  .rich-preview em{font-style:italic}
  .rich-preview blockquote{border-left:3px solid #02AFCF;padding-left:14px;color:#6B7280;font-style:italic;margin:12px 0}

  .about-accent-line{width:30px;height:3px;background:linear-gradient(90deg,#02AFCF,#7C3AED);border-radius:2px}

  @media(max-width:900px){
    .about-main-grid{grid-template-columns:1fr!important}
  }
  @media(max-width:640px){
    .about-stats-grid{grid-template-columns:1fr 1fr!important}
  }
`;

export default function AboutSection() {
  const [mission, setMission] = useState<MissionData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [values, setValues] = useState<ValuesData | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const [missionRes, statsRes, valuesRes] = await Promise.all([
          supabase.from("about_content").select("*").eq("section", "mission").single(),
          supabase.from("about_content").select("*").eq("section", "stats").single(),
          supabase.from("about_content").select("*").eq("section", "values").single(),
        ]);

        if (missionRes.data) setMission(missionRes.data);
        if (statsRes.data) setStats(statsRes.data);
        if (valuesRes.data) setValues(valuesRes.data);
      } catch (error) {
        console.error("Error fetching about content:", error);
      }
    };

    fetchAboutContent();
  }, [supabase]);

  const hasStats  = (stats?.meta?.items?.length  ?? 0) > 0;
  const hasValues = (values?.meta?.items?.length ?? 0) > 0;

  return (
    <section aria-labelledby="home-about-heading" style={{ padding: "96px 40px", background: "#F8FAFF" }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div className="about-accent-line" />
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2.5px", color: "#02AFCF", textTransform: "uppercase" }}>
                Qui sommes-nous
              </p>
            </div>
            <h2
              id="home-about-heading"
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "clamp(26px,3.5vw,44px)",
                fontWeight: 900,
                color: "#053366",
                letterSpacing: "-1px",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {mission?.title ?? "À propos de VoyajAime"}
            </h2>
          </div>
          <Link href="/about" className="about-link" aria-label="En savoir plus sur VoyajAime">
            En savoir plus <ArrowRight size={15} />
          </Link>
        </div>

        {/* Main grid */}
        <div
          className="about-main-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "start" }}
        >
          {/* Gauche — mission + stats */}
          <div>
            {mission?.content ? (
              <div
                className="rich-preview"
                style={{ marginBottom: 32 }}
                dangerouslySetInnerHTML={{ __html: mission.content.slice(0, 600) }}
              />
            ) : mission?.subtitle ? (
              <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.78, marginBottom: 32 }}>
                {mission.subtitle}
              </p>
            ) : null}

            {hasStats && (
              <div
                className="about-stats-grid"
                style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}
              >
                {stats!.meta.items!.slice(0, 4).map((item, i) => (
                  <div key={i} className="about-stat-card">
                    <p style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: 36,
                      fontWeight: 900,
                      color: "#02AFCF",
                      marginBottom: 6,
                      lineHeight: 1,
                    }}>
                      {item.value}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: ".2px" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Droite — valeurs */}
          {hasValues && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {values!.meta.items!.slice(0, 4).map((item, i) => (
                <div key={i} className="about-value-card">
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: `${COLORS[i % COLORS.length]}12`,
                    color: COLORS[i % COLORS.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {ICON_MAP[item.icon] ?? <Star size={20} strokeWidth={1.8} />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                </div>
              ))}

              <Link
                href="/about"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 22px",
                  marginTop: 8,
                  background: "linear-gradient(135deg,#02AFCF,#053366)",
                  color: "white",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  alignSelf: "flex-start",
                  boxShadow: "0 4px 16px rgba(2,175,207,.28)",
                  transition: "all .2s",
                }}
              >
                Découvrir notre histoire <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}