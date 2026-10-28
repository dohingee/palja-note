// 탭 화면의 공통 틀: 위쪽 안전 영역 + 스크롤되는 내용 + 맨 아래 배너 광고.
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createStyles, font, spacing } from '../lib/theme';
import { AdBanner } from './AdBanner';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    header: { gap: 2, paddingTop: spacing.sm },
    eyebrow: { fontSize: font.small, color: t.colors.primary, fontWeight: '700', letterSpacing: 0.5 },
    title: { fontSize: font.heading + 4, color: t.colors.text, fontWeight: '800' },
  }),
);

export function TabScreen({
  title,
  eyebrow,
  children,
  scroll = true,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  scroll?: boolean;
}) {
  const s = useStyles();
  const header = (
    <View style={s.header}>
      {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
      <Text style={s.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={s.content}>
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[s.content, { flex: 1 }]}>
          {header}
          {children}
        </View>
      )}
      <AdBanner />
    </SafeAreaView>
  );
}
