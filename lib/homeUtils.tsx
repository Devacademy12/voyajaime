import { Tag, Camera, Utensils, Compass, Sailboat, Landmark, Coffee } from "lucide-react";

export const SLIDE_COLORS = ["#2B96A8","#D97706","#7C3AED","#059669","#B45309","#E11D48","#0EA5E9"];
export const FALLBACK_IMG = "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1800&q=90";

export interface SlideExcursion {
  id: string;
  url: string;
  city: string;
  region: string;
  categories: string[];
  color: string;
}

export interface Excursion {
  id: string;
  title: string;
  city: string;
  price_per_person: number;
  duration_hours: number;
  rating: number;
  reviews_count: number;
  photos: string[];
  categories: string[];
}

export const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("culture") || cat.includes("historique") || cat.includes("musée"))  return <Landmark size={14} />;
  if (cat.includes("nature")  || cat.includes("randonnée") || cat.includes("desert"))  return <Compass  size={14} />;
  if (cat.includes("culinaire") || cat.includes("gastronomie") || cat.includes("dégustation")) return <Utensils size={14} />;
  if (cat.includes("plage")   || cat.includes("mer")  || cat.includes("nautique"))     return <Sailboat size={14} />;
  if (cat.includes("photo")   || cat.includes("coucher"))                               return <Camera   size={14} />;
  if (cat.includes("café")    || cat.includes("thé"))                                  return <Coffee   size={14} />;
  return <Tag size={14} />;
};

export const formatCategories = (categories: string[]) => {
  if (!categories || categories.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
      {categories.slice(0, 3).map((cat, idx) => (
        <span
          key={idx}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px",
            backgroundColor: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            borderRadius: 20,
            fontSize: 11, fontWeight: 600, color: "white", letterSpacing: 0.3,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          {getCategoryIcon(cat)}
          {cat}
        </span>
      ))}
      {categories.length > 3 && (
        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "4px 10px",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 20, fontSize: 11, fontWeight: 600,
          color: "rgba(255,255,255,0.8)",
        }}>
          +{categories.length - 3}
        </span>
      )}
    </div>
  );
};

export const Logo = () => (
  <img
    src="/logo.png"
    alt="VoyajAime"
    style={{ height: 35, width: "auto", objectFit: "contain", display: "block" }}
  />
);

export const SkeletonCard = () => (
  <div style={{ borderRadius: 18, overflow: "hidden", background: "white", border: "1px solid #F3F4F6" }}>
    <div style={{
      height: 220,
      background: "linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ height: 16, width: "70%", borderRadius: 6, background: "#F3F4F6" }} />
      <div style={{ height: 12, width: "40%", borderRadius: 6, background: "#F3F4F6" }} />
    </div>
  </div>
);