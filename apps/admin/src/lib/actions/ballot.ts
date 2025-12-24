'use server';

import { apiFetch } from '../api-config';

// Types
export interface BallotCandidate {
  id: string;
  name: string;
  description?: string;
  party?: string;
  position: number;
}

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
  candidates: BallotCandidate[];
  createdAt: string;
}

export interface CreateQuestionInput {
  electionId: string;
  jurisdictionId: string;
  title: string;
  description?: string;
  questionType: BallotQuestion['questionType'];
  maxSelections?: number;
  allowWriteIn?: boolean;
  displayOrder: number;
  candidates: {
    name: string;
    description?: string;
    party?: string;
  }[];
}

export interface UpdateQuestionInput {
  title?: string;
  description?: string;
  questionType?: BallotQuestion['questionType'];
  maxSelections?: number;
  allowWriteIn?: boolean;
  displayOrder?: number;
  candidates?: {
    name: string;
    description?: string;
    party?: string;
  }[];
}

// Actions
export async function createQuestion(input: CreateQuestionInput): Promise<{
  question: BallotQuestion;
}> {
  return apiFetch('/api/ballot/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getQuestion(id: string): Promise<{
  question: BallotQuestion;
  jurisdiction?: {
    id: string;
    name: string;
    type: string;
    code: string;
  };
}> {
  return apiFetch(`/api/ballot/questions/${id}`);
}

export async function getQuestions(params?: {
  electionId?: string;
  jurisdictionId?: string;
}): Promise<{ questions: BallotQuestion[] }> {
  const searchParams = new URLSearchParams();
  if (params?.electionId) searchParams.set('electionId', params.electionId);
  if (params?.jurisdictionId) searchParams.set('jurisdictionId', params.jurisdictionId);

  const query = searchParams.toString();
  return apiFetch(`/api/ballot/questions${query ? `?${query}` : ''}`);
}

export async function getBallotCoverage(electionId: string): Promise<{
  electionId: string;
  electionName: string;
  coverage: {
    jurisdiction: {
      id: string;
      name: string;
      type: string;
      code: string;
      level: number;
    };
    questionCount: number;
  }[];
  totalQuestions: number;
}> {
  return apiFetch(`/api/ballot/${electionId}/coverage`);
}
