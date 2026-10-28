// 광고 ID는 이 파일 한 곳에만 둔다.
// 개발 중에는 구글 공식 테스트 ID(TestIds)를 쓴다. 실제 ID로 테스트 광고를 누르면 AdMob 계정이 정지될 수 있다.
//
// 출시 전에 할 일
// TODO(출시): AdMob(https://apps.admob.com)에서 iOS 앱을 등록하고 광고 단위 2개(배너, 전면)를 만든다.
// TODO(출시): 아래 PRODUCTION_UNIT_IDS에 실제 광고 단위 ID('ca-app-pub-XXXXXXXX/YYYYYYYY')를 넣는다.
// TODO(출시): app.json의 react-native-google-mobile-ads 플러그인 iosAppId(지금은 테스트 앱 ID
//             'ca-app-pub-3940256099942544~1458002511')를 실제 앱 ID('ca-app-pub-XXXXXXXX~ZZZZZZZZ')로 바꾸고 새로 빌드한다.
// TODO(출시): 실제 ID를 다 넣었으면 USE_PRODUCTION_ADS를 true로 바꾼다.
import { TestIds } from 'react-native-google-mobile-ads';

/** 실제 광고 ID를 쓸지. 개발 빌드(__DEV__)에서는 이 값과 상관없이 늘 테스트 ID를 쓴다 */
const USE_PRODUCTION_ADS = false;

const PRODUCTION_UNIT_IDS = {
  banner: '', // TODO(출시): 배너 광고 단위 ID
  interstitial: '', // TODO(출시): 전면 광고 단위 ID
};

const useTest = __DEV__ || !USE_PRODUCTION_ADS || !PRODUCTION_UNIT_IDS.banner || !PRODUCTION_UNIT_IDS.interstitial;

export const AD_UNIT_IDS = {
  banner: useTest ? TestIds.ADAPTIVE_BANNER : PRODUCTION_UNIT_IDS.banner,
  interstitial: useTest ? TestIds.INTERSTITIAL : PRODUCTION_UNIT_IDS.interstitial,
} as const;

export const IS_TEST_ADS = useTest;

/** 전면광고 규칙(기획서 7장) */
export const INTERSTITIAL_RULES = {
  /** 마지막 전면광고 뒤 상세 풀이를 이 횟수만큼 열었을 때 */
  opensBetweenAds: 3,
  /** 전면광고 사이 최소 간격 */
  minIntervalMs: 60_000,
  /** 앱을 켠 뒤 이 시간 동안은 띄우지 않는다 */
  sessionGraceMs: 60_000,
} as const;
