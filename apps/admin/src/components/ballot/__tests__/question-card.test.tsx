/**
 * QuestionCard Component Tests
 * Tests for displaying ballot question information
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionCard } from '../question-card';
import type { BallotQuestion } from '@/lib/actions/ballot';

describe('QuestionCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

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
      { id: 'c1', name: 'Candidate A', description: 'Desc A', party: 'Party X', position: 0 },
      { id: 'c2', name: 'Candidate B', description: 'Desc B', party: 'Party Y', position: 1 },
    ],
    createdAt: '2024-12-24T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should render question title', () => {
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });

    it('should render question description', () => {
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render display order number', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ displayOrder: 2 })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument(); // displayOrder + 1
    });

    it('should not render description if empty', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ description: undefined })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });
  });

  describe('question type labels', () => {
    const typeTests: Array<{ type: BallotQuestion['questionType']; label: string }> = [
      { type: 'single_choice', label: 'Single Choice' },
      { type: 'multi_choice', label: 'Multiple Choice' },
      { type: 'ranked_choice', label: 'Ranked Choice' },
      { type: 'yes_no', label: 'Yes/No' },
      { type: 'write_in', label: 'Write-In' },
    ];

    typeTests.forEach(({ type, label }) => {
      it(`should display ${label} for ${type} question`, () => {
        render(
          <QuestionCard
            question={createMockQuestion({ questionType: type })}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        );

        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('candidates display', () => {
    it('should display candidate count', () => {
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('2 options')).toBeInTheDocument();
    });

    it('should display candidate names', () => {
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Candidate A')).toBeInTheDocument();
      expect(screen.getByText('Candidate B')).toBeInTheDocument();
    });

    it('should display candidate party in parentheses', () => {
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('(Party X)')).toBeInTheDocument();
      expect(screen.getByText('(Party Y)')).toBeInTheDocument();
    });

    it('should handle candidates without party', () => {
      render(
        <QuestionCard
          question={createMockQuestion({
            candidates: [
              { id: 'c1', name: 'No Party Candidate', position: 0 },
            ],
          })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('No Party Candidate')).toBeInTheDocument();
      expect(screen.getByText('1 options')).toBeInTheDocument();
    });

    it('should handle many candidates', () => {
      const manyCandidates = Array.from({ length: 10 }, (_, i) => ({
        id: `c${i}`,
        name: `Candidate ${i + 1}`,
        position: i,
      }));

      render(
        <QuestionCard
          question={createMockQuestion({ candidates: manyCandidates })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('10 options')).toBeInTheDocument();
      expect(screen.getByText('Candidate 1')).toBeInTheDocument();
      expect(screen.getByText('Candidate 10')).toBeInTheDocument();
    });
  });

  describe('multi-choice configuration', () => {
    it('should show max selections badge for multi_choice', () => {
      render(
        <QuestionCard
          question={createMockQuestion({
            questionType: 'multi_choice',
            maxSelections: 3,
          })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Select up to 3')).toBeInTheDocument();
    });

    it('should not show max selections badge when maxSelections is 1', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ maxSelections: 1 })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/Select up to/)).not.toBeInTheDocument();
    });
  });

  describe('write-in configuration', () => {
    it('should show write-in badge when allowed', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ allowWriteIn: true })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Write-in allowed')).toBeInTheDocument();
    });

    it('should not show write-in badge when not allowed', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ allowWriteIn: false })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText('Write-in allowed')).not.toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]); // First button is edit

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const buttons = screen.getAllByRole('button');
      await user.click(buttons[1]); // Second button is delete

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('should have both edit and delete buttons', () => {
      render(
        <QuestionCard
          question={createMockQuestion()}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('XSS handling', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
    ];

    xssPayloads.forEach((payload) => {
      it(`should safely render XSS payload in title: ${payload.substring(0, 20)}...`, () => {
        render(
          <QuestionCard
            question={createMockQuestion({ title: payload })}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        );

        // React escapes by default - text should appear literally
        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS payload in description: ${payload.substring(0, 20)}...`, () => {
        render(
          <QuestionCard
            question={createMockQuestion({ description: payload })}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS payload in candidate name: ${payload.substring(0, 20)}...`, () => {
        render(
          <QuestionCard
            question={createMockQuestion({
              candidates: [
                { id: 'c1', name: payload, position: 0 },
                { id: 'c2', name: 'Normal', position: 1 },
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

  describe('unicode handling', () => {
    it('should render unicode in title', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ title: '選挙の質問 🗳️' })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('選挙の質問 🗳️')).toBeInTheDocument();
    });

    it('should render RTL text in description', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ description: 'سؤال الانتخابات' })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('سؤال الانتخابات')).toBeInTheDocument();
    });

    it('should render unicode candidate names', () => {
      render(
        <QuestionCard
          question={createMockQuestion({
            candidates: [
              { id: 'c1', name: '田中太郎', party: '民主党', position: 0 },
              { id: 'c2', name: 'Müller', party: 'CDU', position: 1 },
            ],
          })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('Müller')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(500);
      render(
        <QuestionCard
          question={createMockQuestion({ title: longTitle })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long description', () => {
      const longDesc = 'B'.repeat(1000);
      render(
        <QuestionCard
          question={createMockQuestion({ description: longDesc })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it('should handle high display order', () => {
      render(
        <QuestionCard
          question={createMockQuestion({ displayOrder: 999 })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('1000')).toBeInTheDocument();
    });

    it('should handle high maxSelections', () => {
      render(
        <QuestionCard
          question={createMockQuestion({
            questionType: 'multi_choice',
            maxSelections: 100,
          })}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Select up to 100')).toBeInTheDocument();
    });
  });
});
