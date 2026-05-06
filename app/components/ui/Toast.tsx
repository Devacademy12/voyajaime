import React from 'react';
import { ToastState } from '..useToast/../../lib/useToast';

interface ToastProps {
  toast: ToastState | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className={`toast ${toast.ok ? 'success' : 'error'}`}>
      {toast.msg}
    </div>
  );
};