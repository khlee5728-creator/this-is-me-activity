import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserInfo, ImageStyle } from '../types'
import { generateIntroduction } from '../services/api'

export default function Step2Page() {
  const location = useLocation()
  const navigate = useNavigate()
  const userInfo = location.state?.userInfo as UserInfo
  
  const [introduction, setIntroduction] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // TTS 및 녹음 관련 상태
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasGeneratedRef = useRef(false)

  const styles: { value: ImageStyle; label: string }[] = [
    { value: 'pixar', label: 'Pixar' },
    { value: 'pixelart', label: 'Pixel Art' },
    { value: 'superhero', label: 'Super Hero' },
    { value: 'lego', label: 'Lego' },
    { value: 'stickerpack', label: 'Sticker Pack' },
    { value: 'disney', label: 'Disney' },
  ]

  // 컴포넌트 마운트 시 자기소개 글 생성
  useEffect(() => {
    // 이미 생성했으면 실행하지 않음
    if (hasGeneratedRef.current) {
      return
    }

    const generateIntro = async () => {
      if (!userInfo) return
      
      hasGeneratedRef.current = true
      setIsGenerating(true)
      setError(null)
      
      try {
        const result = await generateIntroduction(userInfo)
        setIntroduction(result.introduction)
      } catch (err: any) {
        console.error('Introduction generation error:', err)
        setError('자기소개 글 생성 중 오류가 발생했습니다.')
        hasGeneratedRef.current = false // 에러 시 다시 시도 가능하도록
      } finally {
        setIsGenerating(false)
      }
    }

    generateIntro()
  }, [userInfo])

  // TTS 및 녹음 관련 함수
  useEffect(() => {
    synthRef.current = window.speechSynthesis
    
    return () => {
      // 컴포넌트 언마운트 시 TTS 중지
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const handlePlay = () => {
    if (!introduction) return

    if (isPlaying) {
      // 일시정지
      if (synthRef.current) {
        synthRef.current.pause()
      }
      setIsPlaying(false)
    } else {
      // 재생
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(introduction)
        utterance.lang = 'en-US'
        utterance.rate = 0.9 // 초등학생에게 적합한 속도
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
        utterance.onend = () => {
          setIsPlaying(false)
          if (isRecording) {
            handleStopRecording()
          }
        }
        
        utterance.onerror = () => {
          setIsPlaying(false)
          if (isRecording) {
            handleStopRecording()
          }
        }
        
        utteranceRef.current = utterance
        synthRef.current.speak(utterance)
        setIsPlaying(true)
      }
    }
  }

  const handleStartRecording = async () => {
    try {
      // 오디오 스트림 캡처 (시스템 오디오 + 마이크)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: false,
      }).catch(async () => {
        // getDisplayMedia가 실패하면 마이크만 사용
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        })
      })

      audioChunksRef.current = []
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordedAudioUrl(audioUrl)
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      // TTS 재생 시작
      if (!isPlaying) {
        handlePlay()
      }
    } catch (error) {
      console.error('Recording error:', error)
      alert('녹음 기능을 사용할 수 없습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    
    // TTS 중지
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsPlaying(false)
    }
  }

  const handlePlayRecording = () => {
    if (!recordedAudioUrl) return

    if (audioRef.current) {
      if (isPlayingRecording) {
        // 일시정지
        audioRef.current.pause()
        setIsPlayingRecording(false)
      } else {
        // 재생
        audioRef.current.play()
        setIsPlayingRecording(true)
      }
    }
  }

  // 녹음된 오디오 재생 완료 시 상태 업데이트
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      setIsPlayingRecording(false)
    }

    const handlePause = () => {
      setIsPlayingRecording(false)
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('pause', handlePause)
    }
  }, [recordedAudioUrl])

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSubmit = () => {
    if (!introduction) {
      setError('자기소개 글을 생성해주세요')
      return
    }

    if (!selectedStyle) {
      setError('캐릭터 스타일을 선택해주세요')
      return
    }

    navigate('/step3', {
      state: {
        userInfo,
        introduction,
        selectedStyle,
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
      <div className="w-full mx-auto flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6 max-w-[1200px] mx-auto w-full">
          <div className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md">
            Step 2
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-black">
            Read your introduction
          </h1>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 min-h-0 mb-4 grid grid-cols-2 gap-4 max-w-[1200px] mx-auto w-full">
          {/* 왼쪽: AI 생성 자기소개 글 섹션 */}
          <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-lg flex flex-col h-full min-w-0">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-orange-700 mb-2">
                  Read the text below, then record yourself reading it out loud.
                </p>
                <p className="text-base font-semibold text-orange-700">
                  The AI will listen to your reading and create your character image!
                </p>
              </div>
            </div>
            <div className="flex-1 border-2 border-orange-200 rounded-xl p-4 bg-orange-50 overflow-y-auto min-h-[300px] mb-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                  <svg className="animate-spin h-8 w-8 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-orange-500 font-medium">Creating your introduction...</p>
                </div>
              ) : introduction ? (
                <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap break-words">
                  {introduction}
                </p>
              ) : (
                <p className="text-gray-400 text-center min-h-[300px] flex items-center justify-center">Failed to generate introduction.</p>
              )}
            </div>
            {!isGenerating && introduction && (
              <div className="flex justify-center items-center gap-2">
                {/* 재생/일시정지 버튼 */}
                <button
                  onClick={handlePlay}
                  disabled={!introduction}
                  className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-200 active:scale-95"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                
                {/* 녹음 버튼 */}
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={!introduction || isPlaying}
                    className="w-10 h-10 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-200 active:scale-95"
                    aria-label="Start Recording"
                    title="Start Recording"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="w-10 h-10 bg-orange-700 hover:bg-orange-800 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-200 active:scale-95 animate-pulse"
                    aria-label="Stop Recording"
                    title="Stop Recording"
                  >
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  </button>
                )}
                
                {/* 녹음 재생 버튼 */}
                {recordedAudioUrl && !isRecording && (
                  <>
                    <audio
                      ref={audioRef}
                      src={recordedAudioUrl}
                      onEnded={() => setIsPlayingRecording(false)}
                    />
                    <button
                      onClick={handlePlayRecording}
                      className="w-10 h-10 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-200 active:scale-95"
                      aria-label={isPlayingRecording ? 'Pause Recording' : 'Play Recording'}
                      title={isPlayingRecording ? 'Pause Recording' : 'Play Recording'}
                    >
                      {isPlayingRecording ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 오른쪽: 영상 및 Character Style 선택 섹션 */}
          <div className="flex flex-col gap-2 h-full min-w-0">
            {/* 상단: 영상 영역 */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="relative group" style={{ width: '100%', maxWidth: '420px' }}>
                {/* 타원형 프레임 */}
                <div 
                  className="w-full overflow-hidden shadow-2xl"
                  style={{ 
                    aspectRatio: '16/9',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 50%, #FFD9A5 100%)'
                  }}
                >
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ 
                      display: 'block'
                    }}
                    autoPlay
                    muted={isMuted}
                    loop
                  >
                    <source src="/videos/step2-video.mp4.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                {/* 음소거 버튼 */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <button
                    onClick={toggleMute}
                    className="w-12 h-12 bg-yellow-400 hover:bg-yellow-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all duration-200 active:scale-95"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.117-.13zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.117-.13zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 하단: Character Style 선택 섹션 */}
            <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-lg flex flex-col flex-1 min-h-0">
              <h2 className="text-lg font-bold text-orange-700 mb-4">Select a style for your character image</h2>
              <div className="flex-1 border-2 border-orange-200 rounded-xl p-4 bg-orange-50 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
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
                      disney: (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ),
                    }
                    return (
                      <button
                        key={style.value}
                        onClick={() => setSelectedStyle(style.value)}
                        className={`w-full py-2 px-3 rounded-xl font-semibold text-left transition-all duration-200 flex items-center gap-2 text-xs ${
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
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Next 버튼 */}
        <div className="flex justify-end pt-4 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !introduction || !selectedStyle}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-10 rounded-xl text-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95 disabled:transform-none"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
