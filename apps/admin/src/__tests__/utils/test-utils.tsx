import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render with providers
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

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { userEvent };

// Test data factories
export const createMockElection = (overrides: Partial<MockElection> = {}): MockElection => ({
  id: 'test-election-id',
  name: 'Test Election',
  description: 'Test election description',
  status: 'draft',
  startTime: '2025-01-01T00:00:00Z',
  endTime: '2025-01-02T00:00:00Z',
  threshold: 3,
  totalTrustees: 5,
  createdAt: '2024-12-24T00:00:00Z',
  ...overrides,
});

export interface MockElection {
  id: string;
  name: string;
  description: string;
  status: 'setup' | 'draft' | 'registration' | 'active' | 'tallying' | 'complete';
  startTime: string;
  endTime: string;
  threshold: number;
  totalTrustees: number;
  createdAt: string;
}

export const createMockQuestion = (overrides: Partial<MockQuestion> = {}): MockQuestion => ({
  id: 'test-question-id',
  title: 'Test Question',
  description: 'Test question description',
  questionType: 'single_choice',
  maxSelections: 1,
  allowWriteIn: false,
  position: 0,
  candidates: [
    { id: 'c1', name: 'Candidate 1', description: '', party: '', position: 0 },
    { id: 'c2', name: 'Candidate 2', description: '', party: '', position: 1 },
  ],
  ...overrides,
});

export interface MockQuestion {
  id: string;
  title: string;
  description: string;
  questionType: 'single_choice' | 'multi_choice' | 'ranked_choice' | 'yes_no' | 'write_in';
  maxSelections: number;
  allowWriteIn: boolean;
  position: number;
  candidates: MockCandidate[];
}

export interface MockCandidate {
  id: string;
  name: string;
  description: string;
  party: string;
  position: number;
}

export const createMockTrustee = (overrides: Partial<MockTrustee> = {}): MockTrustee => ({
  id: 'test-trustee-id',
  email: 'trustee@example.com',
  name: 'Test Trustee',
  status: 'pending',
  registeredAt: null,
  ...overrides,
});

export interface MockTrustee {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'registered' | 'committed';
  registeredAt: string | null;
}

// Security test helpers
export const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  'javascript:alert("xss")',
  '<svg onload=alert("xss")>',
  '"><script>alert("xss")</script>',
  "'-alert('xss')-'",
  '<body onload=alert("xss")>',
  '<iframe src="javascript:alert(\'xss\')">',
];

export const sqlInjectionPayloads = [
  "'; DROP TABLE elections;--",
  "1' OR '1'='1",
  "1; SELECT * FROM users",
  "' UNION SELECT * FROM elections--",
  "admin'--",
  "1' AND 1=1--",
];

export const pathTraversalPayloads = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '....//....//....//etc/passwd',
];

export const commandInjectionPayloads = [
  '; ls -la',
  '| cat /etc/passwd',
  '`rm -rf /`',
  '$(whoami)',
  '&& echo vulnerable',
];

// Wait helpers
export const waitFor = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Form helpers
export const fillInput = async (
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLElement,
  value: string
) => {
  await user.clear(input);
  await user.type(input, value);
};
