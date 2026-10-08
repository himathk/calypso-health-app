export interface ActivityType {
  id: string;
  name: string;
  emoji: string;
  /** Metabolic equivalent at moderate intensity (Compendium of Physical Activities). */
  met: number;
  color: 'aqua' | 'violet' | 'coral' | 'peach' | 'lime' | 'sun';
  defaultMinutes: number;
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { id: 'walk-break', name: 'Desk walk break', emoji: '🚶', met: 3.0, color: 'violet', defaultMinutes: 3 },
  { id: 'walk', name: 'Walking', emoji: '🚶‍♀️', met: 3.5, color: 'violet', defaultMinutes: 30 },
  { id: 'brisk-walk', name: 'Brisk walk', emoji: '⚡', met: 4.3, color: 'violet', defaultMinutes: 30 },
  { id: 'stairs', name: 'Stair climbing', emoji: '🪜', met: 8.0, color: 'coral', defaultMinutes: 5 },
  { id: 'run', name: 'Running', emoji: '🏃', met: 9.8, color: 'coral', defaultMinutes: 30 },
  { id: 'jog', name: 'Jogging', emoji: '👟', met: 7.0, color: 'coral', defaultMinutes: 25 },
  { id: 'cycle', name: 'Cycling', emoji: '🚴', met: 7.5, color: 'sun', defaultMinutes: 40 },
  { id: 'spin', name: 'Stationary bike', emoji: '🚲', met: 6.8, color: 'sun', defaultMinutes: 30 },
  { id: 'strength', name: 'Strength training', emoji: '🏋️', met: 5.0, color: 'peach', defaultMinutes: 45 },
  { id: 'hiit', name: 'HIIT', emoji: '🔥', met: 8.0, color: 'coral', defaultMinutes: 20 },
  { id: 'yoga', name: 'Yoga', emoji: '🧘', met: 2.5, color: 'lime', defaultMinutes: 30 },
  { id: 'pilates', name: 'Pilates', emoji: '🤸', met: 3.0, color: 'lime', defaultMinutes: 40 },
  { id: 'stretch', name: 'Desk stretches', emoji: '🙆', met: 2.3, color: 'lime', defaultMinutes: 5 },
  { id: 'swim', name: 'Swimming', emoji: '🏊', met: 6.0, color: 'aqua', defaultMinutes: 30 },
  { id: 'dance', name: 'Dancing', emoji: '💃', met: 5.0, color: 'peach', defaultMinutes: 30 },
  { id: 'football', name: 'Football', emoji: '⚽', met: 7.0, color: 'lime', defaultMinutes: 60 },
  { id: 'cricket', name: 'Cricket', emoji: '🏏', met: 4.8, color: 'lime', defaultMinutes: 60 },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', met: 5.5, color: 'sun', defaultMinutes: 45 },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', met: 7.3, color: 'sun', defaultMinutes: 45 },
  { id: 'hike', name: 'Hiking', emoji: '🥾', met: 6.0, color: 'violet', defaultMinutes: 90 },
  { id: 'rope', name: 'Jump rope', emoji: '🪢', met: 11.0, color: 'coral', defaultMinutes: 10 },
  { id: 'elliptical', name: 'Elliptical', emoji: '🌀', met: 5.0, color: 'aqua', defaultMinutes: 30 },
  { id: 'rowing', name: 'Rowing', emoji: '🚣', met: 7.0, color: 'aqua', defaultMinutes: 20 },
  { id: 'chores', name: 'Housework', emoji: '🧹', met: 3.0, color: 'peach', defaultMinutes: 30 },
  { id: 'garden', name: 'Gardening', emoji: '🌱', met: 3.8, color: 'lime', defaultMinutes: 45 },
];

export const INTENSITY = [
  { id: 'easy', label: 'Easy', factor: 0.8 },
  { id: 'moderate', label: 'Moderate', factor: 1 },
  { id: 'hard', label: 'Hard', factor: 1.25 },
] as const;
export type IntensityId = (typeof INTENSITY)[number]['id'];

/**
 * Active calories above resting: (MET − 1) × kg × hours.
 * Subtracting the resting MET avoids double counting what the BMR already covers.
 */
export function activeCalories(met: number, weightKg: number, minutes: number, intensityFactor = 1): number {
  const effective = Math.max(1, met * intensityFactor);
  return Math.round((effective - 1) * weightKg * (minutes / 60));
}

export function activityById(id: string): ActivityType {
  return ACTIVITY_TYPES.find((a) => a.id === id) ?? ACTIVITY_TYPES[1];
}
