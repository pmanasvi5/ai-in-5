import { NavLink } from 'react-router-dom'
import { Newspaper, GraduationCap, Bookmark, Archive, Download, Sun, Moon, Type } from 'lucide-react'
import { Logo } from './Logo'
import type { ThemeSetting } from '../hooks/useTheme'
import type { UserPreferences } from '../types'

const DESTINATIONS = [
  { to: '/', label: 'Today', icon: Newspaper },
  { to: '/learn', label: 'Learn AI', icon: GraduationCap },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/archive', label: 'Explore', icon: Archive },
]

const FONT_SIZE_CYCLE: UserPreferences['fontSize'][] = ['small', 'medium', 'large']

interface NavProps {
  isDark: boolean
  onToggleTheme: () => void
  themeSetting: ThemeSetting
  onShowInstall: () => void
  fontSize: UserPreferences['fontSize']
  onSetFontSize: (size: UserPreferences['fontSize']) => void
}

export function TopNav({ isDark, onToggleTheme, onShowInstall, fontSize, onSetFontSize }: NavProps) {
  function cycleFontSize() {
    const nextIndex = (FONT_SIZE_CYCLE.indexOf(fontSize) + 1) % FONT_SIZE_CYCLE.length
    onSetFontSize(FONT_SIZE_CYCLE[nextIndex])
  }
  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border-light dark:border-border-dark sticky top-0 bg-bg-light/90 dark:bg-bg-dark/90 backdrop-blur-sm z-30">
      <Logo withWordmark size={30} />
      <nav className="hidden md:flex items-center gap-1">
        {DESTINATIONS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'text-muted-light dark:text-muted-dark hover:bg-accent-light/40 dark:hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-1">
        <button
          onClick={cycleFontSize}
          aria-label={`Text size: ${fontSize}. Tap to change.`}
          title={`Text size: ${fontSize}`}
          className="p-2 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5 transition-colors"
        >
          <Type size={20} />
        </button>
        <button
          onClick={onShowInstall}
          aria-label="Install AI in 5"
          title="Install app"
          className="p-2 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5 transition-colors"
        >
          <Download size={20} />
        </button>
        <button
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5 transition-colors"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}

export function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-sm border-t border-border-light dark:border-border-dark safe-bottom"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around">
        {DESTINATIONS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-xs font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-muted-light dark:text-muted-dark'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
