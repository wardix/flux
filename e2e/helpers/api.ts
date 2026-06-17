import { APIRequestContext, request } from '@playwright/test'

const API_BASE = process.env.API_URL || 'http://localhost:3000'

let cachedToken: string | null = null

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken

  const context = await request.newContext()
  const response = await context.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'alice@example.com', password: 'password123' },
  })

  if (!response.ok()) {
    throw new Error(`API auth failed: ${response.status()}`)
  }

  const body = await response.json()
  cachedToken = body.data.token
  await context.dispose()
  return cachedToken!
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  data?: Record<string, any>,
): Promise<T> {
  const token = await getToken()
  const context = await request.newContext()

  const url = `${API_BASE}${path}`
  const options: any = {
    headers: { Authorization: `Bearer ${token}` },
  }
  if (data) options.data = data

  let response
  switch (method) {
    case 'GET':
      response = await context.get(url, options)
      break
    case 'POST':
      response = await context.post(url, options)
      break
    case 'PUT':
      response = await context.put(url, options)
      break
    case 'PATCH':
      response = await context.patch(url, options)
      break
    case 'DELETE':
      response = await context.delete(url, options)
      break
  }

  const body = await response.json()
  await context.dispose()

  if (!response.ok()) {
    throw new Error(`API ${method} ${path} failed: ${response.status()} ${JSON.stringify(body)}`)
  }

  return body as T
}

export async function apiGet<T = any>(path: string): Promise<T> {
  return apiRequest<T>('GET', path)
}

export async function apiPost<T = any>(path: string, data?: Record<string, any>): Promise<T> {
  return apiRequest<T>('POST', path, data)
}

export async function apiPut<T = any>(path: string, data?: Record<string, any>): Promise<T> {
  return apiRequest<T>('PUT', path, data)
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  return apiRequest<T>('DELETE', path)
}
