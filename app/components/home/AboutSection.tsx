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
const COLORS = ["#2B96A8", "#4A5568", "#053366", "#D97706"];

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

  .about-section {
    padding: 100px 40px;
    background: #FAFAF9; /* Beige léger, artisanal */
    position: relative;
    overflow: hidden;
  }

  /* Décoration d'arrière-plan discrète */
  .about-section::after {
    content: '';
    position: absolute;
    bottom: -50px;
    right: -50px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(43,150,168,0.05) 0%, transparent 70%);
    border-radius: 50%;
    z-index: 0;
  }

  .about-stat-card {
    text-align: center;
    padding: 32px 20px;
    border-radius: 24px;
    background: white;
    border: 1px solid #F3F4F6;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  }
  .about-stat-card:hover {
    transform: translateY(-8px);
    border-color: #2B96A8;
    box-shadow: 0 20px 40px rgba(43,150,168,0.08);
  }

  .about-value-card {
    border-radius: 20px;
    padding: 24px;
    border: 1px solid #F3F4F6;
    background: white;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 18px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  }
  .about-value-card:hover {
    border-color: #2B96A8;
    transform: translateX(8px);
    background: #F0F9FA;
  }

  .about-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 3px;
    color: #2B96A8;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .about-eyebrow::before {
    content: '';
    width: 30px;
    height: 2px;
    background: #2B96A8;
    border-radius: 2px;
  }

  .about-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    font-size: 14px;
    font-weight: 700;
    color: #2B96A8;
    text-decoration: none;
    transition: all 0.3s;
    border: 1.5px solid #2B96A8;
    border-radius: 12px;
  }
  .about-link:hover {
    gap: 12px;
    background: #2B96A8;
    color: white;
  }

  .about-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    background: #2B96A8;
    color: white;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.3s;
    box-shadow: 0 8px 24px rgba(43,150,168,0.25);
    border: 2px solid #2B96A8;
  }
  .about-btn-primary:hover {
    background: transparent;
    color: #2B96A8;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(43,150,168,0.2);
  }

  .rich-preview {
    font-size: 17px;
    color: #4B5563;
    line-height: 1.8;
    margin-bottom: 40px;
    font-weight: 400;
  }
  .rich-preview p { margin-bottom: 16px; }
  .rich-preview b, .rich-preview strong { color: #053366; font-weight: 700; }

  @media(max-width: 900px) {
    .about-main-grid { grid-template-columns: 1fr !important; gap: 60px !important; }
    .about-section { padding: 60px 24px; }
  }
  @media(max-width: 640px) {
    .about-stats-grid { grid-template-columns: 1fr !important; }
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
    <section className="about-section" aria-labelledby="home-about-heading">
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 60, flexWrap: "wrap", gap: 20 }}>
          <div style={{ maxWidth: 700 }}>
            <h2
              id="home-about-heading"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 900,
                color: "#053366",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {mission?.title ?? "Découvrez l'âme de Tunisie"}
            </h2>
          </div>
          <Link href="/about" className="about-link">
            Notre vision <ArrowRight size={16} />
          </Link>
        </div>

        {/* Main grid */}
        <div
          className="about-main-grid"
          style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 80, alignItems: "start" }}
        >
          {/* Gauche — mission + stats */}
          <div>
            {mission?.content ? (
              <div
                className="rich-preview"
                dangerouslySetInnerHTML={{ __html: mission.content.slice(0, 800) }}
              />
            ) : mission?.subtitle ? (
              <p className="rich-preview">
                {mission.subtitle}
              </p>
            ) : null}

            {hasStats && (
              <div
                className="about-stats-grid"
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 40 }}
              >
                {stats!.meta.items!.slice(0, 4).map((item, i) => (
                  <div key={i} className="about-stat-card">
                    <p style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 32,
                      fontWeight: 900,
                      color: "#2B96A8",
                      marginBottom: 4,
                      lineHeight: 1,
                    }}>
                      {item.value}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", letterSpacing: "0.2px" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Droite — valeurs */}
          {hasValues && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {values!.meta.items!.slice(0, 3).map((item, i) => (
                <div key={i} className="about-value-card">
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: `${COLORS[i % COLORS.length]}15`,
                    color: COLORS[i % COLORS.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {ICON_MAP[item.icon] ?? <Star size={24} strokeWidth={1.5} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "#053366", marginBottom: 2 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>{item.text}</p>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 20 }}>
                <Link href="/about" className="about-btn-primary">
                  <span>En savoir plus</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
  