/**
 * 스케일링 시스템 유틸리티
 * 고정 해상도를 기준으로 다양한 화면 크기에 맞춰 자동으로 스케일링
 */

interface ScalingOptions {
  designWidth?: number
  designHeight?: number
  containerId?: string
  enableLog?: boolean
}

// 현재 스케일 값 저장
let currentScaleValue: number = 1

/**
 * 스케일링 시스템 초기화
 * @param options 스케일링 옵션
 */
export function initScaling(options: ScalingOptions = {}) {
  const {
    designWidth = 1280,
    designHeight = 800,
    containerId = 'stage',
    enableLog = false,
  } = options

  const container = document.getElementById(containerId)
  if (!container) {
    if (enableLog) {
      console.error(`Container with id "${containerId}" not found`)
    }
    return
  }

  /**
   * 스케일 계산 및 적용
   */
  const updateScale = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 스케일 계산: 비율을 유지하며 작은 값 선택
    const scaleX = viewportWidth / designWidth
    const scaleY = viewportHeight / designHeight
    const scale = Math.min(scaleX, scaleY)

    // 중앙 정렬 계산
    const scaledWidth = designWidth * scale
    const scaledHeight = designHeight * scale
    const left = (viewportWidth - scaledWidth) / 2
    const top = (viewportHeight - scaledHeight) / 2

    // 스타일 적용
    container.style.width = `${designWidth}px`
    container.style.height = `${designHeight}px`
    container.style.position = 'absolute'
    container.style.left = `${left}px`
    container.style.top = `${top}px`
    container.style.transformOrigin = 'top left'
    container.style.transform = `scale(${scale})`

    // 스케일 값 저장
    currentScaleValue = scale
    window.currentScale = scale

    if (enableLog) {
      console.log(`Scale updated: ${scale.toFixed(3)}, Position: (${left.toFixed(0)}, ${top.toFixed(0)})`)
    }
  }

  // 초기 스케일 적용
  updateScale()

  // 리사이즈 이벤트 리스너 등록
  window.addEventListener('resize', updateScale)

  if (enableLog) {
    console.log('Scaling system initialized', {
      designWidth,
      designHeight,
      containerId,
    })
  }
}

/**
 * 현재 적용된 스케일 값 반환
 * @returns 현재 스케일 값
 */
export function getCurrentScale(): number {
  return currentScaleValue
}

