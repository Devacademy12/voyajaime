/**
 * Alert Component
 * Composant d'alerte harmonisé et réutilisable
 */

"use client";

import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { COLORS, COMPONENT_STYLES, MessageType } from "./design-system";

export type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string | React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  closeable?: boolean;
  className?: string;
  style?: React.CSSProperties;
  actions?: React.ReactNode;
}

const iconMap: Record<AlertVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  icon: customIcon,
  onClose,
  closeable = true,
  className = "",
  style = {},
  actions,
}) => {
  const variantStyles = COMPONENT_STYLES.alert[variant];
  const IconComponent = iconMap[variant];

  const baseStyle: React.CSSProperties = {
    ...COMPONENT_STYLES.alert.base,
    ...variantStyles,
    ...style,
  };

  return (
    <div className={`alert alert-${variant} ${className}`} style={baseStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1 }}>
        <div style={{ marginTop: "2px", flexShrink: 0 }}>
          {customIcon || <IconComponent size={18} />}
        </div>
        <div style={{ flex: 1 }}>
          {title && (
            <div
              style={{
                fontWeight: 600,
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              {title}
            </div>
          )}
          <div style={{ fontSize: "13px", lineHeight: 1.55 }}>
            {message}
          </div>
          {actions && <div style={{ marginTop: "12px" }}>{actions}</div>}
        </div>
      </div>
      {closeable && onClose && (
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
            marginLeft: "10px",
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
  );
};

export default Alert;
