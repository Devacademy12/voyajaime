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
const COLORS = ["#0B7A8A", "#053366", "#D97706", "#6B7280"];

interface MissionData {
  title: string | null;
  subtitle: string | null;
  content: string | null;
}
interface StatItem { value: string; label: string; }
interface StatsData { meta: { items?: StatItem[] }; }
interface ValueItem { icon: string; title: string; text: string; }
interface ValuesData { title: string | null; meta: { items?: ValueItem[] }; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .about-section-v2 {
    padding: 96px 40px;
    background: #F7F9FC;
    position: relative;
    overflow: hidden;
  }
  .about-section-v2::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(11,122,138,0.06) 0%, transparent 70%);
    border-radius: 50%; z-index: 0;
  }

  .about-stat-card-v2 {
    text-align: center;
    padding: 28px 16px;
    border-radius: 18px;
    background: white;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 6px rgba(0,0,0,0.04);
    transition: all 0.3s ease;
  }
  .about-stat-card-v2:hover {
    transform: translateY(-6px);
    border-color: rgba(11,122,138,0.25);
    box-shadow: 0 14px 32px rgba(11,122,138,0.07);
  }

  .about-value-card-v2 {
    border-radius: 16px;
    padding: 20px;
    border: 1px solid #E5E7EB;
    background: white;
    box-shadow: 0 1px 5px rgba(0,0,0,0.03);
    transition: all 0.28s ease;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .about-value-card-v2:hover {
    border-color: rgba(11,122,138,0.22);
    transform: translateX(6px);
    box-shadow: 0 8px 20px rgba(11,122,138,0.06);
  }

  .about-link-v2 {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; font-size: 13px; font-weight: 700;
    color: #0B7A8A; text-decoration: none;
    border: 1.5px solid #0B7A8A; border-radius: 10px;
    transition: all 0.25s;
  }
  .about-link-v2:hover { background: #0B7A8A; color: white; gap: 12px; }

  .about-btn-v2 {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 13px 26px; background: #0B7A8A; color: white;
    border-radius: 12px; font-size: 14px; font-weight: 700;
    text-decoration: none; transition: all 0.25s;
    box-shadow: 0 6px 18px rgba(11,122,138,0.22);
    border: 2px solid #0B7A8A;
  }
  .about-btn-v2:hover {
    background: transparent; color: #0B7A8A;
    transform: translateY(-2px);
  }

  .rich-preview-v2 {
    font-size: 16px; color: #4B5563;
    line-height: 1.8; margin-bottom: 36px;
  }
  .rich-preview-v2 p { margin-bottom: 14px; }
  .rich-preview-v2 b, .rich-preview-v2 strong { color: #053366; font-weight: 700; }

  @media(max-width: 900px) {
    .about-main-grid-v2 { grid-template-columns: 1fr !important; gap: 48px !important; }
    .about-section-v2 { padding: 56px 20px; }
    .about-stats-grid-v2 { grid-template-columns: 1fr 1fr !important; }
  }
  @media(max-width: 560px) {
    .about-stats-grid-v2 { grid-template-columns: 1fr !important; }
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
    <section className="about-section-v2" aria-labelledby="home-about-heading">
      <style>{CSS}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, flexWrap: "wrap", gap: 20 }}>
          <div style={{ maxWidth: 640 }}>
            <p className="section-eyebrow">À propos</p>
            <h2
              id="home-about-heading"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(30px, 4.5vw, 46px)",
                fontWeight: 700, color: "#053366",
                letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0,
              }}
            >
              {mission?.title ?? "Découvrez l'âme de Tunisie"}
            </h2>
          </div>
          <Link href="/about" className="about-link-v2">
            Notre vision <ArrowRight size={15} />
          </Link>
        </div>

        {/* Main grid */}
        <div
          className="about-main-grid-v2"
          style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 72, alignItems: "start" }}
        >
          {/* Left — mission + stats */}
          <div>
            {mission?.content ? (
              <div
                className="rich-preview-v2"
                dangerouslySetInnerHTML={{ __html: mission.content.slice(0, 800) }}
              />
            ) : mission?.subtitle ? (
              <p className="rich-preview-v2">{mission.subtitle}</p>
            ) : null}

            {hasStats && (
              <div
                className="about-stats-grid-v2"
                style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 36 }}
              >
                {stats!.meta.items!.slice(0, 4).map((item, i) => (
                  <div key={i} className="about-stat-card-v2">
                    <p style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 30, fontWeight: 700,
                      color: "#0B7A8A", marginBottom: 4, lineHeight: 1,
                    }}>
                      {item.value}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", letterSpacing: "0.2px" }}>{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — values */}
          {hasValues && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {values!.meta.items!.slice(0, 3).map((item, i) => (
                <div key={i} className="about-value-card-v2">
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${COLORS[i % COLORS.length]}12`,
                    color: COLORS[i % COLORS.length],
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {ICON_MAP[item.icon] ?? <Star size={22} strokeWidth={1.5} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#053366", marginBottom: 3 }}>{item.title}</h3>
                    <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>{item.text}</p>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <Link href="/about" className="about-btn-v2">
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
