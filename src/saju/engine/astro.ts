// 절기(節)·중기(中氣)·합삭(초하루) 순간 계산. 천문 계산은 lunar-javascript(寿星万年历 알고리즘)를 쓴다.
// 그 라이브러리는 결과를 베이징 시각(UTC+8)으로 주므로 여기서 UTC 밀리초로 바꿔서 내보낸다.
import { ShouXingUtil } from 'lunar-javascript';

const DEG = Math.PI / 180;
/** J2000 기준 일수(베이징 시각) → UTC 밀리초 */
const bjDaysToUtcMs = (t: number): number => (t - 8 / 24 + 2451545 - 2440587.5) * 86400000;

const cache = new Map<string, number>();
function memo(key: string, f: () => number): number {
  let v = cache.get(key);
  if (v === undefined) {
    v = f();
    cache.set(key, v);
  }
  return v;
}

/**
 * n번째 절(節)의 순간. n = 0은 2000년 소한(태양 황경 285°)이고, n이 1 늘 때마다 다음 절(30°씩).
 * 2000년 입춘 = n 1, Y년 입춘 = 1 + 12(Y − 2000).
 */
export const jieUtcMs = (n: number): number =>
  memo(`j${n}`, () => bjDaysToUtcMs(ShouXingUtil.qiAccurate((285 + 30 * n) * DEG)));

/** Y년 입춘이 몇 번째 절인지 */
export const ipchunIndex = (year: number): number => 1 + 12 * (year - 2000);

/** 2000년 1월 6일(소한 무렵) UTC 밀리초 */
const JIE0_APPROX = Date.UTC(2000, 0, 6);
const MEAN_JIE_MS = (365.2422 / 12) * 86400000;

/** 그 순간 직전(같으면 포함)에 든 절의 번호 */
export function jieIndexAt(utcMs: number): number {
  let n = Math.floor((utcMs - JIE0_APPROX) / MEAN_JIE_MS);
  while (jieUtcMs(n + 1) <= utcMs) n++;
  while (jieUtcMs(n) > utcMs) n--;
  return n;
}

/** Y년 동지(태양 황경 270°)부터 j번째 중기(30°씩)의 순간 */
export const zhongqiUtcMs = (dongjiYear: number, j: number): number =>
  memo(`z${dongjiYear}:${j}`, () => bjDaysToUtcMs(ShouXingUtil.qiAccurate((270 + 360 * (dongjiYear - 1999) + 30 * j) * DEG)));

/** k번째 합삭(초하루 순간). k = 0은 2000-01-06 무렵 */
export const newMoonUtcMs = (k: number): number => memo(`s${k}`, () => bjDaysToUtcMs(ShouXingUtil.shuoHigh(2 * Math.PI * k)));

const SYNODIC_MS = 29.530588853 * 86400000;
const NEW_MOON0_APPROX = Date.UTC(2000, 0, 6, 18);

/** 그 순간 직전(같으면 포함)의 합삭 번호 */
export function newMoonIndexAt(utcMs: number): number {
  let k = Math.floor((utcMs - NEW_MOON0_APPROX) / SYNODIC_MS);
  while (newMoonUtcMs(k + 1) <= utcMs) k++;
  while (newMoonUtcMs(k) > utcMs) k--;
  return k;
}
