/**
 * ConfirmModal Component
 * Modal de confirmation / dialog standardisée
 */

"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { COLORS, COMPONENT_STYLES } from "./design-system";

export type ConfirmModalType = "warning" | "danger" | "info" | "success";

interface ConfirmModalProps {
  isOpen: boolean;
  type?: ConfirmModalType;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  confirmVariant?: "danger" | "primary";
}

const iconMap: Record<ConfirmModalType, React.ElementType> = {
  warning: AlertTriangle,
  danger: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const colorMap: Record<ConfirmModalType, { color: string; bg: string }> = {
  warning: {
    color: COLORS.status.warning,
    bg: COLORS.status.warningBg,
  },
  danger: {
    color: COLORS.status.error,
    bg: COLORS.status.errorBg,
  },
  info: {
    color: COLORS.primary.main,
    bg: COLORS.status.infoBg,
  },
  success: {
    color: COLORS.status.success,
    bg: COLORS.status.successBg,
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  type = "warning",
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  loading = false,
  icon: customIcon,
  children,
  confirmVariant = type === "danger" ? "danger" : "primary",
}) => {
  if (!isOpen) return null;

  const IconComponent = iconMap[type];
  const colors = colorMap[type];

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error("ConfirmModal error:", error);
    }
  };

  // Styles CSS constants avec typage correct - valeurs directes
  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.2s ease-out",
  };

  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
  };

  const contentStyle: React.CSSProperties = {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: "24px",
    padding: "32px 28px",
    width: "100%",
    maxWidth: "480px",
    maxHeight: "calc(100vh - 2rem)",
    overflowY: "auto",
    boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.25)",
    animation: "slideUp 0.3s ease-out",
  };

  const iconContainerStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: colors.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 800,
    color: COLORS.neutral.text.primary,
    margin: "0 0 8px",
    textAlign: "center",
  };

  const messageStyle: React.CSSProperties = {
    fontSize: "14px",
    color: COLORS.neutral.text.secondary,
    margin: "0 0 20px",
    textAlign: "center",
    lineHeight: 1.6,
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  };

  const getButtonStyle = (variant: "secondary" | "danger" | "primary"): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      border: "none",
      borderRadius: "12px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontFamily: "inherit",
      padding: "12px 20px",
      flex: 1,
      opacity: loading ? 0.5 : 1,
    };

    if (variant === "secondary") {
      return {
        ...baseStyle,
        backgroundColor: "#F3F4F6",  // Valeur directe au lieu de COLORS.neutral.background.hover
        color: "#374151",            // Valeur directe au lieu de COLORS.neutral.text.primary
        border: "1px solid #E5E7EB", // Valeur directe au lieu de COLORS.neutral.border
      };
    }
    if (variant === "danger") {
      return {
        ...baseStyle,
        backgroundColor: "#DC2626",  // Rouge erreur
        color: "#FFFFFF",
      };
    }
    return {
      ...baseStyle,
      backgroundColor: "#2B96A8",    // Couleur primaire
      color: "#FFFFFF",
    };
  };

  return (
    <>
      <div style={backdropStyle} onClick={onCancel}>
        <div style={overlayStyle} onClick={onCancel} />

        <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
          {/* Icon */}
          <div style={iconContainerStyle}>
            {customIcon || <IconComponent size={32} color={colors.color} />}
          </div>

          {/* Title */}
          <h2 style={titleStyle}>{title}</h2>

          {/* Message */}
          <div style={messageStyle}>{message}</div>

          {/* Custom Content */}
          {children && <div style={{ marginBottom: "24px" }}>{children}</div>}

          {/* Actions */}
          <div style={actionsStyle}>
            <button
              onClick={onCancel}
              disabled={loading}
              style={getButtonStyle("secondary")}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={getButtonStyle(confirmVariant === "danger" ? "danger" : "primary")}
            >
              {loading ? "Traitement..." : confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default ConfirmModal;