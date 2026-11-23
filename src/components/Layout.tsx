import { useState, type ReactNode } from 'react'
import { TopNav, BottomNav } from './Navigation'
import { InstallInstructions } from './InstallInstructions'
import type { ThemeSetting } from '../hooks/useTheme'
import type { UserPreferences } from '../types'

interface LayoutProps {
  children: ReactNode
  isDark: boolean
  themeSetting: ThemeSetting
  onToggleTheme: () => void
  fontSize: UserPreferences['fontSize']
  onSetFontSize: (size: UserPreferences['fontSize']) => void
}

export function Layout({ children, isDark, themeSetting, onToggleTheme, fontSize, onSetFontSize }: LayoutProps) {
  const [showInstall, setShowInstall] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav
        isDark={isDark}
        themeSetting={themeSetting}
        onToggleTheme={onToggleTheme}
        onShowInstall={() => setShowInstall(true)}
        fontSize={fontSize}
        onSetFontSize={onSetFontSize}
      />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-6 pb-24 md:pb-12">{children}</main>
      <BottomNav />
      {showInstall && <InstallInstructions onClose={() => setShowInstall(false)} />}
    </div>
  )
}
