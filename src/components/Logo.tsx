interface LogoProps {
  size?: number
  withWordmark?: boolean
}

/** The AI in 5 mark: a soft rounded tile with a five-point "spark" motif, standing in for the five daily stories. */
export function Logo({ size = 32, withWordmark = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="#8B7CE8" />
        <path
          d="M20 9 L23.2 17.4 L32 20 L23.2 22.6 L20 31 L16.8 22.6 L8 20 L16.8 17.4 Z"
          fill="#FAF9F6"
        />
      </svg>
      {withWordmark && (
        <span className="font-bold text-lg tracking-tight text-ink-light dark:text-ink-dark">
          AI in 5
        </span>
      )}
    </div>
  )
}
