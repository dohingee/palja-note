// 큰 총운 점수 표시(오늘 탭·기간 화면 위쪽).
import { StyleSheet, Text, View } from 'react-native';

import { ELEMENT_HANJA } from '../lib/labels';
import { createStyles, font, radius, spacing, useTheme } from '../lib/theme';
import type { CategoryFortune, Pillar } from '../saju/types';
import { Bar } from './ui';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    wrap: {
      borderRadius: radius.lg,
      padding: spacing.xl,
      backgroundColor: t.colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      gap: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    caption: { fontSize: font.small, color: t.colors.textMuted, fontWeight: '600' },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    score: { fontSize: font.hero + 12, fontWeight: '800', letterSpacing: -1 },
    unit: { fontSize: font.title, color: t.colors.textMuted, fontWeight: '700' },
    pillar: { flexDirection: 'row', gap: 6 },
    glyph: {
      width: 46,
      height: 46,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glyphText: { fontSize: 24, fontWeight: '800' },
    pillarCaption: { fontSize: font.caption, color: t.colors.textMuted, textAlign: 'right', marginTop: 4 },
    headline: { fontSize: font.bodyLarge, color: t.colors.text, fontWeight: '600', lineHeight: 23 },
  }),
);

export function ScoreHero({
  caption,
  overall,
  pillar,
  headline,
}: {
  caption: string;
  overall: CategoryFortune;
  pillar: Pillar;
  headline?: string;
}) {
  const s = useStyles();
  const t = useTheme();
  const color = t.levels[overall.level];
  const stem = t.elements[pillar.stemElement];
  const branch = t.elements[pillar.branchElement];
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View>
          <Text style={s.caption}>{caption}</Text>
          <View style={s.scoreRow} accessibilityLabel={`총운 ${Math.round(overall.score)}점`}>
            <Text style={[s.score, { color }]}>{Math.round(overall.score)}</Text>
            <Text style={s.unit}>점</Text>
          </View>
        </View>
        <View>
          <View style={s.pillar} accessibilityLabel={`${pillar.hangul}일`}>
            <View style={[s.glyph, { backgroundColor: stem.soft }]}>
              <Text style={[s.glyphText, { color: stem.main }]}>{pillar.stem}</Text>
            </View>
            <View style={[s.glyph, { backgroundColor: branch.soft }]}>
              <Text style={[s.glyphText, { color: branch.main }]}>{pillar.branch}</Text>
            </View>
          </View>
          <Text style={s.pillarCaption}>
            {pillar.hangul} · {ELEMENT_HANJA[pillar.stemElement]}
            {ELEMENT_HANJA[pillar.branchElement]}
          </Text>
        </View>
      </View>
      <Bar value={overall.score} color={color} />
      {headline ? <Text style={s.headline}>{headline}</Text> : null}
    </View>
  );
}
