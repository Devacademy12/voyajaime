"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Chargement des détails..." }: LoadingSpinnerProps) {
  return (
    <div className="modal-overlay">
      <div className="loading-spinner">
        <Loader2 size={32} className="spinner" />
        <p>{message}</p>
      </div>
    </div>
  );
}