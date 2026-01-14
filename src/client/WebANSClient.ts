/**
 * WebANS Client
 * Main entry point for the WebANS TypeScript SDK
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AuthProvider } from '../auth/types';
import { AgentsAPI } from './agents';
import { ProtocolsAPI } from './protocols';
import { SSEClient } from '../streaming/SSEClient';
import { WebSocketClient } from '../streaming/WebSocketClient';
import {
  WebANSError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  NetworkError,
  type APIErrorResponse,
} from '../types/errors';

export interface WebANSClientConfig {
  /** WebANS API base URL */
  baseUrl?: string;
  /** Authentication provider */
  auth?: AuthProvider;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retries for failed requests */
  retries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

export class WebANSClient {
  private readonly httpClient: AxiosInstance;
  private readonly config: Required<Omit<WebANSClientConfig, 'auth' | 'headers'>> & {
    auth?: AuthProvider;
    headers?: Record<string, string>;
  };

  /** Agents API for registration, resolution, and management */
  public readonly agents: AgentsAPI;
  /** Protocols API for multi-protocol negotiation */
  public readonly protocols: ProtocolsAPI;

  constructor(config: WebANSClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api.webans.org',
      auth: config.auth,
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      headers: config.headers,
    };

    this.httpClient = this.createHttpClient();
    this.agents = new AgentsAPI(this.httpClient);
    this.protocols = new ProtocolsAPI(this.httpClient);
  }

  /**
   * Create an SSE client for real-time events
   * @param endpoint Optional custom endpoint (default: /v1/events/stream)
   */
  createSSEClient(endpoint?: string): SSEClient {
    return new SSEClient({
      baseUrl: this.config.baseUrl,
      endpoint: endpoint || '/v1/events/stream',
      auth: this.config.auth,
    });
  }

  /**
   * Create a WebSocket client for bidirectional communication
   * @param endpoint Optional custom endpoint (default: /v1/events/ws)
   */
  createWebSocketClient(endpoint?: string): WebSocketClient {
    return new WebSocketClient({
      baseUrl: this.config.baseUrl,
      endpoint: endpoint || '/v1/events/ws',
      auth: this.config.auth,
    });
  }

  /**
   * Get API health status
   */
  async getHealth(): Promise<{
    status: string;
    version: string;
    timestamp: string;
    checks: Record<string, string>;
  }> {
    const response = await this.httpClient.get('/health');
    return response.data;
  }

  /**
   * Get API configuration info
   */
  async getConfigInfo(): Promise<Record<string, unknown>> {
    const response = await this.httpClient.get('/config/info');
    return response.data;
  }

  /**
   * Create the HTTP client with interceptors
   */
  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WebANS-SDK-TypeScript/1.0.0',
        ...this.config.headers,
      },
    });

    // Request interceptor for authentication
    client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        if (this.config.auth) {
          const authHeader = await this.config.auth.getAuthHeader();
          // Handle different auth types
          if (this.config.auth.constructor.name === 'APIKeyAuth') {
            config.headers['X-API-Key'] = authHeader;
          } else {
            config.headers['Authorization'] = authHeader;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error)) {
          // Handle retries
          const config = error.config as AxiosRequestConfig & {
            _retryCount?: number;
          };

          if (
            config &&
            error.response?.status &&
            error.response.status >= 500 &&
            (config._retryCount || 0) < this.config.retries
          ) {
            config._retryCount = (config._retryCount || 0) + 1;
            await this.delay(this.config.retryDelay * config._retryCount);
            return client.request(config);
          }

          // Transform to typed errors
          const errorResponse = error.response?.data as APIErrorResponse | undefined;
          const traceId = errorResponse?.error?.traceId;

          switch (error.response?.status) {
            case 401:
              throw new AuthenticationError(
                errorResponse?.error?.message || 'Authentication failed',
                traceId
              );
            case 403:
              throw new AuthorizationError(
                errorResponse?.error?.message || 'Access denied',
                traceId
              );
            case 429:
              const retryAfter = error.response.headers['retry-after'];
              throw new RateLimitError(
                errorResponse?.error?.message || 'Rate limit exceeded',
                retryAfter ? parseInt(retryAfter, 10) : undefined,
                traceId
              );
            default:
              if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                throw new NetworkError('Request timed out', error);
              }
              if (!error.response) {
                throw new NetworkError('Network error', error);
              }
              throw new WebANSError(
                errorResponse?.error?.message || error.message,
                errorResponse?.error?.code || 'UNKNOWN_ERROR',
                error.response?.status,
                traceId
              );
          }
        }
        throw error;
      }
    );

    return client;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the underlying HTTP client (for advanced usage)
   */
  getHttpClient(): AxiosInstance {
    return this.httpClient;
  }
}
