// 한 기간의 분야별 카드 목록. 누르면 그 분야의 상세 풀이(전면광고 규칙이 걸리는 곳)로 간다.
import { router } from 'expo-router';
import { View } from 'react-native';

import type { FortuneText } from '../content/api';
import { periodRefToParams } from '../lib/fortune';
import type { PeriodRef } from '../lib/fortune';
import { categoryLabel } from '../lib/texts';
import { spacing } from '../lib/theme';
import type { Category, PeriodFortune } from '../saju/types';
import { CATEGORIES } from '../saju/types';
import { CategoryCard } from './CategoryCard';

export function openCategoryDetail(ref: PeriodRef, category: Category) {
  router.push({ pathname: '/detail', params: { ...periodRefToParams(ref), category } });
}

export function PeriodCategoryList({
  periodRef,
  period,
  texts,
  exclude = [],
}: {
  periodRef: PeriodRef;
  period: PeriodFortune;
  texts: Record<Category, FortuneText> | null;
  exclude?: Category[];
}) {
  return (
    <View style={{ gap: spacing.md }}>
      {CATEGORIES.filter((c) => !exclude.includes(c)).map((c) => (
        <CategoryCard
          key={c}
          label={categoryLabel(c)}
          fortune={period.categories[c]}
          headline={texts?.[c].headline}
          onPress={() => openCategoryDetail(periodRef, c)}
        />
      ))}
    </View>
  );
}
