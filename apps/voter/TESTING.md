# Voter Portal Testing Guide

## Quick Start

```bash
# Navigate to voter app
cd apps/voter

# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
apps/voter/
├── jest.config.ts              # Jest configuration
├── jest.setup.ts               # Test environment setup
├── src/
│   ├── app/
│   │   ├── vote/
│   │   │   └── [electionId]/
│   │   │       ├── __tests__/
│   │   │       │   └── page.test.tsx       (51 tests)
│   │   │       └── review/
│   │   │           └── __tests__/
│   │   │               └── page.test.tsx   (51 tests)
│   │   │       └── confirm/
│   │   │           └── __tests__/
│   │   │               └── page.test.tsx   (34 tests)
│   │   └── verify/
│   │       └── __tests__/
│   │           └── page.test.tsx           (40 tests)
│   └── lib/
│       └── __tests__/
│           └── encryption.test.ts          (30 tests)
```

## Test Commands

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- page.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should encrypt"

# Run tests for a specific file
npm test -- src/lib/__tests__/encryption.test.ts
```

### Advanced Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests and update snapshots
npm test -- -u

# Run tests in CI mode
npm test -- --ci --coverage --maxWorkers=2

# Run only changed tests
npm test -- --onlyChanged

# Run tests with specific configuration
npm test -- --config=jest.config.ts
```

## Writing New Tests

### Test Template

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import YourComponent from '../YourComponent'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('YourComponent', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  test('should render component', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  test('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<YourComponent />)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })
})
```

### Testing Best Practices

1. **Use Testing Library Queries** (in order of preference):
   - `getByRole` (most accessible)
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`
   - `getByTestId` (last resort)

2. **User Event Over FireEvent**:
   ```typescript
   // Good
   const user = userEvent.setup()
   await user.click(button)

   // Avoid
   fireEvent.click(button)
   ```

3. **Wait for Async Operations**:
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument()
   })
   ```

4. **Clean Up Between Tests**:
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks()
     sessionStorage.clear()
   })
   ```

5. **Test Accessibility**:
   ```typescript
   test('should have proper heading hierarchy', () => {
     render(<Component />)
     const h1 = screen.getByRole('heading', { level: 1 })
     expect(h1).toHaveTextContent('Page Title')
   })
   ```

## Common Testing Patterns

### Testing Components with API Calls

```typescript
import * as actions from '@/lib/actions/voting'

jest.mock('@/lib/actions/voting')

test('should load data from API', async () => {
  ;(actions.fetchElection as jest.Mock).mockResolvedValue({
    success: true,
    election: mockElection,
  })

  render(<Component />)

  await waitFor(() => {
    expect(screen.getByText('Election Name')).toBeInTheDocument()
  })
})
```

### Testing Form Interactions

```typescript
test('should submit form', async () => {
  const user = userEvent.setup()
  render(<Form />)

  const input = screen.getByLabelText(/name/i)
  await user.type(input, 'John Doe')

  const submitButton = screen.getByRole('button', { name: /submit/i })
  await user.click(submitButton)

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
  })
})
```

### Testing Navigation

```typescript
test('should navigate to next page', async () => {
  const user = userEvent.setup()
  const mockPush = jest.fn()

  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })

  render(<Component />)

  const nextButton = screen.getByRole('button', { name: /next/i })
  await user.click(nextButton)

  expect(mockPush).toHaveBeenCalledWith('/next-page')
})
```

### Testing Error States

```typescript
test('should display error message', async () => {
  ;(actions.fetchData as jest.Mock).mockResolvedValue({
    success: false,
    error: 'Failed to load data',
  })

  render(<Component />)

  await waitFor(() => {
    expect(screen.getByText(/failed to load data/i)).toBeInTheDocument()
  })
})
```

## Debugging Tests

### View Test Output

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with logs
npm test -- --testNamePattern="specific test" --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/apps/voter/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "cwd": "${workspaceFolder}/apps/voter"
    }
  ]
}
```

### Common Issues

**Issue**: Tests timeout
```bash
# Increase timeout
npm test -- --testTimeout=10000
```

**Issue**: Module not found
```bash
# Clear Jest cache
npm test -- --clearCache
```

**Issue**: Tests pass locally but fail in CI
```bash
# Run in CI mode
npm test -- --ci --maxWorkers=2
```

## Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View Coverage Report

After running with coverage, open:
```
apps/voter/coverage/lcov-report/index.html
```

### Coverage Thresholds

Current coverage targets (can be adjusted in `jest.config.ts`):

```typescript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test Voter Portal

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: apps/voter
        run: npm install

      - name: Run tests
        working-directory: apps/voter
        run: npm test -- --ci --coverage --maxWorkers=2

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/voter/coverage/lcov.info
```

## Test Maintenance

### Updating Snapshots

```bash
# Update all snapshots
npm test -- -u

# Update specific snapshot
npm test -- -u --testNamePattern="specific test"
```

### Fixing Flaky Tests

1. **Ensure proper async handling**:
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Text')).toBeInTheDocument()
   })
   ```

2. **Clear mocks between tests**:
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks()
   })
   ```

3. **Avoid timing-dependent tests**:
   ```typescript
   // Bad
   setTimeout(() => expect(result).toBe(true), 100)

   // Good
   await waitFor(() => expect(result).toBe(true))
   ```

### Adding New Test Files

1. Create test file adjacent to source:
   ```
   src/
     components/
       MyComponent.tsx
       __tests__/
         MyComponent.test.tsx
   ```

2. Follow naming convention: `*.test.tsx` or `*.test.ts`

3. Use describe blocks for organization:
   ```typescript
   describe('MyComponent', () => {
     describe('Rendering', () => { /* tests */ })
     describe('User Interactions', () => { /* tests */ })
     describe('Error Handling', () => { /* tests */ })
   })
   ```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Test Suite Statistics

- **Total Tests**: 206
- **Test Files**: 5
- **Average Tests per File**: 41
- **Coverage Target**: 70%

## Getting Help

For questions or issues with testing:

1. Check existing tests for patterns
2. Review this guide
3. Check Jest/Testing Library documentation
4. Ask in team chat or create an issue

---

**Last Updated**: December 24, 2025
**Test Framework**: Jest + React Testing Library
**Node Version**: 20+
