// 설정 > 내 정보 수정
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { BirthForm } from '../components/BirthForm';
import { Notice } from '../components/ui';
import { draftFromInput, useProfile, useRequiredProfile } from '../lib/profile';
import { createStyles, spacing } from '../lib/theme';
import type { BirthInput } from '../saju/types';

const useStyles = createStyles((t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: spacing.xl, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
  }),
);

export default function EditProfileScreen() {
  const s = useStyles();
  const profile = useRequiredProfile();
  const { saveProfile } = useProfile();

  const onSubmit = async (value: BirthInput) => {
    await saveProfile(value);
    if (router.canGoBack()) router.back();
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Notice>정보를 바꾸면 모든 풀이가 새 정보로 다시 계산돼요.</Notice>
        <BirthForm initial={draftFromInput(profile)} submitLabel="저장하기" onSubmit={onSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
