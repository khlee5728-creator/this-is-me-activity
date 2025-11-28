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
    <div className="w-[1280px] h-[800px] px-4 py-6 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)' }}>
      <div className="max-w-5xl mx-auto flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md">
            Step 2
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Take or upload your photo. Then choose the style
          </h1>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 flex-1 min-h-0">
          {/* 왼쪽: 사진 업로드 섹션 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="border-2 border-dashed border-orange-300 rounded-xl h-64 md:h-80 flex flex-col items-center justify-center mb-4 overflow-hidden bg-orange-50">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-orange-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-orange-400 font-semibold text-lg">Upload your photo here!</p>
                  <p className="text-orange-300 text-sm mt-1">Click Camera or Upload button</p>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCameraClick}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
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
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Character Style</h2>
            <div className="space-y-3">
              {styles.map((style) => {
                const styleIcons = {
                  cartoon: (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  ),
                  fairytale: (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
                  fantasy: (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  ),
                }
                return (
                  <button
                    key={style.value}
                    onClick={() => {
                      setSelectedStyle(style.value)
                      setError(null)
                    }}
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-left transition-all duration-200 flex items-center gap-3 ${
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Next 버튼 */}
        <div className="flex justify-end mt-auto pt-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !selectedImage || !selectedStyle}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Next →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
