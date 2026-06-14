import { describe, test, expect } from 'bun:test'
import { extractCardIdFromBranch, verifyGitHubSignature } from '../../src/lib/githubHelpers'
import { createHmac } from 'crypto'

describe('extractCardIdFromBranch', () => {
  test('should extract ID from feat branch', () => {
    expect(extractCardIdFromBranch('feat/45-setup-cicd')).toBe(45)
  })

  test('should extract ID from fix branch', () => {
    expect(extractCardIdFromBranch('fix/123-fix-login')).toBe(123)
  })

  test('should extract ID from chore branch', () => {
    expect(extractCardIdFromBranch('chore/7-update-deps')).toBe(7)
  })

  test('should return null for non-matching branch', () => {
    expect(extractCardIdFromBranch('main')).toBeNull()
    expect(extractCardIdFromBranch('develop')).toBeNull()
    expect(extractCardIdFromBranch('release/v1.0')).toBeNull()
  })

  test('should return null for branch without ID', () => {
    expect(extractCardIdFromBranch('feat/no-id-here')).toBeNull()
  })
})

describe('verifyGitHubSignature', () => {
  test('should return true for valid signature', () => {
    const payload = '{"test": true}'
    const secret = 'my-secret'
    const valid = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')
    expect(verifyGitHubSignature(payload, valid, secret)).toBe(true)
  })

  test('should return false for invalid signature', () => {
    expect(verifyGitHubSignature('payload', 'sha256=invalid', 'secret')).toBe(false)
  })
})
