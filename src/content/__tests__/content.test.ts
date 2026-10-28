import { describe, expect, it } from '@jest/globals';
import {
  CATEGORY_LABELS,
  getCategoryText,
  getDayMasterProfile,
  getElementBalanceText,
  getLuckyItems,
} from '../api';
import { CATEGORIES } from '../../saju/types';
import type {
  CategoryFortune,
  Element,
  FactorCode,
  Level,
  PeriodKind,
  Pillar,
  SajuChart,
  Stem,
  TenGod,
} from '../../saju/types';
import { DAY_MASTER_PROFILES } from '../data/dayMasters';
import { ELEMENT_INFO } from '../data/elements';
import { FACTOR_TEXT } from '../data/factors';
import { ADVICE, HEADLINES, OPENINGS } from '../data/levels';
import { BRANCH_TEN_GOD_TEXT, SAME_TEN_GOD_TEXT, TEN_GOD_TEXT, TEN_GOD_TIPS } from '../data/tenGods';
import { fnv1a } from '../hash';

const TEN_GODS: TenGod[] = [
  'bigyeon', 'geopjae', 'siksin', 'sanggwan', 'pyeonjae',
  'jeongjae', 'pyeongwan', 'jeonggwan', 'pyeonin', 'jeongin',
];
const LEVELS: Level[] = [1, 2, 3, 4, 5];
const KINDS: PeriodKind[] = ['daeun', 'year', 'month', 'day'];
const FACTORS: FactorCode[] = [
  'useful_element', 'harmful_element', 'clash_day_branch', 'combine_day_branch',
  'clash_year_branch', 'peach_blossom', 'travel_horse', 'nobleman', 'academic_star',
];
const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const BANNED = ['반드시', '100%', '죽', '불치'];

function fortune(over: Partial<CategoryFortune> = {}): CategoryFortune {
  return {
    category: 'overall',
    score: 60,
    level: 3,
    stemTenGod: 'jeongjae',
    branchTenGod: 'siksin',
    factors: [],
    ...over,
  };
}

function sentenceCount(text: string): number {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0).length;
}

/** data/ 안의 모든 문자열을 모은다 */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

describe('getCategoryText', () => {
  it('십성 × 분야 × 등급 × 기간 모든 조합에서 빈 문장이 없다', () => {
    let n = 0;
    for (const kind of KINDS)
      for (const category of CATEGORIES)
        for (const level of LEVELS)
          for (const stemTenGod of TEN_GODS)
            for (const branchTenGod of TEN_GODS) {
              const t = getCategoryText(kind, fortune({ category, level, stemTenGod, branchTenGod }), 'seed');
              expect(t.headline.trim().length).toBeGreaterThan(0);
              expect(t.body.trim().length).toBeGreaterThan(0);
              expect(t.advice.trim().length).toBeGreaterThan(0);
              expect(t.body).not.toContain('{c}');
              const c = sentenceCount(t.body);
              expect(c).toBeGreaterThanOrEqual(3);
              expect(c).toBeLessThanOrEqual(5);
              n++;
            }
    expect(n).toBe(4 * 7 * 5 * 10 * 10);
  });

  it('이유 코드가 모두 들어와도 본문은 5문장 이하다', () => {
    for (const category of CATEGORIES) {
      const t = getCategoryText('day', fortune({ category, factors: FACTORS }), 's');
      expect(sentenceCount(t.body)).toBeLessThanOrEqual(5);
    }
  });

  it('분야에 맞는 이유 문장을 붙인다', () => {
    const love = getCategoryText('day', fortune({ category: 'love', factors: ['peach_blossom'] }), 'x');
    expect(FACTOR_TEXT.peach_blossom.byCategory.love!.some((s) => love.body.includes(s))).toBe(true);
    const study = getCategoryText('year', fortune({ category: 'study', factors: ['academic_star'] }), 'x');
    expect(FACTOR_TEXT.academic_star.byCategory.study!.some((s) => study.body.includes(s))).toBe(true);
    // 관련 없는 분야에는 붙이지 않는다
    const money = getCategoryText('day', fortune({ category: 'money', factors: ['academic_star'] }), 'x');
    expect(sentenceCount(money.body)).toBe(3);
  });

  it('같은 seed면 같은 문장이 나온다', () => {
    const f = fortune({ category: 'career', level: 4, stemTenGod: 'jeonggwan', factors: ['nobleman'] });
    expect(getCategoryText('day', f, '2026-10-28')).toEqual(getCategoryText('day', f, '2026-10-28'));
  });

  it('seed가 다르면 문장이 다양하게 나온다', () => {
    const f = fortune({ category: 'love', level: 4, stemTenGod: 'pyeonjae', branchTenGod: 'jeongin' });
    const bodies = new Set<string>();
    const headlines = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      const t = getCategoryText('day', f, `2026-11-${String(d).padStart(2, '0')}`);
      bodies.add(t.body);
      headlines.add(t.headline);
    }
    expect(bodies.size).toBeGreaterThanOrEqual(10);
    expect(headlines.size).toBeGreaterThanOrEqual(2);
  });

  it('기간 종류에 맞는 말투로 시작한다', () => {
    const f = fortune();
    expect(getCategoryText('day', f, 's').body).toMatch(/^오늘/);
    expect(getCategoryText('month', f, 's').body).toMatch(/^이달/);
    expect(getCategoryText('year', f, 's').body).toMatch(/^이 해/);
    expect(getCategoryText('daeun', f, 's').body).toMatch(/^이 (10년|대운)/);
  });
});

describe('문구 데이터', () => {
  it('모든 칸에 문장이 3개 이상 있다', () => {
    for (const g of TEN_GODS) {
      for (const c of CATEGORIES) {
        expect(TEN_GOD_TEXT[g][c].up.length).toBeGreaterThanOrEqual(3);
        expect(TEN_GOD_TEXT[g][c].down.length).toBeGreaterThanOrEqual(3);
      }
      expect(BRANCH_TEN_GOD_TEXT[g].length).toBeGreaterThanOrEqual(3);
      expect(TEN_GOD_TIPS[g].length).toBeGreaterThanOrEqual(3);
    }
    expect(SAME_TEN_GOD_TEXT.length).toBeGreaterThanOrEqual(3);
    for (const c of CATEGORIES) {
      for (const l of LEVELS) expect(HEADLINES[c][l].length).toBeGreaterThanOrEqual(3);
      for (const b of ['low', 'mid', 'high'] as const) expect(ADVICE[c][b].length).toBeGreaterThanOrEqual(3);
    }
    for (const k of KINDS) for (const l of LEVELS) expect(OPENINGS[k][l].length).toBeGreaterThanOrEqual(3);
    for (const code of FACTORS) {
      const t = FACTOR_TEXT[code];
      for (const pool of [t.general, ...Object.values(t.byCategory)]) {
        if (pool) expect(pool.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('금지어가 없다', () => {
    const all = collectStrings([
      DAY_MASTER_PROFILES, ELEMENT_INFO, FACTOR_TEXT, HEADLINES, OPENINGS, ADVICE,
      TEN_GOD_TEXT, BRANCH_TEN_GOD_TEXT, SAME_TEN_GOD_TEXT, TEN_GOD_TIPS, CATEGORY_LABELS,
    ]);
    expect(all.length).toBeGreaterThan(500);
    for (const s of all) for (const w of BANNED) expect(s).not.toContain(w);
  });

  it('조합된 결과에도 금지어가 없다', () => {
    for (const kind of KINDS)
      for (const category of CATEGORIES)
        for (const level of LEVELS) {
          const t = getCategoryText(kind, fortune({ category, level, factors: FACTORS }), `${kind}${level}`);
          for (const w of BANNED) expect(t.headline + t.body + t.advice).not.toContain(w);
        }
  });
});

describe('getDayMasterProfile', () => {
  it('10개 일간 모두 제목·요약·장점 4개·주의점 3개가 있다', () => {
    for (const s of STEMS) {
      const p = getDayMasterProfile(s);
      expect(p.title.length).toBeGreaterThan(0);
      expect(sentenceCount(p.summary)).toBeGreaterThanOrEqual(3);
      expect(sentenceCount(p.summary)).toBeLessThanOrEqual(4);
      expect(p.strengths).toHaveLength(4);
      expect(p.cautions).toHaveLength(3);
    }
  });

  it('돌려준 값을 고쳐도 원본은 그대로다', () => {
    getDayMasterProfile('甲').strengths.push('x');
    expect(getDayMasterProfile('甲').strengths).toHaveLength(4);
  });
});

function pillar(): Pillar {
  return {
    stem: '甲', branch: '子', hangul: '갑자', stemElement: 'wood', branchElement: 'water',
    stemYinYang: 'yang', branchYinYang: 'yang', stemTenGod: null, branchTenGod: 'jeongin',
  };
}

function chart(over: Partial<SajuChart> = {}): SajuChart {
  return {
    input: { name: '테스트', year: 1990, month: 1, day: 1, calendar: 'solar', isLeapMonth: false, hour: 10, minute: 0, gender: 'female' },
    corrected: { year: 1990, month: 1, day: 1, hour: 9, minute: 28 },
    year: pillar(), month: pillar(), day: pillar(), hour: pillar(),
    dayMaster: '甲', dayMasterElement: 'wood',
    elementCounts: { wood: 3, fire: 1, earth: 0, metal: 2, water: 2 },
    strength: 'strong', usefulElement: 'metal', harmfulElement: 'wood',
    daeunStartAge: 5, daeun: [],
    ...over,
  };
}

describe('getElementBalanceText', () => {
  it('많음·부족·없음, 신강, 용신을 설명한다', () => {
    const t = getElementBalanceText(chart());
    expect(t.body).toContain('목(木)이 많은 편');
    expect(t.body).toContain('토(土)는 하나도 없어요');
    expect(t.body).toContain('화(火)는 하나뿐');
    expect(t.body).toContain('신강');
    expect(t.body).toContain('용신');
    expect(t.body).toContain('금(金)이에요');
    expect(t.advice).toContain('흰색');
    expect(t.body).not.toContain('시주 없이');
  });

  it('시주가 없으면 삼주로 풀었다고 알린다', () => {
    const t = getElementBalanceText(
      chart({ hour: null, elementCounts: { wood: 1, fire: 1, earth: 2, metal: 1, water: 1 }, strength: 'weak', usefulElement: 'water', harmfulElement: 'earth' }),
    );
    expect(t.body).toContain('시주 없이');
    expect(t.body).toContain('6글자');
    expect(t.body).toContain('신약');
    expect(t.body).toContain('수(水)예요');
  });

  it('모든 신강도·용신 조합에서 금지어 없이 문장을 만든다', () => {
    for (const strength of ['strong', 'balanced', 'weak'] as const)
      for (const usefulElement of ELEMENTS)
        for (const harmfulElement of ELEMENTS) {
          const t = getElementBalanceText(chart({ strength, usefulElement, harmfulElement }));
          for (const s of [t.headline, t.body, t.advice]) {
            expect(s.length).toBeGreaterThan(0);
            for (const w of BANNED) expect(s).not.toContain(w);
          }
        }
  });
});

describe('getLuckyItems', () => {
  it('오행 표준에 맞는 색·숫자·방향을 준다', () => {
    const expected: Record<Element, { numbers: number[]; direction: string }> = {
      wood: { numbers: [3, 8], direction: '동쪽' },
      fire: { numbers: [2, 7], direction: '남쪽' },
      earth: { numbers: [5, 10], direction: '가운데(중앙)' },
      metal: { numbers: [4, 9], direction: '서쪽' },
      water: { numbers: [1, 6], direction: '북쪽' },
    };
    for (const e of ELEMENTS) {
      const l = getLuckyItems(e, 'seed');
      expect(expected[e].numbers).toContain(l.number);
      expect(l.direction).toBe(expected[e].direction);
      expect(ELEMENT_INFO[e].colors).toContain(l.color);
      expect(l.item.length).toBeGreaterThan(0);
    }
  });

  it('seed로 결정되고 날마다 아이템이 달라진다', () => {
    expect(getLuckyItems('fire', 'a')).toEqual(getLuckyItems('fire', 'a'));
    const items = new Set<string>();
    for (let d = 1; d <= 30; d++) items.add(getLuckyItems('fire', `day-${d}`).item);
    expect(items.size).toBeGreaterThanOrEqual(3);
  });
});

describe('기타', () => {
  it('분야 이름', () => {
    expect(CATEGORY_LABELS).toEqual({
      overall: '총운', love: '연애·결혼운', money: '금전운', career: '직업·성공운',
      study: '학업·시험운', health: '건강운', relationship: '인간관계운',
    });
  });

  it('FNV-1a 해시가 알려진 값과 같다', () => {
    expect(fnv1a('')).toBe(0x811c9dc5);
    expect(fnv1a('a')).toBe(0xe40c292c);
  });
});
