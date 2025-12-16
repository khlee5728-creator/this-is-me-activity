/**
 * 플랫폼 감지 및 기능 지원 여부 확인 유틸리티
 * Android/iOS 앱 빌드 시 호환성을 위해 사용
 */

export interface PlatformInfo {
  isIOS: boolean
  isAndroid: boolean
  isWebView: boolean
  isSafari: boolean
  isChrome: boolean
  isMobile: boolean
  isCapacitor: boolean
  isCordova: boolean
}

export interface FeatureSupport {
  speechSynthesis: boolean
  mediaRecorder: boolean
  getUserMedia: boolean
  getDisplayMedia: boolean
}

/**
 * 플랫폼 정보 감지
 */
export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent || ''
  const vendor = navigator.vendor || ''

  return {
    isIOS: /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream,
    isAndroid: /Android/.test(ua),
    isWebView:
      /(wv|WebView)/i.test(ua) ||
      (window as any).webkit?.messageHandlers !== undefined ||
      (window as any).Android !== undefined,
    isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
    isChrome: /Chrome/.test(ua) && /Google Inc/.test(vendor),
    isMobile:
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(
        ua
      ),
    isCapacitor: !!(window as any).Capacitor,
    isCordova: !!(window as any).cordova,
  }
}

/**
 * 기능 지원 여부 감지
 */
export function detectFeatureSupport(): FeatureSupport {
  return {
    speechSynthesis: 'speechSynthesis' in window,
    mediaRecorder: 'MediaRecorder' in window,
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    getDisplayMedia: !!navigator.mediaDevices?.getDisplayMedia,
  }
}

/**
 * TTS 기능 사용 가능 여부
 * iOS WebView에서는 제한적이므로 별도 체크
 */
export function isTTSSupported(): boolean {
  const platform = detectPlatform()
  const features = detectFeatureSupport()

  // iOS WebView에서는 TTS가 제한적
  if (platform.isIOS && platform.isWebView) {
    return false
  }

  return features.speechSynthesis
}

/**
 * 녹음 기능 사용 가능 여부
 * iOS WebView에서는 MediaRecorder가 제한적
 */
export function isRecordingSupported(): boolean {
  const platform = detectPlatform()
  const features = detectFeatureSupport()

  // iOS WebView에서는 녹음이 제한적
  if (platform.isIOS && platform.isWebView) {
    return false
  }

  return features.mediaRecorder && features.getUserMedia
}

/**
 * 화면 캡처 기능 사용 가능 여부
 * getDisplayMedia는 대부분의 모바일에서 미지원
 */
export function isScreenCaptureSupported(): boolean {
  const platform = detectPlatform()
  const features = detectFeatureSupport()

  // 모바일에서는 getDisplayMedia 미지원
  if (platform.isMobile) {
    return false
  }

  return features.getDisplayMedia
}
