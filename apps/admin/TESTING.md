# Admin App Testing Guide

## Quick Start

### Run All Tests
```bash
cd apps/admin
npm test
```

### Run Specific Test Suites

#### Library Utilities Tests (New!)
```bash
# All lib utility tests
npm test -- src/lib/__tests__/

# Just utils.ts tests (44 tests)
npm test -- src/lib/__tests__/utils.test.ts

# Just auth.ts tests (48 tests)
npm test -- src/lib/__tests__/auth.test.ts
```

#### Other Test Suites
```bash
# Component tests
npm test -- src/components/

# Page tests
npm test -- src/app/

# Action tests
npm test -- src/lib/actions/
```

### Watch Mode (for development)
```bash
npm test:watch
```

### Coverage Report
```bash
npm test:coverage
```

### CI Mode
```bash
npm test:ci
```

## New Test Coverage (This Update)

### 1. `/apps/admin/src/lib/__tests__/utils.test.ts` (44 tests)
Comprehensive tests for the `cn()` utility function:
- ✅ Basic class name merging
- ✅ Tailwind CSS class conflicts (p-2 vs p-4, etc.)
- ✅ Responsive variants (md:, lg:, etc.)
- ✅ Pseudo-classes (hover:, focus:, dark:)
- ✅ Edge cases (null, undefined, empty values)
- ✅ Real-world component scenarios

### 2. `/apps/admin/src/lib/__tests__/auth.test.ts` (48 tests)
Comprehensive tests for NextAuth configuration:
- ✅ Email provider setup
- ✅ Magic link generation (15-minute expiry)
- ✅ Session management (24-hour JWT sessions)
- ✅ Authentication callbacks (authorized, jwt, session)
- ✅ XSS prevention in email templates
- ✅ Security validations
- ✅ Environment variable handling
- ✅ Redirect logic (login → dashboard)

**Total New Tests: 92 comprehensive test cases**

## Test Structure

```
apps/admin/
├── src/
│   ├── lib/
│   │   ├── __tests__/
│   │   │   ├── utils.test.ts       ← NEW (44 tests)
│   │   │   ├── auth.test.ts        ← NEW (48 tests)
│   │   │   ├── api-config.test.ts
│   │   │   └── README.md           ← NEW (detailed docs)
│   │   ├── utils.ts
│   │   └── auth.ts
│   ├── components/
│   │   └── .../__tests__/          (existing tests)
│   └── app/
│       └── .../__tests__/          (existing tests)
├── jest.config.js
├── jest.setup.tsx
└── test-lib-utils.sh               ← NEW (helper script)
```

## Coverage Goals

The project maintains 80% coverage across:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Helper Scripts

### Run Library Tests Only
```bash
chmod +x test-lib-utils.sh
./test-lib-utils.sh
```

This script runs both utils and auth tests with verbose output.

## Test Patterns

All tests follow consistent patterns:

### 1. Descriptive Organization
```typescript
describe('feature name', () => {
  describe('sub-feature', () => {
    it('should do something specific', () => {
      // test implementation
    });
  });
});
```

### 2. Setup and Teardown
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 3. Edge Case Testing
Every function tests:
- ✅ Null values
- ✅ Undefined values
- ✅ Empty strings/arrays/objects
- ✅ Boundary conditions
- ✅ Type safety

### 4. Security Testing
- ✅ XSS prevention
- ✅ Input sanitization
- ✅ Authentication flows
- ✅ Session security

## Mocking Strategy

### Global Mocks (jest.setup.tsx)
- ResizeObserver (for Radix UI)
- window.matchMedia (for responsive components)
- Next.js router and Link

### Test-Specific Mocks
- `nodemailer` (for email tests)
- `next-auth` (for auth config tests)

## Common Test Commands

```bash
# Run tests matching a pattern
npm test -- --testNamePattern="should handle"

# Run tests in a specific file
npm test -- utils.test.ts

# Update snapshots (if any)
npm test -- -u

# Run tests with maximum workers (parallel)
npm test -- --maxWorkers=4

# Run only changed tests (with git)
npm test -- --onlyChanged

# Run with coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/lib/utils.ts"
```

## Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Single Test
```bash
npm test -- --testNamePattern="specific test name" --verbose
```

### VS Code Debugging
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/apps/admin/node_modules/.bin/jest",
  "args": [
    "${fileBasename}",
    "--config",
    "${workspaceFolder}/apps/admin/jest.config.js"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Troubleshooting

### Tests Fail Due to Module Resolution
- Ensure you're in the `apps/admin` directory
- Run `npm install` to ensure dependencies are installed

### Tests Timeout
- Increase timeout in jest.config.js
- Or use `--testTimeout=10000` flag

### Coverage Threshold Not Met
- Run `npm test:coverage` to see uncovered lines
- Add tests for uncovered branches/functions

## Best Practices

1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**
3. **Use descriptive test names** ("should..." format)
4. **One assertion per test** (when possible)
5. **Test edge cases** (null, undefined, empty, boundaries)
6. **Keep tests isolated** (no shared state)
7. **Mock external dependencies**
8. **Test security** (XSS, injection, auth)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Project Testing Patterns](./src/__tests__/utils/test-utils.tsx)

## Questions?

For detailed test documentation, see:
- `/apps/admin/src/lib/__tests__/README.md` - Library utilities test documentation
- Individual test files for implementation examples
