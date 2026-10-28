// 천간·지지·오행 기본 표. 다른 엔진 파일은 모두 여기서 가져다 쓴다.
import type { Branch, Element, Stem, YinYang } from '../types';

export const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES: Branch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const STEM_HANGUL = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const BRANCH_HANGUL = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

/** 상생 순서. ELEMENTS[i]가 ELEMENTS[i+1]을 생(生)하고, ELEMENTS[i+2]를 극(剋)한다 */
export const ELEMENTS: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export const STEM_ELEMENT: Element[] = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];

/** 지지 본기(대표) 오행 */
export const BRANCH_ELEMENT: Element[] = [
  'water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water',
];

/**
 * 지지 정기(본기) 지장간. 지지의 십성은 이 천간으로 정한다.
 * 子癸 丑己 寅甲 卯乙 辰戊 巳丙 午丁 未己 申庚 酉辛 戌戊 亥壬
 */
export const BRANCH_MAIN_STEM: number[] = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8];

export const stemYinYang = (i: number): YinYang => (i % 2 === 0 ? 'yang' : 'yin');
/** 지지 음양은 순서(체) 기준: 子寅辰午申戌 양, 丑卯巳未酉亥 음 */
export const branchYinYang = (i: number): YinYang => (i % 2 === 0 ? 'yang' : 'yin');

export const elementIndex = (e: Element): number => ELEMENTS.indexOf(e);
export const stemIndex = (s: Stem): number => STEMS.indexOf(s);
export const branchIndex = (b: Branch): number => BRANCHES.indexOf(b);

export const mod = (n: number, m: number): number => ((n % m) + m) % m;
