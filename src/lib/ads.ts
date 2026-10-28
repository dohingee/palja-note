// 광고 시작(ATT → 동의 → SDK 초기화)과 전면광고 규칙(기획서 7장)을 맡는다.
// 전면광고는 화면을 옮길 때마다 띄우지 않는다(AdMob 정책 위반). 오직 분야별 "상세 풀이"를 열 때만
// onCategoryDetailOpened()를 부르고, 이 파일이 규칙에 맞을 때만 실제로 띄운다.
import { getTrackingPermissionsAsync, PermissionStatus, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { useSyncExternalStore } from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
import mobileAds, { AdEventType, AdsConsent, InterstitialAd } from 'react-native-google-mobile-ads';

import { AD_UNIT_IDS, INTERSTITIAL_RULES } from './adConfig';

/** 이 JS 실행(앱 세션)이 시작된 시각 */
const SESSION_STARTED_AT = Date.now();

let adsReady = false;
let initPromise: Promise<void> | null = null;
let onboardingActive = true;

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let interstitialShowing = false;

/** 마지막 전면광고 뒤 상세 풀이를 연 횟수 */
let opensSinceLastAd = 0;
/** 마지막 전면광고를 띄운 시각(아직 없으면 null) */
let lastAdShownAt: number | null = null;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

/** 가입 화면이 떠 있는 동안 true. 이때는 어떤 광고도 시작하거나 띄우지 않는다 */
export function setOnboardingActive(active: boolean) {
  onboardingActive = active;
}

/**
 * 광고를 쓸 준비를 한다. 여러 번 불러도 한 번만 실행된다. 가입이 끝난 뒤에 부른다.
 * 순서: (유럽 등) 광고 동의 → iOS 앱 추적 투명성(ATT) 요청 → SDK 초기화.
 * ATT를 거절해도 광고는 나오지만 IDFA 없이(비맞춤) 나온다. 이는 OS와 Google SDK가 알아서 지킨다.
 */
export function initAds(): Promise<void> {
  if (onboardingActive) return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      const canRequestAds = await gatherConsent();
      await requestTracking();
      if (!canRequestAds) return;
      await mobileAds().initialize();
      adsReady = true;
      emit();
      loadInterstitial();
    })().catch((e) => {
      if (__DEV__) console.warn('[ads] init failed', e);
      initPromise = null; // 다음에 다시 시도할 수 있게
    });
  }
  return initPromise;
}

async function gatherConsent(): Promise<boolean> {
  try {
    const info = await AdsConsent.gatherConsent();
    return info.canRequestAds;
  } catch (e) {
    if (__DEV__) console.warn('[ads] consent', e);
    try {
      // 네트워크 오류 등: 지난번에 받은 동의 상태로 판단한다.
      return (await AdsConsent.getConsentInfo()).canRequestAds;
    } catch {
      return false;
    }
  }
}

/** ATT 팝업은 앱이 화면 앞에 있을 때(active)만 뜬다. 그 전에 부르면 조용히 무시되므로 기다린다 */
function waitUntilActive(): Promise<void> {
  if (AppState.currentState === 'active') return Promise.resolve();
  return new Promise((resolve) => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sub.remove();
        resolve();
      }
    });
  });
}

async function requestTracking(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await waitUntilActive();
    const { status } = await getTrackingPermissionsAsync();
    if (status === PermissionStatus.UNDETERMINED) await requestTrackingPermissionsAsync();
  } catch (e) {
    if (__DEV__) console.warn('[ads] ATT', e);
  }
}

function loadInterstitial() {
  if (!adsReady) return;
  if (!interstitial) {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoaded = false;
      interstitialShowing = false;
    });
    ad.addAdEventListener(AdEventType.OPENED, () => {
      // iOS에서 상태 표시줄이 닫기 버튼을 가리는 문제를 피한다(라이브러리 문서 권장)
      if (Platform.OS === 'ios') StatusBar.setHidden(true);
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (Platform.OS === 'ios') StatusBar.setHidden(false);
      interstitialShowing = false;
      interstitialLoaded = false;
      // 다음 광고를 미리 불러 둔다
      ad.load();
    });
    interstitial = ad;
  }
  if (!interstitialLoaded) interstitial.load();
}

/** 지금 전면광고를 띄워도 되는지(횟수 외의 조건) */
function timingAllows(now: number): boolean {
  if (onboardingActive) return false;
  if (now - SESSION_STARTED_AT < INTERSTITIAL_RULES.sessionGraceMs) return false;
  if (lastAdShownAt !== null && now - lastAdShownAt < INTERSTITIAL_RULES.minIntervalMs) return false;
  return true;
}

/**
 * 분야별 상세 풀이 화면이 열릴 때 한 번 부른다.
 * 마지막 전면광고 뒤 3번째로 열 때(그 사이 조건이 안 맞아 못 띄웠으면 그다음 열 때) 띄운다.
 * 단, 앱을 켠 뒤 1분 안, 직전 광고 뒤 60초 안, 가입 중에는 띄우지 않는다.
 */
export function onCategoryDetailOpened(): void {
  opensSinceLastAd += 1;
  if (!adsReady || !interstitial) return;
  if (opensSinceLastAd < INTERSTITIAL_RULES.opensBetweenAds) return;
  const now = Date.now();
  if (!timingAllows(now)) return;
  if (!interstitialLoaded) {
    loadInterstitial();
    return;
  }
  if (interstitialShowing) return;
  interstitialShowing = true;
  interstitial
    .show()
    .then(() => {
      lastAdShownAt = Date.now();
      opensSinceLastAd = 0;
    })
    .catch((e: unknown) => {
      interstitialShowing = false;
      if (__DEV__) console.warn('[ads] show failed', e);
      loadInterstitial();
    });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** 광고 SDK가 준비됐는지(배너를 그릴지) */
export function useAdsReady(): boolean {
  return useSyncExternalStore(subscribe, () => adsReady, () => false);
}
