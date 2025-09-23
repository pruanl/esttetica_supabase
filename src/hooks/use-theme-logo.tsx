import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import logo from '@/assets/images/logo.png'
import logoDark from '@/assets/images/logo_dark.png'

export function useThemeLogo() {
  const { theme } = useTheme()
  
  // Função para determinar a logo correta
  const getCorrectLogo = () => {
    const root = window.document.documentElement
    const isDark = root.classList.contains('dark')
    
    return isDark ? logoDark : logo
  }
  
  const [currentLogo, setCurrentLogo] = useState(getCorrectLogo)

  useEffect(() => {
    const updateLogo = () => {
      const root = window.document.documentElement
      const isDark = root.classList.contains('dark')
      
      setCurrentLogo(isDark ? logoDark : logo)
    }

    // Atualizar logo imediatamente
    updateLogo()

    // Observar mudanças na classe do documento
    const observer = new MutationObserver(updateLogo)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      observer.disconnect()
    }
  }, [theme])

  return currentLogo
}