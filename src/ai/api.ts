// 기기 안 AI(애플 Foundation Models)로 미리 쓴 풀이를 자연스러운 맞춤 문장으로 다시 쓴다.
// 지원 안 되는 기기에서는 isAvailable()이 false이고, 화면은 원래 문구를 그대로 보여준다.
import type { FortuneText } from '../content/api';

export declare function isAvailable(): Promise<boolean>;
/** 실패하거나 지원 안 되면 null을 돌려준다. 절대 throw하지 않는다 */
export declare function rewriteFortune(params: {
  name: string;
  periodLabel: string;
  categoryLabel: string;
  original: FortuneText;
}): Promise<FortuneText | null>;
