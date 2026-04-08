// ─────────────────────────────────────────────
//  components/ui/SearchBar.tsx
// ─────────────────────────────────────────────
"use client";
import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
  className,
}: Props) {
  return (
    <div style={{ position: "relative" }} className={className}>
      <Search
        size={20}
        color="#9CA3AF"
        style={{
          position: "absolute",
          left: 18,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "16px 48px 16px 52px",
          border: "2px solid #EEF2FF",
          borderRadius: 18,
          fontSize: 15,
          fontFamily: "inherit",
          color: "#053366",
          background: "white",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color .2s, box-shadow .2s",
          boxShadow: "0 4px 20px rgba(5,51,102,.06)",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#02AFCF";
          e.target.style.boxShadow =
            "0 0 0 4px rgba(2,175,207,.1), 0 4px 20px rgba(5,51,102,.06)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#EEF2FF";
          e.target.style.boxShadow = "0 4px 20px rgba(5,51,102,.06)";
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            display: "flex",
            alignItems: "center",
            padding: 0,
          }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}