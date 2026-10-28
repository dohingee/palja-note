// 화면 전체가 같이 쓰는 색·간격·글자 크기. 색을 바꿀 때는 여기만 고친다.
import { useColorScheme } from 'react-native';

import type { Element, Level } from '../saju/types';

export interface Palette {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  danger: string;
  tabBar: string;
}

export interface ElementColor {
  /** 글자·막대 색 */
  main: string;
  /** 칸 배경 */
  soft: string;
  /** main 위에 올리는 글자 색 */
  onMain: string;
}

const light: Palette = {
  background: '#FAF6EF', // 한지 느낌의 따뜻한 미색
  surface: '#FFFFFF',
  surfaceMuted: '#F3ECE1',
  border: '#E8DFD2',
  text: '#2B2420',
  textMuted: '#6F6358',
  textFaint: '#A3968A',
  primary: '#B4432F', // 단청 주홍
  primarySoft: '#F6E3DD',
  onPrimary: '#FFFFFF',
  accent: '#B08A2E', // 금박 황토
  accentSoft: '#F4EAD2',
  danger: '#C23B3B',
  tabBar: '#FFFDF9',
};

const dark: Palette = {
  background: '#15120F',
  surface: '#211C18',
  surfaceMuted: '#2B2520',
  border: '#3A322B',
  text: '#F3ECE2',
  textMuted: '#BFB2A4',
  textFaint: '#857869',
  primary: '#E2735C',
  primarySoft: '#3D2620',
  onPrimary: '#1A0F0C',
  accent: '#D9B45A',
  accentSoft: '#3A311C',
  danger: '#F07272',
  tabBar: '#1B1714',
};

// 오행 색: 木 초록, 火 빨강, 土 황토, 金 회색/흰색, 水 남색/검정
const elementLight: Record<Element, ElementColor> = {
  wood: { main: '#3E8E57', soft: '#E3F1E6', onMain: '#FFFFFF' },
  fire: { main: '#D2463A', soft: '#FBE4E1', onMain: '#FFFFFF' },
  earth: { main: '#B8862B', soft: '#F6EBD3', onMain: '#FFFFFF' },
  metal: { main: '#8E949B', soft: '#EEF0F2', onMain: '#FFFFFF' },
  water: { main: '#1F2D5A', soft: '#E0E5F1', onMain: '#FFFFFF' },
};

const elementDark: Record<Element, ElementColor> = {
  wood: { main: '#5DBB7A', soft: '#1E3326', onMain: '#0E1A12' },
  fire: { main: '#F0675A', soft: '#3A1E1B', onMain: '#1F0B09' },
  earth: { main: '#DDAE4E', soft: '#382D17', onMain: '#1E1608' },
  metal: { main: '#E4E7EA', soft: '#34373A', onMain: '#1A1C1E' },
  water: { main: '#6F8FD8', soft: '#1C2440', onMain: '#0B1020' },
};

/** 점수 등급(1 매우 나쁨 ~ 5 매우 좋음) 색 */
const levelLight: Record<Level, string> = { 1: '#9A6A5E', 2: '#C08A4A', 3: '#8C8170', 4: '#4F9363', 5: '#B4432F' };
const levelDark: Record<Level, string> = { 1: '#C79A8E', 2: '#E0AE6E', 3: '#B7AC9B', 4: '#71BE88', 5: '#E2735C' };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;
export const font = {
  caption: 12,
  small: 13,
  body: 15,
  bodyLarge: 16,
  title: 18,
  heading: 22,
  display: 30,
  hero: 44,
} as const;

export interface Theme {
  scheme: 'light' | 'dark';
  colors: Palette;
  elements: Record<Element, ElementColor>;
  levels: Record<Level, string>;
}

const lightTheme: Theme = { scheme: 'light', colors: light, elements: elementLight, levels: levelLight };
const darkTheme: Theme = { scheme: 'dark', colors: dark, elements: elementDark, levels: levelDark };

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}

/**
 * 테마에 따라 달라지는 StyleSheet를 만드는 훅을 돌려준다. 라이트/다크 각각 한 번만 만든다.
 * 예: const useStyles = createStyles((t) => StyleSheet.create({ box: { backgroundColor: t.colors.surface } }));
 */
export function createStyles<T>(factory: (t: Theme) => T): () => T {
  const cache = new Map<Theme['scheme'], T>();
  return function useStyles() {
    const t = useTheme();
    let s = cache.get(t.scheme);
    if (!s) {
      s = factory(t);
      cache.set(t.scheme, s);
    }
    return s;
  };
}
