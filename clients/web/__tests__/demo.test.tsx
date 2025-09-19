/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Demo component to show testing capabilities
const DemoComponent = () => {
  return (
    <div>
      <h1>BeQ Testing Demo</h1>
      <button onClick={() => alert('Button clicked!')}>Click me</button>
      <input type="text" placeholder="Enter text" aria-label="Demo input" />
      <div role="status" aria-live="polite">Ready for testing</div>
    </div>
  )
}

describe('BeQ Testing Framework Demo', () => {
  it('renders components correctly', () => {
    render(<DemoComponent />)

    expect(screen.getByText('BeQ Testing Demo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    expect(screen.getByLabelText('Demo input')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Ready for testing')
  })

  it('handles user interactions', () => {
    render(<DemoComponent />)

    const input = screen.getByLabelText('Demo input')
    const button = screen.getByRole('button')

    // Test input functionality
    fireEvent.change(input, { target: { value: 'test input' } })
    expect(input).toHaveValue('test input')

    // Test button is interactive
    expect(button).toBeEnabled()
  })

  it('has proper accessibility attributes', () => {
    render(<DemoComponent />)

    const input = screen.getByLabelText('Demo input')
    const status = screen.getByRole('status')

    expect(input).toHaveAttribute('aria-label', 'Demo input')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveAttribute('role', 'status')
  })
})