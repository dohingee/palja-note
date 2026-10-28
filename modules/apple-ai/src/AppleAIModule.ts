// 네이티브 모듈 'AppleAI'(ios/AppleAIModule.swift)를 불러온다.
// iOS가 아니거나(안드로이드·웹), 모듈이 없는 빌드(Expo Go 등)에서는 null이다.
import { requireOptionalNativeModule } from 'expo';

export type AppleAIAvailability =
  | 'available'
  | 'deviceNotEligible'
  | 'appleIntelligenceNotEnabled'
  | 'modelNotReady'
  | 'languageNotSupported'
  | 'osTooOld'
  | 'unknown'
  /** 네이티브 모듈이 없음(안드로이드·웹·Expo Go) */
  | 'unsupportedPlatform';

export interface AppleAIRewriteResult {
  headline: string;
  body: string;
  advice: string;
}

interface AppleAINativeModule {
  availability(): AppleAIAvailability;
  rewrite(instructions: string, prompt: string): Promise<AppleAIRewriteResult>;
}

export default requireOptionalNativeModule<AppleAINativeModule>('AppleAI');
