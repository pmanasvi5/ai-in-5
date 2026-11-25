import { Award, Lock } from 'lucide-react'
import { computeMilestones } from '../utils/milestones'

interface LearningDashboardProps {
  termsLearned: number
  challengesCompleted: number
  activitiesCompleted: number
  everCompletedFullBriefing: boolean
}

export function LearningDashboard({
  termsLearned,
  challengesCompleted,
  activitiesCompleted,
  everCompletedFullBriefing,
}: LearningDashboardProps) {
  const milestones = computeMilestones({ termsLearned, challengesCompleted, everCompletedFullBriefing })
  const achievedCount = milestones.filter((m) => m.achieved).length

  return (
    <div className="card p-5 flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-light dark:text-muted-dark">
        Your learning so far
      </p>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="font-display text-2xl font-semibold">{termsLearned}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark">Terms learned</p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold">{challengesCompleted}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark">Challenges done</p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold">{activitiesCompleted}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark">Activities tried</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-light dark:text-muted-dark mb-2">
          Milestones ({achievedCount}/{milestones.length})
        </p>
        <div className="grid grid-cols-2 gap-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${
                m.achieved
                  ? 'bg-teal-light dark:bg-teal/10 text-ink-light dark:text-ink-dark'
                  : 'bg-bg-light dark:bg-white/5 text-muted-light dark:text-muted-dark'
              }`}
            >
              {m.achieved ? (
                <Award size={14} className="text-teal shrink-0" />
              ) : (
                <Lock size={12} className="shrink-0 opacity-50" />
              )}
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
