const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g

/**
 * Removes Portuguese diacritics by normalizing to NFD and stripping combining marks.
 * Based on MDN String.prototype.normalize documentation for consistent Unicode handling.
 */
export function normalizeDiacritics(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS_REGEX, '')
}

/**
 * Normalizes for crossword comparisons: uppercase + diacritic stripping.
 */
export function normalizeForComparison(value: string): string {
  return normalizeDiacritics(value).toUpperCase()
}

/**
 * Checks equality ignoring diacritics/case differences.
 */
export function equalsNormalized(a: string, b: string): boolean {
  return normalizeForComparison(a) === normalizeForComparison(b)
}
