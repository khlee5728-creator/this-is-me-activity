import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import IntroPage from './pages/IntroPage'
import Step1Page from './pages/Step1Page'
import Step2Page from './pages/Step2Page'
import Step3Page from './pages/Step3Page'

function App() {
  useEffect(() => {
    const TARGET_WIDTH = 1280
    const TARGET_HEIGHT = 800

    const updateStageScale = () => {
      const stage = document.getElementById('stage')
      if (!stage) return

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // scale = min(window.innerWidth/1280, window.innerHeight/800)
      const scaleX = viewportWidth / TARGET_WIDTH
      const scaleY = viewportHeight / TARGET_HEIGHT
      const scale = Math.min(scaleX, scaleY)

      // 스케일 적용
      stage.style.transform = `translateX(-50%) scale(${scale})`
      stage.style.transformOrigin = 'top center'
      stage.style.left = '50%'
      stage.style.top = '0'
    }

    const checkScroll = () => {
      const stage = document.getElementById('stage')
      if (!stage) return

      // 실제 내용 크기 확인 (원본 크기 기준)
      const contentWidth = stage.scrollWidth
      const contentHeight = stage.scrollHeight

      // 스크롤 필요 여부 확인
      const needsVerticalScroll = contentHeight > TARGET_HEIGHT + 2
      const needsHorizontalScroll = contentWidth > TARGET_WIDTH + 2

      if (needsVerticalScroll || needsHorizontalScroll) {
        if (!stage.classList.contains('scrollable')) {
          stage.classList.add('scrollable')
        }
      } else {
        if (stage.classList.contains('scrollable')) {
          stage.classList.remove('scrollable')
        }
      }
    }

    // 즉시 실행
    updateStageScale()
    checkScroll()
    
    // 리사이즈 이벤트 리스너 (즉시 반영)
    const handleResize = () => {
      updateStageScale()
      requestAnimationFrame(() => {
        checkScroll()
      })
    }
    
    window.addEventListener('resize', handleResize, { passive: true })

    // MutationObserver로 stage 내부 내용 변경 감지
    const stage = document.getElementById('stage')
    if (stage) {
      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(() => {
          updateStageScale()
          checkScroll()
        })
      })
      
      mutationObserver.observe(stage, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })

      // 초기 스크롤 확인 (여러 시점에서)
      const initCheck = () => {
        updateStageScale()
        requestAnimationFrame(() => {
          checkScroll()
        })
      }
      
      initCheck()
      setTimeout(initCheck, 50)
      setTimeout(initCheck, 200)
      setTimeout(initCheck, 500)

      return () => {
        window.removeEventListener('resize', handleResize)
        mutationObserver.disconnect()
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <BrowserRouter>
      <div id="stage">
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/step1" element={<Step1Page />} />
          <Route path="/step2" element={<Step2Page />} />
          <Route path="/step3" element={<Step3Page />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
