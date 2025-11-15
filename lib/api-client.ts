type ApiHeaders = HeadersInit | undefined

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number
}

const DEFAULT_TIMEOUT = 10000

export async function apiFetch<T>(input: RequestInfo | URL, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, headers, signal, ...rest } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(input, {
      ...rest,
      headers: mergeHeaders(headers),
      signal: signal ?? controller.signal,
    })

    const rawText = await response.text()
    const parsedBody = rawText ? safeJsonParse(rawText) : null

    if (!response.ok) {
      const errorMessage =
        (parsedBody && typeof parsedBody === 'object' && 'error' in parsedBody && typeof parsedBody.error === 'string'
          ? parsedBody.error
          : parsedBody && typeof parsedBody === 'object' && 'message' in parsedBody && typeof parsedBody.message === 'string'
          ? parsedBody.message
          : null) ?? 'Erro inesperado ao comunicar com o servidor.'

      throw new Error(errorMessage)
    }

    return parsedBody as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tempo limite atingido. Por favor, tente novamente.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function mergeHeaders(headers: ApiHeaders): HeadersInit {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (!headers) {
    return baseHeaders
  }

  if (headers instanceof Headers) {
    const result = new Headers(baseHeaders)
    headers.forEach((value, key) => result.set(key, value))
    return result
  }

  return {
    ...baseHeaders,
    ...(headers as Record<string, string>),
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
