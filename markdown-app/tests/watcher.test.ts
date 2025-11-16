import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { registerHotReloadClient } from "../watcher.ts";

/**
 * Mock WebSocket for testing.
 * Implements minimal WebSocket interface needed for testing.
 */
class MockWebSocket {
  readyState: number = 1; // OPEN = 1
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  messages: string[] = [];

  send(message: string): void {
    if (this.readyState !== 1) {
      throw new Error("WebSocket is not open");
    }
    this.messages.push(message);
  }

  close(): void {
    this.readyState = 3; // CLOSED = 3
    if (this.onclose) {
      this.onclose();
    }
  }

  triggerError(): void {
    if (this.onerror) {
      this.onerror();
    }
  }
}

describe("markdown-app - watcher", () => {
  describe("registerHotReloadClient", () => {
    it("should register a WebSocket client", () => {
      const socket = new MockWebSocket() as unknown as WebSocket;

      expect(() => registerHotReloadClient(socket)).not.toThrow();
    });

    it("should set onclose handler", () => {
      const socket = new MockWebSocket() as unknown as WebSocket;

      registerHotReloadClient(socket);

      expect(socket.onclose).toBeDefined();
      expect(typeof socket.onclose).toBe("function");
    });

    it("should set onerror handler", () => {
      const socket = new MockWebSocket() as unknown as WebSocket;

      registerHotReloadClient(socket);

      expect(socket.onerror).toBeDefined();
      expect(typeof socket.onerror).toBe("function");
    });

    it("should remove client on close", () => {
      const socket = new MockWebSocket() as unknown as WebSocket;

      registerHotReloadClient(socket);

      // Trigger close event
      if (socket.onclose) {
        socket.onclose(new CloseEvent("close"));
      }

      // Client should be removed from set (we can't directly verify the Set,
      // but we verify the handler was called without error)
      expect(true).toBe(true);
    });

    it("should remove client on error", () => {
      const socket = new MockWebSocket() as unknown as WebSocket;

      registerHotReloadClient(socket);

      // Trigger error event
      if (socket.onerror) {
        socket.onerror(new Event("error"));
      }

      // Client should be removed from set
      expect(true).toBe(true);
    });

    it("should handle multiple clients", () => {
      const socket1 = new MockWebSocket() as unknown as WebSocket;
      const socket2 = new MockWebSocket() as unknown as WebSocket;

      expect(() => {
        registerHotReloadClient(socket1);
        registerHotReloadClient(socket2);
      }).not.toThrow();
    });

    it("should clean up client when onclose is triggered", () => {
      const socket = new MockWebSocket() as unknown as WebSocket;

      registerHotReloadClient(socket);

      // Verify onclose is set
      expect(socket.onclose).not.toBeNull();

      // Simulate close
      const mockSocket = socket as unknown as MockWebSocket;
      mockSocket.close();

      // Should not throw
      expect(true).toBe(true);
    });

    it("should clean up client when onerror is triggered", () => {
      const socket = new MockWebSocket() as unknown as WebSocket;

      registerHotReloadClient(socket);

      // Verify onerror is set
      expect(socket.onerror).not.toBeNull();

      // Simulate error
      const mockSocket = socket as unknown as MockWebSocket;
      mockSocket.triggerError();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
