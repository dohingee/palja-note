// 여러 화면이 같이 쓰는 작은 부품들(카드, 제목, 배지, 버튼, 알림, 막대).
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { createStyles, font, radius, spacing, useTheme } from '../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
    },
    sectionTitle: {
      fontSize: font.title,
      fontWeight: '700',
      color: t.colors.text,
      marginBottom: spacing.sm,
    },
    sectionSub: { fontSize: font.small, color: t.colors.textMuted, marginTop: -spacing.xs, marginBottom: spacing.md },
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    badgeText: { fontSize: font.caption, fontWeight: '700' },
    button: {
      borderRadius: radius.md,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { fontSize: font.bodyLarge, fontWeight: '700' },
    notice: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      backgroundColor: t.colors.accentSoft,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    noticeIcon: { fontSize: font.small, color: t.colors.accent, fontWeight: '800' },
    noticeText: { flex: 1, fontSize: font.small, color: t.colors.text, lineHeight: 19 },
    barTrack: { height: 8, borderRadius: radius.pill, backgroundColor: t.colors.surfaceMuted, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: radius.pill },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
    centerText: { fontSize: font.body, color: t.colors.textMuted, textAlign: 'center', lineHeight: 22 },
    segment: {
      flexDirection: 'row',
      backgroundColor: t.colors.surfaceMuted,
      borderRadius: radius.md,
      padding: 3,
    },
    segmentItem: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, alignItems: 'center' },
    segmentItemActive: {
      backgroundColor: t.colors.surface,
      shadowColor: '#000',
      shadowOpacity: t.scheme === 'dark' ? 0 : 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    segmentText: { fontSize: font.body, color: t.colors.textMuted, fontWeight: '600' },
    segmentTextActive: { color: t.colors.text, fontWeight: '700' },
  }),
);

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useStyles();
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const s = useStyles();
  return (
    <View>
      <Text style={s.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={s.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}

export function Badge({ label, color, background }: { label: string; color?: string; background?: string }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={[s.badge, { backgroundColor: background ?? t.colors.primarySoft }]}>
      <Text style={[s.badgeText, { color: color ?? t.colors.primary }]}>{label}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const s = useStyles();
  const t = useTheme();
  const bg = variant === 'primary' ? t.colors.primary : t.colors.surfaceMuted;
  const fg = variant === 'primary' ? t.colors.onPrimary : variant === 'danger' ? t.colors.danger : t.colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.button, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }]}
    >
      <Text style={[s.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  const s = useStyles();
  return (
    <View style={s.notice}>
      <Text style={s.noticeIcon}>i</Text>
      <Text style={s.noticeText}>{children}</Text>
    </View>
  );
}

/** 출생 시각을 모를 때 보여주는 안내 */
export function HourUnknownNotice() {
  return <Notice>시간 모름 — 삼주로 풀었어요. 출생 시각을 알면 설정에서 넣어 주세요.</Notice>;
}

export function Bar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const s = useStyles();
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function CenterMessage({ message, loading }: { message: string; loading?: boolean }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={s.center}>
      {loading ? <ActivityIndicator color={t.colors.primary} /> : null}
      <Text style={s.centerText}>{message}</Text>
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const s = useStyles();
  return (
    <View style={s.segment} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[s.segmentItem, active && s.segmentItemActive]}
          >
            <Text style={[s.segmentText, active && s.segmentTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
