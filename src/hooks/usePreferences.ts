import { useCallback, useEffect, useState } from 'react'
import type { UserPreferences } from '../types'
import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage'

const DEFAULTS: UserPreferences = { theme: 'system', fontSize: 'medium' }

const FONT_SIZE_PX: Record<UserPreferences['fontSize'], string> = {
  small: '15px',
  medium: '16px',
  large: '18px',
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    readJSON<UserPreferences>(STORAGE_KEYS.preferences, DEFAULTS),
  )

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_PX[preferences.fontSize]
  }, [preferences.fontSize])

  const setFontSize = useCallback((fontSize: UserPreferences['fontSize']) => {
    setPreferences((prev) => {
      const next = { ...prev, fontSize }
      writeJSON(STORAGE_KEYS.preferences, next)
      return next
    })
  }, [])

  return { preferences, setFontSize }
}
