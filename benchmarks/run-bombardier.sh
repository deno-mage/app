#!/bin/bash

# Start the server in the background
deno run --allow-net benchmarks/bombardier-server.ts &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "=== Mage Bombardier Benchmarks ==="
echo "Hardware: Apple M1 Max, 64GB RAM"
echo "Deno: $(deno --version | head -1)"
echo "Date: $(date '+%Y-%m-%d')"
echo ""

echo "=== Test 1: Simple text response ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/

echo ""
echo "=== Test 2: Route with path parameter (matches Hono benchmark) ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/user/lookup/username/foo

echo ""
echo "=== Test 3: JSON response ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/json

# Kill the server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

echo ""
echo "Done!"
