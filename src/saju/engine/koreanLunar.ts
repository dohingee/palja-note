// 한국 음력 → 양력 변환.
//
// lunar-javascript의 음력은 중국 음력(베이징 시각 UTC+8 기준)이라 한국 음력과 가끔 다르다.
// 예) 1997년 설날: 중국 2/7, 한국 2/8 / 2012년 윤달: 중국 윤4월, 한국 윤3월 / 2027년 설날: 중국 2/6, 한국 2/7.
// 그래서 같은 라이브러리의 천문 계산(합삭·중기 순간)만 가져와서, 시헌력 규칙을 한국 표준시로 다시 적용한다.
//
// 시헌력 규칙
// 1. 합삭(달이 해와 겹치는 순간)이 든 날(한국 표준시 날짜)이 그 달 초하루다.
// 2. 동지가 든 달이 11월이다.
// 3. 어느 해 11월부터 다음 해 11월 전까지 달이 13개면, 그중 중기(中氣)가 들지 않은 첫 달이 윤달이다.
import { newMoonIndexAt, newMoonUtcMs, zhongqiUtcMs } from './astro';
import { koreaDateJdn as koreaJdn } from './time';

export const LUNAR_MIN_YEAR = 1900;
export const LUNAR_MAX_YEAR = 2100;

const monthStartJdn = (k: number): number => koreaJdn(newMoonUtcMs(k));

/** 그 날짜가 든 음력 달의 합삭 번호 */
function monthIndexContaining(jdn: number): number {
  const noonUtc = (jdn - 2440588) * 86400000 + 3 * 3600000; // 한국 정오 ≈ UTC 03시
  let k = newMoonIndexAt(noonUtc);
  while (monthStartJdn(k + 1) <= jdn) k++;
  while (monthStartJdn(k) > jdn) k--;
  return k;
}

interface LunarMonthInfo {
  year: number;
  month: number;
  leap: boolean;
  startJdn: number;
  days: number;
}

const cycleCache = new Map<number, LunarMonthInfo[]>();

/** (Y−1)년 11월부터 Y년 11월 직전까지의 달 목록 */
function monthsOfCycle(y: number): LunarMonthInfo[] {
  const cached = cycleCache.get(y);
  if (cached) return cached;

  const a = monthIndexContaining(koreaJdn(zhongqiUtcMs(y - 1, 0)));
  const b = monthIndexContaining(koreaJdn(zhongqiUtcMs(y - 1, 12)));
  const count = b - a;
  const zq: number[] = [];
  for (let j = 0; j <= 12; j++) zq.push(koreaJdn(zhongqiUtcMs(y - 1, j)));

  let leapI = -1;
  if (count === 13) {
    for (let i = 1; i < 13; i++) {
      const s = monthStartJdn(a + i);
      const e = monthStartJdn(a + i + 1);
      if (!zq.some((d) => d >= s && d < e)) {
        leapI = i;
        break;
      }
    }
  }

  const list: LunarMonthInfo[] = [];
  let num = 11;
  let year = y - 1;
  for (let i = 0; i < count; i++) {
    let leap = false;
    if (i > 0) {
      if (i === leapI) leap = true;
      else {
        num = (num % 12) + 1;
        if (num === 1) year = y;
      }
    }
    const startJdn = monthStartJdn(a + i);
    list.push({ year, month: num, leap, startJdn, days: monthStartJdn(a + i + 1) - startJdn });
  }
  cycleCache.set(y, list);
  return list;
}

/** 그 음력 해의 윤달 번호(없으면 0) */
export function koreanLeapMonth(year: number): number {
  const m = [...monthsOfCycle(year), ...monthsOfCycle(year + 1)].find((x) => x.year === year && x.leap);
  return m ? m.month : 0;
}

/** 한국 음력 날짜 → 양력 JDN. 없는 날짜면 오류 */
export function koreanLunarToJdn(year: number, month: number, day: number, isLeapMonth: boolean): number {
  if (!Number.isInteger(year) || year < LUNAR_MIN_YEAR || year > LUNAR_MAX_YEAR) {
    throw new Error(`음력은 ${LUNAR_MIN_YEAR}~${LUNAR_MAX_YEAR}년만 지원합니다: ${year}`);
  }
  const info = [...monthsOfCycle(year), ...monthsOfCycle(year + 1)].find(
    (x) => x.year === year && x.month === month && x.leap === isLeapMonth,
  );
  if (!info) {
    throw new Error(isLeapMonth ? `${year}년에는 윤${month}월이 없습니다` : `없는 음력 달입니다: ${year}년 ${month}월`);
  }
  if (!Number.isInteger(day) || day < 1 || day > info.days) {
    throw new Error(`${year}년 음력 ${isLeapMonth ? '윤' : ''}${month}월은 ${info.days}일까지입니다`);
  }
  return info.startJdn + day - 1;
}
