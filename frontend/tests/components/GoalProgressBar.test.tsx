import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, test } from 'vitest'
import { GoalProgressBar } from '../../src/components/goals/GoalProgressBar'

describe('GoalProgressBar', () => {
  test('should render progress bar with correct value', () => {
    const { container } = render(<GoalProgressBar progress={45} />)
    const progressEl = container.querySelector('progress')
    expect(progressEl).toBeInTheDocument()
    expect(progressEl).toHaveAttribute('value', '45')
    expect(progressEl).toHaveAttribute('max', '100')
  })

  test('should use error class for progress < 30%', () => {
    const { container } = render(<GoalProgressBar progress={25} />)
    const progressEl = container.querySelector('progress')
    expect(progressEl).toHaveClass('progress-error')
  })

  test('should use warning class for progress between 30% and 70%', () => {
    const { container } = render(<GoalProgressBar progress={50} />)
    const progressEl = container.querySelector('progress')
    expect(progressEl).toHaveClass('progress-warning')
  })

  test('should use success class for progress > 70%', () => {
    const { container } = render(<GoalProgressBar progress={85} />)
    const progressEl = container.querySelector('progress')
    expect(progressEl).toHaveClass('progress-success')
  })

  test('should display percentage label when showLabel is true', () => {
    render(<GoalProgressBar progress={60} showLabel={true} />)
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  test('should hide percentage label when showLabel is false', () => {
    render(<GoalProgressBar progress={60} showLabel={false} />)
    expect(screen.queryByText('60%')).not.toBeInTheDocument()
  })
})
