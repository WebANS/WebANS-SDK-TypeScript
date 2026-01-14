/**
 * WebANS Protocol Types
 * Multi-protocol support for A2A, MCP, UCP, and custom protocols
 */

export type ProtocolType = 'a2a' | 'mcp' | 'ucp' | 'custom';

export interface ProtocolNegotiationRequest {
  /** Requested protocols in order of preference */
  protocols: ProtocolType[];
  /** Protocol-specific capabilities */
  capabilities?: ProtocolCapabilities;
  /** Compression preferences */
  compression?: string[];
  /** Streaming configuration */
  streaming?: StreamingConfig;
}

export interface ProtocolCapabilities {
  /** A2A protocol capabilities */
  a2a?: A2ACapabilities;
  /** MCP protocol capabilities */
  mcp?: MCPCapabilities;
  /** UCP protocol capabilities */
  ucp?: UCPCapabilities;
  /** Custom protocol capabilities */
  custom?: Record<string, unknown>;
}

export interface A2ACapabilities {
  /** Supported A2A versions */
  versions?: string[];
  /** Supported message types */
  messageTypes?: string[];
  /** Supported authentication methods */
  authentication?: string[];
}

export interface MCPCapabilities {
  /** Supported MCP versions */
  versions?: string[];
  /** Supported tools */
  tools?: string[];
  /** Supported resources */
  resources?: string[];
  /** Supported prompts */
  prompts?: string[];
}

export interface UCPCapabilities {
  /** Supported UCP versions */
  versions?: string[];
  /** Supported commerce operations */
  operations?: string[];
  /** Supported payment methods */
  paymentMethods?: string[];
  /** AP2 mandate support */
  ap2Support?: boolean;
}

export interface StreamingConfig {
  /** Enable SSE streaming */
  sse?: boolean;
  /** Enable WebSocket streaming */
  websocket?: boolean;
  /** Heartbeat interval in seconds */
  heartbeatInterval?: number;
  /** Reconnect on disconnect */
  autoReconnect?: boolean;
}

export interface ProtocolNegotiationResponse {
  /** Negotiated protocol */
  protocol: ProtocolType;
  /** Negotiated version */
  version: string;
  /** Session ID for this negotiation */
  sessionId: string;
  /** Negotiated features */
  features: NegotiatedFeatures;
  /** Session expiration timestamp */
  expiresAt: string;
}

export interface NegotiatedFeatures {
  /** Compression algorithm to use */
  compression?: string;
  /** Streaming configuration */
  streaming?: StreamingConfig;
  /** Protocol-specific features */
  protocolFeatures?: Record<string, unknown>;
}

export interface ProtocolMessage {
  /** Message ID */
  id: string;
  /** Message type */
  type: string;
  /** Message payload */
  payload: unknown;
  /** Timestamp */
  timestamp: string;
  /** Protocol version */
  protocolVersion?: string;
}
