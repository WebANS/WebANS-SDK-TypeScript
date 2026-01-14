/**
 * WebANS SSE Client
 * Server-Sent Events client for real-time event streaming
 */

import EventSource from 'eventsource';
import type { AuthProvider } from '../auth/types';

export interface SSEClientConfig {
  /** WebANS API base URL */
  baseUrl: string;
  /** SSE endpoint path */
  endpoint: string;
  /** Authentication provider */
  auth?: AuthProvider;
  /** Reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds */
  reconnectDelay?: number;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
}

export interface SSEEvent {
  /** Event type */
  type: string;
  /** Event data */
  data: unknown;
  /** Event ID */
  id?: string;
  /** Timestamp */
  timestamp?: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;
export type SSEErrorHandler = (error: Error) => void;

export class SSEClient {
  private readonly config: Required<SSEClientConfig>;
  private eventSource?: EventSource;
  private handlers: Map<string, Set<SSEEventHandler>> = new Map();
  private errorHandlers: Set<SSEErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private isConnected = false;

  constructor(config: SSEClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      endpoint: config.endpoint,
      auth: config.auth as AuthProvider,
      autoReconnect: config.autoReconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
    };
  }

  /**
   * Connect to the SSE stream
   */
  async connect(): Promise<void> {
    if (this.eventSource) {
      return; // Already connected
    }

    const url = `${this.config.baseUrl}${this.config.endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'text/event-stream',
    };

    // Add auth header if available
    if (this.config.auth) {
      const authHeader = await this.config.auth.getAuthHeader();
      if (this.config.auth.constructor.name === 'APIKeyAuth') {
        headers['X-API-Key'] = authHeader;
      } else {
        headers['Authorization'] = authHeader;
      }
    }

    this.eventSource = new EventSource(url, {
      headers,
    });

    this.eventSource.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('open', { type: 'open', data: { connected: true } });
    };

    this.eventSource.onerror = (_error) => {
      this.isConnected = false;
      const err = new Error('SSE connection error');
      this.errorHandlers.forEach((handler) => handler(err));

      if (
        this.config.autoReconnect &&
        this.reconnectAttempts < this.config.maxReconnectAttempts
      ) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.config.reconnectDelay);
      }
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = {
          type: data.type || 'message',
          data: data.data || data,
          id: event.lastEventId,
          timestamp: data.timestamp,
        };

        this.emit(sseEvent.type, sseEvent);
        this.emit('*', sseEvent); // Wildcard handler
      } catch {
        // Handle non-JSON messages
        const sseEvent: SSEEvent = {
          type: 'message',
          data: event.data,
          id: event.lastEventId,
        };
        this.emit('message', sseEvent);
        this.emit('*', sseEvent);
      }
    };
  }

  /**
   * Disconnect from the SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
      this.isConnected = false;
      this.emit('close', { type: 'close', data: { connected: false } });
    }
  }

  /**
   * Subscribe to events of a specific type
   * @param eventType Event type to subscribe to (use '*' for all events)
   * @param handler Event handler function
   */
  on(eventType: string, handler: SSEEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  /**
   * Unsubscribe from events
   * @param eventType Event type
   * @param handler Handler to remove
   */
  off(eventType: string, handler: SSEEventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  /**
   * Subscribe to error events
   * @param handler Error handler function
   */
  onError(handler: SSEErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Check if connected
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Emit event to handlers
   */
  private emit(eventType: string, event: SSEEvent): void {
    this.handlers.get(eventType)?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('SSE handler error:', error);
      }
    });
  }
}
