import { describe, test, expect } from 'vitest'
import en from '../../src/i18n/locales/en.json'
import id from '../../src/i18n/locales/id.json'

describe('Translation files', () => {
  test('en.json and id.json should have the same keys', () => {
    const enKeys = getAllKeys(en)
    const idKeys = getAllKeys(id)
    expect(enKeys).toEqual(idKeys)
  })

  test('no empty values in en.json', () => {
    const values = getAllValues(en)
    values.forEach((val) => {
      expect(val).not.toBe('')
    })
  })

  test('no empty values in id.json', () => {
    const values = getAllValues(id)
    values.forEach((val) => {
      expect(val).not.toBe('')
    })
  })

  test('interpolation variables match between languages', () => {
    const enInterp = getInterpolationKeys(en)
    const idInterp = getInterpolationKeys(id)
    // Setiap key yang punya {{variable}} di en harus juga ada di id
    for (const [key, vars] of Object.entries(enInterp)) {
      expect(idInterp[key]).toEqual(vars)
    }
  })
})

// Helper: recursively get all keys as dot-notation strings
function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, val]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof val === 'object' && val !== null) {
      return getAllKeys(val, fullKey)
    }
    return [fullKey]
  })
}

// Helper: get all leaf values
function getAllValues(obj: Record<string, any>): string[] {
  return Object.values(obj).flatMap((val) => {
    if (typeof val === 'object' && val !== null) return getAllValues(val)
    return [val]
  })
}

// Helper: extract {{variable}} patterns per key
function getInterpolationKeys(obj: Record<string, any>, prefix = ''): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof val === 'object' && val !== null) {
      Object.assign(result, getInterpolationKeys(val, fullKey))
    } else if (typeof val === 'string') {
      const matches = val.match(/\{\{(\w+)\}\}/g)
      if (matches) {
        result[fullKey] = matches.sort()
      }
    }
  }
  return result
}
