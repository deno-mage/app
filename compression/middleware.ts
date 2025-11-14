import type { MageMiddleware } from "../app/mod.ts";

/**
 * Options for the compression middleware.
 */
export interface CompressionOptions {
  /** Minimum response size in bytes to compress @default 1024 */
  threshold?: number;
  /** Maximum response size in bytes to compress (prevents OOM) @default 10485760 */
  maxSize?: number;
  /**
   * Maximum size in bytes to buffer in memory for compression.
   * Responses larger than this will use streaming compression without Content-Length header.
   * @default 1048576 (1MB)
   */
  bufferThreshold?: number;
  /** Content types to compress (defaults to common text types) */
  contentTypes?: string[];
}

const DEFAULT_CONTENT_TYPES = [
  "text/html",
  "text/css",
  "text/plain",
  "text/xml",
  "text/javascript",
  "application/json",
  "application/javascript",
  "application/xml",
  "application/x-javascript",
  "application/xhtml+xml",
  "application/rss+xml",
  "application/atom+xml",
  "image/svg+xml",
];

/**
 * Compress response bodies using gzip.
 *
 * Only compresses responses above threshold size and for compressible content types.
 * Checks Accept-Encoding header to ensure client supports gzip.
 *
 * With MageResponse, body access is direct (no streaming overhead).
 * Uses a hybrid approach for memory efficiency:
 * - Small responses (<bufferThreshold): Buffered in memory, sets Content-Length header
 * - Large responses (≥bufferThreshold): Streamed compression, uses chunked transfer encoding
 *
 * NOTE: In production, compression is typically handled by CDN/reverse proxy.
 * Use this for development, self-hosted deployments, or Deno Deploy.
 */
export const compression = (
  options?: CompressionOptions,
): MageMiddleware => {
  const {
    threshold = 1024,
    maxSize = 10 * 1024 * 1024, // 10MB default
    bufferThreshold = 1 * 1024 * 1024, // 1MB default
    contentTypes = DEFAULT_CONTENT_TYPES,
  } = options ?? {};

  return async (c, next) => {
    await next();

    // Check if already compressed
    if (c.res.headers.get("Content-Encoding")) {
      return;
    }

    // Check if client accepts gzip
    const acceptEncoding = c.req.header("Accept-Encoding") || "";
    if (!acceptEncoding.includes("gzip")) {
      return;
    }

    // Check content type is compressible
    const contentType = c.res.headers.get("Content-Type") || "";
    const shouldCompress = contentTypes.some((type) => {
      if (type.endsWith("/*")) {
        const prefix = type.slice(0, -2);
        return contentType.startsWith(prefix);
      }
      return contentType.startsWith(type);
    });

    if (!shouldCompress) return;

    // Get body directly from MageResponse (no streaming overhead!)
    const body = c.res.body;
    if (!body) {
      return;
    }

    // Convert body to Uint8Array for size checking and compression
    let bodyBytes: Uint8Array;
    if (typeof body === "string") {
      bodyBytes = new TextEncoder().encode(body);
    } else if (body instanceof Uint8Array) {
      bodyBytes = body;
    } else {
      // Body is ReadableStream or other BodyInit - skip compression
      // (This happens with external Responses like file serving)
      return;
    }

    const bodySize = bodyBytes.byteLength;

    // Check size thresholds
    if (bodySize < threshold) {
      return; // Too small to compress
    }
    if (bodySize > maxSize) {
      return; // Too large (DoS protection)
    }

    // Add Vary header for proper caching
    addVaryAcceptEncoding(c.res.headers);

    /**
     * Hybrid compression algorithm:
     * - Small responses (<bufferThreshold): Compress and set Content-Length
     * - Large responses (≥bufferThreshold): Streaming compression (no Content-Length)
     */

    if (bodySize < bufferThreshold) {
      /**
       * PATH 1: Buffered compression
       * Benefits: Sets Content-Length, enables progress bars, allows range requests
       */
      let compressed: Uint8Array;
      try {
        compressed = await compressGzip(bodyBytes);
      } catch (_error) {
        // If compression fails, skip it
        return;
      }

      // Only use compressed version if it's actually smaller
      if (compressed.byteLength >= bodySize) {
        return; // Skip compression
      }

      // Update response with compressed body
      c.res.setBody(compressed as BodyInit);
      c.res.headers.set("Content-Encoding", "gzip");
      c.res.headers.set("Content-Length", compressed.byteLength.toString());
    } else {
      /**
       * PATH 2: Streaming compression
       * Benefits: Constant memory usage, no buffering
       * Trade-off: No Content-Length (uses chunked transfer encoding)
       */
      const compressedStream = createCompressedStream(bodyBytes);

      c.res.setBody(compressedStream);
      c.res.headers.set("Content-Encoding", "gzip");
      c.res.headers.delete("Content-Length"); // Chunked encoding
    }
  };
};

/**
 * Compress data using gzip and return as Uint8Array.
 * Used for buffered compression path where we need to know compressed size.
 */
async function compressGzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  const compressed = stream.pipeThrough(new CompressionStream("gzip"));
  const chunks: Uint8Array[] = [];

  for await (const chunk of compressed) {
    chunks.push(chunk);
  }

  return concatenateUint8Arrays(chunks);
}

/**
 * Create a streaming gzip compressed ReadableStream.
 * Used for large responses to avoid buffering entire body in memory.
 * Does not set Content-Length as compressed size is unknown until completion.
 */
function createCompressedStream(data: Uint8Array): ReadableStream {
  const source = new ReadableStream({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });

  return source.pipeThrough(new CompressionStream("gzip"));
}

/**
 * Add or append "Accept-Encoding" to the Vary header.
 * Ensures proper caching behavior for compressed responses.
 */
function addVaryAcceptEncoding(headers: Headers): void {
  const existingVary = headers.get("Vary");
  if (existingVary) {
    const varyValues = existingVary.split(",").map((v) =>
      v.trim().toLowerCase()
    );
    if (!varyValues.includes("accept-encoding")) {
      headers.set("Vary", `${existingVary}, Accept-Encoding`);
    }
  } else {
    headers.set("Vary", "Accept-Encoding");
  }
}

/**
 * Concatenate multiple Uint8Array chunks into a single array.
 */
function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
