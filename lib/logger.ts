/**
 * Logger configurável por ambiente
 * 
 * Comportamento:
 * - Desenvolvimento: Todos os níveis visíveis
 * - Produção: Apenas warn e error visíveis
 * - Formato estruturado com timestamp e contexto
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  requestId?: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const isDev = process.env.NODE_ENV === 'development'
const isServer = typeof window === 'undefined'

// Em produção, só mostra warn e error
// Em desenvolvimento, mostra tudo
const minLevel: LogLevel = isDev ? 'debug' : 'warn'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function formatMessage(entry: LogEntry): string {
  const prefix = entry.requestId ? `[${entry.requestId}]` : ''
  return `${prefix} ${entry.message}`.trim()
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  requestId?: string
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: formatTimestamp(),
    requestId
  }
}

/**
 * Logger principal
 * 
 * @example
 * // Log simples
 * logger.info('Utilizador autenticado')
 * 
 * // Log com contexto
 * logger.info('Puzzle carregado', { puzzleId: '123', mode: 'daily' })
 * 
 * // Log com request ID (útil para tracing)
 * const log = logger.withRequestId('req-abc123')
 * log.info('A processar pedido')
 */
export const logger = {
  debug(message: string, context?: LogContext) {
    if (!shouldLog('debug')) return
    const entry = createLogEntry('debug', message, context)
    console.debug(`[DEBUG] ${formatMessage(entry)}`, context || '')
  },

  info(message: string, context?: LogContext) {
    if (!shouldLog('info')) return
    const entry = createLogEntry('info', message, context)
    console.info(`[INFO] ${formatMessage(entry)}`, context || '')
  },

  warn(message: string, context?: LogContext) {
    if (!shouldLog('warn')) return
    const entry = createLogEntry('warn', message, context)
    console.warn(`[WARN] ${formatMessage(entry)}`, context || '')
  },

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!shouldLog('error')) return
    
    const errorContext: LogContext = { ...context }
    
    if (error instanceof Error) {
      errorContext.errorMessage = error.message
      errorContext.errorStack = error.stack
      if ('digest' in error) {
        errorContext.errorDigest = (error as Error & { digest?: string }).digest
      }
    } else if (error) {
      errorContext.error = error
    }

    const entry = createLogEntry('error', message, errorContext)
    console.error(`[ERROR] ${formatMessage(entry)}`, errorContext)
  },

  /**
   * Cria um logger com request ID para tracing
   */
  withRequestId(requestId: string) {
    return {
      debug: (message: string, context?: LogContext) => {
        if (!shouldLog('debug')) return
        const entry = createLogEntry('debug', message, context, requestId)
        console.debug(`[DEBUG] ${formatMessage(entry)}`, context || '')
      },
      info: (message: string, context?: LogContext) => {
        if (!shouldLog('info')) return
        const entry = createLogEntry('info', message, context, requestId)
        console.info(`[INFO] ${formatMessage(entry)}`, context || '')
      },
      warn: (message: string, context?: LogContext) => {
        if (!shouldLog('warn')) return
        const entry = createLogEntry('warn', message, context, requestId)
        console.warn(`[WARN] ${formatMessage(entry)}`, context || '')
      },
      error: (message: string, error?: Error | unknown, context?: LogContext) => {
        if (!shouldLog('error')) return
        
        const errorContext: LogContext = { ...context }
        if (error instanceof Error) {
          errorContext.errorMessage = error.message
          errorContext.errorStack = error.stack
        } else if (error) {
          errorContext.error = error
        }

        const entry = createLogEntry('error', message, errorContext, requestId)
        console.error(`[ERROR] ${formatMessage(entry)}`, errorContext)
      }
    }
  },

  /**
   * Gera um request ID único para tracing
   */
  generateRequestId(): string {
    return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  },

  /**
   * Helper para medir tempo de execução
   */
  time(label: string) {
    const start = performance.now()
    return {
      end: (context?: LogContext) => {
        const duration = Math.round(performance.now() - start)
        logger.info(`${label} completed`, { ...context, durationMs: duration })
        return duration
      }
    }
  },

  /**
   * Informações sobre o ambiente atual
   */
  get env() {
    return {
      isDevelopment: isDev,
      isProduction: !isDev,
      isServer,
      isClient: !isServer,
      minLogLevel: minLevel
    }
  }
}

export default logger
