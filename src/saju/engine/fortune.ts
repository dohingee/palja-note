// 기간 운(대운·세운·월운·일진)의 분야별 점수.
//
// 점수 모델 (모든 수치는 아래 표 하나에서 조정한다)
//   점수 = 50 + Σ(가산점), 0~100으로 자른 뒤 반올림. 총운은 나머지 여섯 분야의 가중 평균을 OVERALL_SPREAD배로 넓힌 값.
//   기간 기둥의 천간은 가중치 1, 지지는 0.8(POSITION_WEIGHT)로 센다. 가산점 항목은 다섯 가지다.
//   1) 십성 묶음(GROUP_POINTS): 분야마다 중요한 십성이 들어오면 +, 해로운 십성이면 −.
//      예) 금전: 재성 +10, 식상(식상생재) +5, 비겁(겁재 탈재) −6 / 연애: 남자는 재성, 여자는 관성이 배우자 별.
//      양수 점수에는 신강/신약 배율(STRENGTH_MULT)을 곱한다. 신약이면 재성·관성·식상의 좋은 점이 줄고,
//      신강이면 비겁·인성의 좋은 점이 준다("재성은 신강에게 복, 신약에게 짐").
//      십성 하나하나의 보정(TEN_GOD_ADJUST, 예: 상관은 직업 −3)을 더한다.
//   2) 신강/신약 적합도(STRENGTH_FIT): 일간에게 필요한 기운이면 모든 분야 +, 반대면 −.
//   3) 오행(ELEMENT_POINTS): 기간 오행이 용신이면 +(useful_element), 기신이면 −(harmful_element).
//      건강운은 여기에 원국에서 가장 적은 오행이 들어오면 +, 가장 많은 오행이면 −(BALANCE_POINTS)을 더한다.
//   4) 원국 지지와의 관계(EVENT_POINTS): 일지 충·일지 육합·년지 충.
//   5) 신살(EVENT_POINTS): 도화·역마(년지/일지 삼합 기준), 천을귀인·문창귀인(일간 기준).
//   이유 코드(factors)는 그 분야 점수를 실제로 움직인 3)~5) 항목을 영향이 큰 순서로 나열한다.
//   같은 입력이면 늘 같은 결과가 나온다(난수 없음).
import type { Category, CategoryFortune, Element, FactorCode, Level, PeriodFortune, PeriodKind, SajuChart, Strength, TenGod } from '../types';
import { BRANCH_ELEMENT, BRANCH_MAIN_STEM, ELEMENTS, STEM_ELEMENT, branchIndex, mod, stemIndex } from './constants';
import { ipchunIndex, jieUtcMs } from './astro';
import { dayJiazi, jiaziOf, makePillar, monthJiaziOfJie, yearJiazi } from './pillars';
import { isAcademicStar, isClash, isCombine, isNobleman, isPeachBlossom, isTravelHorse } from './shinsal';
import { groupOf, tenGodOf, type TenGodGroup } from './tenGods';
import { jdnToIso, jdnToYmd, koreaDateJdn, parseIsoDate, ymdToJdn } from './time';

type SubCategory = Exclude<Category, 'overall'>;
const SUBS: SubCategory[] = ['love', 'money', 'career', 'study', 'health', 'relationship'];
type Points = Record<SubCategory, number>;
type GroupPoints = Record<TenGodGroup, number>;

// ---------------------------- 조정용 표 -------------------------------------
export const SCORING = {
  POSITION_WEIGHT: { stem: 1, branch: 0.8 },

  /** 분야별 십성 묶음 점수. 연애는 성별에 따라 배우자 별이 다르다 */
  GROUP_POINTS: {
    loveMale: { bigeop: -4, siksang: 3, jae: 10, gwan: 1, inseong: 0 },
    loveFemale: { bigeop: -2, siksang: 0, jae: 3, gwan: 10, inseong: 1 },
    money: { bigeop: -6, siksang: 5, jae: 10, gwan: 1, inseong: -2 },
    career: { bigeop: -1, siksang: -2, jae: 3, gwan: 10, inseong: 5 },
    study: { bigeop: 1, siksang: 3, jae: -5, gwan: 3, inseong: 10 },
    health: { bigeop: 2, siksang: -1, jae: -1, gwan: -4, inseong: 3 },
    relationship: { bigeop: 6, siksang: 4, jae: 1, gwan: -2, inseong: 2 },
  } satisfies Record<string, GroupPoints>,

  /** 십성 하나하나의 추가 보정 */
  TEN_GOD_ADJUST: {
    geopjae: { money: -3, love: -1 },
    sanggwan: { career: -3, relationship: -1 },
    pyeongwan: { health: -2, career: -1 },
    jeonggwan: { career: 2 },
    jeongin: { study: 2 },
    pyeonin: { study: -1, health: -1 },
    siksin: { health: 2 },
  } as Partial<Record<TenGod, Partial<Points>>>,

  /** GROUP_POINTS 중 양수에만 곱하는 신강/신약 배율 */
  STRENGTH_MULT: {
    strong: { bigeop: 0.5, siksang: 1.2, jae: 1.2, gwan: 1.2, inseong: 0.5 },
    balanced: { bigeop: 1, siksang: 1, jae: 1, gwan: 1, inseong: 1 },
    weak: { bigeop: 1.2, siksang: 0.5, jae: 0.3, gwan: 0.4, inseong: 1.2 },
  } satisfies Record<Strength, GroupPoints>,

  /** 모든 분야에 더하는 신강/신약 적합도 */
  STRENGTH_FIT: {
    strong: { bigeop: -3, siksang: 2, jae: 3, gwan: 2, inseong: -2 },
    balanced: { bigeop: 0, siksang: 0, jae: 0, gwan: 0, inseong: 0 },
    weak: { bigeop: 3, siksang: -2, jae: -3, gwan: -3, inseong: 3 },
  } satisfies Record<Strength, GroupPoints>,

  ELEMENT_POINTS: {
    useful_element: { love: 6, money: 6, career: 6, study: 6, health: 7, relationship: 6 },
    harmful_element: { love: -6, money: -6, career: -6, study: -6, health: -7, relationship: -6 },
  },

  /** 건강운: 원국에 가장 적은 오행이 들어오면 +, 가장 많은 오행이면 − */
  BALANCE_POINTS: { scarce: 3, excess: -3 },

  /** 기간 지지 1글자 기준(위치 가중치 없음) */
  EVENT_POINTS: {
    clash_day_branch: { love: -8, money: -3, career: -3, study: -3, health: -6, relationship: -5 },
    combine_day_branch: { love: 8, money: 2, career: 2, study: 1, health: 1, relationship: 5 },
    clash_year_branch: { love: -1, money: -2, career: -4, study: -2, health: -3, relationship: -4 },
    peach_blossom: { love: 8, money: 0, career: 0, study: -2, health: 0, relationship: 3 },
    travel_horse: { love: 0, money: 2, career: 3, study: -1, health: -2, relationship: 1 },
    nobleman: { love: 3, money: 3, career: 4, study: 3, health: 3, relationship: 8 },
    academic_star: { love: 0, money: 0, career: 2, study: 8, health: 0, relationship: 0 },
  } satisfies Partial<Record<FactorCode, Points>>,

  /** 총운 = 분야 점수 가중 평균 */
  OVERALL_WEIGHTS: { love: 0.15, money: 0.2, career: 0.2, study: 0.15, health: 0.15, relationship: 0.15 } satisfies Points,

  /** 평균을 내면 점수가 50 쪽으로 몰리므로, 총운은 50에서 벗어난 만큼을 이 배수로 넓힌다 */
  OVERALL_SPREAD: 1.4,

  /** 점수 → 등급. 이 값 이상이면 그 등급 */
  LEVEL_FLOORS: [
    [75, 5],
    [60, 4],
    [45, 3],
    [30, 2],
    [0, 1],
  ] as [number, Level][],
};
// ---------------------------------------------------------------------------

export function levelOf(score: number): Level {
  for (const [floor, level] of SCORING.LEVEL_FLOORS) if (score >= floor) return level;
  return 1;
}

const clamp = (x: number) => Math.min(100, Math.max(0, x));

/** 60갑자 번호 하나(기간 기둥)에 대한 분야별 운 */
export function evaluate(chart: SajuChart, jiazi: number): Record<Category, CategoryFortune> {
  const S = SCORING;
  const dm = stemIndex(chart.dayMaster);
  const ps = mod(jiazi, 10);
  const pb = mod(jiazi, 12);
  const stemTenGod = tenGodOf(dm, ps);
  const branchTenGod = tenGodOf(dm, BRANCH_MAIN_STEM[pb]);

  const base: Points = { love: 0, money: 0, career: 0, study: 0, health: 0, relationship: 0 };
  const factorPoints = new Map<FactorCode, Points>();
  const addFactor = (code: FactorCode, pts: Partial<Points>, w = 1) => {
    const cur = factorPoints.get(code) ?? { love: 0, money: 0, career: 0, study: 0, health: 0, relationship: 0 };
    for (const c of SUBS) cur[c] += (pts[c] ?? 0) * w;
    factorPoints.set(code, cur);
  };

  // 1)·2) 십성
  const loveTable = chart.input.gender === 'male' ? S.GROUP_POINTS.loveMale : S.GROUP_POINTS.loveFemale;
  const tables: Record<SubCategory, GroupPoints> = {
    love: loveTable,
    money: S.GROUP_POINTS.money,
    career: S.GROUP_POINTS.career,
    study: S.GROUP_POINTS.study,
    health: S.GROUP_POINTS.health,
    relationship: S.GROUP_POINTS.relationship,
  };
  const tenGodTerms: [TenGod, number][] = [
    [stemTenGod, S.POSITION_WEIGHT.stem],
    [branchTenGod, S.POSITION_WEIGHT.branch],
  ];
  for (const [tg, w] of tenGodTerms) {
    const g = groupOf(tg);
    const adj = S.TEN_GOD_ADJUST[tg] ?? {};
    for (const c of SUBS) {
      const p = tables[c][g];
      base[c] += w * (p > 0 ? p * S.STRENGTH_MULT[chart.strength][g] : p);
      base[c] += w * (S.STRENGTH_FIT[chart.strength][g] + (adj[c] ?? 0));
    }
  }

  // 3) 오행
  const counts = chart.elementCounts;
  const minCount = Math.min(...ELEMENTS.map((e) => counts[e]));
  const maxCount = Math.max(...ELEMENTS.map((e) => counts[e]));
  const elementTerms: [Element, number][] = [
    [STEM_ELEMENT[ps], S.POSITION_WEIGHT.stem],
    [BRANCH_ELEMENT[pb], S.POSITION_WEIGHT.branch],
  ];
  for (const [e, w] of elementTerms) {
    if (e === chart.usefulElement) addFactor('useful_element', S.ELEMENT_POINTS.useful_element, w);
    if (e === chart.harmfulElement) addFactor('harmful_element', S.ELEMENT_POINTS.harmful_element, w);
    if (counts[e] === minCount) base.health += w * S.BALANCE_POINTS.scarce;
    else if (counts[e] === maxCount) base.health += w * S.BALANCE_POINTS.excess;
  }

  // 4) 원국 지지와의 관계
  const dayB = branchIndex(chart.day.branch);
  const yearB = branchIndex(chart.year.branch);
  if (isClash(pb, dayB)) addFactor('clash_day_branch', S.EVENT_POINTS.clash_day_branch);
  if (isCombine(pb, dayB)) addFactor('combine_day_branch', S.EVENT_POINTS.combine_day_branch);
  if (isClash(pb, yearB)) addFactor('clash_year_branch', S.EVENT_POINTS.clash_year_branch);

  // 5) 신살
  if (isPeachBlossom(pb, [yearB, dayB])) addFactor('peach_blossom', S.EVENT_POINTS.peach_blossom);
  if (isTravelHorse(pb, [yearB, dayB])) addFactor('travel_horse', S.EVENT_POINTS.travel_horse);
  if (isNobleman(dm, pb)) addFactor('nobleman', S.EVENT_POINTS.nobleman);
  if (isAcademicStar(dm, pb)) addFactor('academic_star', S.EVENT_POINTS.academic_star);

  const factorsFor = (pick: (p: Points) => number): FactorCode[] =>
    [...factorPoints.entries()]
      .map(([code, p]) => [code, pick(p)] as const)
      .filter(([, v]) => v !== 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .map(([code]) => code);

  const result = {} as Record<Category, CategoryFortune>;
  let overallRaw = 0;
  for (const c of SUBS) {
    let raw = 50 + base[c];
    for (const p of factorPoints.values()) raw += p[c];
    const score = Math.round(clamp(raw));
    overallRaw += S.OVERALL_WEIGHTS[c] * score;
    result[c] = { category: c, score, level: levelOf(score), stemTenGod, branchTenGod, factors: factorsFor((p) => p[c]) };
  }
  const overall = Math.round(clamp(50 + S.OVERALL_SPREAD * (overallRaw - 50)));
  result.overall = {
    category: 'overall',
    score: overall,
    level: levelOf(overall),
    stemTenGod,
    branchTenGod,
    factors: factorsFor((p) => SUBS.reduce((sum, c) => sum + S.OVERALL_WEIGHTS[c] * p[c], 0)),
  };
  return result;
}

function period(chart: SajuChart, kind: PeriodKind, label: string, jiazi: number, startJdn: number, endJdn: number): PeriodFortune {
  return {
    kind,
    label,
    pillar: makePillar(jiazi, chart.dayMaster),
    startDate: jdnToIso(startJdn),
    endDate: jdnToIso(endJdn),
    categories: evaluate(chart, jiazi),
  };
}

const assertYear = (year: number) => {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error(`연도는 1900~2100이어야 합니다: ${year}`);
};

/** 대운 10개. 기간은 시작 나이가 되는 해의 생일부터 10년 */
export function getDaeunFortunes(chart: SajuChart): PeriodFortune[] {
  const { month, day } = chart.corrected;
  return chart.daeun.map((d) => {
    const jz = jiaziOf(stemIndex(d.pillar.stem), branchIndex(d.pillar.branch));
    const start = ymdToJdn(d.startYear, month, day);
    const end = ymdToJdn(d.startYear + 10, month, day) - 1;
    return period(chart, 'daeun', `${d.startAge}~${d.endAge}세`, jz, start, end);
  });
}

/** 세운: 그해 입춘부터 다음 해 입춘 전날까지 */
export function getYearFortune(chart: SajuChart, year: number): PeriodFortune {
  assertYear(year);
  const start = koreaDateJdn(jieUtcMs(ipchunIndex(year)));
  const end = koreaDateJdn(jieUtcMs(ipchunIndex(year + 1))) - 1;
  return period(chart, 'year', `${year}년`, yearJiazi(year), start, end);
}

/** 월운 12개: 그해 인월(입춘)부터 축월(다음 해 소한~입춘 전날)까지. 이름은 절이 든 양력 달 */
export function getMonthFortunes(chart: SajuChart, year: number): PeriodFortune[] {
  assertYear(year);
  const out: PeriodFortune[] = [];
  for (let i = 0; i < 12; i++) {
    const n = ipchunIndex(year) + i;
    const start = koreaDateJdn(jieUtcMs(n));
    const end = koreaDateJdn(jieUtcMs(n + 1)) - 1;
    const s = jdnToYmd(start);
    out.push(period(chart, 'month', `${s.year}년 ${s.month}월`, monthJiaziOfJie(n), start, end));
  }
  return out;
}

/** 일진. date는 'YYYY-MM-DD' */
export function getDayFortune(chart: SajuChart, date: string): PeriodFortune {
  const { year, month, day } = parseIsoDate(date);
  const jdn = ymdToJdn(year, month, day);
  return period(chart, 'day', `${year}년 ${month}월 ${day}일`, dayJiazi(jdn), jdn, jdn);
}
