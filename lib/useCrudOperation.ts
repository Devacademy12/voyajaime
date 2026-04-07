import { useState, useCallback } from 'react';
import { useToast } from './useToast';

export interface CrudAction {
  id: string;
  action: string;
  value?: any;
}

export interface CrudHandlers<T> {
  onSuccess?: (data: T[], result?: any) => T[];
  onError?: (error: Error) => void;
  confirmMessage?: string;
  successMessage: string;
  errorPrefix?: string;
}

export function useCrudOperation<T extends { id: string }>(
  initialData: T[],
  apiCall: (payload: any) => Promise<any>
) {
  const [loading, setLoading] = useState<string | null>(null);
  const [data, setData] = useState(initialData);
  const { showToast } = useToast();

  const execute = useCallback(
    async (
      itemId: string,
      payload: CrudAction,
      handlers: CrudHandlers<T>
    ) => {
      // Confirmation
      if (handlers.confirmMessage && !confirm(handlers.confirmMessage)) {
        return;
      }

      setLoading(itemId);
      try {
        const result = await apiCall(payload);

        // Update data with custom handler or default deletion
        if (handlers.onSuccess) {
          const newData = handlers.onSuccess(data, result);
          setData(newData);
        } else {
          // Default: remove item
          setData((prev) => prev.filter((item) => item.id !== itemId));
        }

        showToast(handlers.successMessage);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur inconnue');
        handlers.onError?.(err);
        showToast(
          `${handlers.errorPrefix || 'Erreur'}: ${err.message}`,
          false
        );
      } finally {
        setLoading(null);
      }
    },
    [data, apiCall, showToast]
  );

  return {
    loading,
    data,
    setData,
    execute,
  };
}
