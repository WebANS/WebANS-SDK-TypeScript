/**
 * WebANS Error Types
 * Typed exceptions for precise error handling
 */

export class WebANSError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public traceId?: string
  ) {
    super(message);
    this.name = 'WebANSError';
  }
}

export class AuthenticationError extends WebANSError {
  constructor(message: string, traceId?: string) {
    super(message, 'AUTHENTICATION_ERROR', 401, traceId);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends WebANSError {
  constructor(message: string, traceId?: string) {
    super(message, 'AUTHORIZATION_ERROR', 403, traceId);
    this.name = 'AuthorizationError';
  }
}

export class AgentNotFoundError extends WebANSError {
  constructor(agentName: string, traceId?: string) {
    super(`Agent not found: ${agentName}`, 'AGENT_NOT_FOUND', 404, traceId);
    this.name = 'AgentNotFoundError';
  }
}

export class AgentConflictError extends WebANSError {
  constructor(agentName: string, traceId?: string) {
    super(`Agent already exists: ${agentName}`, 'AGENT_CONFLICT', 409, traceId);
    this.name = 'AgentConflictError';
  }
}

export class ValidationError extends WebANSError {
  constructor(
    message: string,
    public details?: Record<string, string[]>,
    traceId?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400, traceId);
    this.name = 'ValidationError';
  }
}

export class CertificateError extends WebANSError {
  constructor(message: string, traceId?: string) {
    super(message, 'CERTIFICATE_ERROR', 400, traceId);
    this.name = 'CertificateError';
  }
}

export class ProtocolNegotiationError extends WebANSError {
  constructor(message: string, traceId?: string) {
    super(message, 'PROTOCOL_NEGOTIATION_ERROR', 422, traceId);
    this.name = 'ProtocolNegotiationError';
  }
}

export class RateLimitError extends WebANSError {
  constructor(
    message: string,
    public retryAfter?: number,
    traceId?: string
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, traceId);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends WebANSError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends WebANSError {
  constructor(message: string = 'Request timed out') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    traceId?: string;
    timestamp?: string;
    details?: Record<string, unknown>;
  };
}
