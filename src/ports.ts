/**
 * Get an available port starting from the provided port number.
 *
 * @param startPort
 * @returns
 */
export const getAvailablePort = (startPort: number): number => {
  for (let port = startPort; port < 65535; port++) {
    try {
      Deno.listen({ port }).close();

      return port;
    } catch (e) {
      if (e instanceof Deno.errors.AddrInUse) {
        continue;
      } else {
        throw e;
      }
    }
  }

  throw new Error("No available ports found");
};
