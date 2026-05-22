import { useMemo } from 'react';
import {
  countByStage,
  totalEnProduccion,
  pctCapacidad,
  CAPACIDAD_INSTALADA,
} from './aggregations';
import { STAGE_CSS_VAR, STAGE_LABELS } from './stages';
import type { Lot, Stage } from './types';
import styles from './LotesDashboard.module.css';

const C_OUT = 213.6; // 2π × 34
const C_IN  = 150.8; // 2π × 24

const ACTIVE_STAGES: Stage[] = ['almacigo', 'transplante', 'raleo'];

interface Props {
  lots: Lot[];
}

export function LotesDashboard({ lots }: Props) {
  const { totalActivo, pct, segments } = useMemo(() => {
    const total = totalEnProduccion(lots);
    const pct = pctCapacidad(total);
    const stagesWithCount = ACTIVE_STAGES
      .map((s) => ({ stage: s, count: countByStage(lots, s) }))
      .filter((s) => s.count > 0);
    const totalDonut = stagesWithCount.reduce((a, s) => a + s.count, 0) || 1;
    let offset = 38;
    const segments = stagesWithCount.map((s) => {
      const arc = (s.count / totalDonut) * C_IN;
      const gap = C_IN - arc;
      const seg = { stage: s.stage, count: s.count, arc, gap, offset };
      offset -= arc;
      return seg;
    });
    return { totalActivo: total, pct, segments };
  }, [lots]);

  const capArc = (pct / 100) * C_OUT;
  const totalLabel =
    totalActivo > 999
      ? (totalActivo / 1000).toFixed(1) + 'k'
      : String(totalActivo);

  return (
    <div className={styles.card}>
      {/* Bloque 1: donut + contadores */}
      <div className={styles.donutRow}>
        <svg width="84" height="84" viewBox="0 0 80 80" className={styles.donutSvg} aria-hidden="true">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-card-h)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="var(--green)" strokeWidth="5"
            strokeDasharray={`${capArc} ${C_OUT - capArc}`}
            strokeDashoffset="53"
            strokeLinecap="round"
          />
          <circle cx="40" cy="40" r="24" fill="none" stroke="var(--bg-card-h)" strokeWidth="11" />
          {segments.map((s) => (
            <circle
              key={s.stage}
              cx="40" cy="40" r="24" fill="none"
              stroke={STAGE_CSS_VAR[s.stage]}
              strokeWidth="11"
              strokeDasharray={`${s.arc} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
          <text x="40" y="37" textAnchor="middle" fontSize="11" fontWeight="700"
            fill="var(--text-1)" fontFamily="'DM Mono', monospace">
            {totalLabel}
          </text>
          <text x="40" y="49" textAnchor="middle" fontSize="7"
            fill="var(--text-3)" fontFamily="sans-serif">
            plantas
          </text>
        </svg>

        <div className={styles.stats}>
          <p className={styles.totalLabel}>Total en producción</p>
          <p className={styles.totalNumber}>{totalActivo.toLocaleString('es-CL')}</p>
          <p className={styles.activeLots}>
            {lots.length} lote{lots.length !== 1 ? 's' : ''} activos
          </p>
          {segments.map((s) => (
            <div key={s.stage} className={styles.legendItem}>
              <div
                className={styles.legendDot}
                style={{ background: STAGE_CSS_VAR[s.stage] }}
              />
              <p className={styles.legendLabel}>
                {STAGE_LABELS[s.stage]}{' '}
                <span style={{ color: STAGE_CSS_VAR[s.stage], fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                  {s.count.toLocaleString('es-CL')}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sep} />

      {/* Bloque 2: barras de distribución */}
      {segments.length > 0 && (
        <div className={styles.bars}>
          {segments.map((s) => {
            const barW = totalActivo > 0 ? Math.round((s.count / totalActivo) * 100) : 0;
            return (
              <div key={s.stage} className={styles.barRow}>
                <div className={styles.barHeader}>
                  <p className={styles.barLabel} style={{ color: STAGE_CSS_VAR[s.stage] }}>
                    {STAGE_LABELS[s.stage]}
                  </p>
                  <p className={styles.barValue} style={{ color: STAGE_CSS_VAR[s.stage] }}>
                    {s.count.toLocaleString('es-CL')}
                  </p>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: barW + '%', background: STAGE_CSS_VAR[s.stage] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.sep} />

      {/* Bloque 3: capacidad instalada */}
      <div className={styles.capacityRow}>
        <div>
          <p className={styles.capacityLabel}>Capacidad instalada</p>
          <p className={styles.capacityValue}>
            {totalActivo.toLocaleString('es-CL')}{' '}
            <span className={styles.capacityMuted}>de</span>{' '}
            {CAPACIDAD_INSTALADA.toLocaleString('es-CL')}
          </p>
        </div>
        <svg width="56" height="32" viewBox="0 0 56 32" aria-hidden="true">
          <path d="M4 29 A24 24 0 0 1 52 29" fill="none" stroke="var(--bg-card-h)" strokeWidth="7" strokeLinecap="round" />
          <path
            d="M4 29 A24 24 0 0 1 52 29"
            fill="none" stroke="var(--green)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${75 * pct / 100} 75`}
            strokeDashoffset="0"
          />
          <text x="28" y="26" textAnchor="middle" fontSize="10" fontWeight="700"
            fill="var(--green)" fontFamily="'DM Mono', monospace">
            {pct}%
          </text>
        </svg>
      </div>
    </div>
  );
}
