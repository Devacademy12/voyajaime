"use client";

import { AlertCircle, RotateCw } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="db-error">
      <AlertCircle size={28} color="#DC2626" style={{ marginBottom: "0.75rem" }} />
      <p className="db-error-title">Erreur de chargement</p>
      <p className="db-error-msg">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="db-error-retry">
          <RotateCw size={12} /> Réessayer
        </button>
      )}
    </div>
  );
}