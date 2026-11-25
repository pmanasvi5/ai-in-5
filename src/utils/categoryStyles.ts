import type { NewsCategory } from '../types'

export type CategoryHue = 'accent' | 'coral' | 'teal' | 'amber' | 'plum'

/** Each real-world category gets one of five brand hues; several categories
 * share a hue (five hues cover eight categories), matched loosely by theme
 * rather than assigning every category its own unique, less cohesive color. */
const CATEGORY_HUES: Record<NewsCategory, CategoryHue> = {
  'New Models': 'accent',
  'Tools & Apps': 'teal',
  'Company News': 'amber',
  'Business & Work': 'plum',
  'Policy & Regulation': 'amber',
  'Safety & Security': 'coral',
  Research: 'teal',
  'Health & Education': 'plum',
}

export function categoryHue(category: NewsCategory): CategoryHue {
  return CATEGORY_HUES[category] ?? 'accent'
}

const PILL_CLASSES: Record<CategoryHue, string> = {
  accent: 'bg-accent-light text-accent dark:bg-accent/20 dark:text-accent-dark',
  coral: 'bg-coral-light text-coral dark:bg-coral/20 dark:text-coral-dark',
  teal: 'bg-teal-light text-teal dark:bg-teal/20 dark:text-teal-dark',
  amber: 'bg-amber-light text-amber dark:bg-amber/20 dark:text-amber-dark',
  plum: 'bg-plum-light text-plum dark:bg-plum/20 dark:text-plum-dark',
}

export function categoryPillClass(category: NewsCategory): string {
  return PILL_CLASSES[categoryHue(category)]
}

const BAR_CLASSES: Record<CategoryHue, string> = {
  accent: 'bg-accent',
  coral: 'bg-coral',
  teal: 'bg-teal',
  amber: 'bg-amber',
  plum: 'bg-plum',
}

export function categoryBarClass(category: NewsCategory): string {
  return BAR_CLASSES[categoryHue(category)]
}
