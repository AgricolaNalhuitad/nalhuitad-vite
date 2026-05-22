import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLotes } from './lotesApi';
import type { Lot } from './types';

export const LOTES_QUERY_KEY = ['lotes'] as const;

export function useLotes() {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeLotes(
      (lots) => {
        setIsListening(false);
        qc.setQueryData<Lot[]>(LOTES_QUERY_KEY, lots);
      },
      (err) => {
        setIsListening(false);
        setFirestoreError(err);
      },
    );
  }, [qc, retryCount]);

  const retry = useCallback(() => {
    setFirestoreError(null);
    setIsListening(true);
    setRetryCount((n) => n + 1);
  }, []);

  const { data } = useQuery<Lot[]>({
    queryKey: LOTES_QUERY_KEY,
    queryFn: () => new Promise<Lot[]>(() => {}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    data,
    isLoading: isListening,
    isError: firestoreError !== null,
    error: firestoreError,
    retry,
  };
}
