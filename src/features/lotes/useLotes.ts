import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeLotes } from './lotesApi';
import type { Lot } from './types';

export const LOTES_QUERY_KEY = ['lotes'] as const;

// Patrón híbrido: Firestore onSnapshot alimenta el cache de React Query vía setQueryData.
// useQuery nunca resuelve su queryFn (promesa infinita) — solo sirve como almacén reactivo.
// Esto da acceso a React Query DevTools, estado loading/error uniforme con el resto de la app,
// y cache compartido si varios componentes llaman a useLotes simultáneamente.
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
