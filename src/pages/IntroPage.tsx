import { useNavigate } from 'react-router-dom'

export default function IntroPage() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/step1')
  }

  return (
    <div className="w-[1280px] h-[800px] relative overflow-hidden">
      {/* 배경 이미지 - 첨부된 이미지 사용 */}
      <div className="absolute inset-0">
        <img
          src="/intro-background.png"
          alt="THIS IS ME! Intro"
          className="w-full h-full object-cover"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* 메인 콘텐츠 - 이미지 위에 오버레이 */}
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
    </div>
  )
}
