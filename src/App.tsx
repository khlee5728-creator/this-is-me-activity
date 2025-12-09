import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { initScaling } from './utils/scaling'
import IntroPage from './pages/IntroPage'
import Step1Page from './pages/Step1Page'
import Step2Page from './pages/Step2Page'
import Step3Page from './pages/Step3Page'

function App() {
  useEffect(() => {
    const TARGET_WIDTH = 1280
    const TARGET_HEIGHT = 800

    // 스케일링 시스템 초기화
    initScaling({
      designWidth: TARGET_WIDTH,
      designHeight: TARGET_HEIGHT,
      containerId: 'stage',
      enableLog: false, // 프로덕션에서는 false
    })

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

    // 초기 스크롤 확인
    checkScroll()
    
    // 리사이즈 이벤트 리스너 (스크롤 체크만)
    const handleResize = () => {
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
