// 화면이 사주 엔진(src/saju/api)을 부르는 길목. 기간을 가리키는 방법(PeriodRef)과 라우트 파라미터 변환도 여기서 한다.
import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { computeChart, getDaeunFortunes, getDayFortune, getMonthFortunes, getYearFortune } from '../saju/api';
import type { BirthInput, Category, PeriodFortune, SajuChart } from '../saju/types';
import { CATEGORIES } from '../saju/types';
import { profileKey, useRequiredProfile } from './profile';

export type PeriodRef =
  | { kind: 'day'; date: string }
  | { kind: 'year'; year: number }
  | { kind: 'month'; year: number; index: number }
  | { kind: 'daeun'; index: number };

/** 라우트 파라미터(문자열)로 바꾼다 */
export function periodRefToParams(ref: PeriodRef): Record<string, string> {
  switch (ref.kind) {
    case 'day':
      return { kind: 'day', date: ref.date };
    case 'year':
      return { kind: 'year', year: String(ref.year) };
    case 'month':
      return { kind: 'month', year: String(ref.year), index: String(ref.index) };
    case 'daeun':
      return { kind: 'daeun', index: String(ref.index) };
  }
}

type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function intParam(v: string | string[] | undefined): number | null {
  const s = one(v);
  if (!s || !/^-?\d+$/.test(s)) return null;
  return parseInt(s, 10);
}

export function paramsToPeriodRef(params: RawParams): PeriodRef | null {
  const kind = one(params.kind);
  if (kind === 'day') {
    const date = one(params.date);
    return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { kind, date } : null;
  }
  if (kind === 'year') {
    const year = intParam(params.year);
    return year === null ? null : { kind, year };
  }
  if (kind === 'month') {
    const year = intParam(params.year);
    const index = intParam(params.index);
    return year === null || index === null || index < 0 || index > 11 ? null : { kind, year, index };
  }
  if (kind === 'daeun') {
    const index = intParam(params.index);
    return index === null || index < 0 ? null : { kind, index };
  }
  return null;
}

export function paramToCategory(v: string | string[] | undefined): Category | null {
  const s = one(v);
  return s && (CATEGORIES as string[]).includes(s) ? (s as Category) : null;
}

/** 기기 시간대 기준 오늘 'YYYY-MM-DD' */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 엔진이 던지는 오류를 화면이 다룰 수 있게 null로 바꾼다 */
function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch (e) {
    if (__DEV__) console.warn('[saju]', e);
    return null;
  }
}

export function resolvePeriod(chart: SajuChart, ref: PeriodRef): PeriodFortune | null {
  switch (ref.kind) {
    case 'day':
      return safe(() => getDayFortune(chart, ref.date));
    case 'year':
      return safe(() => getYearFortune(chart, ref.year));
    case 'month':
      return safe(() => getMonthFortunes(chart, ref.year)[ref.index] ?? null);
    case 'daeun':
      return safe(() => getDaeunFortunes(chart)[ref.index] ?? null);
  }
}

/** 풀이 문구 seed: 같은 사람·같은 기간이면 같은 문장. 오늘의 운세는 날짜가 바뀌면 달라진다 */
export function textSeed(profile: BirthInput, period: PeriodFortune): string {
  return `${profileKey(profile)}#${period.kind}#${period.startDate}`;
}

/** 저장된 프로필로 사주 원국을 계산한다(프로필이 바뀔 때만 다시 계산) */
export function useChart(): { profile: BirthInput; chart: SajuChart | null } {
  const profile = useRequiredProfile();
  const chart = useMemo(() => safe(() => computeChart(profile)), [profile]);
  return { profile, chart };
}

export function useDaeunFortunes(chart: SajuChart | null): PeriodFortune[] {
  return useMemo(() => (chart ? (safe(() => getDaeunFortunes(chart)) ?? []) : []), [chart]);
}

export function useMonthFortunes(chart: SajuChart | null, year: number): PeriodFortune[] {
  return useMemo(() => (chart ? (safe(() => getMonthFortunes(chart, year)) ?? []) : []), [chart, year]);
}

export function useYearFortune(chart: SajuChart | null, year: number): PeriodFortune | null {
  return useMemo(() => (chart ? safe(() => getYearFortune(chart, year)) : null), [chart, year]);
}

export function useDayFortune(chart: SajuChart | null, date: string): PeriodFortune | null {
  return useMemo(() => (chart ? safe(() => getDayFortune(chart, date)) : null), [chart, date]);
}

/** 라우트 파라미터로 받은 기간을 계산한다(같은 기간이면 다시 계산하지 않음) */
export function usePeriod(chart: SajuChart | null, ref: PeriodRef | null): PeriodFortune | null {
  const refKey = ref ? JSON.stringify(ref) : null;
  return useMemo(() => {
    if (!chart || !refKey) return null;
    return resolvePeriod(chart, JSON.parse(refKey) as PeriodRef);
  }, [chart, refKey]);
}

/** 오늘(ISO)이 그 기간 안에 드는지 */
export function containsDate(period: PeriodFortune, iso: string): boolean {
  return period.startDate <= iso && iso <= period.endDate;
}

/** 지금 나이가 속한 대운 위치(없으면 -1) */
export function currentDaeunIndex(list: PeriodFortune[], chart: SajuChart | null, now: Date = new Date()): number {
  if (!chart) return -1;
  const year = now.getFullYear();
  const byDate = list.findIndex((p) => containsDate(p, todayISO(now)));
  if (byDate >= 0) return byDate;
  return chart.daeun.findIndex((d) => d.startYear <= year && year <= d.endYear);
}

/** 오늘 날짜. 앱을 켜 둔 채 자정이 지나도 다시 앞으로 가져오면 새 날짜로 바뀐다 */
export function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(todayISO());
    });
    return () => sub.remove();
  }, []);
  return today;
}
