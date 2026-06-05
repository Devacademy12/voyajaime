"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Globe, Star, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

const ICON_MAP: Record<string, React.ReactNode> = {
  heart:  <Heart  size={18} strokeWidth={2} />,
  shield: <ShieldCheck size={18} strokeWidth={2} />,
  globe:  <Globe  size={18} strokeWidth={2} />,
  star:   <Star   size={18} strokeWidth={2} />,
  map:    <MapPin size={18} strokeWidth={2} />,
  users:  <Users  size={18} strokeWidth={2} />,
};

const ACCENT_COLORS = ["#2B96A8", "#053366", "#D4A84B", "#5B7FA6"];

interface MissionData { title: string | null; subtitle: string | null; content: string | null; }
interface StatItem { value: string; label: string; }
interface StatsData { meta: { items?: StatItem[] }; }
interface ValueItem { icon: string; title: string; text: string; }
interface ValuesData { title: string | null; meta: { items?: ValueItem[] }; }

const CSS = `
  .about-section {
    padding: 100px 72px;
    background: #FFFFFF;
    position: relative;
  }

  /* Subtle grid texture */
  .about-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(43,150,168,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(43,150,168,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  .about-inner {
    max-width: 1140px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  /* Header row */
  .about-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 64px;
    flex-wrap: wrap;
    gap: 20px;
  }

  /* Stats */
  .about-stat-card {
    text-align: center;
    padding: 28px 16px;
    border-radius: 16px;
    background: #FAFAFA;
    border: 1px solid #EAECF0;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  .about-stat-card:hover {
    transform: translateY(-6px);
    border-color: #2B96A8;
    box-shadow: 0 12px 32px rgba(43,150,168,0.10);
    background: white;
  }

  /* Values */
  .about-value-card {
    border-radius: 14px;
    padding: 18px 20px;
    border: 1px solid #EAECF0;
    background: white;
    transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
    display: flex;
    align-items: flex-start;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
  }
  .about-value-card:hover {
    border-color: #2B96A8;
    transform: translateX(6px);
    box-shadow: 0 6px 24px rgba(43,150,168,0.08);
  }

  /* Links */
  .about-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    font-size: 13px;
    font-weight: 700;
    color: #2B96A8;
    text-decoration: none;
    border: 1.5px solid #2B96A8;
    border-radius: 10px;
    transition: all 0.2s;
    letter-spacing: 0.1px;
  }
  .about-link:hover {
    background: #2B96A8;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(43,150,168,0.25);
  }

  .about-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 13px 26px;
    background: #2B96A8;
    color: white;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s;
    box-shadow: 0 6px 20px rgba(43,150,168,0.25);
    border: 2px solid #2B96A8;
    letter-spacing: 0.1px;
  }
  .about-btn-primary:hover {
    background: transparent;
    color: #2B96A8;
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(43,150,168,0.18);
  }

  .about-body-text {
    font-size: 16px;
    color: #475569;
    line-height: 1.85;
    margin-bottom: 36px;
    font-weight: 400;
  }
  .about-body-text p { margin-bottom: 14px; }
  .about-body-text b, .about-body-text strong { color: #053366; font-weight: 700; }

  /* Decorative accent line for section */
  .about-accent-line {
    width: 48px; height: 3px;
    background: linear-gradient(90deg, #2B96A8, #02AFCF);
    border-radius: 2px;
    margin-bottom: 20px;
  }

  @media(max-width: 1024px) {
    .about-section { padding: 80px 32px; }
    .about-main-grid { grid-template-columns: 1fr !important; gap: 56px !important; }
    .about-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media(max-width: 640px) {
    .about-section { padding: 64px 20px; }
    .about-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
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
      <div className="about-inner">

        {/* Header */}
        <div className="about-header">
          <div style={{ maxWidth: 600 }}>
            <div className="about-accent-line" />
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              fontSize: 11, fontWeight: 700, letterSpacing: "3px",
              color: "#2B96A8", textTransform: "uppercase", marginBottom: 16,
            }}>
              Notre mission
            </span>
            <h2
              id="home-about-heading"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(30px, 4vw, 46px)",
                fontWeight: 900,
                color: "#053366",
                letterSpacing: "-1.5px",
                lineHeight: 1.08,
                margin: 0,
              }}
            >
              {mission?.title ?? "Découvrez l'âme de Tunisie"}
            </h2>
          </div>
          <Link href="/about" className="about-link">
            Notre vision <ArrowRight size={14} />
          </Link>
        </div>

        {/* Main grid */}
        <div
          className="about-main-grid"
          style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 72, alignItems: "start" }}
        >
          {/* Left — mission + stats */}
          <div>
            {mission?.content ? (
              <div
                className="about-body-text"
                dangerouslySetInnerHTML={{ __html: mission.content.slice(0, 800) }}
              />
            ) : mission?.subtitle ? (
              <p className="about-body-text">{mission.subtitle}</p>
            ) : null}

            {hasStats && (
              <div
                className="about-stats-grid"
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 36 }}
              >
                {stats!.meta.items!.slice(0, 4).map((item, i) => (
                  <div key={i} className="about-stat-card">
                    <p style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 30,
                      fontWeight: 900,
                      color: "#2B96A8",
                      marginBottom: 4,
                      lineHeight: 1,
                    }}>
                      {item.value}
                    </p>
                    <p style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#64748B",
                      letterSpacing: "0.2px",
                      lineHeight: 1.4,
                    }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — values */}
          {hasValues && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {values!.meta.items!.slice(0, 3).map((item, i) => (
                <div key={i} className="about-value-card">
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: `${ACCENT_COLORS[i % ACCENT_COLORS.length]}12`,
                    color: ACCENT_COLORS[i % ACCENT_COLORS.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {ICON_MAP[item.icon] ?? <Star size={18} strokeWidth={2} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#053366",
                      marginBottom: 4,
                      letterSpacing: "-0.1px",
                    }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.55 }}>{item.text}</p>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 18 }}>
                <Link href="/about" className="about-btn-primary">
                  <span>En savoir plus</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}