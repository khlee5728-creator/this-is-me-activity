/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
  // 필요한 다른 환경 변수들도 여기에 추가 가능
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 스케일링 시스템 전역 변수
declare global {
  interface Window {
    currentScale: number
  }
}

