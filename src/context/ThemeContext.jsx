import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({})

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    // Wait for settings to be loaded from SettingsContext
    const checkSettings = () => {
      const savedTheme = localStorage.getItem('theme') // Changed from 'nephra-theme' to match SettingsContext
      if (savedTheme) {
        setSettingsLoaded(true)
        if (savedTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const systemTheme = prefersDark ? 'dark' : 'light'
          setTheme(systemTheme)
          applyTheme(systemTheme)
        } else {
          setTheme(savedTheme)
          applyTheme(savedTheme)
        }
      } else {
        // Fallback if settings not loaded yet
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const initialTheme = prefersDark ? 'dark' : 'light'
        setTheme(initialTheme)
        applyTheme(initialTheme)
      }
    }

    // Check immediately
    checkSettings()

    // Listen for storage changes (when settings are updated)
    window.addEventListener('storage', checkSettings)
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'system' || !savedTheme) {
        const systemTheme = e.matches ? 'dark' : 'light'
        setTheme(systemTheme)
        applyTheme(systemTheme)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('storage', checkSettings)
    }
  }, [])

  const applyTheme = (newTheme) => {
    const root = document.documentElement
    const isDark = newTheme === 'dark'
    
    root.classList.toggle('dark', isDark)
    root.setAttribute('data-theme', newTheme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1f2937' : '#ffffff')
    }
  }

  const toggleTheme = () => {
    // Check if dark mode is enabled in settings
    const enableDarkMode = localStorage.getItem('enable_dark_mode')
    if (enableDarkMode === 'false') {
      // Dark mode is disabled, don't allow toggle
      return
    }
    
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const setLightTheme = () => {
    setTheme('light')
    localStorage.setItem('nephra-theme', 'light')
    applyTheme('light')
  }

  const setDarkTheme = () => {
    setTheme('dark')
    localStorage.setItem('nephra-theme', 'dark')
    applyTheme('dark')
  }

  const setSystemTheme = () => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(systemTheme)
    localStorage.removeItem('nephra-theme')
    applyTheme(systemTheme)
  }

  const value = {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
