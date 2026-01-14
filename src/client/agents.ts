/**
 * WebANS Agents API
 * Agent registration, resolution, and management
 */

import type { AxiosInstance } from 'axios';
import type {
  Agent,
  AgentResolution,
  AgentRegistration,
  AgentUpdate,
  AgentSearchQuery,
  AgentSearchResult,
  ThreeWordName,
} from '../types/agent';
import {
  AgentNotFoundError,
  AgentConflictError,
  ValidationError,
} from '../types/errors';

export class AgentsAPI {
  constructor(private readonly client: AxiosInstance) {}

  /**
   * Resolve an agent by name
   * @param name Agent name (hierarchical or three-word)
   * @param protocolHint Optional protocol preference
   */
  async resolve(name: string, protocolHint?: string): Promise<AgentResolution> {
    try {
      const params: Record<string, string> = {};
      if (protocolHint) {
        params.protocol = protocolHint;
      }

      const response = await this.client.get<AgentResolution>(
        `/v1/agents/resolve/${encodeURIComponent(name)}`,
        { params }
      );
      return response.data;
    } catch (error: unknown) {
      if (this.isAxiosError(error) && error.response?.status === 404) {
        throw new AgentNotFoundError(name);
      }
      throw error;
    }
  }

  /**
   * Register a new agent
   * @param registration Agent registration details
   */
  async register(registration: AgentRegistration): Promise<Agent> {
    try {
      const response = await this.client.post<Agent>(
        '/v1/agents/register',
        registration
      );
      return response.data;
    } catch (error: unknown) {
      if (this.isAxiosError(error)) {
        if (error.response?.status === 409) {
          throw new AgentConflictError(registration.name);
        }
        if (error.response?.status === 400) {
          throw new ValidationError(
            error.response.data?.error?.message || 'Validation failed',
            error.response.data?.error?.details
          );
        }
      }
      throw error;
    }
  }

  /**
   * Update an existing agent
   * @param name Agent name
   * @param update Update details
   */
  async update(name: string, update: AgentUpdate): Promise<Agent> {
    try {
      const response = await this.client.patch<Agent>(
        `/v1/agents/${encodeURIComponent(name)}`,
        update
      );
      return response.data;
    } catch (error: unknown) {
      if (this.isAxiosError(error) && error.response?.status === 404) {
        throw new AgentNotFoundError(name);
      }
      throw error;
    }
  }

  /**
   * Delete an agent (soft delete with recovery period)
   * @param name Agent name
   */
  async delete(name: string): Promise<void> {
    try {
      await this.client.delete(`/v1/agents/${encodeURIComponent(name)}`);
    } catch (error: unknown) {
      if (this.isAxiosError(error) && error.response?.status === 404) {
        throw new AgentNotFoundError(name);
      }
      throw error;
    }
  }

  /**
   * Recover a deleted agent within recovery period
   * @param name Agent name
   */
  async recover(name: string): Promise<Agent> {
    try {
      const response = await this.client.post<Agent>(
        `/v1/agents/${encodeURIComponent(name)}/recover`
      );
      return response.data;
    } catch (error: unknown) {
      if (this.isAxiosError(error) && error.response?.status === 404) {
        throw new AgentNotFoundError(name);
      }
      throw error;
    }
  }

  /**
   * Search for agents
   * @param query Search query parameters
   */
  async search(query: AgentSearchQuery = {}): Promise<AgentSearchResult> {
    const response = await this.client.get<AgentSearchResult>(
      '/v1/agents/search',
      { params: query }
    );
    return response.data;
  }

  /**
   * Get agent deletion impact assessment
   * @param name Agent name
   */
  async getDeletionImpact(name: string): Promise<{
    dependents: string[];
    warnings: string[];
  }> {
    const response = await this.client.get(
      `/v1/agents/${encodeURIComponent(name)}/deletion-impact`
    );
    return response.data;
  }

  /**
   * List deleted agents within recovery period
   */
  async listDeleted(): Promise<Agent[]> {
    const response = await this.client.get<{ agents: Agent[] }>(
      '/v1/agents/deleted'
    );
    return response.data.agents;
  }

  /**
   * Generate a three-word name for an agent
   * @param agentName Full hierarchical agent name
   */
  async generateThreeWordName(agentName: string): Promise<ThreeWordName> {
    const response = await this.client.post<ThreeWordName>(
      '/v1/names/generate',
      { agentName }
    );
    return response.data;
  }

  /**
   * Resolve a three-word name to full agent name
   * @param threeWordName Three-word name (e.g., "atlas.nova.cipher")
   */
  async resolveThreeWordName(threeWordName: string): Promise<ThreeWordName> {
    const response = await this.client.get<ThreeWordName>(
      `/v1/names/${encodeURIComponent(threeWordName)}`
    );
    return response.data;
  }

  /**
   * Type guard for Axios errors
   */
  private isAxiosError(error: unknown): error is {
    response?: { status: number; data?: { error?: { message?: string; details?: Record<string, string[]> } } };
  } {
    return typeof error === 'object' && error !== null && 'response' in error;
  }
}
