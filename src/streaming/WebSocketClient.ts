/**
 * WebANS WebSocket Client
 * Bidirectional WebSocket client for real-time communication
 */

import type { AuthProvider } from '../auth/types';

export interface WebSocketClientConfig {
  /** WebANS API base URL */
  baseUrl: string;
  /** WebSocket endpoint path */
  endpoint: string;
  /** Authentication provider */
  auth?: AuthProvider;
  /** Reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds */
  reconnectDelay?: number;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
  /** Heartbeat interval in milliseconds */
  heartbeatInterval?: number;
}

export interface WebSocketMessage {
  /** Message type */
  type: string;
  /** Message payload */
  payload: unknown;
  /** Message ID */
  id?: string;
  /** Timestamp */
  timestamp?: string;
}

export type WebSocketMessageHandler = (message: WebSocketMessage) => void;
export type WebSocketErrorHandler = (error: Error) => void;

export class WebSocketClient {
  private readonly config: Required<WebSocketClientConfig>;
  private socket?: WebSocket;
  private handlers: Map<string, Set<WebSocketMessageHandler>> = new Map();
  private errorHandlers: Set<WebSocketErrorHandler> = new Set();
  private reconnectAttempts = 0;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private isConnected = false;
  private messageQueue: WebSocketMessage[] = [];

  constructor(config: WebSocketClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      endpoint: config.endpoint,
      auth: config.auth as AuthProvider,
      autoReconnect: config.autoReconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? 3000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
    };
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = this.config.baseUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    const url = `${wsUrl}${this.config.endpoint}`;

    // Get auth token if available
    let authToken: string | undefined;
    if (this.config.auth) {
      authToken = await this.config.auth.getAuthHeader();
    }

    // For browser WebSocket, we can pass token as query param
    // In Node.js, you'd use headers with a WebSocket library that supports them
    const finalUrl = authToken
      ? `${url}?token=${encodeURIComponent(authToken)}`
      : url;

    this.socket = new WebSocket(finalUrl);

    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
      this.emit('open', { type: 'open', payload: { connected: true } });
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('close', {
        type: 'close',
        payload: { code: event.code, reason: event.reason },
      });

      if (
        this.config.autoReconnect &&
        this.reconnectAttempts < this.config.maxReconnectAttempts
      ) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.config.reconnectDelay);
      }
    };

    this.socket.onerror = () => {
      const err = new Error('WebSocket connection error');
      this.errorHandlers.forEach((handler) => handler(err));
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.emit(message.type, message);
        this.emit('*', message); // Wildcard handler
      } catch {
        // Handle non-JSON messages
        const message: WebSocketMessage = {
          type: 'message',
          payload: event.data,
        };
        this.emit('message', message);
        this.emit('*', message);
      }
    };

    // Wait for connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      const onOpen = () => {
        clearTimeout(timeout);
        this.socket?.removeEventListener('open', onOpen);
        this.socket?.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        clearTimeout(timeout);
        this.socket?.removeEventListener('open', onOpen);
        this.socket?.removeEventListener('error', onError);
        reject(new Error('WebSocket connection failed'));
      };

      this.socket?.addEventListener('open', onOpen);
      this.socket?.addEventListener('error', onError);
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = undefined;
      this.isConnected = false;
    }
  }

  /**
   * Send a message to the server
   * @param message Message to send
   */
  send(message: WebSocketMessage): void {
    if (!this.isConnected || !this.socket) {
      // Queue message for sending when connected
      this.messageQueue.push(message);
      return;
    }

    this.socket.send(
      JSON.stringify({
        ...message,
        id: message.id || this.generateId(),
        timestamp: message.timestamp || new Date().toISOString(),
      })
    );
  }

  /**
   * Subscribe to messages of a specific type
   * @param messageType Message type to subscribe to (use '*' for all messages)
   * @param handler Message handler function
   */
  on(messageType: string, handler: WebSocketMessageHandler): () => void {
    if (!this.handlers.has(messageType)) {
      this.handlers.set(messageType, new Set());
    }
    this.handlers.get(messageType)!.add(handler);

    // Return unsubscribe function
    return () => this.off(messageType, handler);
  }

  /**
   * Unsubscribe from messages
   * @param messageType Message type
   * @param handler Handler to remove
   */
  off(messageType: string, handler: WebSocketMessageHandler): void {
    this.handlers.get(messageType)?.delete(handler);
  }

  /**
   * Subscribe to error events
   * @param handler Error handler function
   */
  onError(handler: WebSocketErrorHandler): () => void {
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
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', payload: {} });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Flush queued messages after reconnect
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Emit message to handlers
   */
  private emit(messageType: string, message: WebSocketMessage): void {
    this.handlers.get(messageType)?.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('WebSocket handler error:', error);
      }
    });
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
