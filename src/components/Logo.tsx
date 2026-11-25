interface LogoProps {
  size?: number
  withWordmark?: boolean
}

/**
 * The AI in 5 mark: a bold numeral 5 on an electric-blue tile, with a coral
 * accent dot standing in for a speech-bubble tail — "five stories,
 * explained simply," without the brain/robot/circuit AI cliches.
 */
export function Logo({ size = 32, withWordmark = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="10.5" fill="#1E46E6" />
        <text
          x="17"
          y="29"
          textAnchor="middle"
          fontFamily="'DM Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="24"
          fill="#FDF9F2"
        >
          5
        </text>
        <circle cx="27.5" cy="27.5" r="4" fill="#FF6B4A" />
      </svg>
      {withWordmark && (
        <span className="font-display font-semibold text-lg tracking-tight text-ink-light dark:text-ink-dark">
          AI in <span className="text-accent dark:text-accent-dark">5</span>
        </span>
      )}
    </div>
  )
}
