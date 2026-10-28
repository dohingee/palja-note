Pod::Spec.new do |s|
  s.name           = 'AppleAI'
  s.version        = '1.0.0'
  s.summary        = 'On-device text rewriting with Apple Foundation Models'
  s.description    = 'Local Expo module for palja-note. Uses FoundationModels on iOS 26+, reports unavailable elsewhere.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.license        = 'MIT'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # iOS 26 미만 기기에서도 앱이 켜지도록 약하게(weak) 연결한다.
  s.weak_frameworks = 'FoundationModels'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift}"
end
