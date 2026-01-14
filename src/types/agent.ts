/**
 * WebANS Agent Types
 * OWASP ANS v1.1 compliant agent definitions
 */

export interface Agent {
  /** Hierarchical agent name (e.g., "payment.processor.stripe.v2.1") */
  name: string;
  /** Agent endpoint URL */
  endpoint: string;
  /** Supported protocols (a2a, mcp, ucp, custom) */
  protocols: string[];
  /** Agent capabilities */
  capabilities: AgentCapabilities;
  /** Agent status */
  status: AgentStatus;
  /** X.509 certificate in PEM format */
  certificate?: string;
  /** Certificate fingerprint (SHA-256) */
  fingerprint?: string;
  /** Agent version */
  version: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Registration timestamp */
  registeredAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
  /** Certificate expiration */
  expiresAt?: string;
}

export interface AgentCapabilities {
  /** Supported authentication methods */
  authentication?: string[];
  /** Supported communication methods */
  communication?: string[];
  /** Supported data formats */
  dataFormats?: string[];
  /** Custom capability extensions */
  [key: string]: unknown;
}

export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'deleted' | 'pending';

export interface AgentResolution {
  /** Resolved agent details */
  agent: Agent;
  /** Resolution timestamp */
  resolvedAt: string;
  /** Time-to-live in seconds */
  ttl: number;
  /** Cache status */
  cached: boolean;
}

export interface AgentRegistration {
  /** Hierarchical agent name */
  name: string;
  /** Agent endpoint URL */
  endpoint: string;
  /** Supported protocols */
  protocols: string[];
  /** Agent capabilities */
  capabilities?: AgentCapabilities;
  /** X.509 certificate in PEM format (required for certificate auth) */
  certificate?: string;
  /** Agent version */
  version?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface AgentUpdate {
  /** Updated endpoint URL */
  endpoint?: string;
  /** Updated protocols */
  protocols?: string[];
  /** Updated capabilities */
  capabilities?: AgentCapabilities;
  /** Updated certificate */
  certificate?: string;
  /** Updated version */
  version?: string;
  /** Updated metadata */
  metadata?: Record<string, unknown>;
  /** Updated status */
  status?: AgentStatus;
}

export interface AgentSearchQuery {
  /** Search query string */
  query?: string;
  /** Filter by protocols */
  protocols?: string[];
  /** Filter by capabilities */
  capabilities?: string[];
  /** Filter by status */
  status?: AgentStatus;
  /** Maximum results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface AgentSearchResult {
  /** List of matching agents */
  agents: Agent[];
  /** Total count of matching agents */
  total: number;
  /** Current offset */
  offset: number;
  /** Current limit */
  limit: number;
}

export interface ThreeWordName {
  /** Three-word name (e.g., "atlas.nova.cipher") */
  name: string;
  /** Full agent name it resolves to */
  agentName: string;
  /** DNS record value */
  dnsRecord: string;
}
