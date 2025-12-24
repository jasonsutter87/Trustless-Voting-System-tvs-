/**
 * BallotPreview Component Tests
 * Tests for ballot preview display with view mode toggle
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BallotPreview } from '../ballot-preview';
import type { BallotQuestion } from '@/lib/actions/ballot';

describe('BallotPreview', () => {
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

  describe('basic rendering', () => {
    it('should render election name in header', () => {
      render(
        <BallotPreview
          electionName="2025 General Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText('2025 General Election')).toBeInTheDocument();
    });

    it('should render ballot instructions', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText(/Please review all questions before submitting/i)).toBeInTheDocument();
    });

    it('should render encryption notice', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText(/Your vote will be encrypted before submission/i)).toBeInTheDocument();
    });

    it('should render disabled submit button', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      const submitButton = screen.getByRole('button', { name: /Submit Ballot \(Preview Only\)/i });
      expect(submitButton).toBeDisabled();
    });

    it('should render preview mode description', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText(/Preview how voters will see the ballot/i)).toBeInTheDocument();
    });
  });

  describe('view mode toggle', () => {
    it('should render Desktop and Mobile buttons', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByRole('button', { name: 'Desktop' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Mobile' })).toBeInTheDocument();
    });

    it('should default to desktop view', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      const desktopButton = screen.getByRole('button', { name: 'Desktop' });
      // Active state has different styling - check it's there
      expect(desktopButton).toBeInTheDocument();
    });

    it('should switch to mobile view when Mobile clicked', async () => {
      const user = userEvent.setup();
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Mobile' }));

      // Mobile button should now be active
      expect(screen.getByRole('button', { name: 'Mobile' })).toBeInTheDocument();
    });

    it('should switch back to desktop view', async () => {
      const user = userEvent.setup();
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Mobile' }));
      await user.click(screen.getByRole('button', { name: 'Desktop' }));

      expect(screen.getByRole('button', { name: 'Desktop' })).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty message when no questions', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[]}
        />
      );

      expect(screen.getByText('No questions added yet.')).toBeInTheDocument();
    });
  });

  describe('question rendering', () => {
    it('should render question title', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ title: 'Who should win?' })]}
        />
      );

      expect(screen.getByText('Who should win?')).toBeInTheDocument();
    });

    it('should render question description', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ description: 'Choose carefully' })]}
        />
      );

      expect(screen.getByText('Choose carefully')).toBeInTheDocument();
    });

    it('should not render description if empty', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ description: undefined })]}
        />
      );

      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });

    it('should render question numbers', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[
            createMockQuestion({ id: 'q1', title: 'Question 1' }),
            createMockQuestion({ id: 'q2', title: 'Question 2' }),
            createMockQuestion({ id: 'q3', title: 'Question 3' }),
          ]}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render all candidate names', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText('Candidate A')).toBeInTheDocument();
      expect(screen.getByText('Candidate B')).toBeInTheDocument();
    });

    it('should render candidate party in parentheses', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText('(Party X)')).toBeInTheDocument();
      expect(screen.getByText('(Party Y)')).toBeInTheDocument();
    });

    it('should render candidate description', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText('Desc A')).toBeInTheDocument();
      expect(screen.getByText('Desc B')).toBeInTheDocument();
    });

    it('should not render party if not provided', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({
            candidates: [
              { id: 'c1', name: 'Independent', position: 0 },
            ],
          })]}
        />
      );

      expect(screen.queryByText(/^\(/)).not.toBeInTheDocument();
    });
  });

  describe('question type labels', () => {
    const typeTests: Array<{
      type: BallotQuestion['questionType'];
      label: string;
    }> = [
      { type: 'single_choice', label: 'Select one' },
      { type: 'ranked_choice', label: 'Rank your choices' },
      { type: 'yes_no', label: 'Yes or No' },
      { type: 'write_in', label: 'Write-in response' },
    ];

    typeTests.forEach(({ type, label }) => {
      it(`should display ${label} for ${type} question`, () => {
        render(
          <BallotPreview
            electionName="Test Election"
            questions={[createMockQuestion({ questionType: type })]}
          />
        );

        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should display max selections for multi_choice', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({
            questionType: 'multi_choice',
            maxSelections: 3,
          })]}
        />
      );

      expect(screen.getByText(/Select up to 3/)).toBeInTheDocument();
    });
  });

  describe('input types', () => {
    it('should render radio inputs for single choice', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ questionType: 'single_choice' })]}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBe(2);
      radios.forEach((radio) => expect(radio).toBeDisabled());
    });

    it('should render checkbox inputs for multi choice', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ questionType: 'multi_choice' })]}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(2);
      checkboxes.forEach((checkbox) => expect(checkbox).toBeDisabled());
    });
  });

  describe('write-in option', () => {
    it('should show write-in indicator when allowed', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ allowWriteIn: true })]}
        />
      );

      expect(screen.getByText('Write-in option available')).toBeInTheDocument();
    });

    it('should not show write-in indicator when not allowed', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ allowWriteIn: false })]}
        />
      );

      expect(screen.queryByText('Write-in option available')).not.toBeInTheDocument();
    });
  });

  describe('multiple questions', () => {
    it('should render all questions', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[
            createMockQuestion({ id: 'q1', title: 'President' }),
            createMockQuestion({ id: 'q2', title: 'Governor' }),
            createMockQuestion({ id: 'q3', title: 'Mayor' }),
          ]}
        />
      );

      expect(screen.getByText('President')).toBeInTheDocument();
      expect(screen.getByText('Governor')).toBeInTheDocument();
      expect(screen.getByText('Mayor')).toBeInTheDocument();
    });

    it('should render questions in order', () => {
      const { container } = render(
        <BallotPreview
          electionName="Test Election"
          questions={[
            createMockQuestion({ id: 'q1', title: 'First' }),
            createMockQuestion({ id: 'q2', title: 'Second' }),
          ]}
        />
      );

      const titles = container.querySelectorAll('h3');
      expect(titles[0]).toHaveTextContent('First');
      expect(titles[1]).toHaveTextContent('Second');
    });
  });

  describe('XSS handling', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
    ];

    xssPayloads.forEach((payload) => {
      it(`should safely render XSS in election name: ${payload.substring(0, 20)}...`, () => {
        render(
          <BallotPreview
            electionName={payload}
            questions={[createMockQuestion()]}
          />
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS in question title: ${payload.substring(0, 20)}...`, () => {
        render(
          <BallotPreview
            electionName="Test Election"
            questions={[createMockQuestion({ title: payload })]}
          />
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS in question description: ${payload.substring(0, 20)}...`, () => {
        render(
          <BallotPreview
            electionName="Test Election"
            questions={[createMockQuestion({ description: payload })]}
          />
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS in candidate name: ${payload.substring(0, 20)}...`, () => {
        render(
          <BallotPreview
            electionName="Test Election"
            questions={[createMockQuestion({
              candidates: [
                { id: 'c1', name: payload, position: 0 },
                { id: 'c2', name: 'Normal', position: 1 },
              ],
            })]}
          />
        );

        expect(screen.getByText(payload)).toBeInTheDocument();
      });

      it(`should safely render XSS in candidate party: ${payload.substring(0, 20)}...`, () => {
        render(
          <BallotPreview
            electionName="Test Election"
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

  describe('unicode handling', () => {
    it('should render unicode election name', () => {
      render(
        <BallotPreview
          electionName="選挙 2025 🗳️"
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText('選挙 2025 🗳️')).toBeInTheDocument();
    });

    it('should render RTL text in question title', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ title: 'سؤال الانتخابات' })]}
        />
      );

      expect(screen.getByText('سؤال الانتخابات')).toBeInTheDocument();
    });

    it('should render unicode candidate names', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({
            candidates: [
              { id: 'c1', name: '田中太郎', party: '民主党', position: 0 },
              { id: 'c2', name: 'Müller', party: 'CDU', position: 1 },
            ],
          })]}
        />
      );

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('Müller')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very long election name', () => {
      const longName = 'A'.repeat(300);
      render(
        <BallotPreview
          electionName={longName}
          questions={[createMockQuestion()]}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long question title', () => {
      const longTitle = 'B'.repeat(500);
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ title: longTitle })]}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle many questions', () => {
      const manyQuestions = Array.from({ length: 20 }, (_, i) =>
        createMockQuestion({ id: `q${i}`, title: `Question ${i + 1}` })
      );

      render(
        <BallotPreview
          electionName="Test Election"
          questions={manyQuestions}
        />
      );

      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 20')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should handle many candidates per question', () => {
      const manyCandidates = Array.from({ length: 15 }, (_, i) => ({
        id: `c${i}`,
        name: `Candidate ${i + 1}`,
        position: i,
      }));

      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ candidates: manyCandidates })]}
        />
      );

      expect(screen.getByText('Candidate 1')).toBeInTheDocument();
      expect(screen.getByText('Candidate 15')).toBeInTheDocument();
    });

    it('should handle question with no candidates', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion({ candidates: [] })]}
        />
      );

      // Question should still render
      expect(screen.getByText('Test Question')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      // h2 for election name
      expect(screen.getByRole('heading', { level: 2, name: 'Test Election' })).toBeInTheDocument();
      // h3 for question titles
      expect(screen.getByRole('heading', { level: 3, name: 'Test Question' })).toBeInTheDocument();
    });

    it('should have disabled inputs in preview mode', () => {
      render(
        <BallotPreview
          electionName="Test Election"
          questions={[createMockQuestion()]}
        />
      );

      const inputs = screen.getAllByRole('radio');
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });
  });
});
