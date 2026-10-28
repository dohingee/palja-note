// 사주 엔진의 입출력 계약. 엔진(src/saju), 풀이 문구(src/content), 화면(src/app)이 모두 이 형식만 주고받는다.
// 바꿀 때는 세 쪽을 함께 고친다.

export type Gender = 'male' | 'female';
export type CalendarType = 'solar' | 'lunar';

/** 가입 때 받는 정보 */
export interface BirthInput {
  name: string;
  year: number;
  month: number;
  day: number;
  calendar: CalendarType;
  /** 음력 윤달 여부 (calendar === 'lunar'일 때만 의미 있음) */
  isLeapMonth: boolean;
  /** 출생 시·분. 모르면 둘 다 null */
  hour: number | null;
  minute: number | null;
  gender: Gender;
}

export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type YinYang = 'yang' | 'yin';

/** 십성 */
export type TenGod =
  | 'bigyeon' // 비견
  | 'geopjae' // 겁재
  | 'siksin' // 식신
  | 'sanggwan' // 상관
  | 'pyeonjae' // 편재
  | 'jeongjae' // 정재
  | 'pyeongwan' // 편관
  | 'jeonggwan' // 정관
  | 'pyeonin' // 편인
  | 'jeongin'; // 정인

export interface Pillar {
  stem: Stem;
  branch: Branch;
  /** 한글 읽기, 예: '갑자' */
  hangul: string;
  stemElement: Element;
  branchElement: Element;
  stemYinYang: YinYang;
  branchYinYang: YinYang;
  /** 일간 기준 천간의 십성. 일주 천간(일간 자신)은 null */
  stemTenGod: TenGod | null;
  /** 일간 기준 지지(정기)의 십성 */
  branchTenGod: TenGod;
}

export interface DaeunPeriod {
  /** 만 나이 기준 */
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  pillar: Pillar;
}

export type Strength = 'strong' | 'balanced' | 'weak';

export interface SajuChart {
  input: BirthInput;
  /** 진태양시·서머타임 보정 후 양력 출생 시각. 시간 모름이면 hour/minute는 null */
  corrected: { year: number; month: number; day: number; hour: number | null; minute: number | null };
  year: Pillar;
  month: Pillar;
  day: Pillar;
  /** 출생 시간 모름이면 null (삼주로 풀이) */
  hour: Pillar | null;
  dayMaster: Stem;
  dayMasterElement: Element;
  /** 천간·지지 글자 수 기준 오행 개수 (시주 없으면 6글자) */
  elementCounts: Record<Element, number>;
  strength: Strength;
  /** 부족한 기운을 채워 주는 오행(간이 용신) */
  usefulElement: Element;
  /** 지나치게 많아 피해야 할 오행 */
  harmfulElement: Element;
  daeunStartAge: number;
  daeun: DaeunPeriod[];
}

export type Category = 'overall' | 'love' | 'money' | 'career' | 'study' | 'health' | 'relationship';
export const CATEGORIES: Category[] = ['overall', 'love', 'money', 'career', 'study', 'health', 'relationship'];

export type PeriodKind = 'daeun' | 'year' | 'month' | 'day';

/** 운세 점수에 영향을 준 이유. 풀이 문구는 이 코드로 문장을 고른다 */
export type FactorCode =
  | 'useful_element' // 그 기간의 기운이 용신 오행
  | 'harmful_element' // 그 기간의 기운이 기신 오행
  | 'clash_day_branch' // 일지와 충
  | 'combine_day_branch' // 일지와 육합
  | 'clash_year_branch' // 년지와 충
  | 'peach_blossom' // 도화살이 들어옴
  | 'travel_horse' // 역마살이 들어옴
  | 'nobleman' // 천을귀인이 들어옴
  | 'academic_star'; // 문창귀인이 들어옴

export type Level = 1 | 2 | 3 | 4 | 5; // 1 매우 나쁨 ~ 5 매우 좋음

export interface CategoryFortune {
  category: Category;
  /** 0~100 */
  score: number;
  level: Level;
  /** 그 기간 천간의 십성 (풀이의 주된 기운) */
  stemTenGod: TenGod;
  /** 그 기간 지지의 십성 */
  branchTenGod: TenGod;
  factors: FactorCode[];
}

export interface PeriodFortune {
  kind: PeriodKind;
  /** 화면 표시용, 예: '2026년', '2026년 3월', '32~41세' */
  label: string;
  pillar: Pillar;
  /** ISO 날짜 'YYYY-MM-DD' (월운은 절기 기준 시작/끝) */
  startDate: string;
  endDate: string;
  categories: Record<Category, CategoryFortune>;
}
