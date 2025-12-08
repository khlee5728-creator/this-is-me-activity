import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserInfo } from '../types'
import { generateIntroduction } from '../services/api'

export default function Step2Page() {
  const location = useLocation()
  const navigate = useNavigate()
  const userInfo = location.state?.userInfo as UserInfo
  
  const [introduction, setIntroduction] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 컴포넌트 마운트 시 자기소개 글 생성
  useEffect(() => {
    const generateIntro = async () => {
      if (!userInfo) return
      
      setIsGenerating(true)
      setError(null)
      
      try {
        const result = await generateIntroduction(userInfo)
        setIntroduction(result.introduction)
      } catch (err: any) {
        console.error('Introduction generation error:', err)
        setError('자기소개 글 생성 중 오류가 발생했습니다.')
      } finally {
        setIsGenerating(false)
      }
    }

    generateIntro()
  }, [userInfo])

  const handleSubmit = () => {
    if (!introduction) {
      setError('자기소개 글을 생성해주세요')
      return
    }

    navigate('/step3', {
      state: {
        userInfo,
        introduction,
      },
    })
  }

  if (!userInfo) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">사용자 정보가 없습니다. 처음부터 시작해주세요.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg"
        >
          처음으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="w-[1280px] h-[800px] px-4 py-6 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)' }}>
      <div className="max-w-5xl mx-auto flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md">
            Step 2
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Read your introduction
          </h1>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 min-h-0 mb-4">
          {/* AI 생성 자기소개 글 섹션 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">My Introduction</h2>
            <div className="flex-1 border-2 border-orange-200 rounded-xl p-6 bg-orange-50 overflow-y-auto">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <svg className="animate-spin h-8 w-8 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-orange-500 font-medium">Creating your introduction...</p>
                </div>
              ) : introduction ? (
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                  {introduction}
                </p>
              ) : (
                <p className="text-gray-400 text-center">Failed to generate introduction.</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Next 버튼 */}
        <div className="flex justify-end mt-auto pt-4">
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !introduction}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
