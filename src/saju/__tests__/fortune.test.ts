import { describe, expect, it } from '@jest/globals';
import { computeChart, getDaeunFortunes, getDayFortune, getMonthFortunes, getYearFortune } from '../api';
import { CATEGORIES, type PeriodFortune } from '../types';
import { birth, gz } from './helpers';

const check = (p: PeriodFortune) => {
  for (const c of CATEGORIES) {
    const f = p.categories[c];
    expect(f.category).toBe(c);
    expect(Number.isInteger(f.score)).toBe(true);
    expect(f.score).toBeGreaterThanOrEqual(0);
    expect(f.score).toBeLessThanOrEqual(100);
    expect([1, 2, 3, 4, 5]).toContain(f.level);
    expect(new Set(f.factors).size).toBe(f.factors.length);
  }
};

describe('기간 운', () => {
  const chart = computeChart(birth({}));

  it('세운 2026 = 丙午년, 입춘(2/4)부터 다음 입춘 전날까지', () => {
    const y = getYearFortune(chart, 2026);
    expect(y.kind).toBe('year');
    expect(y.label).toBe('2026년');
    expect(gz(y.pillar)).toBe('丙午');
    expect(y.startDate).toBe('2026-02-04');
    expect(y.endDate).toBe('2027-02-03');
    check(y);
  });

  it('월운 12개: 寅월(2026년 2월)부터 丑월(2027년 1월)까지, 날짜가 이어진다', () => {
    const ms = getMonthFortunes(chart, 2026);
    expect(ms).toHaveLength(12);
    expect(ms.map((m) => m.pillar.branch).join('')).toBe('寅卯辰巳午未申酉戌亥子丑');
    expect(gz(ms[0].pillar)).toBe('庚寅'); // 丙년 → 庚寅월(병신년 경인두)
    expect(ms[0].label).toBe('2026년 2월');
    expect(ms[1].label).toBe('2026년 3월');
    expect(ms[11].label).toBe('2027년 1월');
    expect(ms[0].startDate).toBe('2026-02-04');
    expect(ms[11].endDate).toBe('2027-02-03');
    for (let i = 1; i < 12; i++) {
      const prevEnd = new Date(ms[i - 1].endDate + 'T00:00:00Z').getTime();
      expect(new Date(ms[i].startDate + 'T00:00:00Z').getTime() - prevEnd).toBe(86400000);
    }
    ms.forEach(check);
  });

  it('일진 2026-10-28 = 乙亥일', () => {
    const d = getDayFortune(chart, '2026-10-28');
    expect(d.label).toBe('2026년 10월 28일');
    expect(gz(d.pillar)).toBe('乙亥');
    expect([d.startDate, d.endDate]).toEqual(['2026-10-28', '2026-10-28']);
    check(d);
    expect(() => getDayFortune(chart, '2026-13-01')).toThrow();
  });

  it('대운 10개와 나이 표시', () => {
    const ds = getDaeunFortunes(chart);
    expect(ds).toHaveLength(10);
    expect(ds[0].label).toBe('8~17세');
    expect(ds[0].startDate).toBe('2008-01-01');
    expect(ds[0].endDate).toBe('2017-12-31');
    expect(gz(ds[0].pillar)).toBe(gz(chart.daeun[0].pillar));
    ds.forEach(check);
  });

  it('십성: 戊 일간에 丙午년 → 천간 편인, 지지(정기 丁) 정인', () => {
    const y = getYearFortune(chart, 2026);
    expect(y.categories.overall.stemTenGod).toBe('pyeonin');
    expect(y.categories.overall.branchTenGod).toBe('jeongin');
  });

  it('이유 코드: 일지 午와 子일은 충, 未일은 육합', () => {
    // 2026-10-29 = 丙子일, 2026-11-05 = 癸未일
    const clash = getDayFortune(chart, '2026-10-29');
    expect(gz(clash.pillar)).toBe('丙子');
    expect(clash.categories.love.factors).toContain('clash_day_branch');
    const combine = getDayFortune(chart, '2026-11-05');
    expect(gz(combine.pillar)).toBe('癸未');
    expect(combine.categories.love.factors).toContain('combine_day_branch');
  });

  it('신살: 戊 일간의 천을귀인은 丑·未, 문창귀인은 申', () => {
    const d = getDayFortune(chart, '2026-11-05'); // 癸未
    expect(d.categories.relationship.factors).toContain('nobleman');
    // 일지 午(寅午戌)·년지 卯(亥卯未) → 도화는 卯·子, 역마는 申·巳
    const ziDay = getDayFortune(chart, '2026-10-29'); // 丙子
    expect(ziDay.categories.love.factors).toContain('peach_blossom');
  });

  it('같은 입력이면 같은 결과(결정적)이고, 많은 사람·날짜에서도 0~100을 지킨다', () => {
    expect(getMonthFortunes(chart, 2030)).toEqual(getMonthFortunes(computeChart(birth({})), 2030));
    for (let i = 0; i < 60; i++) {
      const c = computeChart(birth({ year: 1950 + i, month: 1 + (i % 12), day: 1 + ((i * 7) % 28), hour: i % 3 === 0 ? null : i % 24, minute: i % 3 === 0 ? null : 15, gender: i % 2 ? 'male' : 'female' }));
      getDaeunFortunes(c).forEach(check);
      check(getYearFortune(c, 2026));
      for (let d = 1; d <= 28; d += 9) check(getDayFortune(c, `2026-11-${String(d).padStart(2, '0')}`));
    }
  });
});
