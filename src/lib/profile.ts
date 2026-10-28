// 가입 정보(BirthInput)를 기기 안(AsyncStorage)에만 저장하고, 화면 어디서나 useProfile()로 꺼내 쓴다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { BirthInput, CalendarType, Gender } from '../saju/types';

const STORAGE_KEY = 'palja.profile.v1';

export const NAME_MAX_LENGTH = 12;
export const MIN_BIRTH_YEAR = 1900;

/** 입력 화면에서 쓰는 날것의 값(문자열 그대로) */
export interface ProfileDraft {
  name: string;
  year: string;
  month: string;
  day: string;
  calendar: CalendarType;
  isLeapMonth: boolean;
  hourUnknown: boolean;
  hour: number;
  minute: number;
  gender: Gender | null;
}

export type DraftField = 'name' | 'date' | 'gender';
export type DraftErrors = Partial<Record<DraftField, string>>;

export function emptyDraft(): ProfileDraft {
  return {
    name: '',
    year: '',
    month: '',
    day: '',
    calendar: 'solar',
    isLeapMonth: false,
    hourUnknown: false,
    hour: 12,
    minute: 0,
    gender: null,
  };
}

export function draftFromInput(input: BirthInput): ProfileDraft {
  return {
    name: input.name,
    year: String(input.year),
    month: String(input.month),
    day: String(input.day),
    calendar: input.calendar,
    isLeapMonth: input.isLeapMonth,
    hourUnknown: input.hour === null,
    hour: input.hour ?? 12,
    minute: input.minute ?? 0,
    gender: input.gender,
  };
}

function toInt(s: string): number | null {
  const t = s.trim();
  if (!/^\d+$/.test(t)) return null;
  return parseInt(t, 10);
}

/**
 * 입력값을 검사해 BirthInput으로 바꾼다.
 * 음력 날짜가 실제로 있는지(그해 윤달이 있는지 등)는 사주 엔진이 판단하므로, 저장 직전에 computeChart로 한 번 더 확인한다.
 */
export function validateDraft(
  draft: ProfileDraft,
  today: Date = new Date(),
): { ok: true; value: BirthInput } | { ok: false; errors: DraftErrors } {
  const errors: DraftErrors = {};
  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (name.length === 0) errors.name = '이름이나 별명을 적어 주세요.';
  else if (name.length > NAME_MAX_LENGTH) errors.name = `${NAME_MAX_LENGTH}자 이내로 적어 주세요.`;

  const year = toInt(draft.year);
  const month = toInt(draft.month);
  const day = toInt(draft.day);
  const thisYear = today.getFullYear();
  if (year === null || month === null || day === null) {
    errors.date = '생년월일을 숫자로 모두 적어 주세요.';
  } else if (year < MIN_BIRTH_YEAR || year > thisYear) {
    errors.date = `태어난 해는 ${MIN_BIRTH_YEAR}~${thisYear} 사이로 적어 주세요.`;
  } else if (month < 1 || month > 12) {
    errors.date = '태어난 달은 1~12 사이로 적어 주세요.';
  } else if (draft.calendar === 'solar') {
    const d = new Date(year, month - 1, day);
    if (day < 1 || d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
      errors.date = '없는 날짜예요. 다시 확인해 주세요.';
    } else if (d.getTime() > today.getTime()) {
      errors.date = '미래 날짜는 고를 수 없어요.';
    }
  } else if (day < 1 || day > 30) {
    errors.date = '음력 날짜는 1~30일 사이로 적어 주세요.';
  }

  if (draft.gender === null) errors.gender = '성별을 골라 주세요.';

  if (Object.keys(errors).length > 0 || year === null || month === null || day === null || draft.gender === null) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      name,
      year,
      month,
      day,
      calendar: draft.calendar,
      isLeapMonth: draft.calendar === 'lunar' ? draft.isLeapMonth : false,
      hour: draft.hourUnknown ? null : draft.hour,
      minute: draft.hourUnknown ? null : draft.minute,
      gender: draft.gender,
    },
  };
}

function isBirthInput(v: unknown): v is BirthInput {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.year === 'number' &&
    typeof o.month === 'number' &&
    typeof o.day === 'number' &&
    (o.calendar === 'solar' || o.calendar === 'lunar') &&
    typeof o.isLeapMonth === 'boolean' &&
    (o.hour === null || typeof o.hour === 'number') &&
    (o.minute === null || typeof o.minute === 'number') &&
    (o.gender === 'male' || o.gender === 'female')
  );
}

interface ProfileContextValue {
  /** 아직 불러오는 중이면 loading이 true */
  loading: boolean;
  profile: BirthInput | null;
  saveProfile: (p: BirthInput) => Promise<void>;
  clearProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BirthInput | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          const parsed: unknown = JSON.parse(raw);
          if (isBirthInput(parsed)) setProfile(parsed);
        } catch {
          // 망가진 값은 무시하고 가입 화면부터 다시 시작한다.
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const saveProfile = useCallback(async (p: BirthInput) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProfile(p);
  }, []);

  const clearProfile = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ loading, profile, saveProfile, clearProfile }),
    [loading, profile, saveProfile, clearProfile],
  );
  return createElement(ProfileContext.Provider, { value }, children);
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile은 ProfileProvider 안에서만 쓸 수 있어요.');
  return ctx;
}

/** 프로필이 꼭 있는 화면(탭·상세)에서 쓴다 */
export function useRequiredProfile(): BirthInput {
  const { profile } = useProfile();
  if (!profile) throw new Error('프로필이 없어요.');
  return profile;
}

/** 같은 사람이면 같은 값 — 풀이 문구 seed와 AI 캐시 키에 쓴다 */
export function profileKey(p: BirthInput): string {
  return [p.name, p.year, p.month, p.day, p.calendar, p.isLeapMonth ? 'L' : '', p.hour ?? 'x', p.minute ?? 'x', p.gender].join('|');
}
