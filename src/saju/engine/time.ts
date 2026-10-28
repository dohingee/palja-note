// 날짜·시각 계산과 한국 표준시/서머타임/진태양시 보정.
//
// 용어
// - JDN: 율리우스 일 번호(정수). 날짜 하나를 정수 하나로 나타내서 더하기·빼기를 쉽게 한다.
// - 벽시계 시각: 그때 한국 시계가 가리키던 시각(사용자가 입력하는 출생 시각).
// - 순간(instant): 세계 공통 시각(UTC 밀리초). 절기 비교는 이것으로 한다.
import { mod } from './constants';

export interface Ymd {
  year: number;
  month: number;
  day: number;
}

/** 그레고리력 날짜 → JDN */
export function ymdToJdn(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** JDN → 그레고리력 날짜 */
export function jdnToYmd(jdn: number): Ymd {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

export function daysInMonth(y: number, m: number): number {
  return ymdToJdn(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - ymdToJdn(y, m, 1);
}

export function isValidYmd(y: number, m: number, d: number): boolean {
  return Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

const pad = (n: number) => String(n).padStart(2, '0');
export const formatYmd = ({ year, month, day }: Ymd): string => `${year}-${pad(month)}-${pad(day)}`;
export const jdnToIso = (jdn: number): string => formatYmd(jdnToYmd(jdn));

export function parseIsoDate(date: string): Ymd {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`날짜 형식이 잘못되었습니다(YYYY-MM-DD): ${date}`);
  const ymd = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  if (!isValidYmd(ymd.year, ymd.month, ymd.day)) throw new Error(`없는 날짜입니다: ${date}`);
  return ymd;
}

/** JDN 0일 00:00 기준 분. 벽시계 시각을 숫자 하나로 비교할 때 쓴다 */
export const wallMinutes = (y: number, m: number, d: number, h: number, mi: number): number =>
  ymdToJdn(y, m, d) * 1440 + h * 60 + mi;

/** 1970-01-01의 JDN */
const UNIX_EPOCH_JDN = 2440588;

/** 벽시계 분(wallMinutes) + UTC 오프셋(분) → UTC 밀리초 */
export const wallToUtcMs = (wallMin: number, offsetMin: number): number =>
  (wallMin - offsetMin - UNIX_EPOCH_JDN * 1440) * 60000;

/** UTC 밀리초 + UTC 오프셋(분) → 그 오프셋에서의 날짜 JDN */
export const utcMsToJdn = (ms: number, offsetMin: number): number =>
  Math.floor((ms / 60000 + offsetMin) / 1440) + UNIX_EPOCH_JDN;

// ---------------------------------------------------------------------------
// 한국 표준시 (UTC 기준 오프셋, 분)
//
// 출처: IANA tz database `asia` 파일의 Zone Asia/Seoul
//   (https://github.com/eggert/tz/blob/main/asia, 2026년 확인)
//   1908-04-01 ~ 1911-12-31  UTC+8:30 (대한제국 칙령)
//   1912-01-01 ~ 1954-03-20  UTC+9:00 (조선총독부 고시 제338호, 해방 후에도 유지)
//   1954-03-21 ~ 1961-08-09  UTC+8:30 (대통령령 제876호)
//   1961-08-10 ~             UTC+9:00 (법률 제676호)
//   1908-04-01 이전에는 표준시가 없어 서울 지방평균시를 쓴 것으로 본다.
// ---------------------------------------------------------------------------

/** 서울 경도. 진태양시(정확히는 지방평균시) 보정 기준 */
export const SEOUL_LONGITUDE = 127;
/** 서울 지방평균시의 UTC 오프셋(분) = 경도 × 4분 = 508분(8시간 28분) */
export const SEOUL_LMT_OFFSET_MIN = SEOUL_LONGITUDE * 4;

const STD_OFFSET_TABLE: { from: number; offset: number }[] = [
  { from: wallMinutes(1908, 4, 1, 0, 0), offset: 510 },
  { from: wallMinutes(1912, 1, 1, 0, 0), offset: 540 },
  { from: wallMinutes(1954, 3, 21, 0, 0), offset: 510 },
  { from: wallMinutes(1961, 8, 10, 0, 0), offset: 540 },
];

/** 그 벽시계 시각에 쓰던 한국 표준시의 UTC 오프셋(분, 서머타임 제외) */
export function koreaStdOffset(wallMin: number): number {
  let offset = SEOUL_LMT_OFFSET_MIN;
  for (const row of STD_OFFSET_TABLE) if (wallMin >= row.from) offset = row.offset;
  return offset;
}

// ---------------------------------------------------------------------------
// 한국 서머타임(일광절약시간) 시행 기간. 이 동안 시계가 1시간 빨랐다.
//
// 출처: IANA tz database `asia` 파일의 Rule ROK (https://github.com/eggert/tz/blob/main/asia).
//   그 파일의 주석에 따르면 한국어 위키백과 '한국 표준시'와 당시 신문 기사로 대조했고,
//   1955~1960년 종료일은 국가기록원 관보(theme.archives.go.kr)로 확인했다.
//   - 1948: 6/1 00:00 ~ 9/12 24:00
//   - 1949: 4/3 00:00 ~ 9월 첫 토요일(7일 이후) 24:00 → 9/10
//   - 1950: 4/1 00:00 ~ 9/9 24:00
//   - 1951: 5/6 00:00 ~ 9/8 24:00
//   - 1955: 5/5 00:00 ~ 9/8 24:00
//   - 1956: 5/20 00:00 ~ 9/29 24:00
//   - 1957~1960: 5월 첫 일요일 00:00 ~ 9월 셋째 토요일(17일 이후) 24:00
//   - 1987~1988: 5월 둘째 일요일 02:00 ~ 10월 둘째 일요일 03:00
// start는 표준시 벽시계 기준(이 시각부터 서머타임), end는 서머타임 벽시계 기준(이 시각 전까지 서머타임).
// 시계를 되돌린 날의 겹치는 1시간은 서머타임으로 본다.
// ---------------------------------------------------------------------------
type Wall = [number, number, number, number, number];
const DST_PERIODS: [Wall, Wall][] = [
  [[1948, 6, 1, 0, 0], [1948, 9, 13, 0, 0]],
  [[1949, 4, 3, 0, 0], [1949, 9, 11, 0, 0]],
  [[1950, 4, 1, 0, 0], [1950, 9, 10, 0, 0]],
  [[1951, 5, 6, 0, 0], [1951, 9, 9, 0, 0]],
  [[1955, 5, 5, 0, 0], [1955, 9, 9, 0, 0]],
  [[1956, 5, 20, 0, 0], [1956, 9, 30, 0, 0]],
  [[1957, 5, 5, 0, 0], [1957, 9, 22, 0, 0]],
  [[1958, 5, 4, 0, 0], [1958, 9, 21, 0, 0]],
  [[1959, 5, 3, 0, 0], [1959, 9, 20, 0, 0]],
  [[1960, 5, 1, 0, 0], [1960, 9, 18, 0, 0]],
  [[1987, 5, 10, 2, 0], [1987, 10, 11, 3, 0]],
  [[1988, 5, 8, 2, 0], [1988, 10, 9, 3, 0]],
];
const DST_RANGES = DST_PERIODS.map(([s, e]) => [wallMinutes(...s), wallMinutes(...e)] as const);

/** 그 벽시계 시각이 서머타임이면 60, 아니면 0 */
export function koreaDstMinutes(wallMin: number): number {
  return DST_RANGES.some(([s, e]) => wallMin >= s && wallMin < e) ? 60 : 0;
}

/** 그 벽시계 시각의 실제 UTC 오프셋(표준시 + 서머타임) */
export const koreaOffset = (wallMin: number): number => koreaStdOffset(wallMin) + koreaDstMinutes(wallMin);

export interface CorrectedTime {
  /** 출생 순간(UTC 밀리초). 절기와 비교할 때 쓴다 */
  utcMs: number;
  /** 서울 지방평균시로 고친 날짜·시각. 일주·시주는 이것으로 정한다 */
  jdn: number;
  hour: number;
  minute: number;
}

/**
 * 출생 벽시계 시각 → 진태양시 보정.
 * 보정량 = 서울 지방평균시 오프셋(8:28) − 그때의 실제 시계 오프셋.
 *   - 1912~1954, 1961~ : 8:28 − 9:00 = −32분 (서머타임이면 −92분)
 *   - 1908~1911, 1954~1961: 8:28 − 8:30 = −2분 (서머타임이면 −62분)
 * 날짜가 전날로 넘어갈 수 있다(예: 00:10생 → 전날 23:38).
 * (균시차는 반영하지 않는다. 국내 만세력 대부분과 같은 방식)
 */
export function correctBirthTime(y: number, m: number, d: number, h: number, mi: number): CorrectedTime {
  const wall = wallMinutes(y, m, d, h, mi);
  const offset = koreaOffset(wall);
  const local = wall + (SEOUL_LMT_OFFSET_MIN - offset);
  return {
    utcMs: wallToUtcMs(wall, offset),
    jdn: Math.floor(local / 1440),
    hour: Math.floor(mod(local, 1440) / 60),
    minute: mod(local, 60),
  };
}

/** UTC 순간 → 그때 한국 표준시(서머타임 제외) 날짜 JDN. 달력(음력 초하루, 절기 날짜)은 표준시로 정한다 */
export function koreaDateJdn(utcMs: number): number {
  const approxWall = Math.floor(utcMs / 60000) + 540 + UNIX_EPOCH_JDN * 1440;
  return utcMsToJdn(utcMs, koreaStdOffset(approxWall));
}
