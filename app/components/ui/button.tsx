// components/ui/Button.tsx
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = "primary", 
  size = "md", 
  loading = false,
  fullWidth = false,
  children, 
  className = "",
  disabled,
  ...props 
}: ButtonProps) {
  const variantClasses = {
    primary: "btn-tw-primary",
    secondary: "btn-tw-secondary", 
    danger: "btn-tw-danger",
    success: "btn-tw-success",
    ghost: "btn-tw-ghost"
  };

  const sizeClasses = {
    sm: "btn-tw-sm",
    md: "",
    lg: "btn-tw-lg"
  };

  return (
    <button
      className={`btn-tw ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "btn-tw-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}