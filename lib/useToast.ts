import { useState } from 'react';
import { MessageType } from '@/app/components/ui/design-system';

export interface ToastState {
  id?: string;
  msg: string;
  type: MessageType;
  duration?: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (msg: string, type: MessageType = 'info', duration?: number) => {
    const id = Date.now().toString();
    setToast({ id, msg, type, duration });
  };

  const closeToast = () => {
    setToast(null);
  };

  const showSuccess = (msg: string, duration?: number) => showToast(msg, 'success', duration);
  const showError = (msg: string, duration?: number) => showToast(msg, 'error', duration);
  const showWarning = (msg: string, duration?: number) => showToast(msg, 'warning', duration);
  const showInfo = (msg: string, duration?: number) => showToast(msg, 'info', duration);

  return {
    toast,
    showToast,
    closeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
