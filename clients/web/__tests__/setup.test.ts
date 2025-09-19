/**
 * @jest-environment jsdom
 */

describe('Test Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to DOM', () => {
    document.body.innerHTML = '<div>Hello World</div>'
    expect(document.querySelector('div')).toHaveTextContent('Hello World')
  })
})