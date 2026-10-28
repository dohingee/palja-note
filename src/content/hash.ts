// seed로 문장을 고르는 도구. Math.random을 쓰지 않아 같은 seed면 항상 같은 결과가 나온다.

/** FNV-1a 32비트 해시 */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** seed와 구분용 이름(salt)을 합쳐 목록에서 하나를 고른다 */
export function pick<T>(list: readonly T[], seed: string, ...salt: string[]): T {
  if (list.length === 0) throw new Error('pick: 빈 목록');
  return list[fnv1a([seed, ...salt].join('|')) % list.length];
}
