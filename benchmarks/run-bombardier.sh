#!/bin/bash

# Generate timestamped filename
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
RESULTS_FILE="benchmarks/results/bombardier-${TIMESTAMP}.txt"

# Create results directory if it doesn't exist
mkdir -p benchmarks/results

# Start the server in the background
deno run --allow-net --allow-read benchmarks/bombardier-server.ts &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Function to log to both console and file
log() {
  echo "$1" | tee -a "$RESULTS_FILE"
}

log "=== Mage Bombardier Benchmarks ==="
log "Hardware: $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo 'Unknown')"
log "RAM: $(sysctl -n hw.memsize 2>/dev/null | awk '{print $1/1024/1024/1024 " GB"}' || echo 'Unknown')"
log "Deno: $(deno --version | head -1)"
log "bombardier: $(bombardier --version 2>&1 | head -1 || echo 'Unknown')"
log "Date: $(date '+%Y-%m-%d %H:%M:%S')"
log ""

log "=== Test 1: Simple text response ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/ | tee -a "$RESULTS_FILE"

log ""
log "=== Test 2: Route with path parameter (matches Hono benchmark) ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/user/lookup/username/foo | tee -a "$RESULTS_FILE"

log ""
log "=== Test 3: JSON response ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/json | tee -a "$RESULTS_FILE"

log ""
log "=== Test 4: Dynamic API response - small (~10KB) uncompressed ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/api/small | tee -a "$RESULTS_FILE"

log ""
log "=== Test 5: Dynamic API response - small (~10KB) compressed ==="
bombardier --fasthttp -d 10s -c 100 -H "Accept-Encoding: gzip" http://localhost:8000/api/small-compressed | tee -a "$RESULTS_FILE"

log ""
log "=== Test 6: Dynamic API response - large (~100KB) uncompressed ==="
bombardier --fasthttp -d 10s -c 100 http://localhost:8000/api/large | tee -a "$RESULTS_FILE"

log ""
log "=== Test 7: Dynamic API response - large (~100KB) compressed ==="
bombardier --fasthttp -d 10s -c 100 -H "Accept-Encoding: gzip" http://localhost:8000/api/large-compressed | tee -a "$RESULTS_FILE"

# Kill the server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

log ""
log "=== Benchmark Complete ==="
log "Results saved to: $RESULTS_FILE"

echo ""
echo "Done! Results saved to: $RESULTS_FILE"
