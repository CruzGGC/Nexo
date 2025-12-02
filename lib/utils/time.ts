type ChronoPrecision = 'milliseconds' | 'centiseconds'

interface FormatOptions {
  precision?: ChronoPrecision
}

export function formatChronometer(ms: number, options: FormatOptions = {}): string {
  const { precision = 'centiseconds' } = options
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const fraction = precision === 'milliseconds'
    ? Math.floor(ms % 1000).toString().padStart(3, '0')
    : Math.floor((ms % 1000) / 10).toString().padStart(2, '0')

  return [
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
    fraction,
  ].join(':')
}

/**
 * Format time in milliseconds to mm:ss format
 * Alias for simpler usage
 */
export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format time with centiseconds (mm:ss:cc)
 */
export function formatTimeWithCentiseconds(ms: number): string {
  return formatChronometer(ms, { precision: 'centiseconds' })
}
