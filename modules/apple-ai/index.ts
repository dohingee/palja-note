// 로컬 Expo 모듈 apple-ai의 JS 입구. 여기 함수들은 절대 throw하지 않는다.
import AppleAI from './src/AppleAIModule';
import type { AppleAIAvailability, AppleAIRewriteResult } from './src/AppleAIModule';

export type { AppleAIAvailability, AppleAIRewriteResult };

export function getAvailability(): AppleAIAvailability {
  if (!AppleAI) return 'unsupportedPlatform';
  try {
    return AppleAI.availability();
  } catch {
    return 'unknown';
  }
}

/** 실패하면 null */
export async function rewrite(instructions: string, prompt: string): Promise<AppleAIRewriteResult | null> {
  if (!AppleAI) return null;
  try {
    const r = await AppleAI.rewrite(instructions, prompt);
    if (!r || typeof r.headline !== 'string' || typeof r.body !== 'string' || typeof r.advice !== 'string') return null;
    return r;
  } catch (e) {
    if (__DEV__) console.warn('[apple-ai]', e);
    return null;
  }
}
