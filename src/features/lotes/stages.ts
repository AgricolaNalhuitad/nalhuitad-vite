import type { Stage } from './types';

export const STAGE_ORDER: Stage[] = ['almacigo', 'transplante', 'raleo', 'cosecha'];

export const STAGE_LABELS: Record<Stage, string> = {
  almacigo:    'Almácigo',
  transplante: 'Transplante',
  raleo:       'Raleo',
  cosecha:     'Cosecha',
};

export const STAGE_CSS_VAR: Record<Stage, string> = {
  almacigo:    'var(--stage-a)',
  transplante: 'var(--stage-t)',
  raleo:       'var(--stage-r)',
  cosecha:     'var(--stage-c)',
};
