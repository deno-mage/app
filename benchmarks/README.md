# Mage Benchmarks

This directory contains benchmark scripts and results for the Mage web
framework.

## Quick Start

Run bombardier benchmarks:

```bash
bash benchmarks/run-bombardier.sh
```

Results are automatically saved to
`benchmarks/results/bombardier-YYYYMMDD-HHMMSS.txt`

## Benchmark Types

### 1. Response Types (Deno bench)

Measures end-to-end HTTP request latency for different response types.

**Run:**

```bash
deno bench benchmarks/response-types.bench.ts --allow-net --allow-read --allow-write
```

**Tests:**

- Text responses (small, large)
- JSON responses (small, large)
- HTML responses (small, large)
- Empty, redirect, file serving
- Compression (various sizes, buffered vs streaming)

**Results:** Time per request in microseconds (μs)

### 2. Bombardier (Throughput)

Measures requests per second under load, matching industry-standard methodology.

**Run:**

```bash
bash benchmarks/run-bombardier.sh
```

**Tests:**

- Simple text response
- Route with path parameter
- JSON response
- Dynamic API response - small (~10KB) uncompressed
- Dynamic API response - small (~10KB) compressed
- Dynamic API response - large (~100KB) uncompressed
- Dynamic API response - large (~100KB) compressed

**Results:**

- Requests per second
- Average latency
- Throughput (MB/s)

**Results stored in:** `benchmarks/results/bombardier-YYYYMMDD-HHMMSS.txt`

## Server

`bombardier-server.ts` - Simple HTTP server for bombardier testing with:

- GET / - Simple text response
- GET /user/lookup/username/:username - Route with parameter
- GET /json - JSON response
- GET /api/small - Dynamic API response (~10KB lorem ipsum, uncompressed)
- GET /api/small-compressed - Dynamic API response (~10KB lorem ipsum,
  compressed)
- GET /api/large - Dynamic API response (~100KB lorem ipsum, uncompressed)
- GET /api/large-compressed - Dynamic API response (~100KB lorem ipsum,
  compressed)

## Results

Historical results are stored in:

- `results/` - Timestamped bombardier results (gitignored)

## Comparison Documents

- `framework-comparison.md` - Mage vs other Deno frameworks (Hono, Oak, etc.)

## System Information

Benchmarks include full system details:

- CPU model
- RAM
- Deno version
- bombardier version
- Date/time

This ensures results are comparable across runs and trackable over time.
