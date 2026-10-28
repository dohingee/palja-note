// 개인정보 처리방침(앱 안 문서). 출시 전에 App Store Connect에 올릴 웹 주소용 문서와 내용을 맞춘다.
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { createStyles, font, spacing } from '../lib/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. 어떤 정보를 쓰나요',
    body: '사주 풀이를 위해 이름(별명), 생년월일, 양력·음력과 윤달 여부, 태어난 시각(선택), 성별을 받아요. 이 정보는 이 기기 안(앱 저장공간)에만 저장되고, 팔자노트는 서버를 운영하지 않으므로 어디로도 보내지 않아요.',
  },
  {
    title: '2. 기기 안 AI',
    body: 'iOS 26 이상에서 Apple Intelligence를 켠 경우, 풀이 문장을 이름에 맞게 다시 쓰는 데 애플의 기기 안 언어 모델을 써요. 이 처리는 기기 안에서만 이뤄지고, 결과는 다시 쓰지 않도록 기기 안에만 저장해 둬요.',
  },
  {
    title: '3. 광고',
    body: '무료로 제공하기 위해 Google AdMob 광고를 보여 드려요. 광고 식별자(IDFA)는 앱 추적 투명성(ATT) 팝업에서 "허용"하신 경우에만 맞춤 광고에 쓰이고, 허용하지 않으시면 쓰이지 않아요. AdMob은 광고 제공을 위해 기기 정보·대략적인 위치 등 일부 정보를 처리할 수 있으며, 이는 Google의 개인정보처리방침(policies.google.com/privacy)을 따라요. 입력하신 사주 정보는 광고에 쓰이지 않아요.',
  },
  {
    title: '4. 지우기와 바꾸기',
    body: '설정 > 내 정보 수정에서 언제든 바꿀 수 있고, 설정 > 모든 정보 지우기로 기기에 저장된 정보를 모두 지울 수 있어요. 앱을 삭제해도 모두 지워져요. 추적 허용 여부는 iPhone 설정 > 개인정보 보호 및 보안 > 추적에서 바꿀 수 있어요.',
  },
  {
    title: '5. 어린이',
    body: '팔자노트는 어린이를 대상으로 하지 않아요.',
  },
  {
    title: '6. 문의',
    // TODO(출시): 실제 문의 이메일로 바꾼다
    body: '개인정보 관련 문의: (출시 전에 문의 이메일을 적어 주세요)',
  },
];

const useStyles = createStyles((t) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.colors.background },
    content: { padding: spacing.xl, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
    title: { fontSize: font.bodyLarge, fontWeight: '800', color: t.colors.text, marginBottom: 6 },
    body: { fontSize: font.body, color: t.colors.textMuted, lineHeight: 23 },
    foot: { fontSize: font.caption, color: t.colors.textFaint },
  }),
);

export default function PrivacyScreen() {
  const s = useStyles();
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {SECTIONS.map((sec) => (
        <View key={sec.title}>
          <Text style={s.title}>{sec.title}</Text>
          <Text style={s.body}>{sec.body}</Text>
        </View>
      ))}
      <Text style={s.foot}>시행일: 앱 출시일</Text>
    </ScrollView>
  );
}
