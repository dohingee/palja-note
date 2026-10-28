// 내 사주 탭: 8글자 표, 오행 그래프, 일간 성격, 신강/신약·용신.
import { StyleSheet, Text, View } from 'react-native';

import { ElementBars } from '../../components/ElementBars';
import { PillarTable } from '../../components/PillarTable';
import { TabScreen } from '../../components/TabScreen';
import { Card, CenterMessage, HourUnknownNotice, SectionTitle } from '../../components/ui';
import { useChart } from '../../lib/fortune';
import { ELEMENT_HANJA, elementName, STRENGTH_DESC, STRENGTH_KO } from '../../lib/labels';
import { dayMasterProfile, elementBalanceText } from '../../lib/texts';
import { createStyles, font, radius, spacing, useTheme } from '../../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    meta: { fontSize: font.small, color: t.colors.textMuted, marginBottom: spacing.md, lineHeight: 19 },
    dmHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    dmGlyph: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    dmGlyphText: { fontSize: 30, fontWeight: '800' },
    dmTitle: { fontSize: font.title, fontWeight: '800', color: t.colors.text },
    dmSub: { fontSize: font.small, color: t.colors.textMuted, marginTop: 2 },
    body: { fontSize: font.body, color: t.colors.text, lineHeight: 23 },
    listTitle: { fontSize: font.small, fontWeight: '800', marginTop: spacing.md, marginBottom: 4 },
    listItem: { fontSize: font.body, color: t.colors.text, lineHeight: 22 },
    statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    stat: { flex: 1, borderRadius: radius.md, padding: spacing.md, gap: 2, backgroundColor: t.colors.surfaceMuted },
    statLabel: { fontSize: font.caption, color: t.colors.textMuted, fontWeight: '600' },
    statValue: { fontSize: font.title, fontWeight: '800', color: t.colors.text },
    statSub: { fontSize: font.caption, color: t.colors.textMuted },
    headline: { fontSize: font.bodyLarge, fontWeight: '700', color: t.colors.text, marginTop: spacing.lg, marginBottom: 4 },
    advice: { fontSize: font.small, color: t.colors.textMuted, marginTop: spacing.sm, lineHeight: 19 },
  }),
);

function formatBirth(p: { year: number; month: number; day: number; calendar: string; isLeapMonth: boolean }) {
  return `${p.calendar === 'lunar' ? `음력${p.isLeapMonth ? '(윤달)' : ''}` : '양력'} ${p.year}년 ${p.month}월 ${p.day}일`;
}

export default function ChartScreen() {
  const s = useStyles();
  const t = useTheme();
  const { profile, chart } = useChart();

  if (!chart) {
    return (
      <TabScreen title="내 사주">
        <CenterMessage message="사주를 계산하지 못했어요. 설정에서 생년월일을 확인해 주세요." />
      </TabScreen>
    );
  }

  const dm = dayMasterProfile(chart.dayMaster);
  const balance = elementBalanceText(chart);
  const dmColor = t.elements[chart.dayMasterElement];
  const c = chart.corrected;
  const correctedTime =
    c.hour === null || c.minute === null ? '시간 모름' : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;

  return (
    <TabScreen title={`${profile.name}님의 사주`} eyebrow="팔자 · 여덟 글자">
      {chart.hour === null ? <HourUnknownNotice /> : null}

      <Card>
        <SectionTitle title="사주 원국" />
        <Text style={s.meta}>
          {formatBirth(profile)} · 보정 시각(진태양시) {c.year}.{c.month}.{c.day} {correctedTime}
        </Text>
        <PillarTable chart={chart} />
      </Card>

      <Card>
        <SectionTitle title="오행 분포" subtitle={`${chart.hour ? 8 : 6}글자 속 다섯 기운의 개수예요.`} />
        <ElementBars counts={chart.elementCounts} useful={chart.usefulElement} harmful={chart.harmfulElement} />
        {balance ? (
          <View>
            <Text style={s.headline}>{balance.headline}</Text>
            <Text style={s.body}>{balance.body}</Text>
            <Text style={s.advice}>{balance.advice}</Text>
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="기운의 세기와 용신" />
        <View style={s.statRow}>
          <View style={s.stat}>
            <Text style={s.statLabel}>신강 · 신약</Text>
            <Text style={s.statValue}>{STRENGTH_KO[chart.strength]}</Text>
            <Text style={s.statSub}>{STRENGTH_DESC[chart.strength]}</Text>
          </View>
          <View style={[s.stat, { backgroundColor: t.elements[chart.usefulElement].soft }]}>
            <Text style={s.statLabel}>용신(도움 되는 기운)</Text>
            <Text style={[s.statValue, { color: t.elements[chart.usefulElement].main }]}>
              {elementName(chart.usefulElement)}
            </Text>
            <Text style={s.statSub}>부족한 쪽을 채워 줘요</Text>
          </View>
        </View>
        <Text style={s.advice}>
          넘쳐서 조절하면 좋은 기운(기신) · {elementName(chart.harmfulElement)}
          {'\n'}대운이 바뀌기 시작하는 나이 · 만 {chart.daeunStartAge}세
        </Text>
      </Card>

      {dm ? (
        <Card>
          <View style={s.dmHead}>
            <View style={[s.dmGlyph, { backgroundColor: dmColor.soft }]}>
              <Text style={[s.dmGlyphText, { color: dmColor.main }]}>{chart.dayMaster}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.dmTitle}>{dm.title}</Text>
              <Text style={s.dmSub}>
                일간 {chart.dayMaster} · {ELEMENT_HANJA[chart.dayMasterElement]} 기운
              </Text>
            </View>
          </View>
          <Text style={s.body}>{dm.summary}</Text>
          {dm.strengths.length ? (
            <>
              <Text style={[s.listTitle, { color: t.elements.wood.main }]}>이런 점이 빛나요</Text>
              {dm.strengths.map((x) => (
                <Text key={x} style={s.listItem}>
                  · {x}
                </Text>
              ))}
            </>
          ) : null}
          {dm.cautions.length ? (
            <>
              <Text style={[s.listTitle, { color: t.colors.accent }]}>이런 점은 살펴 주세요</Text>
              {dm.cautions.map((x) => (
                <Text key={x} style={s.listItem}>
                  · {x}
                </Text>
              ))}
            </>
          ) : null}
        </Card>
      ) : null}
    </TabScreen>
  );
}
