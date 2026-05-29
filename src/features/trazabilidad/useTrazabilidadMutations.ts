import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSiembra } from './lotesOrigenApi';
import { LOTES_ORIGEN_QUERY_KEY } from './useLotesOrigen';
import type { NuevaSiembraInput } from './types';

export function useCrearSiembra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NuevaSiembraInput) => createSiembra(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_ORIGEN_QUERY_KEY });
    },
  });
}
