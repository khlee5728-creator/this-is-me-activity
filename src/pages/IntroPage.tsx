import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function IntroPage() {
  const navigate = useNavigate()
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleStart = async () => {
    try {
      if (videoRef.current) {
        setIsPlaying(true)
        // 비디오 재생 시도
        await videoRef.current.play()
      } else {
        console.error('Video element not found')
      }
    } catch (error) {
      console.error('Error playing video:', error)
      // 재생 실패 시 바로 Step1로 이동
      navigate('/step1')
    }
  }

  const handleVideoEnd = () => {
    setIsPlaying(false)
    navigate('/step1')
  }

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e)
    setIsPlaying(false)
    // 에러 발생 시 바로 Step1로 이동
    navigate('/step1')
  }

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    setIsPlaying(false)
    navigate('/step1')
  }

  return (
    <div className="w-[1280px] h-[800px] relative overflow-hidden">
      {/* 배경 이미지 - 동영상 재생 전에만 표시 */}
      {!isPlaying && (
        <div className="absolute inset-0 z-0">
          <img
            src="/intro-background.png"
            alt="THIS IS ME! Intro"
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {/* 인트로 동영상 - 항상 렌더링하되 isPlaying에 따라 표시/숨김 */}
      <div className={`absolute inset-0 z-30 ${isPlaying ? 'block' : 'hidden'}`}>
        <video
          ref={videoRef}
          src="/videos/intro-video.mp4"
          className="w-full h-full object-cover"
          onEnded={handleVideoEnd}
          onError={handleVideoError}
          playsInline
        />
        {/* Skip 버튼 - 영상 재생 중에만 표시, 우측 하단에 배치 */}
        {isPlaying && (
          <div className="absolute bottom-8 right-8 z-40">
            <button
              onClick={handleSkip}
              className="bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Skip
            </button>
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 - 이미지 위에 오버레이 */}
      {!isPlaying && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
          {/* 타이틀 - 상단 중앙에 배치 */}
          <h1 className="absolute top-16 left-1/2 transform -translate-x-1/2 text-6xl font-bold text-black font-serif tracking-tight drop-shadow-lg z-20">
            THIS IS ME!
          </h1>

          {/* 시작 버튼 - 이미지의 오른쪽 하단에 배치 */}
          <div className="absolute bottom-8 right-8">
            <button
              onClick={handleStart}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Tap to Start
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
