// 신살 표. 도화·역마는 년지/일지의 삼합 묶음으로, 천을귀인·문창귀인은 일간으로 찾는다.
// 지지 번호: 子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11 / 천간 번호: 甲0 … 癸9

/**
 * 삼합 묶음은 지지 번호 % 4로 나뉜다.
 * 0 申子辰(수국) · 1 巳酉丑(금국) · 2 寅午戌(화국) · 3 亥卯未(목국)
 */
const samhapGroup = (branch: number): number => branch % 4;

/** 도화(桃花): 申子辰→酉, 巳酉丑→午, 寅午戌→卯, 亥卯未→子 */
const PEACH_BY_GROUP = [9, 6, 3, 0];
/** 역마(驛馬): 申子辰→寅, 巳酉丑→亥, 寅午戌→申, 亥卯未→巳 */
const HORSE_BY_GROUP = [2, 11, 8, 5];

/** 천을귀인(天乙貴人): 甲戊庚→丑未, 乙己→子申, 丙丁→亥酉, 辛→寅午, 壬癸→巳卯 */
const NOBLEMAN_BY_STEM: number[][] = [
  [1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3],
];
/** 문창귀인(文昌貴人): 甲巳 乙午 丙申 丁酉 戊申 己酉 庚亥 辛子 壬寅 癸卯 */
const ACADEMIC_BY_STEM = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];

/** 들어온 지지가 년지 또는 일지 기준 도화인가 */
export const isPeachBlossom = (incoming: number, natalBranches: number[]): boolean =>
  natalBranches.some((b) => PEACH_BY_GROUP[samhapGroup(b)] === incoming);

/** 들어온 지지가 년지 또는 일지 기준 역마인가 */
export const isTravelHorse = (incoming: number, natalBranches: number[]): boolean =>
  natalBranches.some((b) => HORSE_BY_GROUP[samhapGroup(b)] === incoming);

export const isNobleman = (dayStem: number, incoming: number): boolean => NOBLEMAN_BY_STEM[dayStem].includes(incoming);

export const isAcademicStar = (dayStem: number, incoming: number): boolean => ACADEMIC_BY_STEM[dayStem] === incoming;

/** 육충(六沖): 子午 丑未 寅申 卯酉 辰戌 巳亥 */
export const isClash = (a: number, b: number): boolean => Math.abs(a - b) === 6;

/** 육합(六合): 子丑 寅亥 卯戌 辰酉 巳申 午未 */
export const isCombine = (a: number, b: number): boolean => (a + b) % 12 === 1;
