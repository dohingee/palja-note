// 한국어 조사(은/는, 이/가 등)를 앞 글자 받침에 맞춰 붙인다.

/** 문자열의 마지막 한글 글자에 받침이 있는지. 한글이 없으면 false */
export function hasBatchim(word: string): boolean {
  for (let i = word.length - 1; i >= 0; i--) {
    const code = word.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  }
  return false;
}

/** 예: withJosa('목(木)', '이', '가') → '목(木)이' */
export function withJosa(word: string, withBatchim: string, withoutBatchim: string): string {
  return word + (hasBatchim(word) ? withBatchim : withoutBatchim);
}
