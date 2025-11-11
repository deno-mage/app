import type { MageMiddleware } from "../app/mod.ts";

/**
 * Options for the compression middleware.
 */
export interface CompressionOptions {
  /**
   * Minimum response size (in bytes) to compress.
   * @default 1024
   */
  threshold?: number;
  /**
   * Content types to compress. If not specified, compresses common text types.
   * @default ["text/*", "application/json", "application/javascript", ...]
   */
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
 * Compresses response bodies using gzip compression.
 *
 * Only compresses responses above a certain size threshold and for
 * compressible content types. Checks the Accept-Encoding header to ensure
 * the client supports gzip.
 *
 * Note: In production, compression is typically handled by CDN/reverse proxy
 * (nginx, Cloudflare, etc.). Use this middleware for:
 * - Development environments
 * - Self-hosted deployments without reverse proxy
 * - Deno Deploy (which doesn't auto-compress)
 *
 * @param options Configuration options for compression
 * @returns MageMiddleware
 */
export const compression = (
  options?: CompressionOptions,
): MageMiddleware => {
  const {
    threshold = 1024,
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

    // Read the body stream into chunks to check size and compress
    const reader = c.res.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        totalSize += value.byteLength;
      }
    } finally {
      reader.releaseLock();
    }

    // Check threshold
    if (totalSize < threshold) {
      // Restore the response with the original chunks
      const body = concatenateUint8Arrays(chunks);
      c.res = new Response(body, {
        status: c.res.status,
        statusText: c.res.statusText,
        headers: c.res.headers,
      });
      return;
    }

    // Concatenate chunks for compression
    const body = concatenateUint8Arrays(chunks);

    // Compress the body
    let compressed: Uint8Array;

    try {
      compressed = await compressGzip(body);
    } catch (_error) {
      // If compression fails, return uncompressed
      c.res = new Response(body, {
        status: c.res.status,
        statusText: c.res.statusText,
        headers: c.res.headers,
      });
      return;
    }

    // Only use compressed version if it's actually smaller
    if (compressed.byteLength >= totalSize) {
      c.res = new Response(body, {
        status: c.res.status,
        statusText: c.res.statusText,
        headers: c.res.headers,
      });
      return;
    }

    // Create new headers with compression headers added
    const newHeaders = new Headers(c.res.headers);
    newHeaders.set("Content-Encoding", "gzip");

    // Append to existing Vary header instead of overwriting
    const existingVary = newHeaders.get("Vary");
    if (existingVary) {
      const varyValues = existingVary.split(",").map((v) => v.trim());
      if (!varyValues.includes("Accept-Encoding")) {
        newHeaders.set("Vary", `${existingVary}, Accept-Encoding`);
      }
    } else {
      newHeaders.set("Vary", "Accept-Encoding");
    }

    newHeaders.delete("Content-Length"); // Let browser calculate from compressed body

    // Update response with compressed body
    c.res = new Response(compressed, {
      status: c.res.status,
      statusText: c.res.statusText,
      headers: newHeaders,
    });
  };
};

// Compression helpers using Deno's built-in APIs
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
