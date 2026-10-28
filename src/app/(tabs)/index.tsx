// 오늘 탭: 오늘의 총운 점수, 분야별 카드, 행운 아이템.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openCategoryDetail, PeriodCategoryList } from '../../components/PeriodCategoryList';
import { ScoreHero } from '../../components/ScoreHero';
import { TabScreen } from '../../components/TabScreen';
import { Card, CenterMessage, HourUnknownNotice, SectionTitle } from '../../components/ui';
import { textSeed, useChart, useDayFortune, useToday } from '../../lib/fortune';
import type { PeriodRef } from '../../lib/fortune';
import { ELEMENT_HANJA, elementName } from '../../lib/labels';
import { luckyItems, useCategoryTexts } from '../../lib/texts';
import { createStyles, font, radius, spacing, useTheme } from '../../lib/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
  const w = new Date(y, m - 1, d).getDay();
  return `${m}월 ${d}일 ${WEEKDAYS[w]}요일`;
}

const useStyles = createStyles((t) =>
  StyleSheet.create({
    luckyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    luckyItem: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 2,
    },
    luckyLabel: { fontSize: font.caption, color: t.colors.textMuted, fontWeight: '600' },
    luckyValue: { fontSize: font.bodyLarge, color: t.colors.text, fontWeight: '700' },
    luckyFoot: { fontSize: font.caption, color: t.colors.textMuted, marginTop: spacing.sm },
    more: { fontSize: font.small, color: t.colors.primary, fontWeight: '700', marginTop: spacing.sm, textAlign: 'right' },
  }),
);

export default function TodayScreen() {
  const s = useStyles();
  const t = useTheme();
  const { profile, chart } = useChart();
  const today = useToday();
  const period = useDayFortune(chart, today);
  const seed = period ? textSeed(profile, period) : today;
  const texts = useCategoryTexts(period, seed);
  const ref: PeriodRef = { kind: 'day', date: today };

  if (!chart || !period) {
    return (
      <TabScreen title="오늘의 운세" eyebrow={dateLabel(today)}>
        <CenterMessage message="운세를 계산하지 못했어요. 설정에서 생년월일을 확인해 주세요." />
      </TabScreen>
    );
  }

  const lucky = luckyItems(chart.usefulElement, seed);

  return (
    <TabScreen title={`${profile.name}님의 오늘`} eyebrow={dateLabel(today)}>
      {chart.hour === null ? <HourUnknownNotice /> : null}

      <Pressable
        onPress={() => openCategoryDetail(ref, 'overall')}
        accessibilityRole="button"
        accessibilityHint="총운 상세 풀이를 열어요"
      >
        <ScoreHero caption="오늘의 총운" overall={period.categories.overall} pillar={period.pillar} headline={texts?.overall.headline} />
        <Text style={s.more}>총운 상세 풀이 보기 ›</Text>
      </Pressable>

      <View>
        <SectionTitle title="분야별 운세" subtitle="카드를 누르면 자세한 풀이를 볼 수 있어요." />
        <PeriodCategoryList periodRef={ref} period={period} texts={texts} exclude={['overall']} />
      </View>

      {lucky ? (
        <Card>
          <SectionTitle
            title="오늘의 행운"
            subtitle={`나에게 도움이 되는 ${elementName(chart.usefulElement)} 기운에서 골랐어요.`}
          />
          <View style={s.luckyGrid}>
            <View style={s.luckyItem}>
              <Text style={s.luckyLabel}>행운의 색</Text>
              <Text style={[s.luckyValue, { color: t.elements[chart.usefulElement].main }]}>{lucky.color}</Text>
            </View>
            <View style={s.luckyItem}>
              <Text style={s.luckyLabel}>행운의 숫자</Text>
              <Text style={s.luckyValue}>{lucky.number}</Text>
            </View>
            <View style={s.luckyItem}>
              <Text style={s.luckyLabel}>행운의 방향</Text>
              <Text style={s.luckyValue}>{lucky.direction}</Text>
            </View>
            <View style={s.luckyItem}>
              <Text style={s.luckyLabel}>행운의 물건</Text>
              <Text style={s.luckyValue}>{lucky.item}</Text>
            </View>
          </View>
          <Text style={s.luckyFoot}>
            {ELEMENT_HANJA[chart.usefulElement]} · 재미로 보는 참고용이에요.
          </Text>
        </Card>
      ) : null}
    </TabScreen>
  );
}
