// 한 기간(세운·월운·대운·일진)의 분야별 운세 목록.
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { PeriodCategoryList } from '../components/PeriodCategoryList';
import { ScoreHero } from '../components/ScoreHero';
import { CenterMessage, HourUnknownNotice } from '../components/ui';
import { paramsToPeriodRef, textSeed, useChart, usePeriod } from '../lib/fortune';
import { PERIOD_KIND_KO } from '../lib/labels';
import { useCategoryTexts } from '../lib/texts';
import { createStyles, font, spacing } from '../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
    range: { fontSize: font.small, color: t.colors.textMuted, textAlign: 'center' },
    sub: { fontSize: font.title, fontWeight: '700', color: t.colors.text, marginTop: spacing.sm },
  }),
);

function formatRange(start: string, end: string) {
  return `${start.split('-').join('.')} ~ ${end.split('-').join('.')}`;
}

export default function PeriodScreen() {
  const s = useStyles();
  const params = useLocalSearchParams();
  const { profile, chart } = useChart();
  const ref = paramsToPeriodRef(params);
  const period = usePeriod(chart, ref);
  const seed = period ? textSeed(profile, period) : '';
  const texts = useCategoryTexts(period, seed);

  if (!ref || !period || !chart) {
    return (
      <>
        <Stack.Screen options={{ title: '운세' }} />
        <CenterMessage message="이 기간의 운세를 찾지 못했어요." />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${period.label} ${PERIOD_KIND_KO[period.kind]}` }} />
      <ScrollView style={s.root} contentContainerStyle={s.content}>
        {chart.hour === null ? <HourUnknownNotice /> : null}
        <ScoreHero
          caption={`${period.label} 총운`}
          overall={period.categories.overall}
          pillar={period.pillar}
          headline={texts?.overall.headline}
        />
        <Text style={s.range}>{formatRange(period.startDate, period.endDate)}</Text>
        <Text style={s.sub}>분야별 운세</Text>
        <PeriodCategoryList periodRef={ref} period={period} texts={texts} />
      </ScrollView>
    </>
  );
}
