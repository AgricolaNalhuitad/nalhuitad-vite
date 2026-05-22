import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLot } from './lotApi';
import type { Lot } from './types';

export function lotQueryKey(id: string) {
  return ['lotes', id] as const;
}

export function useLot(id: string) {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeLot(
      id,
      (lot) => {
        setIsListening(false);
        qc.setQueryData<Lot | null>(lotQueryKey(id), lot);
      },
      (err) => {
        setIsListening(false);
        setFirestoreError(err);
      },
    );
  }, [id, qc, retryCount]);

  const retry = useCallback(() => {
    setFirestoreError(null);
    setIsListening(true);
    setRetryCount((n) => n + 1);
  }, []);

  const { data } = useQuery<Lot | null>({
    queryKey: lotQueryKey(id),
    queryFn: () => new Promise<Lot | null>(() => {}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    lot: data,
    isLoading: isListening,
    isError: firestoreError !== null,
    error: firestoreError,
    retry,
  };
}
