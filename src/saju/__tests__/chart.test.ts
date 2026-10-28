import { describe, expect, it } from '@jest/globals';
import { Solar } from 'lunar-javascript';
import { computeChart } from '../api';
import { birth, gz } from './helpers';

describe('원국 기둥', () => {
  it('2000-01-01 12:00 양력: 입춘 전이라 己卯년, 丙子월, 戊午일, 戊午시', () => {
    // 戊午일은 널리 알려진 값(2000-01-01 = 戊午日). lunar-javascript도 같은 값을 준다.
    const c = computeChart(birth({}));
    expect(gz(c.year)).toBe('己卯');
    expect(gz(c.month)).toBe('丙子');
    expect(gz(c.day)).toBe('戊午');
    // 보정 후 11:28 → 午시(11~13시), 戊일의 午시는 戊午
    expect(c.corrected).toEqual({ year: 2000, month: 1, day: 1, hour: 11, minute: 28 });
    expect(gz(c.hour)).toBe('戊午');
    expect(c.day.hangul).toBe('무오');
    expect(c.dayMaster).toBe('戊');
    expect(c.day.stemTenGod).toBeNull();
  });

  it('1900-01-01은 甲戌일(만세력 기준값)', () => {
    expect(gz(computeChart(birth({ year: 1900, hour: null, minute: null })).day)).toBe('甲戌');
  });

  it('입춘 경계: 2024 입춘은 2/4 17:27(한국 시각). 직전은 癸卯년 乙丑월, 직후는 甲辰년 丙寅월', () => {
    const before = computeChart(birth({ year: 2024, month: 2, day: 4, hour: 17, minute: 20 }));
    const after = computeChart(birth({ year: 2024, month: 2, day: 4, hour: 17, minute: 35 }));
    expect([gz(before.year), gz(before.month)]).toEqual(['癸卯', '乙丑']);
    expect([gz(after.year), gz(after.month)]).toEqual(['甲辰', '丙寅']);
    // 일주는 같은 날 戊戌
    expect(gz(before.day)).toBe('戊戌');
    expect(gz(after.day)).toBe('戊戌');
  });

  it('보정으로 날짜가 전날로 넘어가면 일주도 전날 것(00:10 → 전날 23:38, 야자시)', () => {
    const c = computeChart(birth({ hour: 0, minute: 10 }));
    expect(c.corrected).toEqual({ year: 1999, month: 12, day: 31, hour: 23, minute: 38 });
    expect(gz(c.day)).toBe('丁巳');
    // 야자시: 시주 천간은 다음 날(戊) 자시 기준 → 壬子
    expect(gz(c.hour)).toBe('壬子');
  });

  it('일주 경계는 자정: 23:50생은 그날 일주(보정 후 23:18)', () => {
    const c = computeChart(birth({ year: 2026, month: 10, day: 28, hour: 23, minute: 50 }));
    expect(gz(c.day)).toBe('乙亥');
  });

  it('서머타임(1987-07-15 10:30): 92분 빼서 08:58 → 辰시', () => {
    const c = computeChart(birth({ year: 1987, month: 7, day: 15, hour: 10, minute: 30 }));
    expect(c.corrected).toEqual({ year: 1987, month: 7, day: 15, hour: 8, minute: 58 });
    expect(gz(c.day)).toBe('乙丑');
    expect(c.hour?.branch).toBe('辰');
    // 서머타임이 아닌 날(1989)은 32분만 뺀다
    const c2 = computeChart(birth({ year: 1989, month: 7, day: 15, hour: 10, minute: 30 }));
    expect([c2.corrected.hour, c2.corrected.minute]).toEqual([9, 58]);
  });

  it('1954~1961 표준시(UTC+8:30)와 서머타임: 1957-06-01 10:00 → 62분 빼서 08:58', () => {
    const c = computeChart(birth({ year: 1957, month: 6, day: 1, hour: 10, minute: 0 }));
    expect([c.corrected.hour, c.corrected.minute]).toEqual([8, 58]);
    expect(gz(c.day)).toBe('甲辰');
  });

  it('시간 모름: 시주 null, 오행은 6글자, 대운은 계산', () => {
    const c = computeChart(birth({ hour: null, minute: null }));
    expect(c.hour).toBeNull();
    expect(c.corrected.hour).toBeNull();
    expect(Object.values(c.elementCounts).reduce((a, b) => a + b, 0)).toBe(6);
    expect(c.daeun).toHaveLength(10);
    const known = computeChart(birth({}));
    expect(Object.values(known.elementCounts).reduce((a, b) => a + b, 0)).toBe(8);
  });

  it('십성: 戊 일간 기준', () => {
    const c = computeChart(birth({}));
    expect(c.year.stemTenGod).toBe('geopjae'); // 己: 같은 토, 음양 다름
    expect(c.year.branchTenGod).toBe('jeonggwan'); // 卯(정기 乙): 목극토, 음양 다름
    expect(c.month.stemTenGod).toBe('pyeonin'); // 丙: 화생토, 음양 같음
    expect(c.month.branchTenGod).toBe('jeongjae'); // 子(정기 癸): 토극수, 음양 다름
    expect(c.day.branchTenGod).toBe('jeongin'); // 午(정기 丁)
  });

  it('lunar-javascript와 대조: 무작위 400개 출생의 년·월·일·시주', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let i = 0; i < 400; i++) {
      const y = 1962 + Math.floor(rnd() * 60); // 표준시 UTC+9, 서머타임 없는 해 위주
      if (y === 1987 || y === 1988) continue;
      const m = 1 + Math.floor(rnd() * 12);
      const d = 1 + Math.floor(rnd() * 28);
      const h = Math.floor(rnd() * 24);
      const mi = Math.floor(rnd() * 60);
      const c = computeChart(birth({ year: y, month: m, day: d, hour: h, minute: mi }));
      // 년·월주: 같은 순간의 베이징 시각(한국 시각 − 1시간)으로 라이브러리에 묻는다
      const bj = new Date(Date.UTC(y, m - 1, d, h - 1, mi));
      const lb = Solar.fromYmdHms(bj.getUTCFullYear(), bj.getUTCMonth() + 1, bj.getUTCDate(), bj.getUTCHours(), bj.getUTCMinutes(), 0).getLunar();
      expect(gz(c.year)).toBe(lb.getYearInGanZhiExact());
      expect(gz(c.month)).toBe(lb.getMonthInGanZhiExact());
      // 일·시주: 보정된 지방시로 묻는다 (라이브러리 getTimeInGanZhi도 23시를 다음 날 자시 천간으로 짚는다)
      const k = c.corrected;
      const ll = Solar.fromYmdHms(k.year, k.month, k.day, k.hour as number, k.minute as number, 0).getLunar();
      expect(gz(c.day)).toBe(ll.getDayInGanZhi());
      expect(gz(c.hour)).toBe(ll.getTimeInGanZhi());
    }
  });

  it('잘못된 입력은 오류', () => {
    expect(() => computeChart(birth({ month: 2, day: 30 }))).toThrow();
    expect(() => computeChart(birth({ hour: 24 }))).toThrow();
    expect(() => computeChart(birth({ year: 1800 }))).toThrow();
  });
});

describe('신강/신약과 용신', () => {
  it('용신과 기신은 서로 다르고, 결과는 늘 같다', () => {
    for (let day = 1; day <= 28; day++) {
      const a = computeChart(birth({ month: 5, day }));
      const b = computeChart(birth({ month: 5, day }));
      expect(a).toEqual(b);
      expect(a.usefulElement).not.toBe(a.harmfulElement);
      expect(['strong', 'balanced', 'weak']).toContain(a.strength);
    }
  });

  it('신약이면 용신은 인성·비겁, 신강이면 식상·재성·관성 중 하나', () => {
    const helpers: Record<string, string[]> = {
      wood: ['wood', 'water'], fire: ['fire', 'wood'], earth: ['earth', 'fire'], metal: ['metal', 'earth'], water: ['water', 'metal'],
    };
    for (let i = 0; i < 200; i++) {
      const c = computeChart(birth({ year: 1970 + (i % 50), month: 1 + (i % 12), day: 1 + (i % 28), hour: i % 24 }));
      const help = helpers[c.dayMasterElement];
      if (c.strength === 'weak') expect(help).toContain(c.usefulElement);
      if (c.strength === 'strong') expect(help).not.toContain(c.usefulElement);
    }
  });
});

describe('대운', () => {
  it('2000-01-01: 己(음)년 남자는 역행(乙亥부터), 여자는 순행(丁丑부터)', () => {
    const m = computeChart(birth({ gender: 'male' }));
    const f = computeChart(birth({ gender: 'female' }));
    expect(m.daeun.map((d) => gz(d.pillar)).slice(0, 3)).toEqual(['乙亥', '甲戌', '癸酉']);
    expect(f.daeun.map((d) => gz(d.pillar)).slice(0, 3)).toEqual(['丁丑', '戊寅', '己卯']);
    // 남자: 지난 절 대설(1999-12-07 22:47 한국 시각)부터 약 24.5일 ÷ 3 = 8.2 → 8세
    expect(m.daeunStartAge).toBe(8);
    // 여자: 다음 절 소한(2000-01-06 10:00 한국 시각)까지 약 4.9일 ÷ 3 = 1.6 → 2세
    expect(f.daeunStartAge).toBe(2);
    expect(m.daeun[0]).toMatchObject({ startAge: 8, endAge: 17, startYear: 2008, endYear: 2017 });
    expect(m.daeun[9].startAge).toBe(98);
  });

  it('양년(庚辰 2000-06-01) 남자는 순행, 여자는 역행', () => {
    const m = computeChart(birth({ month: 6, gender: 'male' }));
    const f = computeChart(birth({ month: 6, gender: 'female' }));
    expect(gz(m.month)).toBe('辛巳');
    expect(gz(m.daeun[0].pillar)).toBe('壬午');
    expect(gz(f.daeun[0].pillar)).toBe('庚辰');
  });
});
