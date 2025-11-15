# Framework Comparison

This document compares Mage performance against other popular Deno web
frameworks.

## Benchmark Setup

All benchmarks use the same methodology:

- **Tool**: bombardier v2.0.2
- **Parameters**: `--fasthttp -d 10s -c 100`
- **Hardware**: Apple M1 Max, 64GB RAM
- **Runtime**: Deno 2.5.6
- **Date**: 2025-11-15

## Test: Route with Path Parameter

This test matches
[Hono's official benchmark](https://hono.dev/docs/concepts/benchmarks):
`GET /user/lookup/username/:username`

### Results

| Framework    | Reqs/sec  | Latency | Notes                          |
| ------------ | --------- | ------- | ------------------------------ |
| Hono 3.0.0   | 136,112   | ~0.73ms | RadixTree router (O(log n))    |
| Fast 4.0.0   | 103,214   | ~0.97ms | High-performance router        |
| Megalo 0.3.0 | 64,597    | ~1.55ms | Lightweight framework          |
| Faster 5.7   | 54,801    | ~1.82ms | Optimized for speed            |
| **Mage**     | 44,588.49 | 2.24ms  | Linear router (O(n) matching)  |
| Oak 10.5.1   | 43,326    | ~2.31ms | Express-like middleware router |
| Opine 2.2.0  | 30,700    | ~3.26ms | Express port for Deno          |

**Note:** Hono benchmarks run on M1 Pro with Deno v1.22.0. Mage benchmarks run
on M1 Max with Deno v2.5.6. Performance differences may be due to hardware and
Deno version variations.

## Test: Simple Text Response

Basic "Hello World" response with no routing complexity.

| Framework | Reqs/sec  | Latency | Throughput |
| --------- | --------- | ------- | ---------- |
| Mage      | 52,658.99 | 1.90ms  | 10.80MB/s  |

**Note:** Hono's official benchmarks don't include a simple text response test
with the same setup.

## Test: JSON Response

Simple JSON object response.

| Framework | Reqs/sec  | Latency | Throughput |
| --------- | --------- | ------- | ---------- |
| Mage      | 49,486.47 | 2.02ms  | 11.28MB/s  |

**Note:** Hono's official benchmarks don't include a JSON response test with the
same setup.

## Analysis

### Mage Performance Characteristics

**Strengths:**

- **Lightweight**: Minimal middleware overhead
- **Fast response handling**: Lazy materialization with MageResponse
- **Predictable**: Linear router performance is consistent regardless of route
  position

**Considerations:**

- **Router scalability**: Linear router (O(n)) becomes slower with many routes
  (>100)
  - For high route counts, consider adding a RadixTree router
  - Most applications have <100 routes and won't notice the difference

### Comparison Notes

These benchmarks measure raw framework performance under ideal conditions. Real
applications differ based on:

- Business logic complexity
- Database queries
- External API calls
- Middleware stack

Choose frameworks based on:

1. **Developer experience** - API design, documentation, community
2. **Feature set** - Built-in features vs. bring-your-own
3. **Performance** - Only matters if it's a bottleneck (usually it's not)
4. **Ecosystem** - Available middleware and plugins

## Contributing Benchmarks

To add comparison data for other frameworks:

1. Use identical hardware and Deno version
2. Run the same bombardier command
3. Submit PR with results and framework version

## Disclaimer

Benchmarks are point-in-time measurements on specific hardware. Your results may
vary. Always benchmark your actual use case before making performance decisions.
