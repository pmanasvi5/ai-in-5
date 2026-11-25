import { useCallback, useEffect, useRef, useState } from 'react'
import type { DailyDigest } from '../types'

export type PlaybackState = 'idle' | 'playing' | 'paused'

function buildSegments(digest: DailyDigest): string[] {
  const intro = `Here's your AI in 5 briefing for ${digest.digestDate}. ${digest.stories.length} stories today.`
  const storySegments = digest.stories.map((story, i) => {
    const parts = [`Story ${i + 1}. ${story.headline}.`]
    if (story.quickScoop) parts.push(story.quickScoop)
    parts.push(`Why it matters: ${story.whyItMatters}`)
    return parts.join(' ')
  })
  const closing = "That's your five for today. Stay curious."
  return [intro, ...storySegments, closing]
}

/**
 * Drives a simple "Listen to Your 5" player using the browser's built-in
 * Speech Synthesis API -- zero cost, no audio files to generate or host.
 * Segments are: intro, one combined utterance per story (headline + quick
 * scoop + why it matters), then a closing line. "Next/previous story"
 * jumps between story segments, skipping the intro/closing bookends.
 */
export function useSpeechBriefing(digest: DailyDigest | null) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [state, setState] = useState<PlaybackState>('idle')
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [rate, setRate] = useState(1)
  const segmentsRef = useRef<string[]>([])
  const rateRef = useRef(1)
  rateRef.current = rate

  useEffect(() => {
    segmentsRef.current = digest ? buildSegments(digest) : []
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digest])

  const speakFrom = useCallback(
    (index: number) => {
      if (!supported) return
      const segments = segmentsRef.current
      if (index < 0 || index >= segments.length) {
        setState('idle')
        return
      }
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(segments[index])
      utterance.rate = rateRef.current
      utterance.onend = () => {
        setSegmentIndex((prev) => {
          const next = prev + 1
          if (next < segmentsRef.current.length) {
            speakFrom(next)
            return next
          }
          setState('idle')
          return 0
        })
      }
      utterance.onerror = () => setState('idle')
      setSegmentIndex(index)
      setState('playing')
      window.speechSynthesis.speak(utterance)
    },
    [supported],
  )

  const play = useCallback(() => speakFrom(0), [speakFrom])

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setState('paused')
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.resume()
    setState('playing')
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSegmentIndex(0)
    setState('idle')
  }, [supported])

  const nextStory = useCallback(() => {
    // Segment 0 is the intro, so story N is at index N; clamp to the last story.
    const lastStoryIndex = segmentsRef.current.length - 2
    speakFrom(Math.min(segmentIndex + 1, lastStoryIndex))
  }, [segmentIndex, speakFrom])

  const previousStory = useCallback(() => {
    speakFrom(Math.max(segmentIndex - 1, 1))
  }, [segmentIndex, speakFrom])

  const changeRate = useCallback(
    (newRate: number) => {
      setRate(newRate)
      if (state === 'playing') speakFrom(segmentIndex) // restart current segment at the new rate
    },
    [state, segmentIndex, speakFrom],
  )

  return { supported, state, segmentIndex, rate, play, pause, resume, stop, nextStory, previousStory, changeRate }
}
