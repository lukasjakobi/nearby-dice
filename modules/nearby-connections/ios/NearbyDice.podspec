Pod::Spec.new do |s|
  s.name           = 'NearbyDice'
  s.version        = '1.0.0'
  s.summary        = 'Google Nearby Connections bridge for Nearby Dice'
  s.description    = 'Advertising, discovery and payloads over Google Nearby Connections (P2P star).'
  s.author         = 'Lukas Jakobi'
  s.homepage       = 'https://developers.google.com/nearby/connections/overview'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Google's Swift package (github.com/google/nearby, product "NearbyConnections"),
  # added through React Native's Swift Package Manager helper.
  # Unverified on devices: check the version and product name when first building for iOS.
  spm_dependency(s,
    url: 'https://github.com/google/nearby',
    requirement: { kind: 'upToNextMajorVersion', minimumVersion: '1.1.0' },
    products: ['NearbyConnections']
  )

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
