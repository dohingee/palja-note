// 사주 엔진 공개 함수 목록. 화면과 풀이 쪽은 이 파일에서만 가져다 쓴다.
// 구현은 src/saju/engine/ 에 둔다.
import type { BirthInput, PeriodFortune, SajuChart } from './types';
import * as engine from './engine';

export const computeChart: (input: BirthInput) => SajuChart = engine.computeChart;
/** 대운 10개 각각의 분야별 운 */
export const getDaeunFortunes: (chart: SajuChart) => PeriodFortune[] = engine.getDaeunFortunes;
/** 특정 연도(세운) */
export const getYearFortune: (chart: SajuChart, year: number) => PeriodFortune = engine.getYearFortune;
/** 특정 연도의 절기 기준 12개월 (입춘이 든 인월부터 축월까지) */
export const getMonthFortunes: (chart: SajuChart, year: number) => PeriodFortune[] = engine.getMonthFortunes;
/** 특정 날짜(일진). date는 'YYYY-MM-DD' */
export const getDayFortune: (chart: SajuChart, date: string) => PeriodFortune = engine.getDayFortune;
