/**
 * WebANS TypeScript SDK
 * Official TypeScript/JavaScript SDK for WebANS Agent Name Service
 *
 * @packageDocumentation
 */

// Main client
export { WebANSClient, type WebANSClientConfig } from './client/WebANSClient';
export { AgentsAPI } from './client/agents';
export { ProtocolsAPI } from './client/protocols';

// Authentication
export {
  type AuthProvider,
  type AuthToken,
  type ChallengeResponse,
  type CertificateAuthResponse,
} from './auth/types';
export { APIKeyAuth, type APIKeyAuthConfig } from './auth/APIKeyAuth';
export { JWTAuth, type JWTAuthConfig } from './auth/JWTAuth';
export { CertificateAuth, type CertificateAuthConfig } from './auth/CertificateAuth';

// Streaming
export {
  SSEClient,
  type SSEClientConfig,
  type SSEEvent,
  type SSEEventHandler,
  type SSEErrorHandler,
} from './streaming/SSEClient';
export {
  WebSocketClient,
  type WebSocketClientConfig,
  type WebSocketMessage,
  type WebSocketMessageHandler,
  type WebSocketErrorHandler,
} from './streaming/WebSocketClient';

// Types
export type {
  Agent,
  AgentCapabilities,
  AgentStatus,
  AgentResolution,
  AgentRegistration,
  AgentUpdate,
  AgentSearchQuery,
  AgentSearchResult,
  ThreeWordName,
} from './types/agent';

export type {
  ProtocolType,
  ProtocolNegotiationRequest,
  ProtocolNegotiationResponse,
  ProtocolCapabilities,
  A2ACapabilities,
  MCPCapabilities,
  UCPCapabilities,
  StreamingConfig,
  NegotiatedFeatures,
  ProtocolMessage,
} from './types/protocol';

// Errors
export {
  WebANSError,
  AuthenticationError,
  AuthorizationError,
  AgentNotFoundError,
  AgentConflictError,
  ValidationError,
  CertificateError,
  ProtocolNegotiationError,
  RateLimitError,
  NetworkError,
  TimeoutError,
  type APIErrorResponse,
} from './types/errors';
