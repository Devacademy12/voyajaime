/**
 * ConfirmModal Component
 * Modal de confirmation / dialog standardisée
 */

"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
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

  return (
    <>
      <div
        style={{
          ...COMPONENT_STYLES.modal.backdrop,
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={onCancel}
      >
        <div
          style={COMPONENT_STYLES.modal.overlay as React.CSSProperties}
          onClick={onCancel}
        />

        <div
          style={{
            ...COMPONENT_STYLES.modal.content,
            animation: "slideUp 0.3s ease-out",
          } as React.CSSProperties}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: colors.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            {customIcon || <IconComponent size={32} color={colors.color} />}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: COLORS.neutral.text.primary,
              margin: "0 0 8px",
              textAlign: "center",
            }}
          >
            {title}
          </h2>

          {/* Message */}
          <p
            style={{
              fontSize: "14px",
              color: COLORS.neutral.text.secondary,
              margin: "0 0 20px",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {message}
          </p>

          {/* Custom Content */}
          {children && <div style={{ marginBottom: "24px" }}>{children}</div>}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                ...COMPONENT_STYLES.button.base,
                ...COMPONENT_STYLES.button.secondary,
                ...COMPONENT_STYLES.button.sizes.md,
                flex: 1,
                opacity: loading ? 0.5 : 1,
              } as React.CSSProperties}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                ...COMPONENT_STYLES.button.base,
                ...(confirmVariant === "danger"
                  ? COMPONENT_STYLES.button.danger
                  : COMPONENT_STYLES.button.primary),
                ...COMPONENT_STYLES.button.sizes.md,
                flex: 1,
                opacity: loading ? 0.5 : 1,
              } as React.CSSProperties}
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
