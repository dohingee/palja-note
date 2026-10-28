// 설정 탭: 내 정보 수정, 개인정보 처리방침, 면책 문구, 정보 지우기.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { clearRewriteCache, isAvailable } from '../../ai/api';
import { TabScreen } from '../../components/TabScreen';
import { Button, Card, SectionTitle } from '../../components/ui';
import { GENDER_KO } from '../../lib/labels';
import { useProfile, useRequiredProfile } from '../../lib/profile';
import { createStyles, font, spacing } from '../../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, gap: spacing.md },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.colors.border },
    key: { fontSize: font.body, color: t.colors.textMuted },
    value: { fontSize: font.body, color: t.colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    linkText: { fontSize: font.bodyLarge, color: t.colors.text, fontWeight: '600' },
    chevron: { fontSize: 18, color: t.colors.textFaint },
    body: { fontSize: font.small, color: t.colors.textMuted, lineHeight: 20 },
    strong: { fontSize: font.body, color: t.colors.text, fontWeight: '700', marginBottom: 4 },
  }),
);

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function SettingsScreen() {
  const s = useStyles();
  const profile = useRequiredProfile();
  const { clearProfile } = useProfile();
  const [aiOn, setAiOn] = useState<boolean | null>(null);

  useEffect(() => {
    isAvailable().then(setAiOn, () => setAiOn(false));
  }, []);

  const rows: [string, string][] = [
    ['이름', profile.name],
    [
      '생년월일',
      `${profile.calendar === 'lunar' ? `음력${profile.isLeapMonth ? '(윤달)' : ''}` : '양력'} ${profile.year}.${pad(profile.month)}.${pad(profile.day)}`,
    ],
    ['태어난 시각', profile.hour === null ? '모름' : `${pad(profile.hour)}:${pad(profile.minute ?? 0)}`],
    ['성별', GENDER_KO[profile.gender]],
  ];

  const confirmReset = () => {
    Alert.alert('모든 정보를 지울까요?', '이 기기에 저장된 내 정보와 맞춤 풀이가 모두 지워지고 처음 화면으로 돌아가요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '지우기',
        style: 'destructive',
        onPress: () => {
          void clearRewriteCache().then(clearProfile);
        },
      },
    ]);
  };

  return (
    <TabScreen title="설정">
      <Card>
        <SectionTitle title="내 정보" />
        {rows.map(([k, v], i) => (
          <View key={k} style={[s.row, i > 0 && s.rowBorder]}>
            <Text style={s.key}>{k}</Text>
            <Text style={s.value}>{v}</Text>
          </View>
        ))}
        <View style={{ marginTop: spacing.md }}>
          <Button title="내 정보 수정" variant="secondary" onPress={() => router.push('/edit-profile')} />
        </View>
      </Card>

      <Card>
        <SectionTitle title="기기 안 AI 맞춤 풀이" />
        <Text style={s.body}>
          {aiOn === null
            ? '확인하는 중이에요…'
            : aiOn
              ? '이 기기에서 Apple Intelligence로 풀이를 이름에 맞춰 다시 써 드려요. 모든 처리는 기기 안에서만 이뤄져요.'
              : 'iOS 26 이상, Apple Intelligence를 켠 기기에서만 쓸 수 있어요. 지금은 미리 쓴 풀이를 그대로 보여 드려요.'}
        </Text>
      </Card>

      <Card>
        <Text style={s.strong}>재미로 보는 참고용이에요</Text>
        <Text style={s.body}>
          팔자노트의 풀이는 전통 명리학을 바탕으로 한 재미용 참고 자료예요. 의학·법률·투자 같은 중요한 결정은 전문가와 상의해
          주세요.
        </Text>
        <Pressable style={[s.linkRow, s.rowBorder, { marginTop: spacing.md }]} onPress={() => router.push('/privacy')} accessibilityRole="link">
          <Text style={s.linkText}>개인정보 처리방침</Text>
          <Text style={s.chevron}>›</Text>
        </Pressable>
      </Card>

      <Button title="모든 정보 지우기" variant="danger" onPress={confirmReset} />
    </TabScreen>
  );
}
