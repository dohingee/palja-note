// Google Mobile Ads / UMP 리소스 번들 타깃이 iOS 12.0을 물려받아 최신 Xcode에서 빌드가 거절되는 문제를 막는다.
// react-native-google-mobile-ads 문서(prerequisites#ios-cocoapods-deployment-targets)가 권하는 post_install 보정을
// 생성되는 Podfile에 넣는다. ios/ 폴더는 손으로 고치지 않으므로(CNG) 이 플러그인으로만 넣는다.
const { withPodfile } = require('expo/config-plugins');

const TAG = '# palja-note: clamp pod deployment targets';
const MIN_IOS = '15.1';

const snippet = `    ${TAG}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        next if current && current.to_f >= ${MIN_IOS}
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_IOS}'
      end
    end`;

module.exports = function withPodsMinDeploymentTarget(config) {
  return withPodfile(config, (cfg) => {
    const src = cfg.modResults.contents;
    if (src.includes(TAG)) return cfg;
    const anchor = /post_install do \|installer\|\n/;
    if (!anchor.test(src)) {
      throw new Error('[withPodsMinDeploymentTarget] Podfile에서 post_install 블록을 찾지 못했어요.');
    }
    cfg.modResults.contents = src.replace(anchor, (m) => `${m}${snippet}\n`);
    return cfg;
  });
};
