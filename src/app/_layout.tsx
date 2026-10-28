// 앱의 뿌리: 프로필 불러오기 → 가입 전이면 가입 화면, 가입 후면 탭 화면.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CenterMessage } from '../components/ui';
import { initAds, setOnboardingActive } from '../lib/ads';
import { ProfileProvider, useProfile } from '../lib/profile';
import { useTheme } from '../lib/theme';

function RootNavigator() {
  const { loading, profile } = useProfile();
  const t = useTheme();
  const signedUp = !!profile;

  useEffect(() => {
    if (loading) return;
    setOnboardingActive(!signedUp);
    // 가입을 마친 뒤에만 ATT 요청·광고 초기화를 한다(가입 화면에서는 광고 없음).
    if (signedUp) void initAds();
  }, [loading, signedUp]);

  if (loading) {
    return <CenterMessage loading message="불러오는 중이에요" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: t.colors.background },
        headerStyle: { backgroundColor: t.colors.background },
        headerTintColor: t.colors.primary,
        headerTitleStyle: { color: t.colors.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={!signedUp}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedUp}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="period" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="detail" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: true, title: '내 정보 수정', presentation: 'modal' }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, title: '개인정보 처리방침' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const t = useTheme();
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ProfileProvider>
        <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
