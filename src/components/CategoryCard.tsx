// 분야 하나의 점수 카드. 누르면 상세 풀이로 간다.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { createStyles, font, radius, spacing, useTheme } from '../lib/theme';
import type { CategoryFortune } from '../saju/types';
import { Bar } from './ui';

const LEVEL_WORD: Record<number, string> = { 1: '조심', 2: '살핌', 3: '보통', 4: '좋음', 5: '아주 좋음' };

const useStyles = createStyles((t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      gap: spacing.sm,
    },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    label: { fontSize: font.bodyLarge, fontWeight: '700', color: t.colors.text },
    scoreWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    score: { fontSize: font.title + 2, fontWeight: '800' },
    level: { fontSize: font.caption, fontWeight: '700' },
    headline: { fontSize: font.body, color: t.colors.textMuted, lineHeight: 21 },
    more: { fontSize: font.small, color: t.colors.primary, fontWeight: '700', marginTop: 2 },
  }),
);

export function CategoryCard({
  label,
  fortune,
  headline,
  onPress,
}: {
  label: string;
  fortune: CategoryFortune;
  headline?: string;
  onPress: () => void;
}) {
  const s = useStyles();
  const t = useTheme();
  const color = t.levels[fortune.level];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${fortune.score}점, 상세 풀이 보기`}
      style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={s.top}>
        <Text style={s.label}>{label}</Text>
        <View style={s.scoreWrap}>
          <Text style={[s.level, { color }]}>{LEVEL_WORD[fortune.level]}</Text>
          <Text style={[s.score, { color }]}>{Math.round(fortune.score)}</Text>
        </View>
      </View>
      <Bar value={fortune.score} color={color} />
      {headline ? (
        <Text style={s.headline} numberOfLines={2}>
          {headline}
        </Text>
      ) : null}
      <Text style={s.more}>상세 풀이 보기 ›</Text>
    </Pressable>
  );
}
