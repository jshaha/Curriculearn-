#!/bin/bash
# Test the full API server with Claude agents

echo "======================================="
echo " Testing NeuroCompiler API with Claude"
echo "======================================="

# Start server in background
echo ""
echo "1. Starting API server with Claude agents..."
export USE_CLAUDE_AGENTS=true
python start_server.py &
SERVER_PID=$!

# Wait for server to start
echo "   Waiting for server to start..."
sleep 3

# Test endpoints
echo ""
echo "2. Testing health endpoint..."
curl -s http://localhost:5001/health | python -m json.tool

echo ""
echo "3. Uploading test lesson..."
LESSON_ID=$(curl -s -X POST -F "file=@Introduction to Photosynthesis - Lesson Plan.pdf" \
  http://localhost:5001/api/upload | python -c "import sys, json; print(json.load(sys.stdin)['lesson_id'])")

echo "   Lesson ID: $LESSON_ID"

echo ""
echo "4. Analyzing lesson with Claude diagnostician..."
curl -s -X POST http://localhost:5001/api/analyze/$LESSON_ID | python -m json.tool

echo ""
echo "5. Optimizing lesson with Claude editor..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"max_iterations": 1, "max_candidates": 2}' \
  http://localhost:5001/api/optimize/$LESSON_ID | python -m json.tool

echo ""
echo "6. Listing all lessons..."
curl -s http://localhost:5001/api/lessons | python -m json.tool

# Cleanup
echo ""
echo "Stopping server..."
kill $SERVER_PID

echo ""
echo "======================================="
echo " Test complete!"
echo "======================================="
