/**
 * DESIGN SYSTEM - VoyajAime
 * Système de design centralisé pour garantir la cohérence visuelle et l'UX
 */

/* ═══════════════════════════════════════════════════════════════
   PALETTE DE COULEURS
   ═══════════════════════════════════════════════════════════════ */

export const COLORS = {
  // Brand Primary
  primary: {
    dark: "#053366",      // Bleu Tunisie (foncé)
    main: "#02AFCF",      // Cyan principal
    light: "#0099B5",     // Cyan clair
    lighter: "#EFF9FB",   // Fond cyan très clair
  },

  // Secondary
  secondary: {
    main: "#259FFC",      // Bleu ciel
    light: "#E0E7FF",
  },

  // Status Colors
  status: {
    success: "#10B981",   // Vert
    successBg: "#ECFDF5",
    successBorder: "#6EE7B7",
    successLight: "#F0FDF4",

    error: "#DC2626",     // Rouge
    errorBg: "#FEF2F2",
    errorBorder: "#FECACA",
    errorLight: "#FEE2E2",

    warning: "#D97706",   // Orange
    warningBg: "#FFFBEB",
    warningBorder: "#FDE68A",
    warningLight: "#FFFBEB",

    info: "#02AFCF",      // Cyan
    infoBg: "#EFF9FB",
    infoBorder: "#A5F3FC",
    infoLight: "#CFFAFE",

    pending: "#D97706",
    pending_bg: "#FFFBEB",
    confirmed: "#10B981",
    confirmed_bg: "#ECFDF5",
    cancelled: "#DC2626",
    cancelled_bg: "#FEF2F2",
  },

  // Neutral
  neutral: {
    white: "#FFFFFF",
    surface: "#F8FAFF",
    bg: "#F5F7FA",
    border: "#E2E8F0",
    borderLight: "#ECF0F5",
    text: {
      primary: "#053366",
      secondary: "#6B7280",
      tertiary: "#9CA3AF",
      light: "#D1D5DB",
    },
    divider: "#EBEBEB",
  },

  // Shadows
  shadow: {
    sm: "0 2px 8px rgba(5, 51, 102, 0.05)",
    md: "0 4px 16px rgba(5, 51, 102, 0.08)",
    lg: "0 8px 32px rgba(5, 51, 102, 0.12)",
    xl: "0 16px 48px rgba(5, 51, 102, 0.16)",
  },
};

/* ═══════════════════════════════════════════════════════════════
   TYPOGRAPHIE
   ═══════════════════════════════════════════════════════════════ */

export const TYPOGRAPHY = {
  fontFamily: {
    primary: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  fontSize: {
    xs: "12px",
    sm: "13px",
    base: "14px",
    lg: "16px",
    xl: "18px",
    "2xl": "20px",
    "3xl": "24px",
    "4xl": "28px",
    "5xl": "32px",
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  letterSpacing: {
    tight: "-0.5px",
    normal: "0",
    wide: "0.5px",
    wider: "0.8px",
  },

  lineHeight: {
    tight: 1.15,
    snug: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
};

/* ═══════════════════════════════════════════════════════════════
   COMPOSANTS - STYLES STANDARDS
   ═══════════════════════════════════════════════════════════════ */

export const COMPONENT_STYLES = {
  /* Alert / Message Box */
  alert: {
    base: {
      padding: "12px 16px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: 500,
      lineHeight: "1.55",
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      marginBottom: "16px",
      border: "1px solid",
    },
    success: {
      backgroundColor: COLORS.status.successBg,
      borderColor: COLORS.status.successBorder,
      color: COLORS.status.success,
    },
    error: {
      backgroundColor: COLORS.status.errorBg,
      borderColor: COLORS.status.errorBorder,
      color: COLORS.status.error,
    },
    warning: {
      backgroundColor: COLORS.status.warningBg,
      borderColor: COLORS.status.warningBorder,
      color: COLORS.status.warning,
    },
    info: {
      backgroundColor: COLORS.status.infoBg,
      borderColor: COLORS.status.infoBorder,
      color: COLORS.primary.dark,
    },
  },

  /* Modal */
  modal: {
    backdrop: {
      position: "fixed",
      inset: "0",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    },
    overlay: {
      position: "absolute",
      inset: "0",
      background: "rgba(5, 19, 51, 0.62)",
      backdropFilter: "blur(10px)",
    },
    content: {
      position: "relative",
      zIndex: 1,
      width: "100%",
      maxWidth: "480px",
      background: COLORS.neutral.white,
      borderRadius: "20px",
      border: `1.5px solid ${COLORS.neutral.border}`,
      boxShadow: COLORS.shadow.xl,
      padding: "32px 28px",
      maxHeight: "90vh",
      overflowY: "auto",
    },
  },

  /* Button */
  button: {
    base: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontFamily: TYPOGRAPHY.fontFamily.primary,
      fontSize: "13px",
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
      textDecoration: "none",
    },
    primary: {
      background: `linear-gradient(135deg, ${COLORS.primary.dark}, ${COLORS.primary.main})`,
      color: COLORS.neutral.white,
      boxShadow: `0 4px 14px rgba(2, 175, 207, 0.3)`,
    },
    secondary: {
      background: COLORS.neutral.white,
      color: COLORS.primary.dark,
      border: `1.5px solid ${COLORS.neutral.border}`,
    },
    danger: {
      background: COLORS.status.errorBg,
      color: COLORS.status.error,
    },
    success: {
      background: `linear-gradient(135deg, ${COLORS.primary.main}, ${COLORS.secondary.main})`,
      color: COLORS.neutral.white,
    },
    ghost: {
      background: "none",
      color: COLORS.neutral.text.secondary,
    },
    sizes: {
      sm: { padding: "8px 14px", fontSize: "12px" },
      md: { padding: "11px 20px", fontSize: "13px" },
      lg: { padding: "14px 28px", fontSize: "14px" },
    },
  },

  /* Badge */
  badge: {
    base: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "11px",
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      padding: "4px 10px",
      borderRadius: "20px",
      textTransform: "uppercase",
      letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    success: {
      backgroundColor: COLORS.status.successBg,
      color: COLORS.status.success,
    },
    error: {
      backgroundColor: COLORS.status.errorBg,
      color: COLORS.status.error,
    },
    warning: {
      backgroundColor: COLORS.status.warningBg,
      color: COLORS.status.warning,
    },
    info: {
      backgroundColor: COLORS.status.infoBg,
      color: COLORS.primary.dark,
    },
  },

  /* Input */
  input: {
    base: {
      width: "100%",
      padding: "11px 14px",
      border: `1.5px solid ${COLORS.neutral.border}`,
      borderRadius: "12px",
      fontSize: TYPOGRAPHY.fontSize.base,
      fontFamily: TYPOGRAPHY.fontFamily.primary,
      color: COLORS.neutral.text.primary,
      backgroundColor: COLORS.neutral.surface,
      outline: "none",
      transition: "all 0.2s",
      boxSizing: "border-box",
    },
    focus: {
      borderColor: COLORS.primary.main,
      backgroundColor: COLORS.neutral.white,
      boxShadow: `0 0 0 3px rgba(2, 175, 207, 0.1)`,
    },
  },

  /* Card */
  card: {
    base: {
      background: COLORS.neutral.white,
      borderRadius: "16px",
      border: `1.5px solid ${COLORS.neutral.border}`,
      boxShadow: COLORS.shadow.sm,
      padding: "20px",
      transition: "all 0.2s",
    },
    hover: {
      boxShadow: COLORS.shadow.md,
      borderColor: COLORS.neutral.borderLight,
      transform: "translateY(-2px)",
    },
  },
};

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

export const ANIMATIONS = {
  fadeIn: "fadeIn 0.3s ease-in-out",
  slideUp: "slideUp 0.3s ease-out",
  slideDown: "slideDown 0.3s ease-out",
  scaleIn: "scaleIn 0.3s ease-out",
  spin: "spin 1s linear infinite",
};

/* ═══════════════════════════════════════════════════════════════
   BREAKPOINTS
   ═══════════════════════════════════════════════════════════════ */

export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "900px",
  lg: "1200px",
  xl: "1600px",
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/* ═══════════════════════════════════════════════════════════════
   MESSAGE TYPES (pour Toast, Alert, etc)
   ═══════════════════════════════════════════════════════════════ */

export type MessageType = "success" | "error" | "warning" | "info";

export const MESSAGE_ICONS: Record<MessageType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ⓘ",
};

export const MESSAGE_DURATIONS: Record<MessageType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};
