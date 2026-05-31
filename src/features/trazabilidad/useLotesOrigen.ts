import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLotesOrigen } from './lotesOrigenApi';
import type { LoteOrigen } from './types';

export const LOTES_ORIGEN_QUERY_KEY = ['loteOrigen'] as const;

// Mismo patrón híbrido que useLotes: onSnapshot alimenta el cache de React Query.
export function useLotesOrigen() {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeLotesOrigen(
      (lotes) => {
        setIsListening(false);
        qc.setQueryData<LoteOrigen[]>(LOTES_ORIGEN_QUERY_KEY, lotes);
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

  const { data } = useQuery<LoteOrigen[]>({
    queryKey: LOTES_ORIGEN_QUERY_KEY,
    queryFn: () => new Promise<LoteOrigen[]>(() => {}),
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
