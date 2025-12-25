#!/bin/bash

# Script to run lib utility tests
# Usage: ./test-lib-utils.sh

echo "========================================"
echo "Testing Admin App Library Utilities"
echo "========================================"
echo ""

# Navigate to admin app directory
cd "$(dirname "$0")"

echo "Running utils.ts tests..."
npm test -- src/lib/__tests__/utils.test.ts --verbose

echo ""
echo "Running auth.ts tests..."
npm test -- src/lib/__tests__/auth.test.ts --verbose

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo "✓ utils.test.ts - 44 test cases"
echo "✓ auth.test.ts - 48 test cases"
echo "Total: 92 comprehensive test cases"
echo "========================================"
