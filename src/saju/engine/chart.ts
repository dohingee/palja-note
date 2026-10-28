// 원국(타고난 사주) 계산: 보정 시각 → 사주 네 기둥 → 오행 개수 → 신강/신약 → 용신/기신 → 대운.
import type { BirthInput, DaeunPeriod, Element, Pillar, SajuChart, Strength } from '../types';
import { ELEMENTS, STEMS, mod, stemIndex } from './constants';
import { jieIndexAt, jieUtcMs } from './astro';
import { koreanLunarToJdn, LUNAR_MAX_YEAR, LUNAR_MIN_YEAR } from './koreanLunar';
import { dayJiazi, hourJiazi, makePillar, monthJiaziAt, yearJiaziAt } from './pillars';
import { elementOfRelation } from './tenGods';
import { correctBirthTime, isValidYmd, jdnToYmd, koreaOffset, wallMinutes, wallToUtcMs, ymdToJdn } from './time';

function validate(input: BirthInput): void {
  const { year, month, hour, minute } = input;
  if (!Number.isInteger(year) || year < LUNAR_MIN_YEAR || year > LUNAR_MAX_YEAR) {
    throw new Error(`출생 연도는 ${LUNAR_MIN_YEAR}~${LUNAR_MAX_YEAR}년만 지원합니다: ${year}`);
  }
  if (input.calendar === 'solar' && !isValidYmd(year, month, input.day)) {
    throw new Error(`없는 양력 날짜입니다: ${year}-${month}-${input.day}`);
  }
  if (hour !== null && (!Number.isInteger(hour) || hour < 0 || hour > 23)) throw new Error(`시는 0~23이어야 합니다: ${hour}`);
  if (hour !== null && minute !== null && (!Number.isInteger(minute) || minute < 0 || minute > 59)) {
    throw new Error(`분은 0~59이어야 합니다: ${minute}`);
  }
}

/** 입력 날짜(양력 또는 한국 음력) → 양력 JDN */
function solarJdnOf(input: BirthInput): number {
  return input.calendar === 'lunar'
    ? koreanLunarToJdn(input.year, input.month, input.day, input.isLeapMonth)
    : ymdToJdn(input.year, input.month, input.day);
}

// ---------------------------------------------------------------------------
// 신강/신약
// 일간을 돕는 글자(같은 오행 = 비겁, 나를 생하는 오행 = 인성)의 가중치 합 ÷ 전체 가중치.
// 월지(월령)가 계절의 힘이라 가장 무겁고, 일지가 그다음이다. 일간 자신은 세지 않는다.
// 비율이 STRONG_AT 이상이면 신강, WEAK_BELOW 미만이면 신약, 그 사이는 중화.
// 무작위로 고른 글자가 도울 확률이 2/5(0.4)이므로 0.4 앞뒤 ±0.1을 중화로 둔다.
// (1960~2020년 출생 3천 명 표본에서 신약·중화·신강이 대략 3분의 1씩 나온다)
// ---------------------------------------------------------------------------
export const STRENGTH_WEIGHTS = {
  yearStem: 1,
  yearBranch: 1,
  monthStem: 1,
  monthBranch: 3,
  dayBranch: 1.5,
  hourStem: 1,
  hourBranch: 1,
};
export const STRONG_AT = 0.5;
export const WEAK_BELOW = 0.3;

function supportRatio(dayEl: Element, pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null }): number {
  const resource = elementOfRelation(dayEl, 4);
  const helps = (e: Element) => e === dayEl || e === resource;
  const w = STRENGTH_WEIGHTS;
  const items: [Element, number][] = [
    [pillars.year.stemElement, w.yearStem],
    [pillars.year.branchElement, w.yearBranch],
    [pillars.month.stemElement, w.monthStem],
    [pillars.month.branchElement, w.monthBranch],
    [pillars.day.branchElement, w.dayBranch],
  ];
  if (pillars.hour) items.push([pillars.hour.stemElement, w.hourStem], [pillars.hour.branchElement, w.hourBranch]);
  const total = items.reduce((s, [, x]) => s + x, 0);
  const support = items.reduce((s, [e, x]) => s + (helps(e) ? x : 0), 0);
  return support / total;
}

export function strengthOf(ratio: number): Strength {
  if (ratio >= STRONG_AT) return 'strong';
  if (ratio < WEAK_BELOW) return 'weak';
  return 'balanced';
}

// ---------------------------------------------------------------------------
// 간이 용신(usefulElement) / 기신(harmfulElement)
// 관계 번호: 0 비겁(같은 오행) 1 식상(내가 생) 2 재성(내가 극) 3 관성(나를 극) 4 인성(나를 생)
// - 신약: 용신 = 인성·비겁 중 적은 쪽(같으면 인성).  기신 = 식상·재성·관성 중 가장 많은 쪽(같으면 관성>재성>식상).
// - 신강: 용신 = 식상·재성·관성 중 가장 적은 쪽(같으면 식상>재성>관성).  기신 = 비겁·인성 중 많은 쪽(같으면 비겁).
// - 중화: 용신 = 다섯 오행 중 가장 적은 것(같으면 식상>재성>관성>인성>비겁).
//         기신 = 용신을 뺀 나머지 중 가장 많은 것(같으면 비겁>인성>관성>재성>식상).
// 개수는 elementCounts(글자 수)로 센다. "같으면" 순서가 고정이라 결과는 늘 같다.
// ---------------------------------------------------------------------------
function pick(dayEl: Element, counts: Record<Element, number>, relations: number[], want: 'min' | 'max'): Element {
  let best = elementOfRelation(dayEl, relations[0]);
  for (const r of relations.slice(1)) {
    const e = elementOfRelation(dayEl, r);
    if (want === 'min' ? counts[e] < counts[best] : counts[e] > counts[best]) best = e;
  }
  return best;
}

export function usefulAndHarmful(dayEl: Element, counts: Record<Element, number>, strength: Strength): { useful: Element; harmful: Element } {
  if (strength === 'weak') {
    return { useful: pick(dayEl, counts, [4, 0], 'min'), harmful: pick(dayEl, counts, [3, 2, 1], 'max') };
  }
  if (strength === 'strong') {
    return { useful: pick(dayEl, counts, [1, 2, 3], 'min'), harmful: pick(dayEl, counts, [0, 4], 'max') };
  }
  const useful = pick(dayEl, counts, [1, 2, 3, 4, 0], 'min');
  const rest = [0, 4, 3, 2, 1].filter((r) => elementOfRelation(dayEl, r) !== useful);
  return { useful, harmful: pick(dayEl, counts, rest, 'max') };
}

// ---------------------------------------------------------------------------
// 대운
// 방향: 양년간 남자·음년간 여자 = 순행, 음년간 남자·양년간 여자 = 역행.
// 시작 나이: 출생 순간부터 순행이면 다음 절, 역행이면 지난 절까지의 일수 ÷ 3 (3일 = 1년, 1일 = 4개월).
//   만 나이로, 반올림한 정수를 쓴다(국내 만세력 관례: 3으로 나눈 나머지 1일은 버리고 2일은 올림). 0이 나오면 1로 둔다.
//   lunar-javascript의 getYun은 내림(sect 1, 시진 단위) 또는 분 단위 환산(sect 2)이라 쓰지 않고,
//   같은 라이브러리의 절기 순간으로 일수(소수 포함)를 직접 센다.
// 시간 모름: 그날 정오(12:00)를 출생 순간으로 보고 센다.
// 기둥: 월주에서 순행이면 다음 갑자, 역행이면 이전 갑자로 10개.
// ---------------------------------------------------------------------------
const DAY_MS = 86400000;

export function daeunStart(birthUtcMs: number, forward: boolean): { days: number; startAge: number } {
  const n = jieIndexAt(birthUtcMs);
  const days = forward ? (jieUtcMs(n + 1) - birthUtcMs) / DAY_MS : (birthUtcMs - jieUtcMs(n)) / DAY_MS;
  return { days, startAge: Math.max(1, Math.round(days / 3)) };
}

export function computeChart(input: BirthInput): SajuChart {
  validate(input);
  const jdn = solarJdnOf(input);
  const { year, month, day } = jdnToYmd(jdn);
  const timeKnown = input.hour !== null;

  let birthUtcMs: number;
  let dayJdn: number;
  let correctedHour: number | null = null;
  let correctedMinute: number | null = null;
  if (timeKnown) {
    const c = correctBirthTime(year, month, day, input.hour as number, input.minute ?? 0);
    birthUtcMs = c.utcMs;
    dayJdn = c.jdn;
    correctedHour = c.hour;
    correctedMinute = c.minute;
  } else {
    const noon = wallMinutes(year, month, day, 12, 0);
    birthUtcMs = wallToUtcMs(noon, koreaOffset(noon));
    dayJdn = jdn;
  }

  const dayJz = dayJiazi(dayJdn);
  const dayMaster = STEMS[mod(dayJz, 10)];
  const yearJz = yearJiaziAt(birthUtcMs);
  const monthJz = monthJiaziAt(birthUtcMs);

  const pYear = makePillar(yearJz, dayMaster);
  const pMonth = makePillar(monthJz, dayMaster);
  const pDay = makePillar(dayJz, dayMaster, true);
  const pHour = correctedHour === null ? null : makePillar(hourJiazi(dayJz, correctedHour), dayMaster);

  const elementCounts = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<Element, number>;
  for (const p of [pYear, pMonth, pDay, pHour]) {
    if (!p) continue;
    elementCounts[p.stemElement]++;
    elementCounts[p.branchElement]++;
  }

  const dayMasterElement = pDay.stemElement;
  const strength = strengthOf(supportRatio(dayMasterElement, { year: pYear, month: pMonth, day: pDay, hour: pHour }));
  const { useful, harmful } = usefulAndHarmful(dayMasterElement, elementCounts, strength);

  const forward = (input.gender === 'male') === (stemIndex(pYear.stem) % 2 === 0);
  const { startAge } = daeunStart(birthUtcMs, forward);
  const corrected = jdnToYmd(dayJdn);
  const birthYear = corrected.year;
  const daeun: DaeunPeriod[] = [];
  for (let i = 0; i < 10; i++) {
    const age = startAge + 10 * i;
    daeun.push({
      startAge: age,
      endAge: age + 9,
      startYear: birthYear + age,
      endYear: birthYear + age + 9,
      pillar: makePillar(monthJz + (forward ? i + 1 : -(i + 1)), dayMaster),
    });
  }

  return {
    input,
    corrected: { ...corrected, hour: correctedHour, minute: correctedMinute },
    year: pYear,
    month: pMonth,
    day: pDay,
    hour: pHour,
    dayMaster,
    dayMasterElement,
    elementCounts,
    strength,
    usefulElement: useful,
    harmfulElement: harmful,
    daeunStartAge: startAge,
    daeun,
  };
}
