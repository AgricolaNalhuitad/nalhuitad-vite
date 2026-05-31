import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLoteOrigen } from './lotesOrigenApi';
import type { LoteOrigen } from './types';

export function loteOrigenQueryKey(id: string) {
  return ['loteOrigen', id] as const;
}

// Mismo patrón híbrido que useLot: onSnapshot por id alimenta el cache de React Query.
export function useLoteOrigen(id: string) {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeLoteOrigen(
      id,
      (lote) => {
        setIsListening(false);
        qc.setQueryData<LoteOrigen | null>(loteOrigenQueryKey(id), lote);
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

  const { data } = useQuery<LoteOrigen | null>({
    queryKey: loteOrigenQueryKey(id),
    queryFn: () => new Promise<LoteOrigen | null>(() => {}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    lote: data,
    isLoading: isListening,
    isError: firestoreError !== null,
    error: firestoreError,
    retry,
  };
}
