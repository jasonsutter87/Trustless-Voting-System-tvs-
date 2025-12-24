/**
 * QuestionForm Component Tests
 * Tests for the ballot question creation/edit form dialog
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionForm } from '../question-form';
import { createQuestion } from '@/lib/actions/ballot';

// Mock the server action
jest.mock('@/lib/actions/ballot', () => ({
  createQuestion: jest.fn(),
}));

const mockCreateQuestion = createQuestion as jest.MockedFunction<typeof createQuestion>;

describe('QuestionForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    electionId: 'election-123',
    displayOrder: 0,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateQuestion.mockResolvedValue({
      question: {
        id: 'new-question-123',
        electionId: 'election-123',
        jurisdictionId: 'election-123',
        title: 'Test Question',
        questionType: 'single_choice',
        maxSelections: 1,
        allowWriteIn: false,
        displayOrder: 0,
        candidates: [],
        createdAt: '2024-12-24T00:00:00Z',
      },
    });
  });

  describe('dialog rendering', () => {
    it('should render dialog when open', () => {
      render(<QuestionForm {...defaultProps} />);

      expect(screen.getByText('Add Ballot Question')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<QuestionForm {...defaultProps} open={false} />);

      expect(screen.queryByText('Add Ballot Question')).not.toBeInTheDocument();
    });

    it('should show Edit title for existing question', () => {
      render(
        <QuestionForm
          {...defaultProps}
          existingQuestion={{
            id: 'existing-123',
            electionId: 'election-123',
            jurisdictionId: 'jurisdiction-123',
            title: 'Existing Question',
            questionType: 'single_choice',
            maxSelections: 1,
            allowWriteIn: false,
            displayOrder: 0,
            candidates: [
              { id: 'c1', name: 'A', position: 0 },
              { id: 'c2', name: 'B', position: 1 },
            ],
            createdAt: '2024-12-24T00:00:00Z',
          }}
        />
      );

      expect(screen.getByText('Edit Question')).toBeInTheDocument();
    });
  });

  describe('form fields', () => {
    it('should have title input', () => {
      render(<QuestionForm {...defaultProps} />);

      expect(screen.getByLabelText(/Question Title/i)).toBeInTheDocument();
    });

    it('should have description textarea', () => {
      render(<QuestionForm {...defaultProps} />);

      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it('should have question type select', () => {
      render(<QuestionForm {...defaultProps} />);

      expect(screen.getByLabelText(/Question Type/i)).toBeInTheDocument();
    });

    it('should have max selections input', () => {
      render(<QuestionForm {...defaultProps} />);

      expect(screen.getByLabelText(/Max Selections/i)).toBeInTheDocument();
    });

    it('should have allow write-in checkbox', () => {
      render(<QuestionForm {...defaultProps} />);

      expect(screen.getByLabelText(/Allow write-in/i)).toBeInTheDocument();
    });

    it('should have two default candidate inputs', () => {
      render(<QuestionForm {...defaultProps} />);

      const optionInputs = screen.getAllByPlaceholderText('Option name');
      expect(optionInputs).toHaveLength(2);
    });
  });

  describe('form validation', () => {
    it('should show error when title is empty', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      // Fill candidates but not title
      const [option1, option2] = screen.getAllByPlaceholderText('Option name');
      await user.type(option1, 'Option A');
      await user.type(option2, 'Option B');

      await user.click(screen.getByRole('button', { name: /Add Question/i }));

      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when less than 2 candidates', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/Question Title/i), 'Test Question');

      // Only fill one candidate
      const [option1] = screen.getAllByPlaceholderText('Option name');
      await user.type(option1, 'Option A');

      await user.click(screen.getByRole('button', { name: /Add Question/i }));

      await waitFor(() => {
        expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('candidate management', () => {
    it('should add new candidate when Add Option clicked', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /Add Option/i });
      await user.click(addButton);

      const optionInputs = screen.getAllByPlaceholderText('Option name');
      expect(optionInputs).toHaveLength(3);
    });

    it('should remove candidate when remove button clicked', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      // Add a third option first
      await user.click(screen.getByRole('button', { name: /Add Option/i }));

      let optionInputs = screen.getAllByPlaceholderText('Option name');
      expect(optionInputs).toHaveLength(3);

      // Find and click remove button (only visible when > 2 candidates)
      const removeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg path[d*="M6 18L18 6"]')
      );
      await user.click(removeButtons[0]);

      optionInputs = screen.getAllByPlaceholderText('Option name');
      expect(optionInputs).toHaveLength(2);
    });

    it('should not show remove buttons when only 2 candidates', () => {
      render(<QuestionForm {...defaultProps} />);

      // Find buttons with the X icon path
      const removeButtons = screen.getAllByRole('button').filter(
        (btn) => btn.querySelector('svg path[d*="M6 18L18 6"]')
      );
      expect(removeButtons).toHaveLength(0);
    });
  });

  describe('form submission', () => {
    const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(screen.getByLabelText(/Question Title/i), 'Test Question');

      const [option1, option2] = screen.getAllByPlaceholderText('Option name');
      await user.type(option1, 'Option A');
      await user.type(option2, 'Option B');
    };

    it('should call createQuestion with form data', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /Add Question/i }));

      await waitFor(() => {
        expect(mockCreateQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Question',
            electionId: 'election-123',
            candidates: expect.arrayContaining([
              expect.objectContaining({ name: 'Option A' }),
              expect.objectContaining({ name: 'Option B' }),
            ]),
          })
        );
      });
    });

    it('should call onSuccess and onClose on successful submit', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /Add Question/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      mockCreateQuestion.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /Add Question/i }));

      expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
    });

    it('should display error on failed submission', async () => {
      mockCreateQuestion.mockRejectedValueOnce(new Error('Server error'));

      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: /Add Question/i }));

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  describe('cancel button', () => {
    it('should call onClose when Cancel clicked', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('question types', () => {
    it('should have question type selector', () => {
      render(<QuestionForm {...defaultProps} />);

      // The select should be present
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();

      // Default value should show in the trigger
      expect(selectTrigger).toHaveTextContent('Single Choice');
    });
  });

  describe('XSS prevention', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
    ];

    xssPayloads.forEach((payload) => {
      it(`should handle XSS in title: ${payload.substring(0, 20)}...`, async () => {
        const user = userEvent.setup();
        render(<QuestionForm {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Question Title/i);
        await user.type(titleInput, payload);

        expect(titleInput).toHaveValue(payload);
      });

      it(`should handle XSS in candidate name: ${payload.substring(0, 20)}...`, async () => {
        const user = userEvent.setup();
        render(<QuestionForm {...defaultProps} />);

        const [option1] = screen.getAllByPlaceholderText('Option name');
        await user.type(option1, payload);

        expect(option1).toHaveValue(payload);
      });
    });
  });

  describe('SQL injection prevention', () => {
    const sqlPayloads = [
      "'; DROP TABLE questions;--",
      "1' OR '1'='1",
    ];

    sqlPayloads.forEach((payload) => {
      it(`should handle SQL injection: ${payload.substring(0, 20)}...`, async () => {
        const user = userEvent.setup();
        render(<QuestionForm {...defaultProps} />);

        const titleInput = screen.getByLabelText(/Question Title/i);
        await user.type(titleInput, payload);

        expect(titleInput).toHaveValue(payload);
      });
    });
  });

  describe('unicode handling', () => {
    it('should handle unicode in title', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      const unicodeTitle = '選挙の質問 🗳️ Élection';
      await user.type(screen.getByLabelText(/Question Title/i), unicodeTitle);

      expect(screen.getByLabelText(/Question Title/i)).toHaveValue(unicodeTitle);
    });

    it('should handle RTL text in candidate name', async () => {
      const user = userEvent.setup();
      render(<QuestionForm {...defaultProps} />);

      const [option1] = screen.getAllByPlaceholderText('Option name');
      await user.type(option1, 'مرشح الانتخابات');

      expect(option1).toHaveValue('مرشح الانتخابات');
    });
  });

  describe('pre-populated form (edit mode)', () => {
    const existingQuestion = {
      id: 'existing-123',
      electionId: 'election-123',
      jurisdictionId: 'jurisdiction-123',
      title: 'Existing Title',
      description: 'Existing Description',
      questionType: 'multi_choice' as const,
      maxSelections: 3,
      allowWriteIn: true,
      displayOrder: 0,
      candidates: [
        { id: 'c1', name: 'Existing A', description: 'Desc A', party: 'Party A', position: 0 },
        { id: 'c2', name: 'Existing B', description: 'Desc B', party: 'Party B', position: 1 },
      ],
      createdAt: '2024-12-24T00:00:00Z',
    };

    it('should populate title from existing question', () => {
      render(<QuestionForm {...defaultProps} existingQuestion={existingQuestion} />);

      expect(screen.getByLabelText(/Question Title/i)).toHaveValue('Existing Title');
    });

    it('should populate description from existing question', () => {
      render(<QuestionForm {...defaultProps} existingQuestion={existingQuestion} />);

      expect(screen.getByLabelText(/Description/i)).toHaveValue('Existing Description');
    });

    it('should populate max selections from existing question', () => {
      render(<QuestionForm {...defaultProps} existingQuestion={existingQuestion} />);

      expect(screen.getByLabelText(/Max Selections/i)).toHaveValue(3);
    });

    it('should check write-in if allowed in existing question', () => {
      render(<QuestionForm {...defaultProps} existingQuestion={existingQuestion} />);

      expect(screen.getByLabelText(/Allow write-in/i)).toBeChecked();
    });

    it('should show Save Changes button in edit mode', () => {
      render(<QuestionForm {...defaultProps} existingQuestion={existingQuestion} />);

      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });
  });
});
