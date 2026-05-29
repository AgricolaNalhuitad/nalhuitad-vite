import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeUnidad } from './unidadesApi';
import type { UnidadProduccion } from './types';

export const unidadQueryKey = (id: string) => ['unidadProduccion', id] as const;

// Mismo patrón híbrido que useLoteOrigen: onSnapshot alimenta el cache de React Query.
export function useUnidad(id: string) {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeUnidad(
      id,
      (unidad) => {
        setIsListening(false);
        qc.setQueryData<UnidadProduccion | null>(unidadQueryKey(id), unidad);
      },
      (err) => {
        setIsListening(false);
        setFirestoreError(err);
      },
    );
  }, [qc, id, retryCount]);

  const retry = useCallback(() => {
    setFirestoreError(null);
    setIsListening(true);
    setRetryCount((n) => n + 1);
  }, []);

  const { data } = useQuery<UnidadProduccion | null>({
    queryKey: unidadQueryKey(id),
    queryFn: () => new Promise<UnidadProduccion | null>(() => {}),
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
