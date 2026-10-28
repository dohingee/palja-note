// 사주 엔진 공개 함수 목록. 화면과 풀이 쪽은 이 파일에서만 가져다 쓴다.
// 구현은 src/saju/engine/ 에 둔다.
import type { BirthInput, PeriodFortune, SajuChart } from './types';

export declare function computeChart(input: BirthInput): SajuChart;
/** 대운 10개 각각의 분야별 운 */
export declare function getDaeunFortunes(chart: SajuChart): PeriodFortune[];
/** 특정 연도(세운) */
export declare function getYearFortune(chart: SajuChart, year: number): PeriodFortune;
/** 특정 연도의 절기 기준 12개월 (입춘이 든 인월부터 축월까지) */
export declare function getMonthFortunes(chart: SajuChart, year: number): PeriodFortune[];
/** 특정 날짜(일진). date는 'YYYY-MM-DD' */
export declare function getDayFortune(chart: SajuChart, date: string): PeriodFortune;
