// 운세 흐름 탭: 연도 선택 → 그해 운(세운) + 절기 기준 12개월(월운) 목록 → 누르면 분야별 상세.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScoreHero } from '../../components/ScoreHero';
import { TabScreen } from '../../components/TabScreen';
import { Bar, CenterMessage, HourUnknownNotice, SectionTitle } from '../../components/ui';
import { containsDate, periodRefToParams, textSeed, useChart, useMonthFortunes, useToday, useYearFortune } from '../../lib/fortune';
import type { PeriodRef } from '../../lib/fortune';
import { categoryText } from '../../lib/texts';
import { createStyles, font, radius, spacing, useTheme } from '../../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    yearPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
    arrowText: { fontSize: 22, color: t.colors.primary, fontWeight: '700' },
    yearText: { fontSize: font.heading, fontWeight: '800', color: t.colors.text },
    yearSub: { fontSize: font.caption, color: t.colors.textMuted, textAlign: 'center' },
    more: { fontSize: font.small, color: t.colors.primary, fontWeight: '700', marginTop: spacing.sm, textAlign: 'right' },
    list: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border },
    rowCurrent: { backgroundColor: t.colors.primarySoft },
    pillar: { width: 46, alignItems: 'center' },
    pillarText: { fontSize: font.title, fontWeight: '800' },
    rowMain: { flex: 1, gap: 6 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    rowLabel: { fontSize: font.body, fontWeight: '700', color: t.colors.text },
    rowNow: { fontSize: font.caption, color: t.colors.primary, fontWeight: '800' },
    rowScore: { fontSize: font.body, fontWeight: '800' },
    chevron: { fontSize: 18, color: t.colors.textFaint },
  }),
);

export default function FlowScreen() {
  const s = useStyles();
  const t = useTheme();
  const { profile, chart } = useChart();
  const today = useToday();
  const thisYear = parseInt(today.slice(0, 4), 10);
  const [year, setYear] = useState(thisYear);
  const minYear = profile.year;
  const maxYear = profile.year + 100;

  const yearFortune = useYearFortune(chart, year);
  const months = useMonthFortunes(chart, year);

  if (!chart) {
    return (
      <TabScreen title="운세 흐름">
        <CenterMessage message="운세를 계산하지 못했어요. 설정에서 생년월일을 확인해 주세요." />
      </TabScreen>
    );
  }

  const yearRef: PeriodRef = { kind: 'year', year };
  const yearHeadline = yearFortune ? categoryText(yearFortune, 'overall', textSeed(profile, yearFortune)).headline : undefined;

  return (
    <TabScreen title="운세 흐름" eyebrow="연도별 · 월별">
      {chart.hour === null ? <HourUnknownNotice /> : null}

      <View style={s.yearPicker}>
        <Pressable
          style={s.arrow}
          onPress={() => setYear((y) => Math.max(minYear, y - 1))}
          disabled={year <= minYear}
          accessibilityRole="button"
          accessibilityLabel="이전 해"
          hitSlop={6}
        >
          <Text style={[s.arrowText, year <= minYear && { color: t.colors.textFaint }]}>‹</Text>
        </Pressable>
        <Pressable onPress={() => setYear(thisYear)} accessibilityRole="button" accessibilityHint="올해로 돌아가요">
          <Text style={s.yearText}>{year}년</Text>
          <Text style={s.yearSub}>
            {yearFortune ? `${yearFortune.pillar.hangul}년 · ` : ''}만 {year - profile.year}세 무렵
            {year !== thisYear ? ' · 올해로' : ''}
          </Text>
        </Pressable>
        <Pressable
          style={s.arrow}
          onPress={() => setYear((y) => Math.min(maxYear, y + 1))}
          disabled={year >= maxYear}
          accessibilityRole="button"
          accessibilityLabel="다음 해"
          hitSlop={6}
        >
          <Text style={[s.arrowText, year >= maxYear && { color: t.colors.textFaint }]}>›</Text>
        </Pressable>
      </View>

      {yearFortune ? (
        <Pressable
          onPress={() => router.push({ pathname: '/period', params: periodRefToParams(yearRef) })}
          accessibilityRole="button"
          accessibilityHint="그해 분야별 운세를 열어요"
        >
          <ScoreHero caption={`${year}년 세운`} overall={yearFortune.categories.overall} pillar={yearFortune.pillar} headline={yearHeadline} />
          <Text style={s.more}>그해 분야별 운세 보기 ›</Text>
        </Pressable>
      ) : null}

      <View>
        <SectionTitle title="달마다의 흐름" subtitle="절기 기준이라 달은 입춘 무렵(양력 2월 초)부터 시작해요." />
        <View style={s.list}>
          {months.map((m, i) => {
            const now = containsDate(m, today);
            const color = t.levels[m.categories.overall.level];
            const ref: PeriodRef = { kind: 'month', year, index: i };
            return (
              <Pressable
                key={m.startDate}
                onPress={() => router.push({ pathname: '/period', params: periodRefToParams(ref) })}
                accessibilityRole="button"
                accessibilityLabel={`${m.label}, 총운 ${Math.round(m.categories.overall.score)}점`}
                style={({ pressed }) => [s.row, i > 0 && s.rowBorder, now && s.rowCurrent, pressed && { opacity: 0.75 }]}
              >
                <View style={s.pillar}>
                  <Text style={[s.pillarText, { color: t.elements[m.pillar.stemElement].main }]}>
                    {m.pillar.stem}
                    <Text style={{ color: t.elements[m.pillar.branchElement].main }}>{m.pillar.branch}</Text>
                  </Text>
                </View>
                <View style={s.rowMain}>
                  <View style={s.rowTop}>
                    <Text style={s.rowLabel}>
                      {m.label} {now ? <Text style={s.rowNow}> 지금</Text> : null}
                    </Text>
                    <Text style={[s.rowScore, { color }]}>{Math.round(m.categories.overall.score)}</Text>
                  </View>
                  <Bar value={m.categories.overall.score} color={color} />
                </View>
                <Text style={s.chevron}>›</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </TabScreen>
  );
}
