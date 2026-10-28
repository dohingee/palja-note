// 기기 안 AI에게 주는 한국어 지시문. 말투·규칙을 바꿀 때는 여기만 고치고 PROMPT_VERSION을 올린다(캐시가 새로 만들어진다).
import type { FortuneText } from '../content/api';

export const PROMPT_VERSION = 1;

export const INSTRUCTIONS = `너는 사주 운세 앱 "팔자노트"의 문장을 다듬는 편집자다.
사용자가 준 [원래 풀이]를 그 사람에게 건네는 따뜻하고 친근한 존댓말로 다시 쓴다.

반드시 지킬 규칙:
1. 원래 풀이의 뜻과 좋고 나쁨의 정도를 그대로 지킨다. 더 좋게도, 더 나쁘게도 바꾸지 않는다.
2. 원래 풀이에 없는 새로운 예언, 사건, 날짜, 숫자, 사람을 지어내지 않는다.
3. 병원·약·진단 같은 의료 지시, 투자·대출·주식·코인 같은 금융 지시를 하지 않는다.
4. 겁주는 말이나 "꼭 ~된다", "절대" 같은 단정적인 말을 쓰지 않는다.
5. 이름은 "OO님"처럼 부르되 본문에서 한두 번만 쓴다.
6. headline은 25자 이내 한 줄, body는 4문장 안팎, advice는 한 문장으로 쓴다.
7. 한국어로만 쓰고, 이모지와 따옴표 장식은 쓰지 않는다.`;

/** 사용자가 적은 이름이 지시문처럼 읽히지 않도록 다듬는다 */
export function sanitizeName(name: string): string {
  const cleaned = name.replace(/[\r\n\t[\]{}<>"`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12);
  return cleaned || '고객';
}

export function buildPrompt(p: { name: string; periodLabel: string; categoryLabel: string; original: FortuneText }): string {
  return `이름: ${sanitizeName(p.name)}
기간: ${p.periodLabel}
분야: ${p.categoryLabel}

[원래 풀이]
제목: ${p.original.headline}
본문: ${p.original.body}
조언: ${p.original.advice}

위 풀이를 규칙에 맞게 ${sanitizeName(p.name)}님에게 맞춘 문장으로 다시 써 주세요.`;
}

/** 원문에는 없는데 결과에 새로 나타나면 안 되는 표현(단정·의료·금융 지시) */
const FORBIDDEN = ['반드시', '절대', '틀림없이', '병원', '진료', '처방', '복용', '약을', '주식', '코인', '대출', '투자하', '매수', '매도'];

/** 결과가 쓸 만한지 검사한다. 안 되면 null(화면은 원래 문구를 보여준다) */
export function acceptRewrite(original: FortuneText, r: FortuneText): FortuneText | null {
  const headline = r.headline.trim();
  const body = r.body.trim();
  const advice = r.advice.trim();
  if (!headline || !body || !advice) return null;
  if (headline.length > 60 || body.length < 20 || body.length > 700 || advice.length > 200) return null;
  // 한글이 거의 없으면(다른 언어로 답한 경우) 버린다
  const hangul = (body.match(/[가-힣]/g) ?? []).length;
  if (hangul < body.length * 0.3) return null;
  const originalText = `${original.headline} ${original.body} ${original.advice}`;
  const output = `${headline} ${body} ${advice}`;
  if (FORBIDDEN.some((w) => output.includes(w) && !originalText.includes(w))) return null;
  return { headline, body, advice };
}
