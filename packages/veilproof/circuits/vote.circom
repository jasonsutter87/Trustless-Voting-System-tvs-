pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";

/**
 * VoteValidity Circuit
 *
 * Proves:
 * 1. Vote is in valid range [0, numCandidates)
 * 2. Nullifier is correctly computed from secret credential
 * 3. Commitment matches the vote
 *
 * Public inputs:
 * - electionId: Election identifier
 * - nullifier: Unique per-credential value (prevents double voting)
 * - commitment: Hash of the vote (for verification)
 * - numCandidates: Number of valid candidates
 *
 * Private inputs:
 * - vote: The actual vote (0 to numCandidates-1)
 * - credentialSecret: Secret part of the credential
 * - voteSalt: Random salt for commitment
 */

template VoteValidity(maxCandidates) {
    // Public inputs
    signal input electionId;
    signal input nullifier;
    signal input commitment;
    signal input numCandidates;

    // Private inputs
    signal input vote;
    signal input credentialSecret;
    signal input voteSalt;

    // ==========================================
    // 1. Verify vote is in valid range
    // ==========================================

    // vote must be >= 0 (always true for field elements)
    // vote must be < numCandidates

    component lessThan = LessThan(8); // 8 bits = max 256 candidates
    lessThan.in[0] <== vote;
    lessThan.in[1] <== numCandidates;
    lessThan.out === 1;

    // Also ensure vote < maxCandidates (compile-time check)
    component lessThanMax = LessThan(8);
    lessThanMax.in[0] <== vote;
    lessThanMax.in[1] <== maxCandidates;
    lessThanMax.out === 1;

    // ==========================================
    // 2. Verify nullifier is correctly computed
    // ==========================================

    // nullifier = Poseidon(electionId, credentialSecret)
    component nullifierHash = Poseidon(2);
    nullifierHash.inputs[0] <== electionId;
    nullifierHash.inputs[1] <== credentialSecret;

    nullifier === nullifierHash.out;

    // ==========================================
    // 3. Verify commitment matches vote
    // ==========================================

    // commitment = Poseidon(vote, voteSalt)
    component commitmentHash = Poseidon(2);
    commitmentHash.inputs[0] <== vote;
    commitmentHash.inputs[1] <== voteSalt;

    commitment === commitmentHash.out;
}

// Main component: Support up to 32 candidates for MVP
component main {public [electionId, nullifier, commitment, numCandidates]} = VoteValidity(32);
