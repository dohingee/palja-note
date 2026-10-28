// 미리 쓴 문장(data/)을 골라 풀이 문단으로 조합한다.
import type { Category, CategoryFortune, Element, FactorCode, PeriodKind, SajuChart, Stem } from '../saju/types';
import type { DayMasterProfile, FortuneText, LuckyItems } from './api';
import { DAY_MASTER_PROFILES } from './data/dayMasters';
import { ELEMENT_INFO } from './data/elements';
import { FACTOR_TEXT } from './data/factors';
import { CATEGORY_LABELS } from './data/labels';
import { ADVICE, HEADLINES, OPENINGS, levelBand } from './data/levels';
import { BRANCH_TEN_GOD_TEXT, SAME_TEN_GOD_TEXT, TEN_GOD_TEXT, TEN_GOD_TIPS } from './data/tenGods';
import { pick } from './hash';
import { withJosa } from './josa';

const ELEMENT_ORDER: Element[] = ['wood', 'fire', 'earth', 'metal', 'water'];
/** 이유 문장은 많아야 이만큼만 붙인다 (본문 3~5문장 유지) */
const MAX_FACTOR_SENTENCES = 2;

export function getDayMasterProfile(stem: Stem): DayMasterProfile {
  const p = DAY_MASTER_PROFILES[stem];
  return { title: p.title, summary: p.summary, strengths: [...p.strengths], cautions: [...p.cautions] };
}

/** 그 분야에 쓸 이유 문장 후보. 분야 전용 문장이 있는 코드를 앞에 둔다 */
function factorPools(factors: FactorCode[], category: Category): { code: FactorCode; pool: string[] }[] {
  const unique = Array.from(new Set(factors));
  const specific: { code: FactorCode; pool: string[] }[] = [];
  const general: { code: FactorCode; pool: string[] }[] = [];
  for (const code of unique) {
    const text = FACTOR_TEXT[code];
    if (!text) continue;
    const own = text.byCategory[category];
    if (own && own.length > 0) specific.push({ code, pool: own });
    else if (text.general && text.general.length > 0) general.push({ code, pool: text.general });
  }
  return [...specific, ...general].slice(0, MAX_FACTOR_SENTENCES);
}

export function getCategoryText(kind: PeriodKind, fortune: CategoryFortune, seed: string): FortuneText {
  const { category, level, stemTenGod, branchTenGod } = fortune;
  const salt = [kind, category];
  const label = CATEGORY_LABELS[category];
  const tone = level >= 3 ? 'up' : 'down';

  const headline = pick(HEADLINES[category][level], seed, ...salt, 'headline');

  const sentences: string[] = [];
  sentences.push(pick(OPENINGS[kind][level], seed, ...salt, 'opening').replace('{c}', label));
  sentences.push(pick(TEN_GOD_TEXT[stemTenGod][category][tone], seed, ...salt, 'stem'));
  sentences.push(
    branchTenGod === stemTenGod
      ? pick(SAME_TEN_GOD_TEXT, seed, ...salt, 'same')
      : pick(BRANCH_TEN_GOD_TEXT[branchTenGod], seed, ...salt, 'branch'),
  );
  for (const { code, pool } of factorPools(fortune.factors, category)) {
    sentences.push(pick(pool, seed, ...salt, 'factor', code));
  }

  const advice = [
    pick(ADVICE[category][levelBand(level)], seed, ...salt, 'advice'),
    pick(TEN_GOD_TIPS[stemTenGod], seed, ...salt, 'tip'),
  ].join(' ');

  return { headline, body: sentences.join(' '), advice };
}

const STRENGTH_TEXT: Record<SajuChart['strength'], { word: string; sentence: string }> = {
  strong: {
    word: '힘이 센 신강',
    sentence:
      '나를 뜻하는 글자(일간)를 돕는 기운이 많아 신강한 사주예요. 스스로 밀고 나가는 힘이 강해서, 그 힘을 일과 표현으로 밖에 풀어 줄 때 운이 살아나요.',
  },
  balanced: {
    word: '균형 잡힌',
    sentence:
      '나를 뜻하는 글자(일간)를 돕는 기운과 덜어 내는 기운이 비슷해 균형 잡힌 사주예요. 어느 한쪽으로 크게 치우치지 않아 상황에 맞춰 힘을 조절하기 좋아요.',
  },
  weak: {
    word: '부드러운 신약',
    sentence:
      '나를 뜻하는 글자(일간)를 돕는 기운이 적어 신약한 사주예요. 혼자 버티기보다 배움과 주변의 도움을 받을 때 힘이 훨씬 커져요.',
  },
};

function joinNames(elements: Element[]): string {
  return elements.map((e) => ELEMENT_INFO[e].name).join('·');
}

export function getElementBalanceText(chart: SajuChart): FortuneText {
  const counts = chart.elementCounts;
  const total = ELEMENT_ORDER.reduce((sum, e) => sum + counts[e], 0);
  const many = ELEMENT_ORDER.filter((e) => counts[e] >= 3);
  const lacking = ELEMENT_ORDER.filter((e) => counts[e] === 1);
  const none = ELEMENT_ORDER.filter((e) => counts[e] === 0);
  const me = ELEMENT_INFO[chart.dayMasterElement];
  const useful = ELEMENT_INFO[chart.usefulElement];
  const harmful = ELEMENT_INFO[chart.harmfulElement];
  const strength = STRENGTH_TEXT[chart.strength];

  const headline = `${withJosa(me.name, '이', '가')} 중심인 ${strength.word} 사주`;

  const body: string[] = [];
  if (chart.hour === null) {
    body.push('출생 시간을 몰라 시주 없이 년·월·일 세 기둥(6글자)으로 풀었어요. 시간을 알게 되면 설정에서 넣어 주세요. 조금 더 자세히 볼 수 있어요.');
  }
  const distribution = ELEMENT_ORDER.map((e) => `${ELEMENT_INFO[e].name} ${counts[e]}개`).join(', ');
  body.push(`사주 ${total}글자를 다섯 가지 기운(오행)으로 나눠 보면 ${distribution}예요.`);

  if (many.length > 0) {
    const top = many.reduce((a, b) => (counts[b] > counts[a] ? b : a));
    body.push(`${withJosa(joinNames(many), '이', '가')} 많은 편이에요. 이 기운이 넘치면 ${ELEMENT_INFO[top].excess}.`);
  }
  if (none.length > 0) {
    body.push(`${withJosa(joinNames(none), '은', '는')} 하나도 없어요. 이 기운이 모자라면 ${ELEMENT_INFO[none[0]].lack}.`);
  }
  if (lacking.length > 0) {
    body.push(`${withJosa(joinNames(lacking), '은', '는')} 하나뿐이라 조금 부족한 편이에요.`);
  }
  if (many.length === 0 && none.length === 0) {
    body.push('다섯 기운이 비교적 고르게 퍼져 있어 균형이 좋은 편이에요.');
  }

  body.push(strength.sentence);
  body.push(
    `그래서 나에게 가장 도움이 되는 기운(용신)은 ${useful.nature}의 기운인 ${withJosa(useful.name, '이에요', '예요')}. ${withJosa(useful.name, '은', '는')} ${withJosa(useful.meaning, '을', '를')} 뜻해요.`,
  );
  if (chart.harmfulElement !== chart.usefulElement) {
    body.push(`반대로 ${withJosa(harmful.name, '은', '는')} 나에게 부담이 되기 쉬운 기운(기신)이라, 너무 치우치지 않게 조금 거리를 두면 좋아요.`);
  }

  const advice =
    `${useful.name} 기운을 채우려면 ${withJosa(useful.colors[0], '이나', '나')} ${useful.colors[1]} 같은 색을 옷이나 소품으로 가까이 두어 보세요. ` +
    `${withJosa(useful.habits[0], '이나', '나')} ${useful.habits[1]} 같은 습관도 도움이 되고, ${useful.direction} 방향의 자리가 잘 맞아요.`;

  return { headline, body: body.join(' '), advice };
}

export function getLuckyItems(element: Element, seed: string): LuckyItems {
  const info = ELEMENT_INFO[element];
  return {
    color: pick(info.colors, seed, element, 'color'),
    number: pick(info.numbers, seed, element, 'number'),
    direction: info.direction,
    item: pick(info.items, seed, element, 'item'),
  };
}
