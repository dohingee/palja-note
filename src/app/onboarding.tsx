// 첫 실행 가입 화면. 정보는 기기 안에만 저장한다.
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BirthForm } from '../components/BirthForm';
import { useProfile } from '../lib/profile';
import { createStyles, font, spacing } from '../lib/theme';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: spacing.xl, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
    hero: { gap: spacing.sm, paddingTop: spacing.lg },
    mark: { fontSize: 40, color: t.colors.primary, fontWeight: '800', letterSpacing: 2 },
    title: { fontSize: font.display, fontWeight: '800', color: t.colors.text },
    sub: { fontSize: font.body, color: t.colors.textMuted, lineHeight: 22 },
    foot: { fontSize: font.caption, color: t.colors.textFaint, textAlign: 'center', lineHeight: 17 },
  }),
);

export default function Onboarding() {
  const s = useStyles();
  const { saveProfile } = useProfile();
  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <Text style={s.mark}>八字</Text>
            <Text style={s.title}>팔자노트</Text>
            <Text style={s.sub}>
              태어난 날의 여덟 글자로 나를 읽어 보는 노트예요.{'\n'}몇 가지만 알려 주시면 바로 시작할게요.
            </Text>
          </View>
          {/* 저장되면 루트 레이아웃의 guard가 바뀌어 탭 화면으로 넘어간다 */}
          <BirthForm submitLabel="내 사주 보기" onSubmit={saveProfile} />
          <Text style={s.foot}>입력한 정보는 이 기기 안에만 저장되고, 어디로도 보내지 않아요.{'\n'}풀이는 재미로 보는 참고용이에요.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
