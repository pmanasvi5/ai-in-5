const EDITORIAL_TZ = 'America/New_York'

/** Today's editorial date (America/New_York) as YYYY-MM-DD, handling EST/EDT automatically via Intl. */
export function editorialToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: EDITORIAL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function formatDigestDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD with no time component, so parse it as a local
  // calendar date rather than letting the Date constructor apply UTC offset.
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function formatPublishedAt(iso: string, source: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return source
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${source} · ${formatted}`
}

export function formatRelativeUpdate(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'unknown'
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

export function formatLearnedDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
