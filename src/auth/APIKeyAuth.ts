/**
 * API Key Authentication Provider
 * Simple API key authentication for WebANS
 */

import type { AuthProvider } from './types';

export interface APIKeyAuthConfig {
  /** API key value */
  apiKey: string;
  /** Header name (default: X-API-Key) */
  headerName?: string;
}

export class APIKeyAuth implements AuthProvider {
  private readonly apiKey: string;
  private readonly headerName: string;

  constructor(config: APIKeyAuthConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.headerName = config.headerName || 'X-API-Key';
  }

  /**
   * Get the authorization header value
   * Returns the API key prefixed with the header name style
   */
  getAuthHeader(): string {
    return this.apiKey;
  }

  /**
   * Get the header name for this auth method
   */
  getHeaderName(): string {
    return this.headerName;
  }

  /**
   * API keys don't expire in the same way as tokens
   */
  isValid(): boolean {
    return !!this.apiKey;
  }
}
