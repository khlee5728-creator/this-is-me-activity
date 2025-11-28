import axios from 'axios'

// 개발 환경에서는 프록시를 통해 /api로 요청, 프로덕션에서는 절대 URL 사용
const backendUrl = import.meta.env.PROD 
  ? 'https://playground.ils.ai.kr/api'
  : '/api'

export const api = axios.create({
  baseURL: backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// OpenAI Chat Completions API를 통한 문항 옵션 생성 (5개씩 생성)
export const generateQuestionOptions = async (type: 'color' | 'food' | 'hobby') => {
  const prompts = {
    color: 'Generate exactly 5 different simple English color names for elementary students. Return only a JSON array with exactly 5 color names. Example format: ["red", "blue", "green", "yellow", "purple"]',
    food: 'Generate exactly 5 different simple English food names for elementary students. Return only a JSON array with exactly 5 food names. Example format: ["pizza", "apple", "ice cream", "hamburger", "banana"]',
    hobby: 'Generate exactly 5 different simple English hobby/activity phrases for elementary students. Return only a JSON array with exactly 5 phrases. Example format: ["reading books", "playing soccer", "drawing pictures", "singing songs", "dancing"]',
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
    }
    return { options: defaults[type] || [] }
  }
}

// OpenAI Images Generations API를 통한 이미지 스타일 변환
export const transformImage = async (
  imageFile: File,
  style: 'cartoon' | 'fairytale' | 'superhero' | 'lego' | 'fantasy'
) => {
  const stylePrompts = {
    cartoon: 'Using the uploaded image as the base reference, transform it into a vibrant cartoon style suitable for children. CRITICAL: The output must be a stylized transformation of the EXACT same person in the uploaded image. Preserve: exact facial features, facial structure, face shape, eye color, hair color and style, pose, body position, clothing, background, and all compositional elements. Do NOT create a new person or different image. The result should look like the same person from the uploaded photo, but drawn in cartoon style.',
    fairytale: 'Using the uploaded image as the base reference, transform it into a beautiful fairy tale illustration style. CRITICAL: The output must be a stylized transformation of the EXACT same person in the uploaded image. Preserve: exact facial features, facial structure, face shape, eye color, hair color and style, pose, body position, clothing, background, and all compositional elements. Do NOT create a new person or different image. The result should look like the same person from the uploaded photo, but drawn in fairy tale illustration style.',
    superhero: 'Using the uploaded image as the base reference, transform it into a superhero comic book style. CRITICAL: The output must be a stylized transformation of the EXACT same person in the uploaded image. Preserve: exact facial features, facial structure, face shape, eye color, hair color and style, pose, body position, clothing, background, and all compositional elements. Do NOT create a new person or different image. The result should look like the same person from the uploaded photo, but drawn in superhero comic book style.',
    lego: 'Using the uploaded image as the base reference, transform it into a LEGO brick minifigure style. CRITICAL: The output must be a stylized transformation of the EXACT same person in the uploaded image. Preserve: exact facial features, facial structure, face shape, eye color, hair color and style, pose, body position, clothing, background, and all compositional elements. Do NOT create a new person or different image. The result should look like the same person from the uploaded photo, but rendered in LEGO minifigure style.',
    fantasy: 'Using the uploaded image as the base reference, transform it into a fantasy art style. CRITICAL: The output must be a stylized transformation of the EXACT same person in the uploaded image. Preserve: exact facial features, facial structure, face shape, eye color, hair color and style, pose, body position, clothing, background, and all compositional elements. Do NOT create a new person or different image. The result should look like the same person from the uploaded photo, but drawn in fantasy art style.',
  }

  try {
    // 이미지를 base64로 변환
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        const base64 = base64String.split(',')[1] || base64String
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })

    // JSON 방식으로 전송 (백엔드가 FormData를 제대로 처리하지 못할 수 있으므로 JSON 우선)
    try {
      const response = await api.post('/images/generations', {
        model: 'dall-e-3',
        prompt: stylePrompts[style],
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        image: base64Image,
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
