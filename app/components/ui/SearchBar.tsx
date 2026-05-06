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
    <div className={`search-control ${className ?? ""}`}>
      <Search size={20} className="search-control-icon" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-control-input"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          type="button"
          className="search-control-clear"
          aria-label="Effacer le champ"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}