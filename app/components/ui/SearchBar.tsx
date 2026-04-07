// ─────────────────────────────────────────────
//  components/ui/SearchBar.tsx
// ─────────────────────────────────────────────
"use client";
import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Rechercher...", className }: Props) {
  return (
    <div className={`search-bar ${className || ""}`}>
      <Search size={15} className="search-bar-icon" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-bar-input"
      />
    </div>
  );
}