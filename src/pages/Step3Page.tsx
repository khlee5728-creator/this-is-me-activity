import { useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { UserInfo, ImageStyle } from '../types'
import { generateImageFromText } from '../services/api'

export default function Step3Page() {
  const location = useLocation()
  const navigate = useNavigate()
  const userInfo = location.state?.userInfo as UserInfo
  const introduction = location.state?.introduction as string
  const selectedStyle = location.state?.selectedStyle as ImageStyle | null
  const captureRef = useRef<HTMLDivElement>(null)
  const hasGeneratedRef = useRef(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 컴포넌트 마운트 시 선택된 스타일로 이미지 생성
  useEffect(() => {
    // 이미 생성했으면 실행하지 않음
    if (hasGeneratedRef.current) {
      return
    }

    const createImage = async () => {
      if (!introduction || !selectedStyle) {
        setError('자기소개 텍스트 또는 스타일이 없습니다.')
        return
      }

      hasGeneratedRef.current = true
      setIsGenerating(true)
      setError(null)

      try {
        const result = await generateImageFromText(introduction, selectedStyle)
        setGeneratedImage(result.imageUrl)
      } catch (err: any) {
        console.error('Image generation error:', err)
        setError(err?.message || '이미지 생성 중 오류가 발생했습니다.')
        hasGeneratedRef.current = false // 에러 시 다시 시도 가능하도록
      } finally {
        setIsGenerating(false)
      }
    }

    createImage()
  }, [introduction, selectedStyle])

  const handleDownload = async () => {
    if (!captureRef.current) return

    setIsDownloading(true)
    try {
      const element = captureRef.current
      const rect = element.getBoundingClientRect()
      
      // 모든 패널의 테두리와 그림자 일시 제거
      const panels = element.querySelectorAll('[class*="border-2"]')
      const originalStyles: Array<{ element: HTMLElement; border: string; boxShadow: string }> = []
      
      panels.forEach((panel) => {
        const el = panel as HTMLElement
        originalStyles.push({
          element: el,
          border: el.style.border,
          boxShadow: el.style.boxShadow
        })
        el.style.border = 'none'
        el.style.boxShadow = 'none'
      })
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#FFF9E6',
        scale: 1,
        useCORS: true,
        logging: false,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height,
        windowWidth: rect.width,
        windowHeight: rect.height,
      })
      
      // 스타일 복원
      originalStyles.forEach(({ element, border, boxShadow }) => {
        element.style.border = border
        element.style.boxShadow = boxShadow
      })
      
      const url = canvas.toDataURL('image/png', 1.0)
      const link = document.createElement('a')
      link.download = 'this-is-me.png'
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePlayAgain = () => {
    navigate('/')
  }

  if (!userInfo || !introduction || !selectedStyle) {
    return (
      <div className="w-[1280px] h-[800px] bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">결과 정보가 없습니다. 처음부터 시작해주세요.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[1280px] h-[800px] flex flex-col overflow-hidden px-4 py-6" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)' }}>
      <div className="w-full mx-auto flex-1 flex flex-col">
        {/* 타이틀 */}
        <h1 className="text-5xl md:text-6xl font-bold text-black text-center py-4 font-serif flex-shrink-0 drop-shadow-md">
          THIS IS ME!
        </h1>

        {/* 결과 표시 화면 (캡처 대상) */}
        <div ref={captureRef} className="flex-1 min-h-0 mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center">
              {/* 재미있는 애니메이션 */}
              <div className="relative mb-6">
                {/* 회전하는 별들 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl animate-spin" style={{ animationDuration: '2s' }}>
                    ⭐
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}>
                    ✨
                  </div>
                </div>
                {/* 중앙 펄스 애니메이션 */}
                <div className="relative z-10">
                  <div className="text-7xl animate-bounce">
                    🎨
                  </div>
                </div>
                {/* 주변 떠다니는 이모지들 */}
                <div className="absolute -top-4 -left-4 text-4xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '1.2s' }}>
                  🖌️
                </div>
                <div className="absolute -top-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '1.3s' }}>
                  🎭
                </div>
                <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce" style={{ animationDelay: '0.6s', animationDuration: '1.4s' }}>
                  🌈
                </div>
                <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '1.1s' }}>
                  🎪
                </div>
              </div>
              <p className="text-orange-600 font-bold text-xl animate-pulse">Creating your character...</p>
              <p className="text-orange-500 text-sm mt-2">Please wait a moment! ✨</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 w-full" style={{ maxWidth: '1200px', width: '100%', alignItems: 'start' }}>
            {/* 왼쪽 패널: 생성된 이미지 */}
            <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-lg flex items-center justify-center overflow-hidden min-h-[300px] max-h-[500px]">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto max-h-[450px] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">🎨</div>
                  <p>이미지를 불러오는 중...</p>
                </div>
              )}
            </div>

            {/* 오른쪽 패널: 자기소개 텍스트 */}
            <div className="rounded-2xl p-4 border-2 border-orange-200 shadow-lg flex items-start min-w-0" style={{ width: '100%', maxWidth: '100%', backgroundColor: '#ffffff', background: '#ffffff', minHeight: 'fit-content', height: 'auto' }}>
              <div className="text-lg leading-relaxed w-full min-w-0" style={{ width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', backgroundColor: '#ffffff', background: '#ffffff', minHeight: 'fit-content', height: 'auto' }}>
                <p className="break-words py-2 whitespace-pre-wrap" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%', color: '#1f2937', backgroundColor: '#ffffff', background: '#ffffff', margin: 0, padding: 0 }}>
                  {introduction}
                </p>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* 버튼 영역 */}
        {generatedImage && !isGenerating && (
          <div className="flex justify-center gap-4 pt-4 flex-shrink-0">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
          </button>
          <button
            onClick={handlePlayAgain}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Play Again</span>
          </button>
          </div>
        )}
      </div>
    </div>
  )
}
