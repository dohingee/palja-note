// 화면에 짧게 붙이는 이름표(오행·십성·신강신약 등). 풀이 문장은 src/content에서 가져온다.
import type { Element, Gender, PeriodKind, Strength, TenGod } from '../saju/types';

export const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export const ELEMENT_HANJA: Record<Element, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
};

export const ELEMENT_KO: Record<Element, string> = {
  wood: '목',
  fire: '화',
  earth: '토',
  metal: '금',
  water: '수',
};

/** 예: '목(木)' */
export function elementName(e: Element): string {
  return `${ELEMENT_KO[e]}(${ELEMENT_HANJA[e]})`;
}

export const TEN_GOD_KO: Record<TenGod, string> = {
  bigyeon: '비견',
  geopjae: '겁재',
  siksin: '식신',
  sanggwan: '상관',
  pyeonjae: '편재',
  jeongjae: '정재',
  pyeongwan: '편관',
  jeonggwan: '정관',
  pyeonin: '편인',
  jeongin: '정인',
};

export const STRENGTH_KO: Record<Strength, string> = {
  strong: '신강',
  balanced: '중화',
  weak: '신약',
};

export const STRENGTH_DESC: Record<Strength, string> = {
  strong: '내 기운이 강한 편',
  balanced: '기운이 고르게 어울린 편',
  weak: '내 기운이 여린 편',
};

export const PERIOD_KIND_KO: Record<PeriodKind, string> = {
  day: '오늘의 운세',
  month: '월운',
  year: '세운',
  daeun: '대운',
};

export const GENDER_KO: Record<Gender, string> = { male: '남성', female: '여성' };

export const PILLAR_POSITIONS = ['시주', '일주', '월주', '년주'] as const;
