import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { UserInfo } from '../types'
import { generateQuestionOptions } from '../services/api'

export default function Step1Page() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<UserInfo>()
  
  // 기본값 정의
  const defaultOptions = {
    color: ['red', 'blue', 'green', 'yellow', 'purple'],
    food: ['pizza', 'apple', 'ice cream', 'hamburger', 'banana'],
    hobby: ['reading books', 'playing soccer', 'drawing pictures', 'singing songs', 'dancing'],
  }

  // 초기 상태에 기본값 설정
  const [colorOptions, setColorOptions] = useState<string[]>(defaultOptions.color)
  const [foodOptions, setFoodOptions] = useState<string[]>(defaultOptions.food)
  const [hobbyOptions, setHobbyOptions] = useState<string[]>(defaultOptions.hobby)
  const [loadingColor, setLoadingColor] = useState(false)
  const [loadingFood, setLoadingFood] = useState(false)
  const [loadingHobby, setLoadingHobby] = useState(false)

  const selectedColor = watch('color')
  const selectedFood = watch('food')
  const selectedHobby = watch('hobby')

  // 입력 필드 자동 크기 조정 함수 (예상 답안보다 20% 더 길게)
  const adjustInputWidth = (input: HTMLInputElement) => {
    const baseWidths: Record<string, number> = {
      name: 80,      // 예상: 5-8자 → 80px → 20% 증가 = 96px
      age: 40,       // 예상: 1-2자 → 40px → 20% 증가 = 48px
      town: 100,     // 예상: 5-10자 → 100px → 20% 증가 = 120px
      color: 80,     // 예상: 3-8자 → 80px → 20% 증가 = 96px
      food: 100,     // 예상: 5-12자 → 100px → 20% 증가 = 120px
      hobby: 120,    // 예상: 8-15자 → 120px → 20% 증가 = 144px
    }
    
    const fieldName = input.name as keyof typeof baseWidths
    const baseWidth = baseWidths[fieldName] || 80
    const minWidth = Math.ceil(baseWidth * 1.2) // 20% 증가
    
    // 입력 값이 없으면 최소 너비 사용
    if (!input.value || input.value.trim() === '') {
      input.style.width = `${minWidth}px`
      return
    }
    
    // 임시 span을 생성하여 텍스트 너비 측정
    const span = document.createElement('span')
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.style.whiteSpace = 'pre'
    span.style.font = window.getComputedStyle(input).font
    span.style.fontSize = window.getComputedStyle(input).fontSize
    span.style.fontFamily = window.getComputedStyle(input).fontFamily
    span.style.fontWeight = window.getComputedStyle(input).fontWeight
    span.style.letterSpacing = window.getComputedStyle(input).letterSpacing
    span.style.paddingLeft = window.getComputedStyle(input).paddingLeft
    span.style.paddingRight = window.getComputedStyle(input).paddingRight
    span.textContent = input.value
    document.body.appendChild(span)
    
    const textWidth = span.offsetWidth
    document.body.removeChild(span)
    
    // 최소 너비와 측정된 너비 중 큰 값 사용 (추가 여유 공간 10px)
    const newWidth = Math.max(minWidth, textWidth + 10)
    input.style.width = `${newWidth}px`
  }

  // 함수 참조 저장 (버튼 클릭 핸들러에서 사용)
  const adjustInputWidthRef = useRef(adjustInputWidth)
  adjustInputWidthRef.current = adjustInputWidth

  // 입력 필드에 자동 크기 조정 이벤트 리스너 추가
  useEffect(() => {
    const handleInput = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (input && input.type === 'text' && input.name) {
        adjustInputWidth(input)
      }
    }

    // 모든 텍스트 입력 필드에 이벤트 리스너 추가
    const setupInputs = () => {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]')
      inputs.forEach((input) => {
        if (input.name) {
          // 초기 크기 설정
          adjustInputWidth(input)
          input.addEventListener('input', handleInput)
          // 값이 변경될 때도 크기 조정 (setValue로 값이 설정된 경우)
          input.addEventListener('change', handleInput)
        }
      })
    }

    // 초기 설정
    setupInputs()

    // 옵션이 로드된 후에도 재설정
    const timer = setTimeout(setupInputs, 100)

    // cleanup 함수
    return () => {
      clearTimeout(timer)
      const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]')
      inputs.forEach((input) => {
        input.removeEventListener('input', handleInput)
        input.removeEventListener('change', handleInput)
      })
    }
  }, [colorOptions, foodOptions, hobbyOptions, selectedColor, selectedFood, selectedHobby]) // 값 변경 시에도 재설정

  // 초기 옵션은 기본값으로 표시되므로 자동 로드하지 않음
  // refresh 버튼을 눌렀을 때만 API 호출

  const loadColorOptions = async () => {
    setLoadingColor(true)
    try {
      const result = await generateQuestionOptions('color')
      // AI가 생성한 옵션 5개를 설정
      const options = result.options || []
      setColorOptions(options.slice(0, 5)) // 최대 5개만 표시
    } catch (error) {
      console.error('Failed to load color options:', error)
      // 에러 발생 시 기본값으로 복원
      setColorOptions(defaultOptions.color)
    } finally {
      setLoadingColor(false)
    }
  }

  const loadFoodOptions = async () => {
    setLoadingFood(true)
    try {
      const result = await generateQuestionOptions('food')
      // AI가 생성한 옵션 5개를 설정
      const options = result.options || []
      setFoodOptions(options.slice(0, 5)) // 최대 5개만 표시
    } catch (error) {
      console.error('Failed to load food options:', error)
      // 에러 발생 시 기본값으로 복원
      setFoodOptions(defaultOptions.food)
    } finally {
      setLoadingFood(false)
    }
  }

  const loadHobbyOptions = async () => {
    setLoadingHobby(true)
    try {
      const result = await generateQuestionOptions('hobby')
      // AI가 생성한 옵션 5개를 설정
      const options = result.options || []
      setHobbyOptions(options.slice(0, 5)) // 최대 5개만 표시
    } catch (error) {
      console.error('Failed to load hobby options:', error)
      // 에러 발생 시 기본값으로 복원
      setHobbyOptions(defaultOptions.hobby)
    } finally {
      setLoadingHobby(false)
    }
  }

  const onSubmit = (data: UserInfo) => {
    navigate('/step2', { state: { userInfo: data } })
  }

  return (
    <div className="w-[1280px] h-[800px] bg-[#F5F5DC] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg">
            Step 1
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Fill in the blanks to introduce yourself!
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 필수 필드 - Name */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="bg-orange-300 text-gray-800 font-bold py-2 px-4 rounded-lg min-w-[100px] text-center flex-shrink-0">
                Name
              </div>
              <div className="flex-1 border-l-2 border-orange-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">My name is</span>
                  <input
                    type="text"
                    {...register('name', { required: '이름을 입력해주세요' })}
                    name="name"
                    className="px-2 py-1 border-b-2 border-gray-400 bg-transparent focus:outline-none focus:border-blue-500 text-gray-800"
                    style={{ minWidth: '96px', width: 'auto', overflow: 'visible' }}
                    placeholder=""
                  />
                </div>
              </div>
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 ml-28">{errors.name.message}</p>
            )}
          </div>

          {/* 필수 필드 - Age */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="bg-orange-300 text-gray-800 font-bold py-2 px-4 rounded-lg min-w-[100px] text-center flex-shrink-0">
                Age
              </div>
              <div className="flex-1 border-l-2 border-orange-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">I am</span>
                  <input
                    type="text"
                    {...register('age', { required: '나이를 입력해주세요' })}
                    name="age"
                    className="px-2 py-1 border-b-2 border-gray-400 bg-transparent focus:outline-none focus:border-blue-500 text-gray-800"
                    style={{ minWidth: '48px', width: 'auto', overflow: 'visible' }}
                    placeholder=""
                  />
                  <span className="text-sm text-gray-600">years old.</span>
                </div>
              </div>
            </div>
            {errors.age && (
              <p className="mt-1 text-sm text-red-500 ml-28">{errors.age.message}</p>
            )}
          </div>

          {/* 필수 필드 - Town */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="bg-orange-300 text-gray-800 font-bold py-2 px-4 rounded-lg min-w-[100px] text-center flex-shrink-0">
                Town
              </div>
              <div className="flex-1 border-l-2 border-orange-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">I live in</span>
                  <input
                    type="text"
                    {...register('town', { required: '사는 곳을 입력해주세요' })}
                    name="town"
                    className="px-2 py-1 border-b-2 border-gray-400 bg-transparent focus:outline-none focus:border-blue-500 text-gray-800"
                    style={{ minWidth: '120px', width: 'auto', overflow: 'visible' }}
                    placeholder=""
                  />
                </div>
              </div>
            </div>
            {errors.town && (
              <p className="mt-1 text-sm text-red-500 ml-28">{errors.town.message}</p>
            )}
          </div>

          {/* 선택 필드 - Color */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-orange-300 text-gray-800 font-bold py-2 px-4 rounded-lg min-w-[100px] text-center flex-shrink-0">
                Color
              </div>
              <div className="flex-1 border-l-2 border-orange-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">My favorite color is</span>
                  <input
                    type="text"
                    {...register('color')}
                    name="color"
                    className="px-2 py-1 border-b-2 border-gray-400 bg-transparent focus:outline-none focus:border-blue-500 text-gray-800"
                    style={{ minWidth: '96px', width: 'auto', overflow: 'visible' }}
                    placeholder=""
                  />
                  <button
                    type="button"
                    onClick={loadColorOptions}
                    disabled={loadingColor}
                    className="w-7 h-7 rounded-lg bg-orange-300 hover:bg-orange-400 disabled:bg-orange-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:shadow-md active:scale-95"
                    title="새로운 옵션 생성"
                  >
                    {loadingColor ? (
                      <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {loadingColor && (
              <div className="ml-28 text-sm text-gray-500">AI가 새로운 옵션을 생성 중...</div>
            )}
            {!loadingColor && colorOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-28">
                {colorOptions.map((option, index) => (
                  <button
                    key={`color-${index}-${option}`}
                    type="button"
                    onClick={() => {
                      setValue('color', option)
                      // 값 설정 후 크기 조정
                      setTimeout(() => {
                        const input = document.querySelector<HTMLInputElement>('input[name="color"]')
                        if (input && adjustInputWidthRef.current) {
                          adjustInputWidthRef.current(input)
                        }
                      }, 0)
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedColor === option
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택 필드 - Food */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-orange-300 text-gray-800 font-bold py-2 px-4 rounded-lg min-w-[100px] text-center flex-shrink-0">
                Food
              </div>
              <div className="flex-1 border-l-2 border-orange-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">My favorite food is</span>
                  <input
                    type="text"
                    {...register('food')}
                    name="food"
                    className="px-2 py-1 border-b-2 border-gray-400 bg-transparent focus:outline-none focus:border-blue-500 text-gray-800"
                    style={{ minWidth: '120px', width: 'auto', overflow: 'visible' }}
                    placeholder=""
                  />
                  <button
                    type="button"
                    onClick={loadFoodOptions}
                    disabled={loadingFood}
                    className="w-7 h-7 rounded-lg bg-orange-300 hover:bg-orange-400 disabled:bg-orange-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:shadow-md active:scale-95"
                    title="새로운 옵션 생성"
                  >
                    {loadingFood ? (
                      <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {loadingFood && (
              <div className="ml-28 text-sm text-gray-500">AI가 새로운 옵션을 생성 중...</div>
            )}
            {!loadingFood && foodOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-28">
                {foodOptions.map((option, index) => (
                  <button
                    key={`food-${index}-${option}`}
                    type="button"
                    onClick={() => {
                      setValue('food', option)
                      // 값 설정 후 크기 조정
                      setTimeout(() => {
                        const input = document.querySelector<HTMLInputElement>('input[name="food"]')
                        if (input && adjustInputWidthRef.current) {
                          adjustInputWidthRef.current(input)
                        }
                      }, 0)
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedFood === option
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택 필드 - Hobby */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-orange-300 text-gray-800 font-bold py-2 px-4 rounded-lg min-w-[100px] text-center flex-shrink-0">
                Hobby
              </div>
              <div className="flex-1 border-l-2 border-orange-200 pl-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">My hobby is</span>
                  <input
                    type="text"
                    {...register('hobby')}
                    name="hobby"
                    className="px-2 py-1 border-b-2 border-gray-400 bg-transparent focus:outline-none focus:border-blue-500 text-gray-800"
                    style={{ minWidth: '144px', width: 'auto', overflow: 'visible' }}
                    placeholder=""
                  />
                  <button
                    type="button"
                    onClick={loadHobbyOptions}
                    disabled={loadingHobby}
                    className="w-7 h-7 rounded-lg bg-orange-300 hover:bg-orange-400 disabled:bg-orange-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-sm hover:shadow-md active:scale-95"
                    title="새로운 옵션 생성"
                  >
                    {loadingHobby ? (
                      <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {loadingHobby && (
              <div className="ml-28 text-sm text-gray-500">AI가 새로운 옵션을 생성 중...</div>
            )}
            {!loadingHobby && hobbyOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 ml-28">
                {hobbyOptions.map((option, index) => (
                  <button
                    key={`hobby-${index}-${option}`}
                    type="button"
                    onClick={() => {
                      setValue('hobby', option)
                      // 값 설정 후 크기 조정
                      setTimeout(() => {
                        const input = document.querySelector<HTMLInputElement>('input[name="hobby"]')
                        if (input && adjustInputWidthRef.current) {
                          adjustInputWidthRef.current(input)
                        }
                      }, 0)
                    }}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedHobby === option
                        ? 'bg-green-600 text-white'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Next 버튼 */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
