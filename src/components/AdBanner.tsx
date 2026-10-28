// 탭 화면 맨 아래에 붙는 배너 광고. 콘텐츠 위에 겹치지 않고, 스크롤 영역 아래 자기 자리를 차지한다.
// 광고 SDK가 준비되기 전(가입 중, 동의 전)이나 광고를 못 받으면 아무것도 그리지 않는다.
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, useForeground } from 'react-native-google-mobile-ads';

import { AD_UNIT_IDS } from '../lib/adConfig';
import { useAdsReady } from '../lib/ads';
import { useTheme } from '../lib/theme';

export function AdBanner() {
  const ready = useAdsReady();
  const t = useTheme();
  const ref = useRef<BannerAd>(null);
  const [failed, setFailed] = useState(false);

  // iOS에서 앱이 오래 백그라운드에 있으면 배너가 비는 문제가 있어, 다시 앞으로 오면 새로 불러온다(라이브러리 문서 권장).
  useForeground(() => {
    if (Platform.OS === 'ios') ref.current?.load();
  });

  if (!ready || failed) return null;
  return (
    <View style={[styles.wrap, { backgroundColor: t.colors.background, borderTopColor: t.colors.border }]}>
      <BannerAd
        ref={ref}
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});
