import { describe, test, expect } from 'vitest'
import { extractTextFromJSON, isValidTiptapDoc, sanitizeTiptapDoc } from '../../src/lib/tiptapHelpers'

describe('tiptapHelpers', () => {
  describe('extractTextFromJSON', () => {
    test('mengekstrak plain text dari nested doc', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello ' }, { type: 'text', text: 'World' }]
          }
        ]
      }
      expect(extractTextFromJSON(doc)).toBe('Hello World')
    })

    test('mengembalikan string kosong untuk doc kosong', () => {
      expect(extractTextFromJSON({ type: 'doc' })).toBe('')
      expect(extractTextFromJSON(null as any)).toBe('')
    })
  })

  describe('isValidTiptapDoc', () => {
    test('return true untuk doc valid', () => {
      expect(isValidTiptapDoc({ type: 'doc', content: [] })).toBe(true)
    })

    test('return false untuk objek random', () => {
      expect(isValidTiptapDoc({ random: 123 })).toBe(false)
      expect(isValidTiptapDoc(null)).toBe(false)
      expect(isValidTiptapDoc('string')).toBe(false)
    })
  })

  describe('sanitizeTiptapDoc', () => {
    test('menghapus node type yang tidak dikenal', () => {
      const dirtyDoc = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Clean text' }]
          },
          {
            type: 'script',
            content: [{ type: 'text', text: 'alert("xss")' }]
          }
        ]
      }
      const cleanDoc = sanitizeTiptapDoc(dirtyDoc as any)
      expect(cleanDoc.content?.length).toBe(1)
      expect(cleanDoc.content?.[0].type).toBe('paragraph')
    })

    test('mempertahankan node type yang valid', () => {
      const validDoc = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Title' }]
          }
        ]
      }
      const cleanDoc = sanitizeTiptapDoc(validDoc as any)
      expect(cleanDoc.content?.length).toBe(1)
      expect(cleanDoc.content?.[0].type).toBe('heading')
    })
  })
})
