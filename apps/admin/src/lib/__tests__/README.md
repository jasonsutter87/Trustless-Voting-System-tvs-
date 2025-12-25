# Admin App Library Utilities Tests

This directory contains comprehensive TDD tests for the admin application's core utility libraries.

## Test Coverage Summary

### 1. utils.test.ts (44 tests)
Tests for `/apps/admin/src/lib/utils.ts`

**Test Categories:**
- **Basic functionality** (6 tests)
  - Single class name merging
  - Multiple class names merging
  - Array of class names
  - Conditional class objects
  - Mixed type merging

- **Tailwind merge functionality** (13 tests)
  - Conflicting class resolution (keeps last)
  - Non-conflicting class merging
  - Responsive variants (sm, md, lg, xl)
  - Pseudo-class states (hover, focus)
  - Dark mode variants
  - Complex utility conflicts (px-2 py-1 vs p-4)
  - Border, text color, background color conflicts

- **Edge cases - null and undefined** (7 tests)
  - Null value handling
  - Undefined value handling
  - Multiple null/undefined values
  - Mixed null and undefined
  - All null/undefined scenarios

- **Edge cases - empty values** (6 tests)
  - Empty string handling
  - Multiple empty strings
  - Empty arrays
  - Arrays with empty strings
  - Empty objects
  - Objects with all false values

- **Edge cases - whitespace** (3 tests)
  - Whitespace trimming
  - Multiple spaces between classes
  - Tabs and newlines handling

- **Complex real-world scenarios** (5 tests)
  - Button variants with active/disabled states
  - Card with responsive padding
  - Input error states
  - Grid layout classes
  - Text styles with variants

- **No arguments** (1 test)
  - Empty call handling

- **Type safety edge cases** (4 tests)
  - Boolean true/false
  - Number 0/1

### 2. auth.test.ts (48 tests)
Tests for `/apps/admin/src/lib/auth.ts`

**Test Categories:**
- **authConfig structure** (6 tests)
  - Configuration object structure
  - Email provider configuration
  - Custom pages setup
  - JWT session strategy
  - Session maxAge (24 hours)
  - Debug mode (dev/production)

- **Email provider configuration** (4 tests)
  - Default EMAIL_FROM handling
  - Custom EMAIL_FROM from environment
  - Magic link maxAge (15 minutes)
  - Server configuration

- **Callbacks - authorized** (9 tests)
  - Authenticated users accessing dashboard
  - Unauthenticated users denied from dashboard
  - Null user handling
  - Non-dashboard pages without auth
  - Redirect from login when authenticated
  - Unauthenticated users on login page
  - Dashboard subpaths authentication
  - Dashboard subpaths denial without auth

- **Callbacks - jwt** (4 tests)
  - Adding user data to token on sign in
  - Preserving existing token data
  - Token when user not provided
  - Null user handling

- **Callbacks - session** (5 tests)
  - Adding token data to session user
  - Session without user object
  - Null token handling
  - Empty token handling
  - Session expiry preservation

- **Email HTML generation edge cases** (8 tests)
  - XSS prevention - escaping < and > in emails
  - XSS prevention - escaping < and > in hosts
  - Multiple < and > characters
  - Empty email handling
  - Empty host handling
  - Valid URL preservation
  - URLs with special characters

- **Email text generation edge cases** (5 tests)
  - Simple text email generation
  - Empty host in text email
  - Empty URL in text email
  - Long URL handling
  - URL encoding preservation

- **Environment variable handling** (4 tests)
  - Missing EMAIL_FROM
  - Missing EMAIL_SERVER in development
  - Missing NEXTAUTH_SECRET
  - Custom EMAIL_FROM

- **Security considerations** (6 tests)
  - Session maxAge < 30 days
  - Magic link expiry < 24 hours
  - JWT session strategy enforcement
  - Dashboard route authentication requirement
  - No sensitive data in session (tokens not exposed)

## Test Execution

### Run all lib tests:
```bash
npm test -- src/lib/__tests__/
```

### Run specific test files:
```bash
# Utils tests only
npm test -- src/lib/__tests__/utils.test.ts

# Auth tests only
npm test -- src/lib/__tests__/auth.test.ts
```

### Run with coverage:
```bash
npm test -- src/lib/__tests__/ --coverage
```

### Run with watch mode:
```bash
npm test:watch -- src/lib/__tests__/
```

### Using the helper script:
```bash
chmod +x test-lib-utils.sh
./test-lib-utils.sh
```

## Test Patterns Used

All tests follow the project's established patterns:

1. **Descriptive test organization** - Tests are grouped using nested `describe` blocks
2. **Clear test names** - All tests use "should..." naming convention
3. **Edge case coverage** - Extensive testing of null, undefined, empty values
4. **Security testing** - XSS prevention, session security, authentication flows
5. **Real-world scenarios** - Complex UI component class merging patterns
6. **Type safety** - Testing TypeScript type edge cases

## Coverage Requirements

These tests help maintain the project's coverage threshold of 80%:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Security Testing

Special attention is paid to security:

### utils.ts
- Input sanitization through proper class merging
- No code injection through class names

### auth.ts
- **XSS Prevention**: Email and host escaping in HTML templates
- **Session Security**: 24-hour session expiry, JWT strategy
- **Magic Link Security**: 15-minute expiry to prevent replay attacks
- **Authentication Flows**: Proper redirection and access control
- **Token Safety**: Sensitive tokens not exposed in session

## Dependencies

Tests use:
- **Jest**: Test runner and assertion library
- **@testing-library/jest-dom**: DOM matchers
- **clsx**: Class name utility (dependency of utils.ts)
- **tailwind-merge**: Tailwind CSS class merging (dependency of utils.ts)

## Mock Configuration

### auth.test.ts mocks:
- `nodemailer` - Email transport mocking
- `next-auth` - NextAuth configuration and handlers

## Future Enhancements

Potential areas for additional testing:
1. Integration tests for auth flow end-to-end
2. Performance tests for class name merging with large inputs
3. Additional edge cases for email templates (internationalization, RTL)
4. Rate limiting tests for magic link requests

## Notes

- All tests are isolated and can run in any order
- Mocks are cleared between tests using `beforeEach`
- Console logs are suppressed during tests (except when testing error cases)
- Tests follow TDD principles: written to fail first, then implemented to pass
