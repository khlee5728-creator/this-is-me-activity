import { useEffect, useState } from 'react'

export function useScale() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const targetWidth = 1280
      const targetHeight = 800

      const scaleX = viewportWidth / targetWidth
      const scaleY = viewportHeight / targetHeight
      const newScale = Math.min(scaleX, scaleY, 1) // 1보다 크게 확대하지 않음

      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
    }
  }, [])

  return scale
}

