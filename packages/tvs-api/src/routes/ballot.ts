/**
 * Ballot Generation Routes
 *
 * Generates voter-specific ballots based on their jurisdiction chain.
 * A Placer County voter gets Federal + State (CA) + County questions.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { uuid } from '@tvs/core';
import { jurisdictions, getJurisdictionChain, type Jurisdiction } from './jurisdictions.js';
import { elections } from './elections.js';

// In-memory store for ballot questions (replace with PostgreSQL)
const ballotQuestions = new Map<string, BallotQuestion>();

export interface BallotQuestion {
  id: string;
  electionId: string;
  jurisdictionId: string;
  title: string;
  description?: string;
  questionType: 'single_choice' | 'multi_choice' | 'ranked_choice' | 'yes_no' | 'write_in';
  maxSelections: number;
  allowWriteIn: boolean;
  displayOrder: number;
  candidates: Candidate[];
  createdAt: string;
}

interface Candidate {
  id: string;
  name: string;
  description?: string;
  party?: string;
  position: number;
}

const CreateQuestionSchema = z.object({
  electionId: z.string().uuid(),
  jurisdictionId: z.string(), // Can be UUID or code
  title: z.string().min(1),
  description: z.string().optional(),
  questionType: z.enum(['single_choice', 'multi_choice', 'ranked_choice', 'yes_no', 'write_in']),
  maxSelections: z.number().int().min(1).default(1),
  allowWriteIn: z.boolean().default(false),
  displayOrder: z.number().int().min(0),
  candidates: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    party: z.string().optional(),
  })).min(1),
});

export async function ballotRoutes(fastify: FastifyInstance) {
  /**
   * Create a ballot question for a jurisdiction
   *
   * POST /api/ballot/questions
   */
  fastify.post('/questions', async (request, reply) => {
    const body = CreateQuestionSchema.parse(request.body);

    // Verify election exists
    const election = elections.get(body.electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    // Verify jurisdiction exists
    const jurisdiction = jurisdictions.get(body.jurisdictionId);
    if (!jurisdiction) {
      return reply.status(404).send({ error: 'Jurisdiction not found' });
    }

    const question: BallotQuestion = {
      id: uuid(),
      electionId: body.electionId,
      jurisdictionId: jurisdiction.id,
      title: body.title,
      description: body.description,
      questionType: body.questionType,
      maxSelections: body.maxSelections,
      allowWriteIn: body.allowWriteIn,
      displayOrder: body.displayOrder,
      candidates: body.candidates.map((c, i) => ({
        id: uuid(),
        name: c.name,
        description: c.description,
        party: c.party,
        position: i,
      })),
      createdAt: new Date().toISOString(),
    };

    ballotQuestions.set(question.id, question);

    return { question };
  });

  /**
   * Get a single ballot question
   *
   * GET /api/ballot/questions/:id
   */
  fastify.get('/questions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const question = ballotQuestions.get(id);

    if (!question) {
      return reply.status(404).send({ error: 'Ballot question not found' });
    }

    const jurisdiction = jurisdictions.get(question.jurisdictionId);

    return {
      question,
      jurisdiction,
    };
  });

  /**
   * List all ballot questions for an election
   *
   * GET /api/ballot/questions?electionId=xxx
   */
  fastify.get('/questions', async (request) => {
    const { electionId, jurisdictionId } = request.query as {
      electionId?: string;
      jurisdictionId?: string;
    };

    let questions = Array.from(ballotQuestions.values());

    if (electionId) {
      questions = questions.filter(q => q.electionId === electionId);
    }

    if (jurisdictionId) {
      const jurisdiction = jurisdictions.get(jurisdictionId);
      if (jurisdiction) {
        questions = questions.filter(q => q.jurisdictionId === jurisdiction.id);
      }
    }

    return {
      questions: questions.sort((a, b) => a.displayOrder - b.displayOrder),
    };
  });

  /**
   * Generate ballot for a voter based on their jurisdiction
   *
   * GET /api/ballot/:electionId/:jurisdictionId
   *
   * Returns all questions the voter is eligible to answer based on
   * their jurisdiction chain (e.g., Placer → California → Federal).
   */
  fastify.get('/:electionId/:jurisdictionId', async (request, reply) => {
    const { electionId, jurisdictionId } = request.params as {
      electionId: string;
      jurisdictionId: string;
    };

    // Verify election exists
    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    // Verify jurisdiction exists
    const voterJurisdiction = jurisdictions.get(jurisdictionId);
    if (!voterJurisdiction) {
      return reply.status(404).send({ error: 'Jurisdiction not found' });
    }

    // Get jurisdiction chain (from Federal down to voter's jurisdiction)
    const chain = getJurisdictionChain(voterJurisdiction.id);
    const chainIds = new Set(chain.map(j => j.id));

    // Find all questions where jurisdiction is in the voter's chain
    const allQuestions = Array.from(ballotQuestions.values())
      .filter(q => q.electionId === electionId && chainIds.has(q.jurisdictionId));

    // Group questions by jurisdiction level
    const sections: BallotSection[] = [];

    for (const jurisdiction of chain) {
      const sectionQuestions = allQuestions
        .filter(q => q.jurisdictionId === jurisdiction.id)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      if (sectionQuestions.length > 0) {
        sections.push({
          jurisdiction: {
            id: jurisdiction.id,
            name: jurisdiction.name,
            type: jurisdiction.type,
            code: jurisdiction.code,
            level: jurisdiction.level,
          },
          questions: sectionQuestions,
        });
      }
    }

    return {
      electionId,
      electionName: election.name,
      voter: {
        jurisdictionId: voterJurisdiction.id,
        jurisdictionName: voterJurisdiction.name,
        jurisdictionCode: voterJurisdiction.code,
      },
      jurisdictionChain: chain.map(j => ({
        id: j.id,
        name: j.name,
        code: j.code,
        level: j.level,
      })),
      sections,
      totalQuestions: allQuestions.length,
    };
  });

  /**
   * Quick endpoint to see which jurisdictions have questions
   *
   * GET /api/ballot/:electionId/coverage
   */
  fastify.get('/:electionId/coverage', async (request, reply) => {
    const { electionId } = request.params as { electionId: string };

    const election = elections.get(electionId);
    if (!election) {
      return reply.status(404).send({ error: 'Election not found' });
    }

    const questions = Array.from(ballotQuestions.values())
      .filter(q => q.electionId === electionId);

    // Group by jurisdiction
    const coverage = new Map<string, { jurisdiction: Jurisdiction; questionCount: number }>();

    for (const q of questions) {
      const jurisdiction = jurisdictions.get(q.jurisdictionId);
      if (jurisdiction) {
        const existing = coverage.get(jurisdiction.id);
        if (existing) {
          existing.questionCount++;
        } else {
          coverage.set(jurisdiction.id, { jurisdiction, questionCount: 1 });
        }
      }
    }

    return {
      electionId,
      electionName: election.name,
      coverage: Array.from(coverage.values())
        .sort((a, b) => a.jurisdiction.level - b.jurisdiction.level),
      totalQuestions: questions.length,
    };
  });
}

interface BallotSection {
  jurisdiction: {
    id: string;
    name: string;
    type: string;
    code: string;
    level: number;
  };
  questions: BallotQuestion[];
}

// Export for use by other routes
export { ballotQuestions };
