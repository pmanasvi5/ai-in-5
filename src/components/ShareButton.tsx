import { useState } from 'react'
import { Share, Check, Link as LinkIcon } from 'lucide-react'

interface ShareButtonProps {
  title: string
  url: string
  className?: string
}

export function ShareButton({ title, url, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled the native share sheet; no action needed.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard unavailable; nothing more we can do silently.
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={hasNativeShare ? 'Share this story' : 'Copy link to this story'}
      className={`flex items-center gap-1.5 text-sm text-muted-light dark:text-muted-dark hover:text-accent transition-colors ${className ?? ''}`}
    >
      {copied ? <Check size={16} /> : hasNativeShare ? <Share size={16} /> : <LinkIcon size={16} />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
