# Results Components Test Suite

Comprehensive test coverage for the results display and decryption status components.

## Test Statistics

- **Total Test Cases**: 134+
- **results-display.test.tsx**: 71 test cases
- **decryption-status.test.tsx**: 63 test cases

## results-display.test.tsx (71+ tests)

### Test Categories

#### Initial Rendering (5 tests)
- Component rendering
- Default table mode
- Total votes display
- Action buttons
- Basic UI elements

#### Winner Banner (5 tests)
- Display when certified
- Hide when uncertified
- Vote count display
- Percentage calculation
- Trophy icon

#### Table View (6 tests)
- Table headers
- Candidate names
- Vote count formatting (locale)
- Percentage display (1 decimal)
- Ranking order
- 1st badge for certified winner

#### Chart View (5 tests)
- Switch to chart view
- Candidate names in chart
- Vote counts in chart
- Percentages in chart
- Trophy icon for winner

#### View Toggle (4 tests)
- Toggle table to chart
- Toggle chart to table
- Data preservation
- Active button highlight

#### Export CSV (6 tests)
- Export button trigger
- CSV headers
- All candidates included
- Filename from election name
- Space to underscore conversion
- URL revocation

#### Print Functionality (3 tests)
- Print button trigger
- Print from table view
- Print from chart view

#### Summary Statistics (5 tests)
- Total votes stat
- Number of candidates
- Winning margin
- Dash for single candidate
- Large number formatting

#### Edge Cases - No Votes (4 tests)
- Zero total votes
- 0% for all candidates
- Empty results array
- Winning margin with zero votes

#### Edge Cases - Single Candidate (4 tests)
- Display single candidate
- 100% for solo candidate
- Rank 1 display
- Winner banner when certified

#### Edge Cases - Ties (4 tests)
- Two-way tie
- Zero winning margin
- Three-way tie
- Winner banner for tied first

#### Sorting Behavior (3 tests)
- Sort by votes descending
- Maintain sort in chart view
- No mutation of original array

#### XSS Prevention (8 tests)
- Script injection in candidate name
- Image tag injection
- JavaScript protocol
- SVG injection
- CSV export safety
- Election name safety

#### Unicode & Internationalization (3 tests)
- Unicode names (Japanese, Spanish, German)
- Emoji support
- RTL text (Arabic)

#### Large Datasets (3 tests)
- Many candidates (50+)
- Very large vote counts
- Large totals formatting

#### Certified vs Uncertified States (4 tests)
- No banner when uncertified
- Banner when certified
- 1st badge conditional
- Winner bar highlighting

#### Accessibility (2 tests)
- Table structure
- Button labels

#### Percentage Calculations (3 tests)
- Correct calculations
- Decimal rounding
- Decimal vote counts

## decryption-status.test.tsx (63+ tests)

### Test Categories

#### Initial Rendering (5 tests)
- Component rendering
- Key icon display
- Share count display
- Decryption URL
- Trustee status header

#### Progress Bar and Count (6 tests)
- 0% with no decryptions
- Partial decryption count
- Threshold reached
- Progress percentage
- Cap at 100%
- Extra shares handling

#### Status Messages (5 tests)
- Shares needed message
- Singular "share" (1 needed)
- Plural "shares" (multiple needed)
- Completion message at threshold
- Completion when exceeding

#### Trustee List Display (6 tests)
- All trustee names
- "Share submitted" status
- "Awaiting share" status
- Checkmark icon
- Clock icon
- Mixed statuses

#### Copy Link Functionality (5 tests)
- Copy button display
- Copy to clipboard
- Checkmark after copy
- Reset after 2 seconds
- Clipboard API failure handling

#### External Link (3 tests)
- Link button display
- Correct URL
- New tab with security

#### Send Reminder (8 tests)
- Button for pending trustees
- No button for completed
- Dialog opening
- Trustee name in dialog
- Dialog description
- Cancel and Send buttons
- Close on Cancel
- Close on Send

#### Threshold States (6 tests)
- Threshold of 1
- Threshold equals total
- Exactly at threshold
- One below threshold
- Above threshold
- Various threshold scenarios

#### Edge Cases - Empty State (2 tests)
- No trustees handling
- Correct message with zero

#### Edge Cases - All Complete (2 tests)
- Completion when all decrypted
- No reminder buttons

#### XSS Prevention (8 tests)
- Script injection in trustee name
- Image tag injection
- JavaScript protocol
- SVG injection
- Election ID injection
- Various payloads

#### Unicode & Internationalization (4 tests)
- Unicode names (Japanese, Spanish, German)
- Emoji support
- RTL text (Arabic)
- Very long names

#### Large Datasets (2 tests)
- Many trustees (20+)
- High threshold values (100+)

#### URL Generation (4 tests)
- Correct election ID
- Special characters
- Custom domain
- Server-side rendering

#### Multiple Dialogs (1 test)
- Different trustee dialogs

#### Accessibility (3 tests)
- Heading structure
- Button accessibility
- Link attributes

#### Status Updates (1 test)
- Rerender with status changes

## Test Patterns Used

### Mocking
- `navigator.clipboard` API for copy functionality
- `window.print()` for print tests
- `window.location.origin` for URL generation
- `URL.createObjectURL` and `URL.revokeObjectURL`
- `next/navigation` router

### Testing Library Utilities
- `render` - Component rendering
- `screen` - DOM queries
- `userEvent` - User interactions
- `waitFor` - Async assertions
- `fireEvent` - Event simulation

### Test Helpers
- `createMockElection()` - Election factory
- `createMockCandidate()` - Candidate factory
- `createMockTrustee()` - Trustee factory

### Coverage Areas
- ✅ Component rendering
- ✅ User interactions
- ✅ State management
- ✅ Data display
- ✅ Edge cases
- ✅ Security (XSS)
- ✅ Internationalization
- ✅ Accessibility
- ✅ Error handling
- ✅ Large datasets

## Running the Tests

```bash
# Run all results tests
npm test -- results

# Run specific test file
npm test -- results-display.test.tsx
npm test -- decryption-status.test.tsx

# Run with coverage
npm test -- --coverage results

# Run in watch mode
npm test -- --watch results
```

## Maintenance Notes

- Update tests when adding new features
- Maintain test factories for consistency
- Follow existing patterns for new tests
- Keep test descriptions clear and specific
- Group related tests in describe blocks
