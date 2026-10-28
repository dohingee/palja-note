// 사주 8글자 표: 시주·일주·월주·년주(오른쪽에서 왼쪽으로 읽는 전통 순서) × 천간·지지.
import { StyleSheet, Text, View } from 'react-native';

import { ELEMENT_HANJA, ELEMENT_KO, PILLAR_POSITIONS, TEN_GOD_KO } from '../lib/labels';
import { createStyles, font, radius, spacing, useTheme } from '../lib/theme';
import type { Element, Pillar, SajuChart, TenGod } from '../saju/types';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    table: { flexDirection: 'row', gap: spacing.sm },
    col: { flex: 1, alignItems: 'stretch', gap: 6 },
    head: { fontSize: font.small, color: t.colors.textMuted, textAlign: 'center', fontWeight: '600' },
    tenGod: { fontSize: font.caption, color: t.colors.textMuted, textAlign: 'center', minHeight: 16 },
    tenGodMe: { color: t.colors.primary, fontWeight: '800' },
    cell: {
      aspectRatio: 1,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
    hanja: { fontSize: 30, fontWeight: '700', lineHeight: 36 },
    elementTag: { fontSize: 10, fontWeight: '700', marginTop: -2 },
    empty: {
      aspectRatio: 1,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.colors.border,
      backgroundColor: t.colors.surfaceMuted,
    },
    emptyText: { fontSize: font.small, color: t.colors.textFaint, fontWeight: '600' },
    hangul: { fontSize: font.small, color: t.colors.text, textAlign: 'center', fontWeight: '600' },
  }),
);

function GlyphCell({ glyph, element, highlight }: { glyph: string; element: Element; highlight?: boolean }) {
  const s = useStyles();
  const t = useTheme();
  const c = t.elements[element];
  return (
    <View
      style={[s.cell, { backgroundColor: c.soft, borderColor: highlight ? t.colors.primary : c.soft }]}
      accessibilityLabel={`${glyph}, ${ELEMENT_KO[element]} 기운`}
    >
      <Text style={[s.hanja, { color: c.main }]}>{glyph}</Text>
      <Text style={[s.elementTag, { color: c.main }]}>
        {ELEMENT_HANJA[element]} {ELEMENT_KO[element]}
      </Text>
    </View>
  );
}

function TenGodLabel({ god, me }: { god: TenGod | null; me?: boolean }) {
  const s = useStyles();
  return <Text style={[s.tenGod, me && s.tenGodMe]}>{me ? '나(일간)' : god ? TEN_GOD_KO[god] : ''}</Text>;
}

function Column({ label, pillar, isDay }: { label: string; pillar: Pillar | null; isDay?: boolean }) {
  const s = useStyles();
  return (
    <View style={s.col}>
      <Text style={s.head}>{label}</Text>
      {pillar ? (
        <>
          <TenGodLabel god={pillar.stemTenGod} me={isDay} />
          <GlyphCell glyph={pillar.stem} element={pillar.stemElement} highlight={isDay} />
          <GlyphCell glyph={pillar.branch} element={pillar.branchElement} />
          <TenGodLabel god={pillar.branchTenGod} />
          <Text style={s.hangul}>{pillar.hangul}</Text>
        </>
      ) : (
        <>
          <TenGodLabel god={null} />
          <View style={s.empty}>
            <Text style={s.emptyText}>모름</Text>
          </View>
          <View style={s.empty}>
            <Text style={s.emptyText}>모름</Text>
          </View>
          <TenGodLabel god={null} />
          <Text style={s.hangul}> </Text>
        </>
      )}
    </View>
  );
}

export function PillarTable({ chart }: { chart: SajuChart }) {
  const s = useStyles();
  const [hourLabel, dayLabel, monthLabel, yearLabel] = PILLAR_POSITIONS;
  return (
    <View style={s.table}>
      <Column label={hourLabel} pillar={chart.hour} />
      <Column label={dayLabel} pillar={chart.day} isDay />
      <Column label={monthLabel} pillar={chart.month} />
      <Column label={yearLabel} pillar={chart.year} />
    </View>
  );
}
