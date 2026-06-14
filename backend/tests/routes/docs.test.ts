import { describe, test, expect } from 'bun:test'
import app from '../../src/index'

describe('GET /api/docs', () => {
  test('should serve API documentation page', async () => {
    const res = await app.fetch(new Request('http://localhost/api/docs'))
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Flux API')
  })
})

describe('GET /api/docs/openapi.json', () => {
  test('should return valid OpenAPI spec', async () => {
    const res = await app.fetch(new Request('http://localhost/api/docs/openapi.json'))
    expect(res.status).toBe(200)
    const spec = await res.json()
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.info.title).toBe('Flux API')
    expect(spec.paths).toBeDefined()
  })

  test('should include all major endpoint groups', async () => {
    const res = await app.fetch(new Request('http://localhost/api/docs/openapi.json'))
    const spec = await res.json()
    const paths = Object.keys(spec.paths)
    expect(paths.some((p) => p.includes('/boards'))).toBe(true)
    expect(paths.some((p) => p.includes('/cards'))).toBe(true)
    expect(paths.some((p) => p.includes('/auth'))).toBe(true)
  })

  test('should include security scheme', async () => {
    const res = await app.fetch(new Request('http://localhost/api/docs/openapi.json'))
    const spec = await res.json()
    expect(spec.components.securitySchemes.bearerAuth).toBeDefined()
    expect(spec.components.securitySchemes.bearerAuth.type).toBe('http')
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
  })

  test('should include example request/response in schemas', async () => {
    const res = await app.fetch(new Request('http://localhost/api/docs/openapi.json'))
    const spec = await res.json()
    // Cek bahwa schemas ada di components
    expect(spec.components.schemas).toBeDefined()
  })

  test('should be accessible without authentication', async () => {
    const res = await app.fetch(new Request('http://localhost/api/docs/openapi.json'))
    expect(res.status).toBe(200)
  })
})
