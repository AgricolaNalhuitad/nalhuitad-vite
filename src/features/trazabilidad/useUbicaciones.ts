import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeUbicaciones } from './ubicacionesApi';
import type { Ubicacion } from './types';

export const UBICACIONES_QUERY_KEY = ['ubicaciones'] as const;

// Mismo patrón híbrido que useLotes: onSnapshot alimenta el cache de React Query.
export function useUbicaciones() {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeUbicaciones(
      (ubicaciones) => {
        setIsListening(false);
        qc.setQueryData<Ubicacion[]>(UBICACIONES_QUERY_KEY, ubicaciones);
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

  const { data } = useQuery<Ubicacion[]>({
    queryKey: UBICACIONES_QUERY_KEY,
    queryFn: () => new Promise<Ubicacion[]>(() => {}),
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
