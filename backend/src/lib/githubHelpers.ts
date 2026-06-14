import { createHmac, timingSafeEqual } from 'crypto'

export function extractCardIdFromBranch(branchName: string): number | null {
  const match = branchName.match(/^(?:feat|fix|chore)\/(\d+)-/)
  if (match && match[1]) {
    return parseInt(match[1], 10)
  }
  return null
}

export function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !signature.startsWith('sha256=')) return false
  
  const computedSignature = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))
  } catch (err) {
    return false
  }
}
