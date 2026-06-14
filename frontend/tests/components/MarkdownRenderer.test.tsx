import { describe, expect, test } from 'vitest'
import { preprocessMentions } from '../../src/components/shared/MarkdownRenderer'

describe('preprocessMentions', () => {
  test('should parse user email mentions into markdown links', () => {
    const input = 'Tolong bantu @user@example.com di sini.'
    const output = preprocessMentions(input)
    expect(output).toBe(
      'Tolong bantu [@user@example.com](mention-user://user@example.com) di sini.',
    )
  })

  test('should parse user username mentions into markdown links', () => {
    const input = 'Halo @wardi silakan cek.'
    const output = preprocessMentions(input)
    expect(output).toBe('Halo [@wardi](mention-user://wardi) silakan cek.')
  })

  test('should parse card mentions into markdown links', () => {
    const input = 'Selesaikan card #42 sebelum deadline.'
    const output = preprocessMentions(input)
    expect(output).toBe('Selesaikan card [#42](mention-card://42) sebelum deadline.')
  })

  test('should parse multiple mentions in a single text', () => {
    const input = 'Cc @wardi silakan cek #15 dan #16'
    const output = preprocessMentions(input)
    expect(output).toBe(
      'Cc [@wardi](mention-user://wardi) silakan cek [#15](mention-card://15) dan [#16](mention-card://16)',
    )
  })
})
