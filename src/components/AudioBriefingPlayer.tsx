import { useState } from 'react'
import { Headphones, Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react'
import type { DailyDigest } from '../types'
import { useSpeechBriefing } from '../hooks/useSpeechBriefing'

const SPEEDS = [0.75, 1, 1.25, 1.5]

interface AudioBriefingPlayerProps {
  digest: DailyDigest
}

export function AudioBriefingPlayer({ digest }: AudioBriefingPlayerProps) {
  const [expanded, setExpanded] = useState(false)
  const player = useSpeechBriefing(digest)

  if (!player.supported) return null

  return (
    <div className="card p-4">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-sm font-semibold w-full"
      >
        <Headphones size={16} className="text-accent" />
        Listen to Your 5
        <span className="text-xs text-muted-light dark:text-muted-dark font-normal ml-auto">
          {expanded ? 'Hide' : 'Show'} player
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 mt-3 animate-fade-up">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={player.previousStory}
              aria-label="Previous story"
              className="p-2.5 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5"
            >
              <SkipBack size={18} />
            </button>

            {player.state === 'idle' && (
              <button
                type="button"
                onClick={player.play}
                aria-label="Play"
                className="p-3.5 rounded-full bg-accent text-white hover:brightness-110"
              >
                <Play size={20} fill="currentColor" />
              </button>
            )}
            {player.state === 'playing' && (
              <button
                type="button"
                onClick={player.pause}
                aria-label="Pause"
                className="p-3.5 rounded-full bg-accent text-white hover:brightness-110"
              >
                <Pause size={20} fill="currentColor" />
              </button>
            )}
            {player.state === 'paused' && (
              <button
                type="button"
                onClick={player.resume}
                aria-label="Resume"
                className="p-3.5 rounded-full bg-accent text-white hover:brightness-110"
              >
                <Play size={20} fill="currentColor" />
              </button>
            )}

            <button
              type="button"
              onClick={player.stop}
              aria-label="Stop"
              disabled={player.state === 'idle'}
              className="p-2.5 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5 disabled:opacity-40"
            >
              <Square size={16} />
            </button>

            <button
              type="button"
              onClick={player.nextStory}
              aria-label="Next story"
              className="p-2.5 rounded-full hover:bg-accent-light/40 dark:hover:bg-white/5"
            >
              <SkipForward size={18} />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => player.changeRate(speed)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  player.rate === speed
                    ? 'bg-accent text-white'
                    : 'bg-accent-light/40 dark:bg-white/5 text-muted-light dark:text-muted-dark'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <p className="text-xs text-center text-muted-light dark:text-muted-dark">
            Uses your browser's built-in text-to-speech — voice and quality vary by device.
          </p>
        </div>
      )}
    </div>
  )
}
