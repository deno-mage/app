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

    // Only compress if we have a response
    if (!c.res) return;

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

    // Get response body without cloning
    if (!c.res.body) {
      return;
    }

    // Fast path: check Content-Length header first to avoid reading small responses
    const contentLengthHeader = c.res.headers.get("Content-Length");
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(contentLength)) {
        if (contentLength < threshold) {
          return; // Skip without reading body
        }
        if (contentLength > maxSize) {
          return; // Skip without reading body
        }
      }
    }

    /**
     * Hybrid compression algorithm:
     * 1. Read response body in chunks while tracking size
     * 2. Bail early if size exceeds maxSize (DoS protection)
     * 3. If size < bufferThreshold: Buffer and compress (sets Content-Length)
     * 4. If size ≥ bufferThreshold: Stream compression (chunked encoding)
     */
    const reader = c.res.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    let exceededMaxSize = false;
    let exceededBufferThreshold = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        totalSize += value.byteLength;

        // Bail out if response is too large to prevent OOM
        if (totalSize > maxSize) {
          exceededMaxSize = true;
          break;
        }

        // Mark if we've exceeded buffer threshold (but keep reading to check total size)
        if (totalSize >= bufferThreshold) {
          exceededBufferThreshold = true;
          // Continue reading to get accurate size for streaming path
        }
      }
    } finally {
      reader.releaseLock();
    }

    // If exceeded max size, return uncompressed
    if (exceededMaxSize) {
      c.res = createUncompressedResponse(c.res, chunks);
      return;
    }

    // Check threshold
    if (totalSize < threshold) {
      c.res = createUncompressedResponse(c.res, chunks);
      return;
    }

    // Prepare Vary header for both paths
    const newHeaders = new Headers(c.res.headers);
    addVaryAcceptEncoding(newHeaders);

    /**
     * PATH 1: Small responses - buffer and compress
     * Benefits: Sets Content-Length, enables progress bars, allows range requests
     */
    if (!exceededBufferThreshold) {
      const body = concatenateUint8Arrays(chunks);

      let compressed: Uint8Array;
      try {
        compressed = await compressGzip(body);
      } catch (_error) {
        // If compression fails, return uncompressed
        c.res = createUncompressedResponse(c.res, chunks);
        return;
      }

      // Only use compressed version if it's actually smaller
      if (compressed.byteLength >= totalSize) {
        c.res = createUncompressedResponse(c.res, chunks);
        return;
      }

      // Set compression headers with Content-Length
      newHeaders.set("Content-Encoding", "gzip");
      newHeaders.set("Content-Length", compressed.byteLength.toString());

      c.res = new Response(compressed as BodyInit, {
        status: c.res.status,
        statusText: c.res.statusText,
        headers: newHeaders,
      });
      return;
    }

    /**
     * PATH 2: Large responses - streaming compression
     * Benefits: Constant memory usage, no buffering
     * Trade-off: No Content-Length (uses chunked transfer encoding)
     */
    const body = concatenateUint8Arrays(chunks);
    const compressedStream = createCompressedStream(body);

    newHeaders.set("Content-Encoding", "gzip");
    newHeaders.delete("Content-Length"); // Explicit about chunked encoding

    c.res = new Response(compressedStream, {
      status: c.res.status,
      statusText: c.res.statusText,
      headers: newHeaders,
    });
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

/**
 * Recreate response from chunks when compression is skipped.
 */
function createUncompressedResponse(
  originalResponse: Response,
  chunks: Uint8Array[],
): Response {
  const body = concatenateUint8Arrays(chunks);
  return new Response(body as BodyInit, {
    status: originalResponse.status,
    statusText: originalResponse.statusText,
    headers: originalResponse.headers,
  });
}
