export interface WorkoutType {
  id: string
  label: string
  emoji: string
  met: number
}

export const WORKOUT_TYPES: WorkoutType[] = [
  { id: 'running',    label: 'Running',    emoji: '🏃', met: 8.0 },
  { id: 'walking',    label: 'Walking',    emoji: '🚶', met: 3.5 },
  { id: 'cycling',    label: 'Cycling',    emoji: '🚴', met: 7.0 },
  { id: 'swimming',   label: 'Swimming',   emoji: '🏊', met: 7.0 },
  { id: 'hiit',       label: 'HIIT',       emoji: '⚡', met: 8.0 },
  { id: 'strength',   label: 'Strength',   emoji: '🏋️', met: 5.0 },
  { id: 'yoga',       label: 'Yoga',       emoji: '🧘', met: 3.0 },
  { id: 'pilates',    label: 'Pilates',    emoji: '🤸', met: 3.5 },
  { id: 'hiking',     label: 'Hiking',     emoji: '🥾', met: 6.0 },
  { id: 'elliptical', label: 'Elliptical', emoji: '🔄', met: 5.0 },
  { id: 'rowing',     label: 'Rowing',     emoji: '🚣', met: 7.0 },
  { id: 'dance',      label: 'Dance',      emoji: '💃', met: 4.5 },
  { id: 'boxing',     label: 'Boxing',     emoji: '🥊', met: 8.0 },
  { id: 'tennis',     label: 'Tennis',     emoji: '🎾', met: 6.0 },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', met: 6.5 },
  { id: 'soccer',     label: 'Soccer',     emoji: '⚽', met: 7.0 },
  { id: 'core',       label: 'Core',       emoji: '💪', met: 4.0 },
]

/** Estimate calories burned: MET × weight_kg × hours */
export function estimateCalories(met: number, weightKg: number, durationMinutes: number): number {
  return Math.round(met * weightKg * (durationMinutes / 60))
}
