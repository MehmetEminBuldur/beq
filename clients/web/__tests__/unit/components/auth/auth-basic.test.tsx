/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Create a simple test component to verify component testing works
const TestAuthComponent = ({ title, onSubmit }: { title: string; onSubmit?: () => void }) => {
  return (
    <div>
      <h1>{title}</h1>
      <form onSubmit={onSubmit}>
        <input type="email" placeholder="Email" aria-label="Email" />
        <input type="password" placeholder="Password" aria-label="Password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  )
}

describe('Authentication Components Basic Tests', () => {
  it('should render a basic auth form', () => {
    render(<TestAuthComponent title="Test Auth" />)

    expect(screen.getByText('Test Auth')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should render form inputs with correct attributes', () => {
    render(<TestAuthComponent title="Test Auth" />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(emailInput).toHaveAttribute('placeholder', 'Email')
    expect(passwordInput).toHaveAttribute('placeholder', 'Password')
  })

  it('should have accessible form structure', () => {
    render(<TestAuthComponent title="Test Auth" />)

    expect(document.querySelector('form')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toHaveAttribute('type', 'submit')
  })
})

describe('Authentication Test Environment', () => {
  it('should have proper jest-dom matchers available', () => {
    const element = document.createElement('div')
    element.textContent = 'Test'
    expect(element).toHaveTextContent('Test')
    expect(element).not.toHaveClass('hidden')
  })

  it('should mock basic browser APIs', () => {
    // Test that our mocked browser APIs work
    expect(window.matchMedia).toBeDefined()
    expect(window.IntersectionObserver).toBeDefined()
    expect(window.ResizeObserver).toBeDefined()
  })
})