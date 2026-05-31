import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeUnidades } from './unidadesApi';
import type { UnidadProduccion } from './types';

export const UNIDADES_QUERY_KEY = ['unidadesProduccion'] as const;

// Mismo patrón híbrido que useLotesOrigen: onSnapshot alimenta el cache de React Query.
export function useUnidades() {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeUnidades(
      (unidades) => {
        setIsListening(false);
        qc.setQueryData<UnidadProduccion[]>(UNIDADES_QUERY_KEY, unidades);
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

  const { data } = useQuery<UnidadProduccion[]>({
    queryKey: UNIDADES_QUERY_KEY,
    queryFn: () => new Promise<UnidadProduccion[]>(() => {}),
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
