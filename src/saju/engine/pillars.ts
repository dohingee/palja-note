// 60갑자 기둥 만들기와 년·월·일·시주 계산.
import type { Pillar, Stem } from '../types';
import {
  BRANCHES, BRANCH_ELEMENT, BRANCH_HANGUL, BRANCH_MAIN_STEM, STEMS, STEM_ELEMENT, STEM_HANGUL,
  branchYinYang, mod, stemIndex, stemYinYang,
} from './constants';
import { jieIndexAt } from './astro';
import { tenGodOf } from './tenGods';

/** 60갑자 번호(甲子 = 0)로 기둥을 만든다. 일주(isDayPillar)는 천간이 일간 자신이라 천간 십성이 없다 */
export function makePillar(jiazi: number, dayMaster: Stem, isDayPillar = false): Pillar {
  const s = mod(jiazi, 10);
  const b = mod(jiazi, 12);
  const dm = stemIndex(dayMaster);
  return {
    stem: STEMS[s],
    branch: BRANCHES[b],
    hangul: STEM_HANGUL[s] + BRANCH_HANGUL[b],
    stemElement: STEM_ELEMENT[s],
    branchElement: BRANCH_ELEMENT[b],
    stemYinYang: stemYinYang(s),
    branchYinYang: branchYinYang(b),
    stemTenGod: isDayPillar ? null : tenGodOf(dm, s),
    branchTenGod: tenGodOf(dm, BRANCH_MAIN_STEM[b]),
  };
}

/** 천간·지지 번호 → 60갑자 번호 */
export const jiaziOf = (stem: number, branch: number): number => mod(6 * stem - 5 * branch, 60);

/** 2000-01-01(JDN 2451545)은 戊午일(54) */
export const dayJiazi = (jdn: number): number => mod(54 + jdn - 2451545, 60);

/** 그 순간이 속한 절기 해(입춘 기준) */
export function sajuYearAt(utcMs: number): number {
  const n = jieIndexAt(utcMs);
  return 2000 + Math.floor((n - 1) / 12);
}

/** 년주 60갑자. 2000년(입춘 이후) = 庚辰(16) */
export const yearJiazi = (sajuYear: number): number => mod(16 + sajuYear - 2000, 60);

/** n번째 절에 시작하는 달의 60갑자. 2000년 소한(n 0)은 丁丑(13)월 */
export const monthJiaziOfJie = (n: number): number => mod(13 + n, 60);

/** 그 순간의 월주 60갑자(절기 기준) */
export const monthJiaziAt = (utcMs: number): number => monthJiaziOfJie(jieIndexAt(utcMs));

/** 그 순간의 년주 60갑자(입춘 기준) */
export const yearJiaziAt = (utcMs: number): number => yearJiazi(sajuYearAt(utcMs));

/**
 * 시주 60갑자. hour는 진태양시 보정 후의 시(0~23).
 * 23시대(야자시)는 일주는 그날 그대로 두고, 시주 천간은 다음 날 자시 기준으로 짚는다(야자시·조자시 구분).
 */
export function hourJiazi(dayJz: number, hour: number): number {
  const branch = Math.floor((hour + 1) / 2) % 12;
  const baseStem = mod(dayJz, 10) + (hour === 23 ? 1 : 0);
  const stem = mod((baseStem % 5) * 2 + branch, 10);
  return jiaziOf(stem, branch);
}
