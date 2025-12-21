#!/bin/bash
# VeilProof Circuit Setup Script
# Compiles the Circom circuit and generates proving/verification keys

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUIT_DIR="$SCRIPT_DIR/../circuits"
BUILD_DIR="$SCRIPT_DIR/../build"

echo "=== VeilProof Circuit Setup ==="

# Check for circom
if ! command -v circom &> /dev/null; then
    echo "Error: circom not found. Install it with:"
    echo "  curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh"
    echo "  git clone https://github.com/iden3/circom.git"
    echo "  cd circom && cargo build --release && cargo install --path circom"
    exit 1
fi

# Check for snarkjs
if ! command -v snarkjs &> /dev/null; then
    echo "Installing snarkjs globally..."
    npm install -g snarkjs
fi

# Create build directory
mkdir -p "$BUILD_DIR"

# Download Powers of Tau (if not exists)
PTAU_FILE="$BUILD_DIR/pot12_final.ptau"
if [ ! -f "$PTAU_FILE" ]; then
    echo "Downloading Powers of Tau ceremony file..."
    curl -L -o "$PTAU_FILE" https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau
fi

echo "Compiling circuit..."
circom "$CIRCUIT_DIR/vote.circom" \
    --r1cs \
    --wasm \
    --sym \
    -o "$BUILD_DIR" \
    -l "$(npm root -g)/circomlib/circuits"

echo "Generating proving key..."
snarkjs groth16 setup \
    "$BUILD_DIR/vote.r1cs" \
    "$PTAU_FILE" \
    "$BUILD_DIR/vote_0000.zkey"

echo "Contributing to ceremony (random entropy)..."
snarkjs zkey contribute \
    "$BUILD_DIR/vote_0000.zkey" \
    "$BUILD_DIR/vote_final.zkey" \
    --name="TVS Dev Contribution" \
    -v -e="$(head -c 64 /dev/urandom | xxd -p)"

echo "Exporting verification key..."
snarkjs zkey export verificationkey \
    "$BUILD_DIR/vote_final.zkey" \
    "$BUILD_DIR/verification_key.json"

echo "=== Setup Complete ==="
echo "Build artifacts in: $BUILD_DIR"
echo ""
echo "Files created:"
ls -la "$BUILD_DIR"
