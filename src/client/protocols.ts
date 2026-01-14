/**
 * WebANS Protocols API
 * Multi-protocol negotiation for A2A, MCP, UCP, and custom protocols
 */

import type { AxiosInstance } from 'axios';
import type {
  ProtocolNegotiationRequest,
  ProtocolNegotiationResponse,
  ProtocolMessage,
} from '../types/protocol';
import { ProtocolNegotiationError } from '../types/errors';

export class ProtocolsAPI {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Negotiate protocol with an agent
   * @param agentName Target agent name
   * @param request Negotiation request with protocol preferences
   */
  async negotiate(
    agentName: string,
    request: ProtocolNegotiationRequest
  ): Promise<ProtocolNegotiationResponse> {
    try {
      const response = await this.client.post<ProtocolNegotiationResponse>(
        '/v1/protocols/negotiate',
        {
          agentName,
          ...request,
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (this.isAxiosError(error) && error.response?.status === 422) {
        throw new ProtocolNegotiationError(
          error.response.data?.error?.message ||
            'Protocol negotiation failed: no compatible protocol found'
        );
      }
      throw error;
    }
  }

  /**
   * Send a message using a negotiated protocol session
   * @param sessionId Negotiation session ID
   * @param message Message to send
   */
  async sendMessage(
    sessionId: string,
    message: Omit<ProtocolMessage, 'id' | 'timestamp'>
  ): Promise<ProtocolMessage> {
    const response = await this.client.post<ProtocolMessage>(
      `/v1/protocols/sessions/${sessionId}/messages`,
      message
    );
    return response.data;
  }

  /**
   * Get messages from a protocol session
   * @param sessionId Negotiation session ID
   * @param since Only return messages after this timestamp
   */
  async getMessages(
    sessionId: string,
    since?: string
  ): Promise<ProtocolMessage[]> {
    const params: Record<string, string> = {};
    if (since) {
      params.since = since;
    }

    const response = await this.client.get<{ messages: ProtocolMessage[] }>(
      `/v1/protocols/sessions/${sessionId}/messages`,
      { params }
    );
    return response.data.messages;
  }

  /**
   * Get session status
   * @param sessionId Negotiation session ID
   */
  async getSessionStatus(sessionId: string): Promise<{
    status: 'active' | 'expired' | 'closed';
    protocol: string;
    expiresAt: string;
  }> {
    const response = await this.client.get(
      `/v1/protocols/sessions/${sessionId}`
    );
    return response.data;
  }

  /**
   * Close a protocol session
   * @param sessionId Negotiation session ID
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.client.delete(`/v1/protocols/sessions/${sessionId}`);
  }

  /**
   * Get supported protocols
   */
  async getSupportedProtocols(): Promise<{
    protocols: Array<{
      name: string;
      version: string;
      description: string;
    }>;
  }> {
    const response = await this.client.get('/v1/protocols');
    return response.data;
  }

  /**
   * Type guard for Axios errors
   */
  private isAxiosError(error: unknown): error is {
    response?: { status: number; data?: { error?: { message?: string } } };
  } {
    return typeof error === 'object' && error !== null && 'response' in error;
  }
}
