/**
 * Extracts the public interface of a class or object.
 */
export type PublicOf<T> = { [K in keyof T]: T[K] };
