// 풀이 문구 공개 함수 목록. 화면은 이 파일에서만 가져다 쓴다.

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

// 구현은 compose.ts, 문구 데이터는 data/ 에 있다.
/** 일간(태어난 날의 천간)별 성격 풀이 */
export { getDayMasterProfile } from './compose';
/** 오행 분포·신강신약·용신 설명 */
export { getElementBalanceText } from './compose';
/** 기간 종류 × 분야 × 점수/십성/요인으로 문장을 조합한다. seed로 같은 날엔 같은 문장이 나오게 한다 */
export { getCategoryText } from './compose';
export { getLuckyItems } from './compose';
export { CATEGORY_LABELS } from './data/labels';
