export const colors = {
  dark: {
    bg1: '#0F1219',
    bg2: '#1A1F2E',
    bgCard: '#1E2538',
    bgCardH: '#242D44',
    bgInput: '#1A2030',
    text1: '#F0F2F5',
    text2: '#8A9BBF',
    text3: '#556180',
    border: '#2A3350',
    sep: '#181E2E',
    stageA: '#C4873B',
    stageT: '#3B8DD4',
    stageR: '#B83D7A',
    stageC: '#7C4DDB',
    green: '#4ADE80',
    red: '#F87171',
    amber: '#FBBF24',
    navBg: '#0E1320',
    navActive: '#4ADE80',
    navInactive: '#6B7FA3',
  },
  light: {
    bg1: '#F5F7FA',
    bg2: '#EEF1F8',
    bgCard: '#FFFFFF',
    bgCardH: '#EEF1F8',
    bgInput: '#F5F7FA',
    text1: '#1A1E2E',
    text2: '#4A5675',
    text3: '#7A8BA8',
    border: '#CDD4E8',
    sep: '#E2E7F2',
    stageA: '#B8701A',
    stageT: '#1E6DB5',
    stageR: '#A02870',
    stageC: '#6B3FA0',
    green: '#157A40',
    red: '#C0392B',
    amber: '#C47A1A',
    navBg: '#FFFFFF',
    navActive: '#157A40',
    navInactive: '#7A8BA8',
  },
} as const;

export type ColorToken = keyof typeof colors.dark;

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function cssVar(token: ColorToken): string {
  return `var(--${kebab(token)})`;
}
