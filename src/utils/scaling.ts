/**
 * 스케일링 시스템 유틸리티
 * 고정 해상도를 기준으로 다양한 화면 크기에 맞춰 자동으로 스케일링
 * Safe Area (노치, 홈 인디케이터) 대응 포함
 */

interface ScalingOptions {
  designWidth?: number;
  designHeight?: number;
  containerId?: string;
  enableLog?: boolean;
  useSafeArea?: boolean;
}

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// 현재 스케일 값 저장
let currentScaleValue: number = 1;
let safeAreaInsets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Safe Area Insets 가져오기
 */
function getSafeAreaInsets(): SafeAreaInsets {
  const style = getComputedStyle(document.documentElement);

  const parseValue = (prop: string): number => {
    const value = style.getPropertyValue(prop);
    return parseInt(value, 10) || 0;
  };

  return {
    top: parseValue("--sat"),
    right: parseValue("--sar"),
    bottom: parseValue("--sab"),
    left: parseValue("--sal"),
  };
}

/**
 * 스케일링 시스템 초기화
 * @param options 스케일링 옵션
 */
export function initScaling(options: ScalingOptions = {}) {
  const {
    designWidth = 1280,
    designHeight = 800,
    containerId = "stage",
    enableLog = false,
    useSafeArea = true,
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    if (enableLog) {
      console.error(`Container with id "${containerId}" not found`);
    }
    return;
  }

  /**
   * 스케일 계산 및 적용
   */
  const updateScale = () => {
    // Safe Area 업데이트
    if (useSafeArea) {
      safeAreaInsets = getSafeAreaInsets();
    }

    // 사용 가능한 뷰포트 크기 (Safe Area 제외)
    const viewportWidth =
      window.innerWidth - safeAreaInsets.left - safeAreaInsets.right;
    const viewportHeight =
      window.innerHeight - safeAreaInsets.top - safeAreaInsets.bottom;

    // 스케일 계산: 비율을 유지하며 작은 값 선택
    const scaleX = viewportWidth / designWidth;
    const scaleY = viewportHeight / designHeight;
    const scale = Math.min(scaleX, scaleY);

    // 중앙 정렬 계산 (Safe Area 고려)
    const scaledWidth = designWidth * scale;
    const left = safeAreaInsets.left + (viewportWidth - scaledWidth) / 2;
    const top = 0;

    // 스타일 적용
    container.style.width = `${designWidth}px`;
    container.style.height = `${designHeight}px`;
    container.style.position = "absolute";
    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
    container.style.transformOrigin = "top left";
    container.style.transform = `scale(${scale})`;

    // 스케일 값 저장
    currentScaleValue = scale;
    (window as any).currentScale = scale;

    if (enableLog) {
      console.log(
        `Scale: ${scale.toFixed(3)}, Position: (${left.toFixed(
          0
        )}, ${top.toFixed(0)}), SafeArea:`,
        safeAreaInsets
      );
    }
  };

  // 초기 스케일 적용
  updateScale();

  // 리사이즈 이벤트 리스너 등록
  window.addEventListener("resize", updateScale);

  // orientation change 이벤트 리스너 (모바일 중요)
  window.addEventListener("orientationchange", () => {
    // orientationchange 후 약간의 지연 필요
    setTimeout(updateScale, 100);
  });

  if (enableLog) {
    console.log("Scaling system initialized with SafeArea support", {
      designWidth,
      designHeight,
      containerId,
      useSafeArea,
    });
  }
}

/**
 * 현재 적용된 스케일 값 반환
 * @returns 현재 스케일 값
 */
export function getCurrentScale(): number {
  return currentScaleValue;
}

/**
 * 현재 Safe Area Insets 반환
 * @returns Safe Area Insets
 */
export function getSafeArea(): SafeAreaInsets {
  return { ...safeAreaInsets };
}
