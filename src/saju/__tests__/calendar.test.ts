import { describe, expect, it } from '@jest/globals';
import { Lunar, LunarYear, Solar } from 'lunar-javascript';
import { computeChart } from '../api';
import { ipchunIndex, jieUtcMs } from '../engine/astro';
import { koreanLeapMonth, koreanLunarToJdn } from '../engine/koreanLunar';
import { correctBirthTime, jdnToIso, koreaDstMinutes, wallMinutes } from '../engine/time';
import { birth, gz } from './helpers';

const lunarIso = (y: number, m: number, d: number, leap = false) => jdnToIso(koreanLunarToJdn(y, m, d, leap));

describe('한국 음력 → 양력', () => {
  it('윤달 입력: 2023년 윤2월 1일 = 2023-03-22, 2020년 윤4월 1일 = 2020-05-23', () => {
    expect(lunarIso(2023, 2, 1, true)).toBe('2023-03-22');
    expect(lunarIso(2023, 2, 1, false)).toBe('2023-02-20');
    expect(lunarIso(2020, 4, 1, true)).toBe('2020-05-23');
  });

  it('한국과 중국 음력이 다른 해: 한국 기준으로 계산한다', () => {
    // 2012년 한국은 윤3월(중국은 윤4월)
    expect(koreanLeapMonth(2012)).toBe(3);
    expect(LunarYear.fromYear(2012).getLeapMonth()).toBe(4);
    expect(lunarIso(2012, 3, 1, true)).toBe('2012-04-21');
    // 2017년 한국 윤5월(중국 윤6월)
    expect(koreanLeapMonth(2017)).toBe(5);
    // 설날: 1997-02-08(중국 2/7), 2027-02-07(중국 2/6)
    expect(lunarIso(1997, 1, 1)).toBe('1997-02-08');
    expect(lunarIso(2027, 1, 1)).toBe('2027-02-07');
  });

  it('최근 설날·추석(공휴일 달력)과 일치', () => {
    expect(lunarIso(2024, 1, 1)).toBe('2024-02-10');
    expect(lunarIso(2025, 1, 1)).toBe('2025-01-29');
    expect(lunarIso(2026, 1, 1)).toBe('2026-02-17');
    expect(lunarIso(2024, 8, 15)).toBe('2024-09-17');
    expect(lunarIso(2025, 8, 15)).toBe('2025-10-06');
    expect(lunarIso(2026, 8, 15)).toBe('2026-09-25');
  });

  it('대부분의 달은 lunar-javascript(중국 음력)와 같다 — 2000~2030 대조, 다른 달은 알려진 경우뿐', () => {
    const diffs: string[] = [];
    for (let y = 2000; y <= 2030; y++) {
      for (let m = 1; m <= 12; m++) {
        if (lunarIso(y, m, 1) !== Lunar.fromYmd(y, m, 1).getSolar().toYmd()) diffs.push(`${y}-${m}`);
      }
    }
    // 모두 합삭이 한국 시각 00~01시(베이징 23~24시)에 든 달, 또는 윤달 위치가 달라진 해(2012, 2017)
    expect(diffs).toEqual(['2001-4', '2005-11', '2012-4', '2012-5', '2012-7', '2013-5', '2017-6', '2019-11', '2020-2', '2023-4', '2026-9', '2027-1', '2028-1', '2029-6']);
  });

  it('음력 입력으로 사주 계산', () => {
    const c = computeChart(birth({ calendar: 'lunar', year: 2023, month: 2, day: 1, isLeapMonth: true, hour: null, minute: null }));
    expect(c.corrected).toMatchObject({ year: 2023, month: 3, day: 22 });
    expect(gz(c.day)).toBe(Solar.fromYmd(2023, 3, 22).getLunar().getDayInGanZhi());
  });

  it('없는 윤달·날짜는 오류', () => {
    expect(() => koreanLunarToJdn(2023, 3, 1, true)).toThrow();
    expect(() => koreanLunarToJdn(2023, 1, 31, false)).toThrow();
  });
});

describe('절기 순간', () => {
  it('lunar-javascript 절기표(베이징 시각)와 같다', () => {
    for (const y of [1950, 1987, 2000, 2024, 2026, 2050]) {
      const table = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
      const libUtcMs = Date.parse(table['立春'].toYmdHms().replace(' ', 'T') + '+08:00');
      // 라이브러리 표는 초 단위로 반올림돼 있다
      expect(Math.abs(jieUtcMs(ipchunIndex(y)) - libUtcMs)).toBeLessThan(1000);
    }
  });
});

describe('서머타임 표', () => {
  it('시행 기간 경계', () => {
    expect(koreaDstMinutes(wallMinutes(1987, 5, 10, 1, 59))).toBe(0);
    expect(koreaDstMinutes(wallMinutes(1987, 5, 10, 3, 0))).toBe(60);
    expect(koreaDstMinutes(wallMinutes(1987, 10, 11, 2, 59))).toBe(60);
    expect(koreaDstMinutes(wallMinutes(1987, 10, 11, 3, 0))).toBe(0);
    expect(koreaDstMinutes(wallMinutes(1948, 6, 1, 0, 0))).toBe(60);
    expect(koreaDstMinutes(wallMinutes(1948, 9, 13, 0, 0))).toBe(0);
    expect(koreaDstMinutes(wallMinutes(1953, 7, 1, 12, 0))).toBe(0); // 전쟁 중 미시행
    expect(koreaDstMinutes(wallMinutes(1960, 9, 17, 23, 59))).toBe(60);
    expect(koreaDstMinutes(wallMinutes(1960, 9, 18, 0, 0))).toBe(0);
    expect(koreaDstMinutes(wallMinutes(1989, 7, 1, 12, 0))).toBe(0);
  });

  it('보정이 날짜를 되돌린다: 1988-07-01 01:00(서머타임) → 6/30 23:28', () => {
    const c = correctBirthTime(1988, 7, 1, 1, 0);
    expect(jdnToIso(c.jdn)).toBe('1988-06-30');
    expect([c.hour, c.minute]).toEqual([23, 28]);
  });
});
