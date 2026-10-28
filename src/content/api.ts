// 풀이 문구 공개 함수 목록. 화면은 이 파일에서만 가져다 쓴다.
import type { Category, CategoryFortune, Element, PeriodKind, SajuChart, Stem } from '../saju/types';

export interface DayMasterProfile {
  /** 예: '큰 나무 같은 사람' */
  title: string;
  summary: string;
  strengths: string[];
  cautions: string[];
}

export interface FortuneText {
  headline: string;
  body: string;
  advice: string;
}

export interface LuckyItems {
  color: string;
  number: number;
  direction: string;
  item: string;
}

export declare function getDayMasterProfile(stem: Stem): DayMasterProfile;
/** 오행 분포·신강신약·용신 설명 */
export declare function getElementBalanceText(chart: SajuChart): FortuneText;
/** 기간 종류 × 분야 × 점수/십성/요인으로 문장을 조합한다. seed로 같은 날엔 같은 문장이 나오게 한다 */
export declare function getCategoryText(kind: PeriodKind, fortune: CategoryFortune, seed: string): FortuneText;
export declare function getLuckyItems(element: Element, seed: string): LuckyItems;
export declare const CATEGORY_LABELS: Record<Category, string>;
