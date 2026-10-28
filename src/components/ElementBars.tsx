// 오행 분포 막대그래프(차트 라이브러리 없이 View로 그린다).
import { StyleSheet, Text, View } from 'react-native';

import { ELEMENT_HANJA, ELEMENT_KO, ELEMENTS } from '../lib/labels';
import { createStyles, font, radius, spacing, useTheme } from '../lib/theme';
import type { Element } from '../saju/types';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    wrap: { gap: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    chip: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    chipHanja: { fontSize: 20, fontWeight: '800' },
    track: { flex: 1, height: 14, borderRadius: radius.pill, backgroundColor: t.colors.surfaceMuted, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: radius.pill },
    count: { width: 54, textAlign: 'right', fontSize: font.small, color: t.colors.text, fontWeight: '700' },
    tags: { flexDirection: 'row', gap: 4, marginTop: 2 },
    tag: { fontSize: 10, fontWeight: '800', paddingHorizontal: 5, paddingVertical: 1, borderRadius: radius.pill, overflow: 'hidden' },
  }),
);

export function ElementBars({
  counts,
  useful,
  harmful,
}: {
  counts: Record<Element, number>;
  useful?: Element;
  harmful?: Element;
}) {
  const s = useStyles();
  const t = useTheme();
  const total = ELEMENTS.reduce((sum, e) => sum + (counts[e] ?? 0), 0);
  const max = Math.max(1, ...ELEMENTS.map((e) => counts[e] ?? 0));
  return (
    <View style={s.wrap}>
      {ELEMENTS.map((e) => {
        const c = t.elements[e];
        const n = counts[e] ?? 0;
        return (
          <View key={e} style={s.row} accessibilityLabel={`${ELEMENT_KO[e]} ${n}개`}>
            <View style={[s.chip, { backgroundColor: c.soft }]}>
              <Text style={[s.chipHanja, { color: c.main }]}>{ELEMENT_HANJA[e]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.track}>
                <View style={[s.fill, { width: `${(n / max) * 100}%`, backgroundColor: c.main }]} />
              </View>
              {e === useful || e === harmful ? (
                <View style={s.tags}>
                  {e === useful ? (
                    <Text style={[s.tag, { color: t.colors.onPrimary, backgroundColor: t.colors.primary }]}>용신 · 도움</Text>
                  ) : null}
                  {e === harmful ? (
                    <Text style={[s.tag, { color: t.colors.textMuted, backgroundColor: t.colors.surfaceMuted }]}>기신 · 넘침</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            <Text style={s.count}>
              {ELEMENT_KO[e]} {n}
              {total > 0 ? <Text style={{ color: t.colors.textFaint, fontWeight: '500' }}>/{total}</Text> : null}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
