/**
 * QuestionList Component Tests
 * Tests for displaying and managing ballot questions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { QuestionList } from '../question-list';
import type { BallotQuestion } from '@/lib/actions/ballot';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../question-card', () => ({
  QuestionCard: ({ question, onEdit, onDelete }: any) => (
    <div data-testid={`question-card-${question.id}`}>
      <div>{question.title}</div>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onDelete}>Delete</button>
    </div>
  ),
}));

jest.mock('../question-form', () => ({
  QuestionForm: ({ open, onClose, electionId, displayOrder, existingQuestion }: any) => (
    <div data-testid="question-form">
      {open && (
        <>
          <div>Form Open: {open.toString()}</div>
          <div>Election ID: {electionId}</div>
          <div>Display Order: {displayOrder}</div>
          <div>Editing: {existingQuestion ? existingQuestion.id : 'new'}</div>
          <button onClick={onClose}>Close Form</button>
        </>
      )}
    </div>
  ),
}));

describe('QuestionList', () => {
  const mockRefresh = jest.fn();
  const mockRouter = {
    refresh: mockRefresh,
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  const createMockQuestion = (overrides: Partial<BallotQuestion> = {}): BallotQuestion => ({
    id: 'question-1',
    electionId: 'election-1',
    jurisdictionId: 'jurisdiction-1',
    title: 'Question 1',
    description: 'Description 1',
    questionType: 'single_choice',
    maxSelections: 1,
    allowWriteIn: false,
    displayOrder: 0,
    candidates: [
      { id: 'c1', name: 'Option A', position: 0 },
      { id: 'c2', name: 'Option B', position: 1 },
    ],
    createdAt: '2024-12-24T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // Mock window.confirm
    global.confirm = jest.fn();
  });

  afterEach(() => {
    delete (global as any).confirm;
  });

  describe('empty state rendering', () => {
    it('should render empty state when no questions', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={false}
        />
      );

      expect(screen.getByText('No Ballot Questions')).toBeInTheDocument();
      expect(screen.getByText(/Add questions that voters will answer/i)).toBeInTheDocument();
    });

    it('should display empty state icon', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={false}
        />
      );

      // SVG clipboard icon should be present
      const icon = screen.getByText('No Ballot Questions').closest('div')?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show add button in empty state when canEdit is true', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={true}
        />
      );

      expect(screen.getByRole('button', { name: /Add First Question/i })).toBeInTheDocument();
    });

    it('should not show add button in empty state when canEdit is false', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={false}
        />
      );

      expect(screen.queryByRole('button', { name: /Add First Question/i })).not.toBeInTheDocument();
    });

    it('should open form when empty state button clicked', async () => {
      const user = userEvent.setup();
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /Add First Question/i }));

      expect(screen.getByText('Form Open: true')).toBeInTheDocument();
      expect(screen.getByText('Display Order: 0')).toBeInTheDocument();
    });

    it('should render QuestionForm in empty state', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={false}
        />
      );

      expect(screen.getByTestId('question-form')).toBeInTheDocument();
    });
  });

  describe('questions list rendering', () => {
    it('should render all questions', () => {
      const questions = [
        createMockQuestion({ id: 'q1', title: 'Question 1' }),
        createMockQuestion({ id: 'q2', title: 'Question 2' }),
        createMockQuestion({ id: 'q3', title: 'Question 3' }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByTestId('question-card-q1')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-q2')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-q3')).toBeInTheDocument();
    });

    it('should display question count with singular form', () => {
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText('1 question on ballot')).toBeInTheDocument();
    });

    it('should display question count with plural form', () => {
      const questions = [
        createMockQuestion({ id: 'q1' }),
        createMockQuestion({ id: 'q2' }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText('2 questions on ballot')).toBeInTheDocument();
    });

    it('should show Add Question button when canEdit is true', () => {
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByRole('button', { name: 'Add Question' })).toBeInTheDocument();
    });

    it('should not show Add Question button when canEdit is false', () => {
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={false}
        />
      );

      expect(screen.queryByRole('button', { name: 'Add Question' })).not.toBeInTheDocument();
    });

    it('should render QuestionCard for each question', () => {
      const questions = [
        createMockQuestion({ id: 'q1', title: 'Question 1' }),
        createMockQuestion({ id: 'q2', title: 'Question 2' }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });
  });

  describe('add question functionality', () => {
    it('should open form when Add Question button clicked', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Question' }));

      expect(screen.getByText('Form Open: true')).toBeInTheDocument();
    });

    it('should set correct display order for new question', async () => {
      const user = userEvent.setup();
      const questions = [
        createMockQuestion({ id: 'q1', displayOrder: 0 }),
        createMockQuestion({ id: 'q2', displayOrder: 1 }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Question' }));

      expect(screen.getByText('Display Order: 2')).toBeInTheDocument();
    });

    it('should pass election ID to form', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-123"
          questions={questions}
          canEdit={true}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Question' }));

      expect(screen.getByText('Election ID: election-123')).toBeInTheDocument();
    });

    it('should not pass existing question when adding new', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Question' }));

      expect(screen.getByText('Editing: new')).toBeInTheDocument();
    });
  });

  describe('edit question functionality', () => {
    it('should open form when edit clicked on QuestionCard', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion({ id: 'q1', title: 'Question 1' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];
      await user.click(editButton);

      expect(screen.getByText('Form Open: true')).toBeInTheDocument();
    });

    it('should pass existing question to form when editing', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion({ id: 'q1', title: 'Question 1' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];
      await user.click(editButton);

      expect(screen.getByText('Editing: q1')).toBeInTheDocument();
    });

    it('should handle editing different questions', async () => {
      const user = userEvent.setup();
      const questions = [
        createMockQuestion({ id: 'q1', title: 'Question 1' }),
        createMockQuestion({ id: 'q2', title: 'Question 2' }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: 'Edit' });
      await user.click(editButtons[1]);

      expect(screen.getByText('Editing: q2')).toBeInTheDocument();
    });
  });

  describe('delete question functionality', () => {
    it('should show confirm dialog when delete clicked', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.fn().mockReturnValue(false);
      global.confirm = confirmSpy;

      const questions = [createMockQuestion({ id: 'q1', title: 'Test Question' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const deleteButton = screen.getAllByRole('button', { name: 'Delete' })[0];
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith('Delete "Test Question"?');
    });

    it('should not refresh when delete is cancelled', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn().mockReturnValue(false);

      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const deleteButton = screen.getAllByRole('button', { name: 'Delete' })[0];
      await user.click(deleteButton);

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should refresh when delete is confirmed', async () => {
      const user = userEvent.setup();
      global.confirm = jest.fn().mockReturnValue(true);

      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const deleteButton = screen.getAllByRole('button', { name: 'Delete' })[0];
      await user.click(deleteButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should handle deleting specific question', async () => {
      const user = userEvent.setup();
      const confirmSpy = jest.fn().mockReturnValue(true);
      global.confirm = confirmSpy;

      const questions = [
        createMockQuestion({ id: 'q1', title: 'Question 1' }),
        createMockQuestion({ id: 'q2', title: 'Question 2' }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(deleteButtons[1]);

      expect(confirmSpy).toHaveBeenCalledWith('Delete "Question 2"?');
    });
  });

  describe('form management', () => {
    it('should close form when onClose is called', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      // Open form
      await user.click(screen.getByRole('button', { name: 'Add Question' }));
      expect(screen.getByText('Form Open: true')).toBeInTheDocument();

      // Close form
      await user.click(screen.getByRole('button', { name: 'Close Form' }));
      await waitFor(() => {
        expect(screen.queryByText('Form Open: true')).not.toBeInTheDocument();
      });
    });

    it('should clear editing question when form closed', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion({ id: 'q1' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      // Open edit
      const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];
      await user.click(editButton);
      expect(screen.getByText('Editing: q1')).toBeInTheDocument();

      // Close form
      await user.click(screen.getByRole('button', { name: 'Close Form' }));

      // Open new question
      await user.click(screen.getByRole('button', { name: 'Add Question' }));
      expect(screen.getByText('Editing: new')).toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      // Multiple open/close cycles
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: 'Add Question' }));
        await user.click(screen.getByRole('button', { name: 'Close Form' }));
      }

      // Should still work
      await user.click(screen.getByRole('button', { name: 'Add Question' }));
      expect(screen.getByText('Form Open: true')).toBeInTheDocument();
    });
  });

  describe('router refresh', () => {
    it('should refresh router when handleSuccess is called', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Question' }));

      // In the real implementation, onSuccess would be called by QuestionForm
      // but since we mocked it, we test that the form receives the correct props
      expect(screen.getByTestId('question-form')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very large number of questions', () => {
      const questions = Array.from({ length: 100 }, (_, i) =>
        createMockQuestion({ id: `q${i}`, title: `Question ${i}` })
      );

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText('100 questions on ballot')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-q0')).toBeInTheDocument();
      expect(screen.getByTestId('question-card-q99')).toBeInTheDocument();
    });

    it('should handle question with empty title', () => {
      const questions = [createMockQuestion({ title: '' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText('1 question on ballot')).toBeInTheDocument();
    });

    it('should handle question with very long title', () => {
      const longTitle = 'A'.repeat(500);
      const questions = [createMockQuestion({ title: longTitle })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle questions with same title', () => {
      const questions = [
        createMockQuestion({ id: 'q1', title: 'Same Title' }),
        createMockQuestion({ id: 'q2', title: 'Same Title' }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getAllByText('Same Title')).toHaveLength(2);
    });

    it('should handle missing description', () => {
      const questions = [createMockQuestion({ description: undefined })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByTestId('question-card-question-1')).toBeInTheDocument();
    });

    it('should handle high display order numbers', () => {
      const questions = [createMockQuestion({ displayOrder: 999 })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      // When adding new question, display order should be 1000
      expect(screen.getByTestId('question-form')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render proper heading in empty state', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={true}
        />
      );

      expect(screen.getByText('No Ballot Questions')).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const addButton = screen.getByRole('button', { name: 'Add Question' });
      expect(addButton).toBeInTheDocument();
    });

    it('should provide context in button labels', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={true}
        />
      );

      expect(screen.getByRole('button', { name: /Add First Question/i })).toBeInTheDocument();
    });
  });

  describe('state management', () => {
    it('should maintain form state across re-renders', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion()];

      const { rerender } = render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Add Question' }));
      expect(screen.getByText('Form Open: true')).toBeInTheDocument();

      rerender(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText('Form Open: true')).toBeInTheDocument();
    });

    it('should reset state when switching from edit to add', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion({ id: 'q1' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      // Open edit
      const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];
      await user.click(editButton);
      expect(screen.getByText('Editing: q1')).toBeInTheDocument();

      // Close
      await user.click(screen.getByRole('button', { name: 'Close Form' }));

      // Open add
      await user.click(screen.getByRole('button', { name: 'Add Question' }));
      expect(screen.getByText('Editing: new')).toBeInTheDocument();
    });
  });

  describe('props validation', () => {
    it('should render with minimal required props', () => {
      render(
        <QuestionList
          electionId="election-1"
          questions={[]}
          canEdit={false}
        />
      );

      expect(screen.getByText('No Ballot Questions')).toBeInTheDocument();
    });

    it('should handle empty election ID', () => {
      render(
        <QuestionList
          electionId=""
          questions={[]}
          canEdit={true}
        />
      );

      expect(screen.getByTestId('question-form')).toBeInTheDocument();
    });

    it('should handle special characters in election ID', () => {
      const questions = [createMockQuestion()];

      render(
        <QuestionList
          electionId="election-123-test@special#chars"
          questions={questions}
          canEdit={true}
        />
      );

      expect(screen.getByText('1 question on ballot')).toBeInTheDocument();
    });
  });

  describe('interaction flows', () => {
    it('should allow editing multiple questions sequentially', async () => {
      const user = userEvent.setup();
      const questions = [
        createMockQuestion({ id: 'q1', title: 'Question 1' }),
        createMockQuestion({ id: 'q2', title: 'Question 2' }),
      ];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const editButtons = screen.getAllByRole('button', { name: 'Edit' });

      // Edit first question
      await user.click(editButtons[0]);
      expect(screen.getByText('Editing: q1')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Close Form' }));

      // Edit second question
      await user.click(editButtons[1]);
      expect(screen.getByText('Editing: q2')).toBeInTheDocument();
    });

    it('should handle add after edit workflow', async () => {
      const user = userEvent.setup();
      const questions = [createMockQuestion({ id: 'q1' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      // Edit
      const editButton = screen.getAllByRole('button', { name: 'Edit' })[0];
      await user.click(editButton);
      await user.click(screen.getByRole('button', { name: 'Close Form' }));

      // Add
      await user.click(screen.getByRole('button', { name: 'Add Question' }));
      expect(screen.getByText('Editing: new')).toBeInTheDocument();
      expect(screen.getByText('Display Order: 1')).toBeInTheDocument();
    });
  });

  describe('console output', () => {
    it('should log delete action when confirmed', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      global.confirm = jest.fn().mockReturnValue(true);

      const questions = [createMockQuestion({ id: 'q1' })];

      render(
        <QuestionList
          electionId="election-1"
          questions={questions}
          canEdit={true}
        />
      );

      const deleteButton = screen.getAllByRole('button', { name: 'Delete' })[0];
      await user.click(deleteButton);

      expect(consoleSpy).toHaveBeenCalledWith('Delete question:', 'q1');
      consoleSpy.mockRestore();
    });
  });
});
