import { useCallback, useEffect, useState } from 'react'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

export type ThemeSetting = 'light' | 'dark' | 'system'

function resolveIsDark(setting: ThemeSetting): boolean {
  if (setting === 'dark') return true
  if (setting === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTheme() {
  const [setting, setSetting] = useState<ThemeSetting>(() =>
    readJSON<ThemeSetting>(STORAGE_KEYS.theme, 'system'),
  )
  const [isDark, setIsDark] = useState(() => resolveIsDark(setting))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    if (setting !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setIsDark(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [setting])

  const updateSetting = useCallback((next: ThemeSetting) => {
    setSetting(next)
    writeJSON(STORAGE_KEYS.theme, next)
    setIsDark(resolveIsDark(next))
  }, [])

  const toggle = useCallback(() => {
    updateSetting(isDark ? 'light' : 'dark')
  }, [isDark, updateSetting])

  return { setting, isDark, setSetting: updateSetting, toggle }
}
