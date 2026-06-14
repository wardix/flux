import { fireEvent, render, screen } from '@testing-library/react'
// biome-ignore lint/correctness/noUnusedImports: React is required for JSX in Vitest environment
import React from 'react'
import { describe, expect, test } from 'vitest'
import { LanguageSwitcher } from '../../src/components/settings/LanguageSwitcher'
import '../../src/i18n'

describe('LanguageSwitcher', () => {
  test('should render language options', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByText('🇺🇸 English')).toBeDefined()
  })

  test('should change language on selection', async () => {
    render(<LanguageSwitcher />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'id' } })
    expect(localStorage.getItem('flux-language')).toBe('id')
  })
})
