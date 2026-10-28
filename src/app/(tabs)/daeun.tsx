// 대운 탭: 10년 단위 목록, 지금 대운 강조, 누르면 분야별 상세.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabScreen } from '../../components/TabScreen';
import { Badge, Bar, CenterMessage, HourUnknownNotice, Notice } from '../../components/ui';
import { currentDaeunIndex, periodRefToParams, textSeed, useChart, useDaeunFortunes, useToday } from '../../lib/fortune';
import { ELEMENT_HANJA, TEN_GOD_KO } from '../../lib/labels';
import { categoryText } from '../../lib/texts';
import { createStyles, font, radius, spacing, useTheme } from '../../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    list: { gap: spacing.md },
    card: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: t.colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: spacing.lg,
    },
    cardCurrent: { borderWidth: 2, borderColor: t.colors.primary },
    glyphs: { gap: 4 },
    glyph: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    glyphText: { fontSize: 22, fontWeight: '800' },
    main: { flex: 1, gap: 6 },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    age: { fontSize: font.title, fontWeight: '800', color: t.colors.text },
    years: { fontSize: font.caption, color: t.colors.textMuted },
    score: { fontSize: font.title, fontWeight: '800' },
    tenGods: { fontSize: font.caption, color: t.colors.textMuted },
    headline: { fontSize: font.small, color: t.colors.text, lineHeight: 19 },
  }),
);

export default function DaeunScreen() {
  const s = useStyles();
  const t = useTheme();
  const { profile, chart } = useChart();
  const list = useDaeunFortunes(chart);
  useToday(); // 앱을 다시 열면 다시 그려서 "지금 대운"을 새로 고른다
  const current = currentDaeunIndex(list, chart);

  if (!chart || list.length === 0) {
    return (
      <TabScreen title="대운">
        <CenterMessage message="대운을 계산하지 못했어요. 설정에서 생년월일을 확인해 주세요." />
      </TabScreen>
    );
  }

  return (
    <TabScreen title="10년 대운" eyebrow={`만 ${chart.daeunStartAge}세부터 10년마다`}>
      {chart.hour === null ? <HourUnknownNotice /> : null}
      <Notice>대운은 10년 동안 이어지는 큰 흐름이에요. 누르면 분야별로 자세히 볼 수 있어요.</Notice>
      <View style={s.list}>
        {list.map((p, i) => {
          const d = chart.daeun[i];
          const isNow = i === current;
          const overall = p.categories.overall;
          const color = t.levels[overall.level];
          const stem = t.elements[p.pillar.stemElement];
          const branch = t.elements[p.pillar.branchElement];
          const headline = categoryText(p, 'overall', textSeed(profile, p)).headline;
          return (
            <Pressable
              key={p.startDate}
              onPress={() => router.push({ pathname: '/period', params: periodRefToParams({ kind: 'daeun', index: i }) })}
              accessibilityRole="button"
              accessibilityLabel={`${p.label} 대운${isNow ? ', 지금 대운' : ''}, 총운 ${Math.round(overall.score)}점`}
              style={({ pressed }) => [s.card, isNow && s.cardCurrent, pressed && { opacity: 0.8 }]}
            >
              <View style={s.glyphs}>
                <View style={[s.glyph, { backgroundColor: stem.soft }]}>
                  <Text style={[s.glyphText, { color: stem.main }]}>{p.pillar.stem}</Text>
                </View>
                <View style={[s.glyph, { backgroundColor: branch.soft }]}>
                  <Text style={[s.glyphText, { color: branch.main }]}>{p.pillar.branch}</Text>
                </View>
              </View>
              <View style={s.main}>
                <View style={s.top}>
                  <View>
                    <Text style={s.age}>{p.label}</Text>
                    <Text style={s.years}>
                      {d ? `${d.startYear}~${d.endYear}년 · ` : ''}
                      {p.pillar.hangul} {ELEMENT_HANJA[p.pillar.stemElement]}
                      {ELEMENT_HANJA[p.pillar.branchElement]}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {isNow ? <Badge label="지금 대운" /> : null}
                    <Text style={[s.score, { color }]}>{Math.round(overall.score)}</Text>
                  </View>
                </View>
                <Bar value={overall.score} color={color} />
                <Text style={s.tenGods}>
                  {TEN_GOD_KO[overall.stemTenGod]} · {TEN_GOD_KO[overall.branchTenGod]}의 기운
                </Text>
                <Text style={s.headline} numberOfLines={2}>
                  {headline}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </TabScreen>
  );
}
