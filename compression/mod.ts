/**
 * Compression middleware for Mage.
 *
 * Compresses response bodies using gzip based on client Accept-Encoding header.
 * Only compresses responses above a size threshold and for compressible content types.
 *
 * Note: In production, compression is typically handled by CDN/reverse proxy.
 * Use this middleware for development or self-hosted deployments.
 *
 * @module
 */

export { compression, type CompressionOptions } from "./middleware.ts";
