import type { BirthInput } from '../types';

export const birth = (over: Partial<BirthInput>): BirthInput => ({
  name: '테스트',
  year: 2000,
  month: 1,
  day: 1,
  calendar: 'solar',
  isLeapMonth: false,
  hour: 12,
  minute: 0,
  gender: 'male',
  ...over,
});

export const gz = (p: { stem: string; branch: string } | null) => (p ? p.stem + p.branch : null);
