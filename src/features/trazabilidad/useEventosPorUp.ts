import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeEventosPorUp } from './eventosApi';
import type { EventoHistorial } from './types';

export function eventosQueryKey(upId: string) {
  return ['eventosHistorial', upId] as const;
}

// Mismo patrón híbrido que useLot: onSnapshot por upId alimenta el cache de React Query.
export function useEventosPorUp(upId: string) {
  const qc = useQueryClient();
  const [retryCount, setRetryCount] = useState(0);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    return subscribeEventosPorUp(
      upId,
      (eventos) => {
        setIsListening(false);
        qc.setQueryData<EventoHistorial[]>(eventosQueryKey(upId), eventos);
      },
      (err) => {
        setIsListening(false);
        setFirestoreError(err);
      },
    );
  }, [upId, qc, retryCount]);

  const retry = useCallback(() => {
    setFirestoreError(null);
    setIsListening(true);
    setRetryCount((n) => n + 1);
  }, []);

  const { data } = useQuery<EventoHistorial[]>({
    queryKey: eventosQueryKey(upId),
    queryFn: () => new Promise<EventoHistorial[]>(() => {}),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    eventos: data,
    isLoading: isListening,
    isError: firestoreError !== null,
    error: firestoreError,
    retry,
  };
}
