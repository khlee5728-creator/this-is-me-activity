import axios from 'axios'

// 개발 환경에서는 프록시를 통해 /api로 요청, 프로덕션에서는 절대 URL 사용
const backendUrl = import.meta.env.PROD 
  ? 'https://playground.polarislabs.ai.kr/api'
  : '/api'

export const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// OpenAI Chat Completions API를 통한 자기소개 글 생성
export const generateIntroduction = async (userInfo: {
  name: string
  age: string
  town: string
  gender?: string
  hairColor?: string
  hairStyle?: string
  color?: string
  food?: string
  hobby?: string
}) => {
  // Step1에서 입력한 정보를 바탕으로 자기소개 글 생성
  const userInfoText = [
    `Name: ${userInfo.name}`,
    `Age: ${userInfo.age} years old`,
    `Location: ${userInfo.town}`,
    userInfo.gender && `Gender: ${userInfo.gender}`,
    userInfo.hairColor && `Hair color: ${userInfo.hairColor}`,
    userInfo.hairStyle && `Hair style: ${userInfo.hairStyle}`,
    userInfo.color && `Favorite color: ${userInfo.color}`,
    userInfo.food && `Favorite food: ${userInfo.food}`,
    userInfo.hobby && `Hobby: ${userInfo.hobby}`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Based on the following information about a student, write a friendly and natural self-introduction paragraph in English for elementary students. Make it warm, engaging, and easy to understand. Write it as if the student is speaking about themselves. Keep it to 3-5 sentences.

Student information:
${userInfoText}

Write a self-introduction paragraph:`

  try {
    const response = await api.post('/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an English teacher helping elementary students write self-introductions. Write in simple, friendly English that elementary students can understand and relate to.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const content = response.data.choices?.[0]?.message?.content || ''
    return { introduction: content.trim() }
  } catch (error) {
    console.error('API Error:', error)
    // Fallback: 기본 자기소개 글 생성
    const fallback = `Hello! My name is ${userInfo.name}. I am ${userInfo.age} years old. I live in ${userInfo.town}.`
    return { introduction: fallback }
  }
}

// OpenAI Chat Completions API를 통한 문항 옵션 생성 (5개씩 생성)
export const generateQuestionOptions = async (type: 'color' | 'food' | 'hobby' | 'hairColor' | 'hairStyle') => {
  const prompts = {
    color: 'Generate exactly 5 different simple English color names for elementary students. Return only a JSON array with exactly 5 color names. Example format: ["red", "blue", "green", "yellow", "purple"]',
    food: 'Generate exactly 5 different simple English food names for elementary students. Return only a JSON array with exactly 5 food names. Example format: ["pizza", "apple", "ice cream", "hamburger", "banana"]',
    hobby: 'Generate exactly 5 different simple English hobby/activity phrases for elementary students. Return only a JSON array with exactly 5 phrases. Example format: ["reading books", "playing soccer", "drawing pictures", "singing songs", "dancing"]',
    hairColor: 'Generate exactly 5 different simple English hair color names for elementary students. Return only a JSON array with exactly 5 hair color names. Example format: ["black", "brown", "blonde", "red", "orange"]',
    hairStyle: 'Generate exactly 5 different simple English hair style descriptions for elementary students. Return only a JSON array with exactly 5 hair style words. Example format: ["short", "long", "curly", "straight", "wavy"]',
  }

  try {
    const response = await api.post('/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an English teacher for elementary students. Generate simple, age-appropriate options. Always return only a valid JSON array with exactly 5 items, no additional text or explanation.',
        },
        {
          role: 'user',
          content: prompts[type],
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    })

    // 응답에서 content 추출
    const content = response.data.choices?.[0]?.message?.content || '[]'
    
    // JSON 파싱 시도
    let options: string[] = []
    try {
      const cleanedContent = content.trim().replace(/^```json\s*|\s*```$/g, '').replace(/^```\s*|\s*```$/g, '')
      options = JSON.parse(cleanedContent)
      
      if (!Array.isArray(options)) {
        throw new Error('Response is not an array')
      }
      
      if (options.length < 5) {
        const defaults = {
          color: ['red', 'blue', 'green', 'yellow', 'purple'],
          food: ['pizza', 'apple', 'ice cream', 'hamburger', 'banana'],
          hobby: ['reading books', 'playing soccer', 'drawing pictures', 'singing songs', 'dancing'],
          hairColor: ['black', 'brown', 'blonde', 'red', 'orange'],
          hairStyle: ['short', 'long', 'curly', 'straight', 'wavy'],
        }
        const defaultOptions = defaults[type] || []
        options = [...options, ...defaultOptions].slice(0, 5)
      } else {
        options = options.slice(0, 5)
      }
    } catch (parseError) {
      console.error('Failed to parse options:', parseError)
      const defaults = {
        color: ['red', 'blue', 'green', 'yellow', 'purple'],
        food: ['pizza', 'apple', 'ice cream', 'hamburger', 'banana'],
        hobby: ['reading books', 'playing soccer', 'drawing pictures', 'singing songs', 'dancing'],
        hairColor: ['black', 'brown', 'blonde', 'red', 'orange'],
        hairStyle: ['short', 'long', 'curly', 'straight', 'wavy'],
      }
      options = defaults[type] || []
    }

    return { options: options.slice(0, 5) }
  } catch (error) {
    console.error('API Error:', error)
    const defaults = {
      color: ['red', 'blue', 'green', 'yellow', 'purple'],
      food: ['pizza', 'apple', 'ice cream', 'hamburger', 'banana'],
      hobby: ['reading books', 'playing soccer', 'drawing pictures', 'singing songs', 'dancing'],
      hairColor: ['black', 'brown', 'blonde', 'red', 'orange'],
      hairStyle: ['short', 'long', 'curly', 'straight', 'wavy'],
    }
    return { options: defaults[type] || [] }
  }
}

// 텍스트 기반 이미지 생성 (자기소개 텍스트로 이미지 생성)
export const generateImageFromText = async (
  introduction: string,
  style: 'pixar' | 'pixelart' | 'superhero' | 'lego' | 'stickerpack' | 'disney'
) => {
  const stylePrompts = {
    pixar: 'Create a Pixar-style 3D character illustration. Use smooth 3D rendering, glossy textures, and warm cinematic lighting. Apply a friendly and cute vibe similar to modern animated movies. Use a simple gradient or softly blurred background.',
    pixelart: 'Create a pixel art character illustration. Use 16-bit or 32-bit style pixel shading with clean blocky shapes. Maintain strong silhouettes and simplified colors. Use a transparent or solid single-color background.',
    superhero: 'Create a superhero-style illustration. Use bold outlines, vivid comic-book colors, and dynamic lighting. Add subtle heroic elements like a simple cape shape or strong pose, but avoid copyrighted costumes. Use a clean gradient background for focus.',
    lego: 'Create a LEGO-style 3D character illustration. Use plastic-like block textures, large round eyes, and minimal facial details. Use bright primary colors and simple shapes. Place the character on a plain white or light background.',
    stickerpack: 'Create a sticker-style character illustration. Use bold outlines, bright colors, and minimal shading. Add a white sticker border around the character. Use a transparent background so it can be used as a sticker.',
    disney: 'Create a Disney-style character illustration. Keep the person\'s facial features recognizable but stylized with elegant proportions. Use soft pastel colors, clean outlines, and gentle shading. Make the eyes slightly larger and expressive, with a warm fairy-tale feeling. Use a soft light background with minimal details.',
  }

  // 자기소개 텍스트와 스타일을 조합한 프롬프트 생성
  const prompt = `${introduction}\n\n${stylePrompts[style]}`

  try {
    // DALL-E 3 text-to-image API 호출
    const response = await api.post('/images/generations', {
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: style,
      response_format: 'b64_json', // base64 반환 요청
    }, {
      timeout: 120000,
    })

    console.log('백엔드 응답:', response.data)

    const imageData = response.data?.data?.[0]
    const b64Json = imageData?.b64_json
    const imageUrl = imageData?.url

    if (b64Json) {
      const dataUrl = `data:image/png;base64,${b64Json}`
      return {
        imageUrl: dataUrl,
        style: style,
      }
    } else if (imageUrl) {
      return {
        imageUrl: imageUrl,
        style: style,
      }
    } else {
      throw new Error('이미지 데이터가 없습니다.')
    }
  } catch (error: any) {
    console.error('Image generation error:', error)
    throw new Error(error?.response?.data?.error?.message || '이미지 생성 중 오류가 발생했습니다.')
  }
}

// OpenAI Images Generations API를 통한 이미지 스타일 변환
export const transformImage = async (
  imageFile: File,
  style: 'pixar' | 'pixelart' | 'superhero' | 'lego' | 'stickerpack'
) => {
  const stylePrompts = {
    pixar: 'Stylize the uploaded photo. Make the result match this style: CRITICAL: Preserve the EXACT person from the original image. Create a Pixar-style 3D character based on the uploaded photo. Keep the person\'s key facial features recognizable, with expressive large eyes and soft facial proportions. Use smooth 3D rendering, glossy textures, and warm cinematic lighting. Apply a friendly and cute vibe similar to modern animated movies. Use a simple gradient or softly blurred background. Keep IDENTICAL facial features, hair color, hair style, eye color, skin tone, body shape, pose, and clothing. The person must be recognizable as the same individual, just rendered in Pixar 3D animation style. Do NOT change the person\'s appearance, only the rendering style to Pixar 3D animation.',
    pixelart: 'Stylize the uploaded photo. Make the result match this style: CRITICAL: Preserve the EXACT person from the original image. Create a pixel art character based on the uploaded photo. Keep the person\'s key facial features and hairstyle recognizable within pixel limitations. Use 16-bit or 32-bit style pixel shading with clean blocky shapes. Maintain strong silhouettes and simplified colors. Use a transparent or solid single-color background. Keep IDENTICAL facial features, hair color, hair style, eye color, skin tone, body shape, pose, and clothing. The person must be recognizable as the same individual, just rendered in pixel art style. Do NOT change the person\'s appearance, only the rendering style to pixel art.',
    superhero: 'Stylize the uploaded photo. Make the result match this style: CRITICAL: Preserve the EXACT person from the original image. Create a superhero-style illustration based on the uploaded photo. Maintain the person\'s facial features and hairstyle, stylized but recognizable. Use bold outlines, vivid comic-book colors, and dynamic lighting. Add subtle heroic elements like a simple cape shape or strong pose, but avoid copyrighted costumes. Use a clean gradient background for focus. Keep IDENTICAL facial features, hair color, hair style, eye color, skin tone, body shape, and pose. The person must be recognizable as the same individual, just rendered in superhero comic book style. Do NOT change the person\'s appearance, only the rendering style to superhero illustration.',
    lego: 'Stylize the uploaded photo. Make the result match this style: CRITICAL: Preserve the EXACT person from the original image. Transform the uploaded photo into a LEGO-style 3D character. Keep the essential facial features and hairstyle recognizable, but simplified into LEGO proportions. Use plastic-like block textures, large round eyes, and minimal facial details. Use bright primary colors and simple shapes. Place the character on a plain white or light background. Keep IDENTICAL facial features, hair color, hair style, eye color, skin tone, body shape, pose, and clothing. The person must be recognizable as the same individual, just rendered as a LEGO minifigure. Do NOT change the person\'s appearance, only the rendering style to LEGO 3D character.',
    stickerpack: 'Stylize the uploaded photo. Make the result match this style: CRITICAL: Preserve the EXACT person from the original image. Create a sticker-style character illustration based on the uploaded photo. Keep the person\'s main facial features recognizable but simplified into cute, clean shapes. Use bold outlines, bright colors, and minimal shading. Add a white sticker border around the character. Use a transparent background so it can be used as a sticker. Keep IDENTICAL facial features, hair color, hair style, eye color, skin tone, body shape, pose, and clothing. The person must be recognizable as the same individual, just rendered in sticker pack style. Do NOT change the person\'s appearance, only the rendering style to sticker illustration.',
  }

  try {
    // 이미지를 정사각형으로 리사이즈/크롭하고 base64로 변환
    // DALL-E 2는 정사각형 이미지만 지원하므로 정사각형으로 변환 필요
    // 이미지 전처리 개선: 최소 크기 보장, 고품질 스케일링 필터 적용
    const { base64Image, imageSize } = await new Promise<{ base64Image: string; imageSize: number }>((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(imageFile)
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Canvas context를 가져올 수 없습니다.'))
          return
        }
        
        // 정사각형 크기 결정 (더 긴 쪽을 기준으로)
        // 최소 1024x1024 크기 보장 (DALL-E 2 최적 해상도)
        const originalSize = Math.max(img.width, img.height)
        const finalSize = Math.max(originalSize, 1024)
        canvas.width = finalSize
        canvas.height = finalSize
        
        // 고품질 이미지 스케일링 필터 활성화
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // 흰색 배경으로 채우기
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, finalSize, finalSize)
        
        // 이미지를 중앙에 배치 (비율 유지)
        // 원본 이미지가 작은 경우 고품질로 업스케일링
        const offsetX = (finalSize - img.width) / 2
        const offsetY = (finalSize - img.height) / 2
        ctx.drawImage(img, offsetX, offsetY, img.width, img.height)
        
        // base64로 변환 (PNG 최고 품질)
        const base64String = canvas.toDataURL('image/png', 1.0)
        const base64 = base64String.split(',')[1] || base64String
        URL.revokeObjectURL(objectUrl)
        resolve({ base64Image: base64, imageSize: finalSize })
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('이미지 로드 실패'))
      }
      img.src = objectUrl
    })

    // 마스크 이미지 생성 (전체 영역을 편집하기 위한 흰색 마스크)
    // ⚠️ 중요: DALL-E 2 이미지 편집 API는 마스크가 필수입니다!
    // 마스크가 없으면 DALL-E 2는 원본 이미지를 무시하고 프롬프트만으로 새 이미지를 생성합니다.
    const maskImage = await new Promise<string>((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = imageSize
      canvas.height = imageSize
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'))
        return
      }
      
      // 흰색으로 전체 영역 채우기 (전체 이미지 편집)
      // 흰색 영역 = 편집할 영역, 검은색 영역 = 유지할 영역
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // base64로 변환
      const maskBase64 = canvas.toDataURL('image/png').split(',')[1]
      resolve(maskBase64)
    })

    // JSON 방식으로 전송 (백엔드가 FormData를 제대로 처리하지 못할 수 있으므로 JSON 우선)
    // this-is-me-activity는 DALL-E 2 전용 엔드포인트 사용
    try {
      const response = await api.post('/images/generations/dall-e-2', {
        model: 'dall-e-2',
        prompt: stylePrompts[style],
        n: 1,
        size: '1024x1024',
        image: base64Image, // 정사각형으로 변환된 원본 이미지
        mask: maskImage, // 마스크 (필수! 없으면 원본 이미지가 무시됨)
        style: style,
        response_format: 'b64_json', // base64 반환 요청
      }, {
        timeout: 120000,
      })

      console.log('백엔드 응답:', response.data) // 디버깅용

      // 백엔드 응답 구조에 맞게 수정: response.data.data[0].b64_json 또는 response.data.data[0].url
      const imageData = response.data?.data?.[0]
      const b64Json = imageData?.b64_json
      const imageUrl = imageData?.url

      // base64 이미지인 경우 (CORS 문제 없음)
      if (b64Json) {
        console.log('base64 이미지 수신 성공')
        const base64Url = b64Json.startsWith('data:') 
          ? b64Json 
          : `data:image/png;base64,${b64Json}`
        return { imageUrl: base64Url, style }
      }

      // URL인 경우 (백엔드가 response_format을 무시하고 URL을 반환한 경우)
      if (imageUrl) {
        console.warn('백엔드가 base64 대신 URL을 반환했습니다. CORS 문제가 발생할 수 있습니다.')
        // base64로 시작하는 경우
        if (imageUrl.startsWith('data:')) {
          return { imageUrl, style }
        }
        // 외부 URL인 경우 (CORS 문제 가능)
        return { imageUrl, style, needsProxy: true }
      }

      console.error('응답 데이터:', response.data)
      throw new Error('응답에 이미지 URL 또는 base64가 없습니다.')
    } catch (jsonError: any) {
      console.error('JSON 방식 실패:', jsonError)
      
      if (jsonError.response) {
        const status = jsonError.response.status
        const errorData = jsonError.response.data
        
        console.error(`백엔드 응답 상태: ${status}`, errorData)
        
        if (status === 500) {
          console.error('백엔드 서버 오류 (500):', errorData)
          throw new Error('백엔드 서버에서 오류가 발생했습니다. 서버 관리자에게 문의하세요.')
        } else if (status === 400) {
          throw new Error('잘못된 요청입니다. 이미지 파일을 확인해주세요.')
        } else if (status === 404) {
          throw new Error('API 엔드포인트를 찾을 수 없습니다.')
        } else {
          throw new Error(`서버 오류 (${status}): ${JSON.stringify(errorData)}`)
        }
      } else if (jsonError.request) {
        throw new Error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.')
      } else {
        throw new Error(`이미지 생성 중 오류가 발생했습니다: ${jsonError.message}`)
      }
    }
  } catch (error: any) {
    console.error('Image generation error:', error)
    // 이미 Error 객체인 경우 그대로 throw
    if (error instanceof Error) {
      throw error
    }
    // 그 외의 경우 메시지 추출
    const errorMessage = error?.message || '이미지 생성 중 오류가 발생했습니다.'
    throw new Error(errorMessage)
  }
}
