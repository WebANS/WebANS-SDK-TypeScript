/**
 * WebANS Authentication Types
 */

export interface AuthProvider {
  /** Get authorization header value */
  getAuthHeader(): Promise<string> | string;
  /** Refresh authentication (if supported) */
  refresh?(): Promise<void>;
  /** Check if authentication is valid */
  isValid?(): boolean;
}

export interface AuthToken {
  /** Access token */
  accessToken: string;
  /** Token type (usually "Bearer") */
  tokenType: string;
  /** Expiration timestamp */
  expiresAt?: string;
  /** Refresh token (if available) */
  refreshToken?: string;
  /** Token scope */
  scope?: string;
}

export interface ChallengeResponse {
  /** Server-provided challenge */
  challenge: string;
  /** Expiration in seconds */
  expiresIn: number;
}

export interface CertificateAuthResponse extends AuthToken {
  /** Authenticated agent ID */
  agentId: string;
}
