/**
 * Toast Component
 * Notification système harmonisée avec animations
 */

"use client";

import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { COLORS, MESSAGE_DURATIONS, MessageType } from "./design-system";

export interface ToastState {
  id?: string;
  msg: string;
  type: MessageType;
  duration?: number;
  onClose?: () => void;
}

interface ToastProps {
  toast: ToastState | null;
  onClose?: () => void;
}

const iconMap: Record<MessageType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<MessageType, { bg: string; border: string; text: string }> = {
  success: {
    bg: COLORS.status.successBg,
    border: COLORS.status.successBorder,
    text: COLORS.status.success,
  },
  error: {
    bg: COLORS.status.errorBg,
    border: COLORS.status.errorBorder,
    text: COLORS.status.error,
  },
  warning: {
    bg: COLORS.status.warningBg,
    border: COLORS.status.warningBorder,
    text: COLORS.status.warning,
  },
  info: {
    bg: COLORS.status.infoBg,
    border: COLORS.status.infoBorder,
    text: COLORS.primary.dark,
  },
};

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;

    const duration = toast.duration || MESSAGE_DURATIONS[toast.type];
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const colors = colorMap[toast.type];
  const IconComponent = iconMap[toast.type];

  return (
    <div
      className="toast-wrapper"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 99999,
        animation: "slideInUp 0.3s ease-out",
        maxWidth: "400px",
      }}
    >
      <div
        className={`toast toast-${toast.type}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px",
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          borderRadius: "12px",
          color: colors.text,
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: COLORS.shadow.lg,
        }}
      >
        <IconComponent size={20} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.msg}</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "inherit",
              opacity: 0.6,
              transition: "opacity 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.6";
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
          }
        }

        .toast-wrapper {
          animation: slideOutDown 0.3s ease-in forwards;
          animation-delay: 0s;
        }
      `}</style>
    </div>
  );
};

export default Toast;
