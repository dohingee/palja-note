// 하단 탭 5개: 오늘 / 내 사주 / 운세 흐름(연도별·월별) / 대운 / 설정
// 아이콘은 그림 라이브러리 없이 한자 한 글자로 그린다.
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import type { ColorValue } from 'react-native';

import { useTheme } from '../../lib/theme';

function Glyph({ char, color, focused }: { char: string; color: ColorValue; focused: boolean }) {
  return <Text style={{ fontSize: 20, lineHeight: 24, color, fontWeight: focused ? '800' : '500' }}>{char}</Text>;
}

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textFaint,
        tabBarStyle: { backgroundColor: t.colors.tabBar, borderTopColor: t.colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: t.colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '오늘', tabBarIcon: (p) => <Glyph char="今" {...p} /> }}
      />
      <Tabs.Screen
        name="chart"
        options={{ title: '내 사주', tabBarIcon: (p) => <Glyph char="命" {...p} /> }}
      />
      <Tabs.Screen
        name="flow"
        options={{ title: '운세 흐름', tabBarIcon: (p) => <Glyph char="流" {...p} /> }}
      />
      <Tabs.Screen
        name="daeun"
        options={{ title: '대운', tabBarIcon: (p) => <Glyph char="運" {...p} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '설정', tabBarIcon: (p) => <Glyph char="設" {...p} /> }}
      />
    </Tabs>
  );
}
