/**
 * JWT Authentication Provider
 * JWT token authentication for WebANS
 */

import type { AuthProvider, AuthToken } from './types';

export interface JWTAuthConfig {
  /** JWT access token */
  token: string;
  /** Token expiration timestamp */
  expiresAt?: Date;
  /** Refresh token (for automatic refresh) */
  refreshToken?: string;
  /** Callback to refresh the token */
  onRefresh?: () => Promise<AuthToken>;
}

export class JWTAuth implements AuthProvider {
  private token: string;
  private expiresAt?: Date;
  private refreshToken?: string;
  private onRefresh?: () => Promise<AuthToken>;

  constructor(config: JWTAuthConfig) {
    if (!config.token) {
      throw new Error('JWT token is required');
    }
    this.token = config.token;
    this.expiresAt = config.expiresAt;
    this.refreshToken = config.refreshToken;
    this.onRefresh = config.onRefresh;
  }

  /**
   * Get the authorization header value
   * Returns "Bearer <token>"
   */
  async getAuthHeader(): Promise<string> {
    // Auto-refresh if expired and refresh callback provided
    if (!this.isValid() && this.onRefresh) {
      await this.refresh();
    }
    return `Bearer ${this.token}`;
  }

  /**
   * Check if the token is still valid (not expired)
   */
  isValid(): boolean {
    if (!this.expiresAt) {
      return true; // No expiry set, assume valid
    }
    // Add 30 second buffer for network latency
    return new Date() < new Date(this.expiresAt.getTime() - 30000);
  }

  /**
   * Refresh the token using the refresh callback
   */
  async refresh(): Promise<void> {
    if (!this.onRefresh) {
      throw new Error('No refresh callback provided');
    }

    const newToken = await this.onRefresh();
    this.token = newToken.accessToken;
    if (newToken.expiresAt) {
      this.expiresAt = new Date(newToken.expiresAt);
    }
    if (newToken.refreshToken) {
      this.refreshToken = newToken.refreshToken;
    }
  }

  /**
   * Update the token manually
   */
  setToken(token: string, expiresAt?: Date): void {
    this.token = token;
    this.expiresAt = expiresAt;
  }

  /**
   * Get the current token (for debugging/logging)
   */
  getToken(): string {
    return this.token;
  }

  /**
   * Get the expiration date
   */
  getExpiresAt(): Date | undefined {
    return this.expiresAt;
  }
}
