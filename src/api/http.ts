import { apiBaseUrl } from '@/api/config'
import type { TokenResponse } from '@/api/contracts'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export interface SessionBridge {
  accessToken: string | null
  refreshToken: string | null
  applyTokenEnvelope(token: TokenResponse): void
  clearSession(): void
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

async function parseError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { title?: string; detail?: string }
    return new ApiError(payload.title || payload.detail || 'API request failed.', response.status)
  }

  return new ApiError((await response.text()) || 'API request failed.', response.status)
}

async function send(path: string, options: RequestOptions = {}, accessToken?: string | null) {
  const headers = new Headers(options.headers)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

async function refresh(session: SessionBridge) {
  if (!session.refreshToken) {
    throw new ApiError('Session expired.', 401)
  }

  const response = await send('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken: session.refreshToken },
  })

  if (!response.ok) {
    session.clearSession()
    throw await parseError(response)
  }

  const payload = (await response.json()) as TokenResponse
  session.applyTokenEnvelope(payload)
  return payload.accessToken
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const response = await send(path, options)
  if (!response.ok) {
    throw await parseError(response)
  }

  return parseJson<T>(response)
}

export async function authorizedJson<T>(session: SessionBridge, path: string, options: RequestOptions = {}) {
  let response = await send(path, options, session.accessToken)

  if (response.status === 401 && session.refreshToken) {
    const accessToken = await refresh(session)
    response = await send(path, options, accessToken)
  }

  if (response.status === 401) {
    session.clearSession()
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  return parseJson<T>(response)
}

export async function authorizedDownload(session: SessionBridge, path: string) {
  let response = await send(path, { method: 'GET' }, session.accessToken)

  if (response.status === 401 && session.refreshToken) {
    const accessToken = await refresh(session)
    response = await send(path, { method: 'GET' }, accessToken)
  }

  if (response.status === 401) {
    session.clearSession()
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const fileName = contentDisposition.match(/filename=\"?([^"]+)\"?/)?.[1] || 'report.csv'

  return { blob, fileName }
}
