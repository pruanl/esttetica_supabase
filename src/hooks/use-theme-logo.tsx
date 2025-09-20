import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import logo from '@/assets/images/logo.png'
import logoDark from '@/assets/images/logo_dark.png'

export function useThemeLogo() {
  const { theme } = useTheme()
  const [currentLogo, setCurrentLogo] = useState(logo)

  useEffect(() => {
    const updateLogo = () => {
      const root = window.document.documentElement
      const isDark = root.classList.contains('dark') || 
                    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      
      setCurrentLogo(isDark ? logoDark : logo)
    }

    // Atualizar logo imediatamente
    updateLogo()

    // Observar mudanças no tema do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => updateLogo()
    
    mediaQuery.addEventListener('change', handleChange)
    
    // Observar mudanças na classe do documento
    const observer = new MutationObserver(updateLogo)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      observer.disconnect()
    }
  }, [theme])

  return currentLogo
}