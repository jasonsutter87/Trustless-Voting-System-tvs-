/**
 * Test Utilities
 *
 * Common test helpers and utilities for the voter portal tests
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Election, BallotResponse, Credential, BallotQuestion } from '@/lib/actions/voting';

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent };

/**
 * Custom render function with providers and userEvent setup
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => ({
  user: userEvent.setup(),
  ...render(ui, { wrapper: AllTheProviders, ...options }),
});

export { customRender as render };

/**
 * Mock data generators for consistent test data
 */

export function createMockElection(overrides?: Partial<Election>): Election {
  return {
    id: 'election-1',
    name: '2024 General Election',
    description: 'National and local elections',
    startTime: '2024-11-01T00:00:00Z',
    endTime: '2024-11-05T23:59:59Z',
    status: 'voting',
    threshold: 3,
    totalTrustees: 5,
    publicKey: 'test-public-key',
    ...overrides,
  };
}

export function createMockCredential(overrides?: Partial<Credential>): Credential {
  return {
    electionId: 'election-1',
    nullifier: 'test-nullifier',
    message: 'test-message',
    signature: 'test-signature',
    ...overrides,
  };
}

export function createMockBallot(overrides?: Partial<BallotResponse>): BallotResponse {
  return {
    electionId: 'election-1',
    electionName: '2024 General Election',
    voter: {
      jurisdictionId: 'US',
      jurisdictionName: 'United States',
      jurisdictionCode: 'US',
    },
    jurisdictionChain: [
      { id: 'US', name: 'United States', code: 'US', level: 0 },
    ],
    sections: [
      {
        jurisdiction: {
          id: 'US',
          name: 'United States',
          type: 'federal',
          code: 'US',
          level: 0,
        },
        questions: [createMockQuestion()],
      },
    ],
    totalQuestions: 1,
    ...overrides,
  };
}

export function createMockQuestion(overrides?: Partial<BallotQuestion>): BallotQuestion {
  return {
    id: 'q1',
    electionId: 'election-1',
    jurisdictionId: 'US',
    title: 'President',
    description: 'Vote for President',
    questionType: 'single_choice',
    maxSelections: 1,
    allowWriteIn: false,
    displayOrder: 0,
    candidates: [
      {
        id: 'c1',
        name: 'Alice Johnson',
        party: 'Democratic',
        description: 'Former Senator',
        position: 0,
      },
      {
        id: 'c2',
        name: 'Bob Smith',
        party: 'Republican',
        description: 'Former Governor',
        position: 1,
      },
    ],
    ...overrides,
  };
}

/**
 * Session storage helpers
 */

export function setupSessionStorage(data: {
  credential?: Credential;
  selections?: Record<string, string | string[]>;
  confirmation?: object;
}) {
  if (data.credential) {
    sessionStorage.setItem('votingCredential', JSON.stringify(data.credential));
  }
  if (data.selections) {
    sessionStorage.setItem('ballotSelections', JSON.stringify(data.selections));
  }
  if (data.confirmation) {
    sessionStorage.setItem('voteConfirmation', JSON.stringify(data.confirmation));
  }
}

export function clearSessionStorage() {
  sessionStorage.clear();
}

/**
 * Mock navigation helpers
 */

export interface MockRouter {
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
  refresh: jest.Mock;
  prefetch: jest.Mock;
}

export function createMockRouter(overrides?: Partial<MockRouter>): MockRouter {
  return {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    ...overrides,
  };
}

/**
 * Form helpers
 */

export async function fillInput(
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  value: string
) {
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Wait helpers
 */

export const waitForMs = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Security test payloads
 */

export const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  'javascript:alert("xss")',
  '<svg onload=alert("xss")>',
  '"><script>alert("xss")</script>',
];

export const maliciousCredentials = [
  '{"electionId": "<script>alert(1)</script>", "nullifier": "test"}',
  '{"electionId": "test", "nullifier": "\'; DROP TABLE votes; --"}',
  '{}',
  '{"malformed": true}',
  'not-valid-json',
];
