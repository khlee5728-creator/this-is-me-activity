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
  const captureRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const styles: { value: ImageStyle; label: string }[] = [
    { value: 'pixar', label: 'Pixar' },
    { value: 'pixelart', label: 'Pixel Art' },
    { value: 'superhero', label: 'Super Hero' },
    { value: 'lego', label: 'Lego' },
    { value: 'stickerpack', label: 'Sticker Pack' },
  ]

  const handleStyleSelect = async (style: ImageStyle) => {
    if (!introduction) {
      setError('자기소개 텍스트가 없습니다.')
      return
    }

    setSelectedStyle(style)
    setIsGenerating(true)
    setError(null)
    setShowResult(false)

    try {
      const result = await generateImageFromText(introduction, style)
      setGeneratedImage(result.imageUrl)
      setShowResult(true)
    } catch (err: any) {
      console.error('Image generation error:', err)
      setError(err?.message || '이미지 생성 중 오류가 발생했습니다.')
      setSelectedStyle(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!captureRef.current) return

    setIsDownloading(true)
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#FFF9E6',
        scale: 2,
        useCORS: true,
        logging: false,
        width: captureRef.current.scrollWidth,
        height: captureRef.current.scrollHeight,
        windowWidth: captureRef.current.scrollWidth,
        windowHeight: captureRef.current.scrollHeight,
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

  if (!userInfo || !introduction) {
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
    <div className="w-[1280px] h-[800px] flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)' }}>
      {/* 타이틀 */}
      <h1 className="text-5xl md:text-6xl font-bold text-black text-center py-6 font-serif flex-shrink-0 drop-shadow-md">
        THIS IS ME!
      </h1>

      {!showResult ? (
        /* 스타일 선택 화면 */
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4 min-h-0">
          <div className="max-w-3xl w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Choose Character Style</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating your image...</span>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="space-y-3">
                {styles.map((style) => {
                  const styleIcons = {
                    pixar: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                    ),
                    pixelart: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 2h4v4H2V2zm6 0h4v4H8V2zm6 0h4v4h-4V2zM2 8h4v4H2V8zm6 0h4v4H8V8zm6 0h4v4h-4V8zM2 14h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4z" />
                      </svg>
                    ),
                    superhero: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ),
                    lego: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 12v-4H5v4h10z" clipRule="evenodd" />
                      </svg>
                    ),
                    stickerpack: (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3 2h10v9H7V4zm2 2v7h6V6H9z" clipRule="evenodd" />
                      </svg>
                    ),
                  }
                  return (
                    <button
                      key={style.value}
                      onClick={() => handleStyleSelect(style.value)}
                      disabled={isGenerating}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-left transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedStyle === style.value
                          ? 'bg-orange-400 text-white shadow-lg scale-105 border-2 border-orange-500'
                          : 'bg-yellow-100 text-gray-700 hover:bg-yellow-200 border-2 border-transparent hover:border-orange-200'
                      }`}
                    >
                      {styleIcons[style.value]}
                      <span>{style.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 결과 표시 화면 (캡처 대상) */
        <div ref={captureRef} className="flex-1 flex items-center justify-center px-8 pb-4 min-h-0" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)' }}>
          <div className="grid grid-cols-2 gap-6 w-full max-w-[1200px]">
            {/* 왼쪽 패널: 생성된 이미지 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-xl flex items-center justify-center overflow-hidden min-h-[400px]">
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">🎨</div>
                  <p>이미지를 불러오는 중...</p>
                </div>
              )}
            </div>

            {/* 오른쪽 패널: 자기소개 텍스트 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-orange-200 shadow-xl flex items-start">
              <div className="space-y-4 text-lg text-gray-800 leading-relaxed w-full">
                <p className="break-words py-2 whitespace-normal whitespace-pre-wrap">
                  {introduction}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex justify-center gap-6 pb-6 flex-shrink-0">
        {showResult && (
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
        )}
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
    </div>
  )
}
