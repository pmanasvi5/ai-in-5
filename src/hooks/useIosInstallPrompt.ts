import { useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../utils/storage'
import { isIosSafari } from '../utils/platform'

const DISMISSED_KEY = 'ios-install-banner-dismissed-at'
const RESHOW_AFTER_DAYS = 30

function isStandalone(): boolean {
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** Decides whether to show the "Add to Home Screen" nudge: only on iOS Safari, only when not already installed, and not if recently dismissed. */
export function useIosInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isIosSafari(window.navigator.userAgent, 'MSStream' in window) || isStandalone()) return

    const dismissedAt = readJSON<number | null>(DISMISSED_KEY, null)
    if (dismissedAt) {
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
      if (daysSince < RESHOW_AFTER_DAYS) return
    }

    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    writeJSON(DISMISSED_KEY, Date.now())
    setVisible(false)
  }

  return { visible, dismiss }
}
