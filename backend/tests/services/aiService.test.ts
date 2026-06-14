import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test'
import * as aiService from '../../src/services/aiService'

// We will mock the entire OpenAI module or at least its client methods
const mockCreate = mock(() => Promise.resolve({
  choices: [{
    message: {
      content: JSON.stringify({
        suggested_labels: [
          { name: 'bug', confidence: 0.95 },
          { name: 'mobile', confidence: 0.88 },
        ],
        suggested_assignees: [
          { name: 'Jane', confidence: 0.85, reason: 'Has handled similar mobile/UI bugs recently' },
          { name: 'John', confidence: 0.60, reason: 'Has experience with auth-related issues' },
        ],
        summary: 'This card tracks a mobile Safari bug where the login button doesn\'t respond.',
        key_points: [
          'Bug: Login button unresponsive on mobile Safari',
          'Root cause: Touch event handling',
        ],
        reasoning: 'Test reasoning',
      }),
    },
  }],
}))

// Mock OpenAI
mock.module('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: mockCreate
        }
      }
    }
  }
})

describe('AI Service', () => {
  const originalEnvKey = process.env.OPENAI_API_KEY
  const originalEnvModel = process.env.OPENAI_MODEL

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.OPENAI_MODEL = 'gpt-4o-mini'
  })

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalEnvKey
    process.env.OPENAI_MODEL = originalEnvModel
  })

  describe('suggestLabels', () => {
    test('should return suggested labels with confidence scores', async () => {
      const result = await aiService.suggestLabels(
        'Fix login button on mobile',
        'Button does not respond on Safari',
        [
          { id: 1, name: 'bug', color: '#FF0000' },
          { id: 2, name: 'mobile', color: '#FF8800' },
          { id: 3, name: 'feature', color: '#00FF00' },
        ]
      )
      expect(result.suggested_labels).toBeDefined()
      expect(result.suggested_labels.length).toBeGreaterThan(0)
      expect(result.suggested_labels[0]).toHaveProperty('confidence')
      expect(result.suggested_labels[0].id).toBe(1)
    })

    test('should return max 3 suggestions', async () => {
      const result = await aiService.suggestLabels('Test', 'Test', 
        Array.from({ length: 10 }, (_, i) => ({ id: i, name: `label-${i}`, color: '#000' }))
      )
      expect(result.suggested_labels.length).toBeLessThanOrEqual(3)
    })
  })

  describe('summarizeCard', () => {
    test('should return summary and key points', async () => {
      const result = await aiService.summarizeCard({
        title: 'Test Card',
        description: 'Long description...',
        comments: [{ text: 'Comment 1' }, { text: 'Comment 2' }],
        activities: [{ action: 'created' }, { action: 'moved' }],
      })
      expect(result.summary).toBeDefined()
      expect(result.key_points).toBeDefined()
      expect(Array.isArray(result.key_points)).toBe(true)
    })
  })

  describe('suggestAssignee', () => {
    test('should return suggested assignees with reasoning', async () => {
      const result = await aiService.suggestAssignee({
        title: 'Fix mobile bug',
        description: '...',
        members: [
          { id: 1, name: 'John', recent_cards: 5 },
          { id: 2, name: 'Jane', recent_cards: 3 },
        ],
      })
      expect(result.suggested_assignees).toBeDefined()
      expect(result.suggested_assignees[0]).toHaveProperty('reason')
      expect(result.suggested_assignees[0].id).toBe(2)
    })

    test('should return max 2 suggestions', async () => {
      const result = await aiService.suggestAssignee({
        title: 'Test',
        description: '...',
        members: Array.from({ length: 10 }, (_, i) => ({
          id: i, name: `User ${i}`, recent_cards: i,
        })),
      })
      expect(result.suggested_assignees.length).toBeLessThanOrEqual(2)
    })
  })

  describe('Error handling', () => {
    test('should throw when OPENAI_API_KEY is not set', async () => {
      delete process.env.OPENAI_API_KEY
      expect(aiService.suggestLabels('Test', 'Test', [])).rejects.toThrow('OpenAI API key is not configured')
      process.env.OPENAI_API_KEY = 'test-key'
    })
  })
})
