// 십성(十星): 일간과 다른 글자의 오행 관계 + 음양 같음/다름으로 정한다.
import type { Element, TenGod } from '../types';
import { ELEMENTS, STEM_ELEMENT, elementIndex, mod } from './constants';

/** 십성을 다섯 묶음으로 */
export type TenGodGroup = 'bigeop' | 'siksang' | 'jae' | 'gwan' | 'inseong';

/** [음양 같음, 음양 다름] — 관계 번호(0 같은 오행, 1 내가 생, 2 내가 극, 3 나를 극, 4 나를 생) 순 */
const TABLE: [TenGod, TenGod][] = [
  ['bigyeon', 'geopjae'],
  ['siksin', 'sanggwan'],
  ['pyeonjae', 'jeongjae'],
  ['pyeongwan', 'jeonggwan'],
  ['pyeonin', 'jeongin'],
];
const GROUPS: TenGodGroup[] = ['bigeop', 'siksang', 'jae', 'gwan', 'inseong'];

/** 일간 기준 그 오행과의 관계 번호 */
export const relationOf = (dayElement: Element, other: Element): number =>
  mod(elementIndex(other) - elementIndex(dayElement), 5);

/** 일간 기준, 관계 번호에 해당하는 오행 */
export const elementOfRelation = (dayElement: Element, relation: number): Element =>
  ELEMENTS[mod(elementIndex(dayElement) + relation, 5)];

/** 일간 천간 번호 dm 기준, 천간 번호 s의 십성 */
export function tenGodOf(dm: number, s: number): TenGod {
  const rel = relationOf(STEM_ELEMENT[dm], STEM_ELEMENT[s]);
  return TABLE[rel][dm % 2 === s % 2 ? 0 : 1];
}

export function groupOf(t: TenGod): TenGodGroup {
  return GROUPS[TABLE.findIndex((pair) => pair.includes(t))];
}

export const groupOfRelation = (relation: number): TenGodGroup => GROUPS[relation];
