// 기기 안 AI(애플 Foundation Models)로 미리 쓴 풀이를 자연스러운 맞춤 문장으로 다시 쓴다.
// 지원 안 되는 기기에서는 isAvailable()이 false이고, 화면은 원래 문구를 그대로 보여준다.
// 실제 모델 호출은 로컬 Expo 모듈 modules/apple-ai(Swift)가 한다.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAvailability, rewrite } from '../../modules/apple-ai';
import type { FortuneText } from '../content/api';
import { acceptRewrite, buildPrompt, INSTRUCTIONS, PROMPT_VERSION } from './prompt';

const CACHE_PREFIX = 'palja.ai.v1.';
const CACHE_INDEX_KEY = 'palja.ai.index.v1';
const CACHE_LIMIT = 300;

export async function isAvailable(): Promise<boolean> {
  try {
    return getAvailability() === 'available';
  } catch {
    return false;
  }
}

/** 32비트 해시 두 개(서로 다른 시작값)를 이어 붙여 캐시 키를 만든다 */
function hashText(s: string): string {
  let a = 0x811c9dc5;
  let b = 0x5bd1e995;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193);
    b = Math.imul(b ^ c, 0x01000193) ^ (b >>> 13);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36) + s.length.toString(36);
}

function isFortuneText(v: unknown): v is FortuneText {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.headline === 'string' && typeof o.body === 'string' && typeof o.advice === 'string';
}

async function readCache(key: string): Promise<FortuneText | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const v: unknown = JSON.parse(raw);
    return isFortuneText(v) ? v : null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: FortuneText): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
    const rawIndex = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    const parsed: unknown = rawIndex ? JSON.parse(rawIndex) : [];
    const index = Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string' && k !== key) : [];
    index.push(key);
    const overflow = index.length > CACHE_LIMIT ? index.splice(0, index.length - CACHE_LIMIT) : [];
    if (overflow.length) await AsyncStorage.multiRemove(overflow.map((k) => CACHE_PREFIX + k));
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch {
    // 캐시는 없어도 된다
  }
}

// 모델은 한 번에 하나씩 부른다(동시 요청 오류 방지). 같은 요청이 겹치면 하나만 돌린다.
let queue: Promise<unknown> = Promise.resolve();
const inFlight = new Map<string, Promise<FortuneText | null>>();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => undefined);
  return run;
}

/** 실패하거나 지원 안 되면 null을 돌려준다. 절대 throw하지 않는다 */
export async function rewriteFortune(params: {
  name: string;
  periodLabel: string;
  categoryLabel: string;
  original: FortuneText;
}): Promise<FortuneText | null> {
  try {
    const prompt = buildPrompt(params);
    const key = hashText(`${PROMPT_VERSION}\n${INSTRUCTIONS}\n${prompt}`);

    const cached = await readCache(key);
    if (cached) return cached;
    if (!(await isAvailable())) return null;

    const existing = inFlight.get(key);
    if (existing) return await existing;

    const job = enqueue(async () => {
      const result = await rewrite(INSTRUCTIONS, prompt);
      const accepted = result ? acceptRewrite(params.original, result) : null;
      if (accepted) await writeCache(key, accepted);
      return accepted;
    })
      .catch(() => null)
      .finally(() => inFlight.delete(key));
    inFlight.set(key, job);
    return await job;
  } catch {
    return null;
  }
}


/** 저장해 둔 맞춤 풀이를 모두 지운다(설정의 "모든 정보 지우기") */
export async function clearRewriteCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(CACHE_PREFIX) || k === CACHE_INDEX_KEY));
  } catch {
    // 무시
  }
}
