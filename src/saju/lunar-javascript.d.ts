// lunar-javascript(6tail)에는 타입 정의가 없어서, 이 엔진과 테스트가 쓰는 부분만 적어 둔다.
declare module 'lunar-javascript' {
  /** 천문 계산 유틸. 반환값은 J2000(2000-01-01 12:00) 기준 일수이며 베이징 시각(UTC+8)이다. */
  export const ShouXingUtil: {
    /** 태양 황경 w(라디안, 2000년 기준 누적값)에 도달하는 순간 */
    qiAccurate(w: number): number;
    /** 해와 달의 황경 차 w(라디안, 2π의 배수 = 합삭)에 도달하는 순간 */
    shuoHigh(w: number): number;
  };

  export interface LunarJs {
    getYear(): number;
    getMonth(): number; // 윤달이면 음수
    getDay(): number;
    getSolar(): SolarJs;
    getYearInGanZhiExact(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    /** 절기 이름 → 순간(베이징 시각) */
    getJieQiTable(): Record<string, SolarJs>;
  }

  export interface SolarJs {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    toYmd(): string;
    toYmdHms(): string;
    getLunar(): LunarJs;
  }

  export const Solar: {
    fromYmd(y: number, m: number, d: number): SolarJs;
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): SolarJs;
  };

  export const Lunar: {
    /** 윤달은 month를 음수로 */
    fromYmd(y: number, m: number, d: number): LunarJs;
  };

  export const LunarYear: {
    fromYear(y: number): { getLeapMonth(): number };
  };
}
