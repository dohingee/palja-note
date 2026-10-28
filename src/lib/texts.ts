// 화면이 풀이 문구(src/content/api)를 부르는 길목. 문구 쪽에서 오류가 나도 화면이 깨지지 않게 감싼다.
import { useMemo } from 'react';

import { CATEGORY_LABELS, getCategoryText, getDayMasterProfile, getElementBalanceText, getLuckyItems } from '../content/api';
import type { DayMasterProfile, FortuneText, LuckyItems } from '../content/api';
import type { Category, Element, PeriodFortune, SajuChart, Stem } from '../saju/types';
import { CATEGORIES } from '../saju/types';

const FALLBACK_TEXT: FortuneText = {
  headline: '풀이를 준비하지 못했어요',
  body: '잠시 뒤 다시 열어 주세요.',
  advice: '오늘도 편안한 하루 보내세요.',
};

function warn(e: unknown) {
  if (__DEV__) console.warn('[content]', e);
}

export function categoryLabel(c: Category): string {
  try {
    return CATEGORY_LABELS[c] ?? c;
  } catch {
    return c;
  }
}

export function categoryText(period: PeriodFortune, category: Category, seed: string): FortuneText {
  try {
    return getCategoryText(period.kind, period.categories[category], seed);
  } catch (e) {
    warn(e);
    return FALLBACK_TEXT;
  }
}

/** 기간 하나의 7개 분야 문구를 한 번에 만든다 */
export function useCategoryTexts(period: PeriodFortune | null, seed: string): Record<Category, FortuneText> | null {
  return useMemo(() => {
    if (!period) return null;
    const out = {} as Record<Category, FortuneText>;
    for (const c of CATEGORIES) out[c] = categoryText(period, c, seed);
    return out;
  }, [period, seed]);
}

export function dayMasterProfile(stem: Stem): DayMasterProfile | null {
  try {
    return getDayMasterProfile(stem);
  } catch (e) {
    warn(e);
    return null;
  }
}

export function elementBalanceText(chart: SajuChart): FortuneText | null {
  try {
    return getElementBalanceText(chart);
  } catch (e) {
    warn(e);
    return null;
  }
}

export function luckyItems(element: Element, seed: string): LuckyItems | null {
  try {
    return getLuckyItems(element, seed);
  } catch (e) {
    warn(e);
    return null;
  }
}
