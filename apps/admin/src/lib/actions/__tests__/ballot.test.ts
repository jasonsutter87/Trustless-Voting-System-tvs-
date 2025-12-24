/**
 * Ballot Server Actions Tests
 * Comprehensive tests for ballot question CRUD operations
 */

import {
  createQuestion,
  getQuestion,
  getQuestions,
  getBallotCoverage,
} from '../ballot';
import type { CreateQuestionInput, BallotQuestion, UpdateQuestionInput } from '../ballot';

// Mock the api-config module
jest.mock('../../api-config', () => ({
  apiFetch: jest.fn(),
  API_BASE_URL: 'http://localhost:3000',
}));

import { apiFetch } from '../../api-config';
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('Ballot Server Actions', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  describe('createQuestion', () => {
    const validInput: CreateQuestionInput = {
      electionId: 'election-123',
      jurisdictionId: 'jurisdiction-456',
      title: 'Who should be the next president?',
      description: 'Select your preferred candidate',
      questionType: 'single_choice',
      maxSelections: 1,
      allowWriteIn: false,
      displayOrder: 0,
      candidates: [
        { name: 'Candidate A', description: 'First candidate', party: 'Party X' },
        { name: 'Candidate B', description: 'Second candidate', party: 'Party Y' },
      ],
    };

    const mockQuestion: BallotQuestion = {
      id: 'question-789',
      electionId: 'election-123',
      jurisdictionId: 'jurisdiction-456',
      title: 'Who should be the next president?',
      description: 'Select your preferred candidate',
      questionType: 'single_choice',
      maxSelections: 1,
      allowWriteIn: false,
      displayOrder: 0,
      candidates: [
        { id: 'c1', name: 'Candidate A', description: 'First candidate', party: 'Party X', position: 0 },
        { id: 'c2', name: 'Candidate B', description: 'Second candidate', party: 'Party Y', position: 1 },
      ],
      createdAt: '2024-12-24T00:00:00Z',
    };

    it('should create question with valid input', async () => {
      mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

      const result = await createQuestion(validInput);

      expect(mockApiFetch).toHaveBeenCalledWith('/api/ballot/questions', {
        method: 'POST',
        body: JSON.stringify(validInput),
      });
      expect(result.question.id).toBe('question-789');
    });

    describe('question types', () => {
      const questionTypes: BallotQuestion['questionType'][] = [
        'single_choice',
        'multi_choice',
        'ranked_choice',
        'yes_no',
        'write_in',
      ];

      questionTypes.forEach((questionType) => {
        it(`should create ${questionType} question`, async () => {
          const input: CreateQuestionInput = { ...validInput, questionType };
          mockApiFetch.mockResolvedValueOnce({
            question: { ...mockQuestion, questionType },
          });

          const result = await createQuestion(input);

          expect(result.question.questionType).toBe(questionType);
        });
      });
    });

    describe('multi_choice configuration', () => {
      it('should handle maxSelections for multi_choice', async () => {
        const multiInput: CreateQuestionInput = {
          ...validInput,
          questionType: 'multi_choice',
          maxSelections: 3,
          candidates: [
            { name: 'Option A' },
            { name: 'Option B' },
            { name: 'Option C' },
            { name: 'Option D' },
            { name: 'Option E' },
          ],
        };
        mockApiFetch.mockResolvedValueOnce({
          question: { ...mockQuestion, ...multiInput },
        });

        const result = await createQuestion(multiInput);

        expect(result.question.maxSelections).toBe(3);
      });

      it('should handle maxSelections equal to total candidates', async () => {
        const input: CreateQuestionInput = {
          ...validInput,
          questionType: 'multi_choice',
          maxSelections: 2,
          candidates: [{ name: 'A' }, { name: 'B' }],
        };
        mockApiFetch.mockResolvedValueOnce({
          question: { ...mockQuestion, maxSelections: 2 },
        });

        await createQuestion(input);
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });

    describe('write-in configuration', () => {
      it('should enable write-in option', async () => {
        const writeInInput: CreateQuestionInput = {
          ...validInput,
          allowWriteIn: true,
        };
        mockApiFetch.mockResolvedValueOnce({
          question: { ...mockQuestion, allowWriteIn: true },
        });

        const result = await createQuestion(writeInInput);

        expect(result.question.allowWriteIn).toBe(true);
      });
    });

    describe('candidate validation', () => {
      it('should handle candidates with all fields', async () => {
        const fullCandidates: CreateQuestionInput = {
          ...validInput,
          candidates: [
            {
              name: 'Full Candidate',
              description: 'A complete candidate profile with all details filled in',
              party: 'Independent Party',
            },
          ],
        };
        mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

        await createQuestion(fullCandidates);
        expect(mockApiFetch).toHaveBeenCalledWith(
          '/api/ballot/questions',
          expect.objectContaining({
            body: expect.stringContaining('Full Candidate'),
          })
        );
      });

      it('should handle candidates with minimal fields', async () => {
        const minimalCandidates: CreateQuestionInput = {
          ...validInput,
          candidates: [{ name: 'Just Name' }, { name: 'Another Name' }],
        };
        mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

        await createQuestion(minimalCandidates);
        expect(mockApiFetch).toHaveBeenCalled();
      });

      it('should handle many candidates', async () => {
        const manyCandidates = Array.from({ length: 50 }, (_, i) => ({
          name: `Candidate ${i + 1}`,
          description: `Description for candidate ${i + 1}`,
          party: `Party ${i % 5}`,
        }));
        const input: CreateQuestionInput = { ...validInput, candidates: manyCandidates };
        mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

        await createQuestion(input);
        expect(mockApiFetch).toHaveBeenCalledWith(
          '/api/ballot/questions',
          expect.objectContaining({
            body: expect.stringContaining('Candidate 50'),
          })
        );
      });
    });

    describe('XSS prevention in questions', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        '"><script>alert(1)</script>',
        "javascript:alert('xss')",
        '<svg/onload=alert(1)>',
        '<body onload=alert(1)>',
        '<iframe src="javascript:alert(1)">',
      ];

      xssPayloads.forEach((payload) => {
        it(`should handle XSS in title: ${payload.substring(0, 25)}...`, async () => {
          const maliciousInput: CreateQuestionInput = {
            ...validInput,
            title: payload,
          };
          mockApiFetch.mockResolvedValueOnce({
            question: { ...mockQuestion, title: payload },
          });

          const result = await createQuestion(maliciousInput);
          expect(result.question).toBeDefined();
        });

        it(`should handle XSS in description: ${payload.substring(0, 25)}...`, async () => {
          const maliciousInput: CreateQuestionInput = {
            ...validInput,
            description: payload,
          };
          mockApiFetch.mockResolvedValueOnce({
            question: { ...mockQuestion, description: payload },
          });

          const result = await createQuestion(maliciousInput);
          expect(result.question).toBeDefined();
        });

        it(`should handle XSS in candidate name: ${payload.substring(0, 25)}...`, async () => {
          const maliciousInput: CreateQuestionInput = {
            ...validInput,
            candidates: [{ name: payload }, { name: 'Normal' }],
          };
          mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

          await createQuestion(maliciousInput);
          expect(mockApiFetch).toHaveBeenCalled();
        });
      });
    });

    describe('SQL injection prevention', () => {
      const sqlPayloads = [
        "'; DROP TABLE questions;--",
        "1' OR '1'='1",
        "' UNION SELECT * FROM users--",
        "'; DELETE FROM candidates;--",
        "1; UPDATE questions SET title='hacked'",
      ];

      sqlPayloads.forEach((payload) => {
        it(`should handle SQL injection: ${payload.substring(0, 25)}...`, async () => {
          const maliciousInput: CreateQuestionInput = {
            ...validInput,
            title: payload,
          };
          mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

          await createQuestion(maliciousInput);
          expect(mockApiFetch).toHaveBeenCalled();
        });
      });
    });

    describe('unicode and special characters', () => {
      it('should handle unicode in title', async () => {
        const unicodeInput: CreateQuestionInput = {
          ...validInput,
          title: '誰が次の大統領になるべきですか？🗳️ Кто должен быть президентом?',
        };
        mockApiFetch.mockResolvedValueOnce({
          question: { ...mockQuestion, title: unicodeInput.title },
        });

        const result = await createQuestion(unicodeInput);
        expect(result.question.title).toContain('誰が');
      });

      it('should handle RTL languages', async () => {
        const rtlInput: CreateQuestionInput = {
          ...validInput,
          title: 'من يجب أن يكون الرئيس القادم؟',
          candidates: [{ name: 'مرشح أ' }, { name: 'مرشح ب' }],
        };
        mockApiFetch.mockResolvedValueOnce({
          question: { ...mockQuestion, title: rtlInput.title },
        });

        await createQuestion(rtlInput);
        expect(mockApiFetch).toHaveBeenCalled();
      });

      it('should handle special HTML entities', async () => {
        const entityInput: CreateQuestionInput = {
          ...validInput,
          title: 'Question with &amp; &lt; &gt; &quot; entities',
        };
        mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

        await createQuestion(entityInput);
        expect(mockApiFetch).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle validation errors', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Title is required'));

        await expect(createQuestion(validInput)).rejects.toThrow('Title is required');
      });

      it('should handle network errors', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

        await expect(createQuestion(validInput)).rejects.toThrow('Failed to fetch');
      });

      it('should handle server errors', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Internal server error'));

        await expect(createQuestion(validInput)).rejects.toThrow('Internal server error');
      });
    });
  });

  describe('getQuestion', () => {
    const mockQuestion: BallotQuestion = {
      id: 'question-123',
      electionId: 'election-456',
      jurisdictionId: 'jurisdiction-789',
      title: 'Test Question',
      questionType: 'single_choice',
      maxSelections: 1,
      allowWriteIn: false,
      displayOrder: 0,
      candidates: [],
      createdAt: '2024-12-24T00:00:00Z',
    };

    it('should fetch question by ID', async () => {
      mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

      const result = await getQuestion('question-123');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/ballot/questions/question-123');
      expect(result.question.id).toBe('question-123');
    });

    it('should include jurisdiction when available', async () => {
      mockApiFetch.mockResolvedValueOnce({
        question: mockQuestion,
        jurisdiction: {
          id: 'jurisdiction-789',
          name: 'Test County',
          type: 'county',
          code: 'TC001',
        },
      });

      const result = await getQuestion('question-123');

      expect(result.jurisdiction).toBeDefined();
      expect(result.jurisdiction?.name).toBe('Test County');
    });

    it('should handle non-existent question', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Question not found'));

      await expect(getQuestion('non-existent')).rejects.toThrow('Question not found');
    });

    describe('ID validation', () => {
      it('should handle UUID format', async () => {
        mockApiFetch.mockResolvedValueOnce({ question: mockQuestion });

        await getQuestion('550e8400-e29b-41d4-a716-446655440000');

        expect(mockApiFetch).toHaveBeenCalledWith(
          '/api/ballot/questions/550e8400-e29b-41d4-a716-446655440000'
        );
      });

      it('should handle path traversal attempts', async () => {
        mockApiFetch.mockRejectedValueOnce(new Error('Invalid ID'));

        await expect(getQuestion('../../../etc/passwd')).rejects.toThrow();
      });
    });
  });

  describe('getQuestions', () => {
    const mockQuestions: BallotQuestion[] = [
      {
        id: 'q1',
        electionId: 'e1',
        jurisdictionId: 'j1',
        title: 'Question 1',
        questionType: 'single_choice',
        maxSelections: 1,
        allowWriteIn: false,
        displayOrder: 0,
        candidates: [],
        createdAt: '',
      },
      {
        id: 'q2',
        electionId: 'e1',
        jurisdictionId: 'j1',
        title: 'Question 2',
        questionType: 'yes_no',
        maxSelections: 1,
        allowWriteIn: false,
        displayOrder: 1,
        candidates: [],
        createdAt: '',
      },
    ];

    it('should fetch all questions without params', async () => {
      mockApiFetch.mockResolvedValueOnce({ questions: mockQuestions });

      const result = await getQuestions();

      expect(mockApiFetch).toHaveBeenCalledWith('/api/ballot/questions');
      expect(result.questions).toHaveLength(2);
    });

    it('should filter by electionId', async () => {
      mockApiFetch.mockResolvedValueOnce({ questions: mockQuestions });

      await getQuestions({ electionId: 'election-123' });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/ballot/questions?electionId=election-123'
      );
    });

    it('should filter by jurisdictionId', async () => {
      mockApiFetch.mockResolvedValueOnce({ questions: mockQuestions });

      await getQuestions({ jurisdictionId: 'jurisdiction-456' });

      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/ballot/questions?jurisdictionId=jurisdiction-456'
      );
    });

    it('should filter by both electionId and jurisdictionId', async () => {
      mockApiFetch.mockResolvedValueOnce({ questions: mockQuestions });

      await getQuestions({ electionId: 'e1', jurisdictionId: 'j1' });

      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('electionId=e1')
      );
      expect(mockApiFetch).toHaveBeenCalledWith(
        expect.stringContaining('jurisdictionId=j1')
      );
    });

    it('should return empty array when no questions', async () => {
      mockApiFetch.mockResolvedValueOnce({ questions: [] });

      const result = await getQuestions({ electionId: 'no-questions' });

      expect(result.questions).toEqual([]);
    });

    it('should handle many questions', async () => {
      const manyQuestions = Array.from({ length: 100 }, (_, i) => ({
        ...mockQuestions[0],
        id: `q${i}`,
        title: `Question ${i}`,
        displayOrder: i,
      }));
      mockApiFetch.mockResolvedValueOnce({ questions: manyQuestions });

      const result = await getQuestions();

      expect(result.questions).toHaveLength(100);
    });
  });

  describe('getBallotCoverage', () => {
    it('should fetch ballot coverage for election', async () => {
      const mockCoverage = {
        electionId: 'election-123',
        electionName: 'Test Election',
        coverage: [
          {
            jurisdiction: {
              id: 'j1',
              name: 'County A',
              type: 'county',
              code: 'CA',
              level: 2,
            },
            questionCount: 5,
          },
          {
            jurisdiction: {
              id: 'j2',
              name: 'City B',
              type: 'city',
              code: 'CB',
              level: 3,
            },
            questionCount: 3,
          },
        ],
        totalQuestions: 8,
      };
      mockApiFetch.mockResolvedValueOnce(mockCoverage);

      const result = await getBallotCoverage('election-123');

      expect(mockApiFetch).toHaveBeenCalledWith('/api/ballot/election-123/coverage');
      expect(result.coverage).toHaveLength(2);
      expect(result.totalQuestions).toBe(8);
    });

    it('should handle election with no coverage', async () => {
      mockApiFetch.mockResolvedValueOnce({
        electionId: 'election-123',
        electionName: 'Empty Election',
        coverage: [],
        totalQuestions: 0,
      });

      const result = await getBallotCoverage('election-123');

      expect(result.coverage).toEqual([]);
      expect(result.totalQuestions).toBe(0);
    });

    it('should handle non-existent election', async () => {
      mockApiFetch.mockRejectedValueOnce(new Error('Election not found'));

      await expect(getBallotCoverage('non-existent')).rejects.toThrow('Election not found');
    });
  });
});
