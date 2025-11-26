import { useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { UserInfo, GeneratedImage } from '../types'

export default function Step3Page() {
  const location = useLocation()
  const navigate = useNavigate()
  const userInfo = location.state?.userInfo as UserInfo
  const generatedImage = location.state?.generatedImage as GeneratedImage & { needsProxy?: boolean }
  const captureRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [displayImageUrl, setDisplayImageUrl] = useState<string>('')

  // 이미지 URL 처리
  useEffect(() => {
    if (generatedImage?.imageUrl) {
      const originalUrl = generatedImage.imageUrl
      
      // base64 이미지는 바로 사용 (CORS 문제 없음)
      if (originalUrl.startsWith('data:')) {
        setDisplayImageUrl(originalUrl)
        setImageLoaded(true)
        setImageError(false)
        return
      }

      // 외부 URL인 경우 - CORS 문제로 로드 실패할 수 있음
      if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
        setDisplayImageUrl(originalUrl)
        
        // 이미지 로드 시도 (CORS 에러는 콘솔에 나타나지만 무시)
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        // 타임아웃 설정
        const timeout = setTimeout(() => {
          setImageLoaded(true)
          setImageError(true)
        }, 5000)
        
        img.onload = () => {
          clearTimeout(timeout)
          setImageLoaded(true)
          setImageError(false)
        }
        
        img.onerror = (e) => {
          clearTimeout(timeout)
          setImageLoaded(true)
          setImageError(true)
          // CORS 에러는 콘솔에 나타나지만 사용자에게는 이미지가 표시될 수 있음
          console.warn('이미지 로드 실패 (CORS 문제일 수 있음):', originalUrl)
        }
        
        // 에러 이벤트 리스너를 먼저 등록한 후 src 설정
        img.src = originalUrl
      } else {
        setDisplayImageUrl(originalUrl)
        setImageLoaded(true)
      }
    } else {
      setImageLoaded(true)
    }
  }, [generatedImage])

  const handleDownload = async () => {
    if (!captureRef.current) return

    setIsDownloading(true)
    try {
      // 이미지가 로드될 때까지 대기
      if (!imageLoaded) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#F5F5DC',
        scale: 2,
        useCORS: true,
        allowTaint: displayImageUrl.startsWith('data:'), // base64 이미지인 경우 true
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

  if (!userInfo || !generatedImage) {
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
    <div className="w-[1280px] h-[800px] bg-[#F5F5DC] flex flex-col">
      {/* 타이틀 */}
      <h1 className="text-5xl md:text-6xl font-bold text-black text-center py-6 font-serif">
        THIS IS ME!
      </h1>

      {/* 메인 콘텐츠 영역 (캡처 대상) */}
      <div ref={captureRef} className="flex-1 flex items-center justify-center px-8 pb-8">
        <div className="grid grid-cols-2 gap-6 w-full max-w-[1200px]">
          {/* 왼쪽 패널: 생성된 이미지 */}
          <div className="bg-white rounded-lg p-6 border border-amber-200 flex items-center justify-center overflow-hidden min-h-[400px]">
            {displayImageUrl ? (
              imageError ? (
                <div className="text-center text-gray-400 p-4">
                  <div className="text-4xl mb-2">⚠️</div>
                  <div className="font-semibold mb-2">이미지를 불러올 수 없습니다</div>
                  <div className="text-sm mt-2 text-gray-500">
                    CORS 정책으로 인해 외부 이미지를 표시할 수 없습니다.
                  </div>
                  <div className="text-xs mt-1 text-gray-400">
                    백엔드 서버에서 이미지를 base64 형식으로 반환하도록 설정해주세요.
                  </div>
                </div>
              ) : (
                <img
                  src={displayImageUrl}
                  alt="Generated"
                  className="w-full h-auto max-h-[600px] object-contain rounded-lg"
                  crossOrigin={displayImageUrl.startsWith('data:') ? undefined : 'anonymous'}
                  onLoad={() => {
                    setImageLoaded(true)
                    setImageError(false)
                  }}
                  onError={() => {
                    setImageError(true)
                    setImageLoaded(true)
                  }}
                />
              )
            ) : (
              <div className="text-gray-400">이미지를 불러오는 중...</div>
            )}
          </div>

          {/* 오른쪽 패널: 자기소개 텍스트 */}
          <div className="bg-white rounded-lg p-8 border border-amber-200 flex items-start">
            <div className="space-y-8 text-xl text-gray-800 leading-loose w-full">
              <p className="break-words py-3 whitespace-normal">
                <span className="font-semibold">Hello! My name is </span>
                <span>{userInfo.name || ''}</span>
                <span>.</span>
              </p>
              <p className="break-words py-3 whitespace-normal">
                <span className="font-semibold">I am </span>
                <span>{userInfo.age || ''}</span>
                <span> years old.</span>
              </p>
              <p className="break-words py-3 whitespace-normal">
                <span className="font-semibold">I live in </span>
                <span>{userInfo.town || ''}</span>
                <span>.</span>
              </p>
              {userInfo.color && (
                <p className="break-words py-3 whitespace-normal">
                  <span className="font-semibold">My favorite color is </span>
                  <span>{userInfo.color}</span>
                  <span>.</span>
                </p>
              )}
              {userInfo.food && (
                <p className="break-words py-3 whitespace-normal">
                  <span className="font-semibold">My favorite food is </span>
                  <span>{userInfo.food}</span>
                  <span>.</span>
                </p>
              )}
              {userInfo.hobby && (
                <p className="break-words py-3 whitespace-normal">
                  <span className="font-semibold">I can </span>
                  <span>{userInfo.hobby}</span>
                  <span>.</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-center gap-4 pb-6">
        <button
          onClick={handleDownload}
          disabled={isDownloading || !imageLoaded}
          className="bg-green-400 hover:bg-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>⬇️</span>
          <span>{isDownloading ? '다운로드 중...' : 'Download'}</span>
        </button>
        <button
          onClick={handlePlayAgain}
          className="bg-green-400 hover:bg-green-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>▶️</span>
          <span>Play Again</span>
        </button>
      </div>
    </div>
  )
}
