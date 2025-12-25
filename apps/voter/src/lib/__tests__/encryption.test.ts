/**
 * Comprehensive tests for Encryption Library
 *
 * Tests cover:
 * - Vote encryption
 * - Commitment generation
 * - ZK proof generation
 * - Vote validation
 * - Vote data preparation
 * - Ballot encryption
 * - Edge cases and error handling
 */

import {
  encryptVote,
  generateCommitment,
  generateZKProof,
  validateVote,
  prepareVoteData,
  encryptBallot,
} from '../encryption'

describe('Encryption Library', () => {
  describe('encryptVote', () => {
    test('should encrypt a simple vote', () => {
      const vote = 'candidate-1'
      const publicKey = 'test-public-key'

      const encrypted = encryptVote(vote, publicKey)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
      expect(encrypted.length).toBeGreaterThan(0)
    })

    test('should produce different output for different votes', () => {
      const vote1 = 'candidate-1'
      const vote2 = 'candidate-2'
      const publicKey = 'test-public-key'

      const encrypted1 = encryptVote(vote1, publicKey)
      const encrypted2 = encryptVote(vote2, publicKey)

      expect(encrypted1).not.toBe(encrypted2)
    })

    test('should handle empty vote string', () => {
      const vote = ''
      const publicKey = 'test-public-key'

      const encrypted = encryptVote(vote, publicKey)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
    })

    test('should handle very long vote strings', () => {
      const vote = 'A'.repeat(10000)
      const publicKey = 'test-public-key'

      const encrypted = encryptVote(vote, publicKey)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
    })

    test('should handle special characters in vote', () => {
      const vote = '{"id":"candidate-1","name":"O\'Brien & Co."}'
      const publicKey = 'test-public-key'

      const encrypted = encryptVote(vote, publicKey)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
    })

    test('should handle unicode characters', () => {
      const vote = '候選人一'
      const publicKey = 'test-public-key'

      const encrypted = encryptVote(vote, publicKey)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
    })

    test('should produce valid base64 string', () => {
      const vote = 'candidate-1'
      const publicKey = 'test-public-key'

      const encrypted = encryptVote(vote, publicKey)

      // Valid base64 should decode without error
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow()
    })

    test('should include timestamp in encrypted data', () => {
      const vote = 'candidate-1'
      const publicKey = 'test-public-key'

      const encrypted = encryptVote(vote, publicKey)
      const decoded = JSON.parse(Buffer.from(encrypted, 'base64').toString())

      expect(decoded.timestamp).toBeDefined()
      expect(typeof decoded.timestamp).toBe('number')
    })

    test('should produce different output for same vote at different times', async () => {
      const vote = 'candidate-1'
      const publicKey = 'test-public-key'

      const encrypted1 = encryptVote(vote, publicKey)
      await new Promise(resolve => setTimeout(resolve, 10))
      const encrypted2 = encryptVote(vote, publicKey)

      expect(encrypted1).not.toBe(encrypted2)
    })
  })

  describe('generateCommitment', () => {
    test('should generate a commitment for a vote', async () => {
      const vote = 'candidate-1'

      const commitment = await generateCommitment(vote)

      expect(commitment).toBeDefined()
      expect(typeof commitment).toBe('string')
      expect(commitment.length).toBe(64) // SHA-256 produces 64 hex characters
    })

    test('should produce different commitments for different votes', async () => {
      const vote1 = 'candidate-1'
      const vote2 = 'candidate-2'

      const commitment1 = await generateCommitment(vote1)
      const commitment2 = await generateCommitment(vote2)

      expect(commitment1).not.toBe(commitment2)
    })

    test('should produce valid hex string', async () => {
      const vote = 'candidate-1'

      const commitment = await generateCommitment(vote)

      expect(commitment).toMatch(/^[0-9a-f]{64}$/)
    })

    test('should produce different commitments at different times', async () => {
      const vote = 'candidate-1'

      const commitment1 = await generateCommitment(vote)
      await new Promise(resolve => setTimeout(resolve, 10))
      const commitment2 = await generateCommitment(vote)

      expect(commitment1).not.toBe(commitment2)
    })

    test('should handle empty vote', async () => {
      const vote = ''

      const commitment = await generateCommitment(vote)

      expect(commitment).toBeDefined()
      expect(typeof commitment).toBe('string')
      expect(commitment.length).toBe(64)
    })

    test('should handle very long vote strings', async () => {
      const vote = 'A'.repeat(10000)

      const commitment = await generateCommitment(vote)

      expect(commitment).toBeDefined()
      expect(typeof commitment).toBe('string')
      expect(commitment.length).toBe(64)
    })

    test('should handle special characters', async () => {
      const vote = '{"candidate":"O\'Brien & Co."}'

      const commitment = await generateCommitment(vote)

      expect(commitment).toBeDefined()
      expect(typeof commitment).toBe('string')
      expect(commitment.length).toBe(64)
    })

    test('should handle unicode characters', async () => {
      const vote = '候選人一'

      const commitment = await generateCommitment(vote)

      expect(commitment).toBeDefined()
      expect(typeof commitment).toBe('string')
      expect(commitment.length).toBe(64)
    })
  })

  describe('generateZKProof', () => {
    test('should generate a ZK proof', () => {
      const vote = 'candidate-1'
      const credential = 'test-credential'

      const proof = generateZKProof(vote, credential)

      expect(proof).toBeDefined()
      expect(typeof proof).toBe('string')
    })

    test('should produce valid JSON', () => {
      const vote = 'candidate-1'
      const credential = 'test-credential'

      const proof = generateZKProof(vote, credential)

      expect(() => JSON.parse(proof)).not.toThrow()
    })

    test('should include proof type', () => {
      const vote = 'candidate-1'
      const credential = 'test-credential'

      const proof = generateZKProof(vote, credential)
      const parsed = JSON.parse(proof)

      expect(parsed.type).toBe('vote_validity')
    })

    test('should include timestamp', () => {
      const vote = 'candidate-1'
      const credential = 'test-credential'

      const proof = generateZKProof(vote, credential)
      const parsed = JSON.parse(proof)

      expect(parsed.timestamp).toBeDefined()
      expect(typeof parsed.timestamp).toBe('number')
    })

    test('should include version', () => {
      const vote = 'candidate-1'
      const credential = 'test-credential'

      const proof = generateZKProof(vote, credential)
      const parsed = JSON.parse(proof)

      expect(parsed.version).toBe('1.0')
    })

    test('should include hash', () => {
      const vote = 'candidate-1'
      const credential = 'test-credential'

      const proof = generateZKProof(vote, credential)
      const parsed = JSON.parse(proof)

      expect(parsed.hash).toBeDefined()
      expect(typeof parsed.hash).toBe('string')
    })

    test('should produce different proofs for different votes', () => {
      const vote1 = 'candidate-1'
      const vote2 = 'candidate-2'
      const credential = 'test-credential'

      const proof1 = generateZKProof(vote1, credential)
      const proof2 = generateZKProof(vote2, credential)

      expect(proof1).not.toBe(proof2)
    })

    test('should produce different proofs for different credentials', () => {
      const vote = 'candidate-1'
      const credential1 = 'credential-1'
      const credential2 = 'credential-2'

      const proof1 = generateZKProof(vote, credential1)
      const proof2 = generateZKProof(vote, credential2)

      expect(proof1).not.toBe(proof2)
    })

    test('should handle empty inputs', () => {
      const vote = ''
      const credential = ''

      const proof = generateZKProof(vote, credential)
      const parsed = JSON.parse(proof)

      expect(parsed.type).toBe('vote_validity')
    })
  })

  describe('validateVote', () => {
    test('should validate string vote', () => {
      const vote = 'candidate-1'

      const isValid = validateVote(vote)

      expect(isValid).toBe(true)
    })

    test('should validate object vote', () => {
      const vote = { candidateId: 'candidate-1', questionId: 'q1' }

      const isValid = validateVote(vote)

      expect(isValid).toBe(true)
    })

    test('should reject null vote', () => {
      const vote = null

      const isValid = validateVote(vote)

      expect(isValid).toBe(false)
    })

    test('should reject undefined vote', () => {
      const vote = undefined

      const isValid = validateVote(vote)

      expect(isValid).toBe(false)
    })

    test('should reject number vote', () => {
      const vote = 123

      const isValid = validateVote(vote)

      expect(isValid).toBe(false)
    })

    test('should reject boolean vote', () => {
      const vote = true

      const isValid = validateVote(vote)

      expect(isValid).toBe(false)
    })

    test('should validate empty string', () => {
      const vote = ''

      const isValid = validateVote(vote)

      expect(isValid).toBe(true)
    })

    test('should validate empty object', () => {
      const vote = {}

      const isValid = validateVote(vote)

      expect(isValid).toBe(true)
    })

    test('should validate array (as object)', () => {
      const vote = ['candidate-1', 'candidate-2']

      const isValid = validateVote(vote)

      expect(isValid).toBe(true)
    })
  })

  describe('prepareVoteData', () => {
    test('should prepare single choice vote data', () => {
      const questionId = 'q1'
      const candidateId = 'candidate-1'

      const voteData = prepareVoteData(questionId, candidateId)

      expect(voteData).toBeDefined()
      expect(typeof voteData).toBe('string')
    })

    test('should produce valid JSON', () => {
      const questionId = 'q1'
      const candidateId = 'candidate-1'

      const voteData = prepareVoteData(questionId, candidateId)
      const parsed = JSON.parse(voteData)

      expect(parsed.questionId).toBe('q1')
      expect(parsed.selection).toEqual(['candidate-1'])
    })

    test('should prepare multi choice vote data', () => {
      const questionId = 'q1'
      const candidateIds = ['candidate-1', 'candidate-2']

      const voteData = prepareVoteData(questionId, candidateIds)
      const parsed = JSON.parse(voteData)

      expect(parsed.questionId).toBe('q1')
      expect(parsed.selection).toEqual(['candidate-1', 'candidate-2'])
    })

    test('should convert single choice to array', () => {
      const questionId = 'q1'
      const candidateId = 'candidate-1'

      const voteData = prepareVoteData(questionId, candidateId)
      const parsed = JSON.parse(voteData)

      expect(Array.isArray(parsed.selection)).toBe(true)
    })

    test('should include timestamp', () => {
      const questionId = 'q1'
      const candidateId = 'candidate-1'

      const voteData = prepareVoteData(questionId, candidateId)
      const parsed = JSON.parse(voteData)

      expect(parsed.timestamp).toBeDefined()
      expect(typeof parsed.timestamp).toBe('number')
    })

    test('should handle empty candidate ID', () => {
      const questionId = 'q1'
      const candidateId = ''

      const voteData = prepareVoteData(questionId, candidateId)
      const parsed = JSON.parse(voteData)

      expect(parsed.selection).toEqual([''])
    })

    test('should handle empty array', () => {
      const questionId = 'q1'
      const candidateIds: string[] = []

      const voteData = prepareVoteData(questionId, candidateIds)
      const parsed = JSON.parse(voteData)

      expect(parsed.selection).toEqual([])
    })

    test('should handle special characters in IDs', () => {
      const questionId = 'q-1/test'
      const candidateId = 'candidate-1#test'

      const voteData = prepareVoteData(questionId, candidateId)
      const parsed = JSON.parse(voteData)

      expect(parsed.questionId).toBe('q-1/test')
      expect(parsed.selection).toEqual(['candidate-1#test'])
    })
  })

  describe('encryptBallot', () => {
    test('should encrypt a simple ballot', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted).toBeDefined()
      expect(Array.isArray(encrypted)).toBe(true)
      expect(encrypted.length).toBe(1)
    })

    test('should include all required fields', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)
      const result = encrypted[0]

      expect(result.questionId).toBe('q1')
      expect(result.encryptedVote).toBeDefined()
      expect(result.commitment).toBeDefined()
      expect(result.zkProof).toBeDefined()
    })

    test('should encrypt multiple answers', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
        { questionId: 'q2', selection: ['candidate-2', 'candidate-3'] },
        { questionId: 'q3', selection: 'candidate-4' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted.length).toBe(3)
      expect(encrypted[0].questionId).toBe('q1')
      expect(encrypted[1].questionId).toBe('q2')
      expect(encrypted[2].questionId).toBe('q3')
    })

    test('should handle empty ballot', async () => {
      const answers: Array<{ questionId: string; selection: string | string[] }> = []
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted).toEqual([])
    })

    test('should handle single choice selections', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].encryptedVote).toBeDefined()
      expect(typeof encrypted[0].encryptedVote).toBe('string')
    })

    test('should handle multi choice selections', async () => {
      const answers = [
        { questionId: 'q1', selection: ['candidate-1', 'candidate-2'] },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].encryptedVote).toBeDefined()
      expect(typeof encrypted[0].encryptedVote).toBe('string')
    })

    test('should generate unique commitments for each answer', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
        { questionId: 'q2', selection: 'candidate-2' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].commitment).not.toBe(encrypted[1].commitment)
    })

    test('should generate ZK proofs for each answer', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].zkProof).toBeDefined()
      expect(() => JSON.parse(encrypted[0].zkProof)).not.toThrow()
    })

    test('should maintain answer order', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
        { questionId: 'q2', selection: 'candidate-2' },
        { questionId: 'q3', selection: 'candidate-3' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].questionId).toBe('q1')
      expect(encrypted[1].questionId).toBe('q2')
      expect(encrypted[2].questionId).toBe('q3')
    })

    test('should handle answers with empty selections', async () => {
      const answers = [
        { questionId: 'q1', selection: '' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].encryptedVote).toBeDefined()
    })

    test('should handle answers with empty array selections', async () => {
      const answers = [
        { questionId: 'q1', selection: [] },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].encryptedVote).toBeDefined()
    })

    test('should handle special characters in question IDs', async () => {
      const answers = [
        { questionId: 'q-1/test#123', selection: 'candidate-1' },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted[0].questionId).toBe('q-1/test#123')
    })

    test('should handle large ballots', async () => {
      const answers = Array.from({ length: 100 }, (_, i) => ({
        questionId: `q${i}`,
        selection: `candidate-${i}`,
      }))
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted.length).toBe(100)
      expect(encrypted[0].questionId).toBe('q0')
      expect(encrypted[99].questionId).toBe('q99')
    })

    test('should produce different encrypted votes for same selection', async () => {
      const answers1 = [{ questionId: 'q1', selection: 'candidate-1' }]
      const answers2 = [{ questionId: 'q1', selection: 'candidate-1' }]
      const publicKey = 'test-public-key'

      const encrypted1 = await encryptBallot(answers1, publicKey)
      await new Promise(resolve => setTimeout(resolve, 10))
      const encrypted2 = await encryptBallot(answers2, publicKey)

      expect(encrypted1[0].encryptedVote).not.toBe(encrypted2[0].encryptedVote)
    })
  })

  describe('Integration Tests', () => {
    test('should encrypt, generate commitment, and proof for complete ballot', async () => {
      const answers = [
        { questionId: 'q1', selection: 'candidate-1' },
        { questionId: 'q2', selection: ['candidate-2', 'candidate-3'] },
      ]
      const publicKey = 'test-public-key'

      const encrypted = await encryptBallot(answers, publicKey)

      expect(encrypted.length).toBe(2)

      // First answer
      expect(encrypted[0].questionId).toBe('q1')
      expect(encrypted[0].encryptedVote).toBeDefined()
      expect(encrypted[0].commitment).toMatch(/^[0-9a-f]{64}$/)
      expect(JSON.parse(encrypted[0].zkProof).type).toBe('vote_validity')

      // Second answer
      expect(encrypted[1].questionId).toBe('q2')
      expect(encrypted[1].encryptedVote).toBeDefined()
      expect(encrypted[1].commitment).toMatch(/^[0-9a-f]{64}$/)
      expect(JSON.parse(encrypted[1].zkProof).type).toBe('vote_validity')
    })

    test('should handle full voting flow', async () => {
      // Prepare votes
      const voteData1 = prepareVoteData('q1', 'candidate-1')
      const voteData2 = prepareVoteData('q2', ['candidate-2', 'candidate-3'])

      expect(validateVote(voteData1)).toBe(true)
      expect(validateVote(voteData2)).toBe(true)

      // Encrypt votes
      const publicKey = 'test-public-key'
      const encrypted1 = encryptVote(voteData1, publicKey)
      const encrypted2 = encryptVote(voteData2, publicKey)

      expect(encrypted1).toBeDefined()
      expect(encrypted2).toBeDefined()

      // Generate commitments
      const commitment1 = await generateCommitment(voteData1)
      const commitment2 = await generateCommitment(voteData2)

      expect(commitment1).toMatch(/^[0-9a-f]{64}$/)
      expect(commitment2).toMatch(/^[0-9a-f]{64}$/)

      // Generate ZK proofs
      const proof1 = generateZKProof(voteData1, publicKey)
      const proof2 = generateZKProof(voteData2, publicKey)

      expect(JSON.parse(proof1).type).toBe('vote_validity')
      expect(JSON.parse(proof2).type).toBe('vote_validity')
    })
  })
})
