# BeQ Frontend Test Suite

This directory contains comprehensive tests for the BeQ MVP frontend application, covering Phases 1-2 implementation.

## Test Structure

```
__tests__/
├── unit/                   # Unit tests for individual components and utilities
│   ├── components/         # Component unit tests
│   ├── hooks/             # Custom hooks tests
│   ├── lib/               # Utility functions and API tests
│   └── pages/             # Page component tests
├── integration/           # Integration tests for feature workflows
│   ├── auth/              # Authentication flow tests
│   ├── chat/              # Chat interface integration tests
│   ├── calendar/          # Calendar/schedule integration tests
│   └── bricks/            # Bricks & Quantas system tests
├── e2e/                   # End-to-end tests (future Playwright/Cypress)
├── mocks/                 # Test mocks and fixtures
│   ├── data/              # Mock data for tests
│   ├── handlers/          # MSW request handlers
│   └── components/        # Mock components
└── utils/                 # Test utilities and helpers
```

## Testing Philosophy

### Phase 1: Core Infrastructure Tests
- ✅ Environment configuration validation
- ✅ Database connectivity (mocked)
- ✅ Backend service integration (mocked)
- ✅ Frontend dependency loading

### Phase 2: Core Features Tests
- ✅ Authentication system functionality
- ✅ Chat interface and AI integration
- ✅ Schedule/calendar view components
- ✅ Bricks & Quantas task management

## Test Categories

### 1. Unit Tests
- **Components**: Individual component rendering, props, and interactions
- **Hooks**: Custom React hooks behavior and state management
- **API Layer**: Service functions and data transformations
- **Utilities**: Helper functions and type validations

### 2. Integration Tests
- **User Flows**: Multi-component workflows
- **API Integration**: Frontend-backend communication
- **State Management**: Cross-component state changes
- **Navigation**: Route transitions and protected routes

### 3. Visual Tests
- **Snapshot Testing**: UI consistency across changes
- **Responsive Design**: Component behavior on different screen sizes
- **Theme Support**: Light/dark mode functionality
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Test Coverage Goals

- **Unit Tests**: >90% coverage for components and utilities
- **Integration Tests**: Complete user journey coverage
- **Edge Cases**: Error states, loading states, empty states
- **Accessibility**: WCAG 2.1 compliance validation

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Run specific test files
npm run test -- --testPathPattern=auth

# Run tests for specific component
npm run test -- ChatInterface
```

## Test Data Management

- **Mock Data**: Realistic sample data for consistent testing
- **Fixtures**: Reusable test data sets
- **Factories**: Dynamic data generation for edge cases
- **Cleanup**: Proper test isolation and cleanup

## Performance Testing

- **Component Render Performance**: Ensure fast component mounting
- **Memory Leaks**: Proper cleanup of subscriptions and timers
- **Bundle Size**: Component tree-shaking effectiveness
- **Loading States**: Proper handling of async operations

## Security Testing

- **Input Validation**: XSS prevention and data sanitization
- **Authentication**: Token handling and session management
- **API Security**: Request validation and error handling
- **Privacy**: PII data handling and storage

## Continuous Integration

- **Pre-commit Hooks**: Run tests before commits
- **PR Validation**: Comprehensive test suite on pull requests
- **Coverage Reports**: Track test coverage trends
- **Performance Monitoring**: Track test execution time