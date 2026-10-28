// 분야별 상세 풀이. 전면광고는 오직 이 화면을 열 때만 규칙(src/lib/ads.ts)에 따라 뜰 수 있다.
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FortuneTextView } from '../components/FortuneTextView';
import { Bar, Card, CenterMessage, HourUnknownNotice } from '../components/ui';
import { onCategoryDetailOpened } from '../lib/ads';
import { paramsToPeriodRef, paramToCategory, textSeed, useChart, usePeriod } from '../lib/fortune';
import { PERIOD_KIND_KO, TEN_GOD_KO } from '../lib/labels';
import { categoryLabel, categoryText } from '../lib/texts';
import { createStyles, font, spacing, useTheme } from '../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm },
    period: { fontSize: font.small, color: t.colors.textMuted, fontWeight: '600' },
    cat: { fontSize: font.heading, color: t.colors.text, fontWeight: '800' },
    score: { fontSize: font.display + 6, fontWeight: '800' },
    meta: { fontSize: font.caption, color: t.colors.textMuted, marginTop: spacing.sm },
    foot: { fontSize: font.caption, color: t.colors.textFaint, textAlign: 'center' },
  }),
);

export default function DetailScreen() {
  const s = useStyles();
  const t = useTheme();
  const params = useLocalSearchParams();
  const { profile, chart } = useChart();
  const ref = paramsToPeriodRef(params);
  const category = paramToCategory(params.category);
  const period = usePeriod(chart, ref);
  const original = useMemo(
    () => (period && category ? categoryText(period, category, textSeed(profile, period)) : null),
    [period, category, profile],
  );

  // 상세 풀이를 열 때 한 번만 알린다(광고를 띄울지는 ads.ts가 정한다)
  useEffect(() => {
    onCategoryDetailOpened();
  }, []);

  if (!period || !category || !original || !chart) {
    return (
      <>
        <Stack.Screen options={{ title: '상세 풀이' }} />
        <CenterMessage message="풀이를 찾지 못했어요." />
      </>
    );
  }

  const fortune = period.categories[category];
  const label = categoryLabel(category);
  const color = t.levels[fortune.level];
  const periodTitle = `${period.label} ${PERIOD_KIND_KO[period.kind]}`;

  return (
    <>
      <Stack.Screen options={{ title: label }} />
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        {chart.hour === null ? <HourUnknownNotice /> : null}
        <Card>
          <View style={s.top}>
            <View>
              <Text style={s.period}>{periodTitle}</Text>
              <Text style={s.cat}>{label}</Text>
            </View>
            <Text style={[s.score, { color }]}>{Math.round(fortune.score)}</Text>
          </View>
          <Bar value={fortune.score} color={color} />
          <Text style={s.meta}>
            {period.pillar.hangul}({period.pillar.stem}
            {period.pillar.branch}) · {TEN_GOD_KO[fortune.stemTenGod]} · {TEN_GOD_KO[fortune.branchTenGod]}의 기운
          </Text>
        </Card>
        <Card>
          <FortuneTextView original={original} name={profile.name} periodLabel={periodTitle} categoryLabel={label} />
        </Card>
        <Text style={s.foot}>재미로 보는 참고용이에요.</Text>
      </ScrollView>
    </>
  );
}
