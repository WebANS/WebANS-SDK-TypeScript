/**
 * Certificate-based Authentication Provider
 * X.509 certificate authentication with challenge-response flow for WebANS
 */

import { createSign, createPrivateKey, type KeyObject } from 'crypto';
import axios from 'axios';
import type { AuthProvider, ChallengeResponse, CertificateAuthResponse } from './types';
import { AuthenticationError, CertificateError } from '../types/errors';

export interface CertificateAuthConfig {
  /** X.509 certificate in PEM format */
  certificate: string;
  /** Private key in PEM format */
  privateKey: string;
  /** Private key passphrase (if encrypted) */
  passphrase?: string;
  /** WebANS API base URL */
  baseUrl?: string;
  /** Token refresh callback */
  onTokenReceived?: (token: CertificateAuthResponse) => void;
}

export class CertificateAuth implements AuthProvider {
  private readonly certificate: string;
  private readonly privateKey: KeyObject;
  private readonly baseUrl: string;
  private readonly onTokenReceived?: (token: CertificateAuthResponse) => void;

  private currentToken?: string;
  private tokenExpiresAt?: Date;
  private agentId?: string;

  constructor(config: CertificateAuthConfig) {
    if (!config.certificate) {
      throw new CertificateError('Certificate is required');
    }
    if (!config.privateKey) {
      throw new CertificateError('Private key is required');
    }

    this.certificate = config.certificate;
    this.baseUrl = config.baseUrl || 'https://api.webans.org';
    this.onTokenReceived = config.onTokenReceived;

    try {
      this.privateKey = createPrivateKey({
        key: config.privateKey,
        passphrase: config.passphrase,
      });
    } catch (error) {
      throw new CertificateError(
        `Failed to parse private key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the authorization header value
   * Performs challenge-response authentication if no valid token exists
   */
  async getAuthHeader(): Promise<string> {
    if (!this.isValid()) {
      await this.authenticate();
    }
    return `Bearer ${this.currentToken}`;
  }

  /**
   * Check if the current token is still valid
   */
  isValid(): boolean {
    if (!this.currentToken || !this.tokenExpiresAt) {
      return false;
    }
    // Add 30 second buffer for network latency
    return new Date() < new Date(this.tokenExpiresAt.getTime() - 30000);
  }

  /**
   * Refresh authentication by re-authenticating
   */
  async refresh(): Promise<void> {
    await this.authenticate();
  }

  /**
   * Perform challenge-response authentication
   */
  async authenticate(): Promise<CertificateAuthResponse> {
    // Step 1: Get challenge from server
    const challenge = await this.getChallenge();

    // Step 2: Sign the challenge with private key
    const signature = this.signChallenge(challenge.challenge);

    // Step 3: Submit certificate + signature + challenge
    const response = await this.submitAuth(challenge.challenge, signature);

    // Store the token
    this.currentToken = response.accessToken;
    this.tokenExpiresAt = response.expiresAt
      ? new Date(response.expiresAt)
      : new Date(Date.now() + 3600000); // Default 1 hour
    this.agentId = response.agentId;

    // Notify callback if provided
    if (this.onTokenReceived) {
      this.onTokenReceived(response);
    }

    return response;
  }

  /**
   * Get a challenge from the server
   */
  private async getChallenge(): Promise<ChallengeResponse> {
    try {
      const response = await axios.get<ChallengeResponse>(
        `${this.baseUrl}/v1/auth/challenge`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AuthenticationError(
          `Failed to get challenge: ${error.response?.data?.error?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Sign a challenge with the private key
   */
  private signChallenge(challenge: string): string {
    const sign = createSign('SHA256');
    sign.update(challenge);
    sign.end();
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Submit authentication request with certificate and signature
   */
  private async submitAuth(
    challenge: string,
    signature: string
  ): Promise<CertificateAuthResponse> {
    try {
      const response = await axios.post<CertificateAuthResponse>(
        `${this.baseUrl}/v1/auth/authenticate`,
        {
          certificate: this.certificate,
          signature,
          challenge,
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        throw new AuthenticationError(
          `Certificate authentication failed: ${errorMessage}`
        );
      }
      throw error;
    }
  }

  /**
   * Get the authenticated agent ID
   */
  getAgentId(): string | undefined {
    return this.agentId;
  }

  /**
   * Get the certificate
   */
  getCertificate(): string {
    return this.certificate;
  }
}
