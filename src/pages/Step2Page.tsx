import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserInfo, ImageStyle } from '../types'
import { transformImage } from '../services/api'

export default function Step2Page() {
  const location = useLocation()
  const navigate = useNavigate()
  const userInfo = location.state?.userInfo as UserInfo
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const styles: { value: ImageStyle; label: string }[] = [
    { value: 'cartoon', label: 'Cartoon' },
    { value: 'fairytale', label: 'Fairy Tale' },
    { value: 'superhero', label: 'Super Hero' },
    { value: 'lego', label: 'Lego' },
    { value: 'fantasy', label: 'Fantasy' },
  ]

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async () => {
    if (!selectedImage) {
      setError('사진을 선택해주세요')
      return
    }
    if (!selectedStyle) {
      setError('스타일을 선택해주세요')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await transformImage(selectedImage, selectedStyle)
      if (!result || !result.imageUrl) {
        throw new Error('이미지 생성 결과가 없습니다.')
      }
      navigate('/step3', {
        state: {
          userInfo,
          generatedImage: result,
        },
      })
    } catch (err: any) {
      const errorMessage = err?.message || '이미지 변환 중 오류가 발생했습니다.'
      setError(errorMessage + ' 다시 시도해주세요.')
      console.error('Image transformation error:', err)
    } finally {
      setIsLoading(false)
    }
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
    <div className="w-[1280px] h-[800px] bg-[#F5F5DC] px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg">
            Step 2
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Take or upload your photo. Then choose the style
          </h1>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 왼쪽: 사진 업로드 섹션 */}
          <div className="bg-white rounded-lg p-6">
            <div className="bg-gray-200 rounded-lg h-64 md:h-80 flex items-center justify-center mb-4 overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-6xl">🌄</div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCameraClick}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">📷</span>
                <span>Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">⬆️</span>
                <span>Upload</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              capture="user"
            />
          </div>

          {/* 오른쪽: 스타일 선택 섹션 */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Character Style</h2>
            <div className="space-y-3">
              {styles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => {
                    setSelectedStyle(style.value)
                    setError(null)
                  }}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-left transition-all ${
                    selectedStyle === style.value
                      ? 'bg-yellow-400 text-gray-800 shadow-md scale-105'
                      : 'bg-yellow-200 text-gray-700 hover:bg-yellow-300'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Next 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedImage || !selectedStyle}
            className="bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            {isLoading ? '처리 중...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
