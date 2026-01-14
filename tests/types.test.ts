/**
 * Error Types Tests
 */

import {
  WebANSError,
  AuthenticationError,
  AgentNotFoundError,
  AgentConflictError,
  ValidationError,
  RateLimitError,
} from '../src/types/errors';

describe('Error Types', () => {
  describe('WebANSError', () => {
    it('should create error with code and status', () => {
      const error = new WebANSError('Test error', 'TEST_ERROR', 500, 'trace-123');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.traceId).toBe('trace-123');
      expect(error.name).toBe('WebANSError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Auth failed', 'trace-456');
      expect(error.message).toBe('Auth failed');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('AgentNotFoundError', () => {
    it('should create agent not found error with agent name', () => {
      const error = new AgentNotFoundError('test.agent.v1');
      expect(error.message).toBe('Agent not found: test.agent.v1');
      expect(error.code).toBe('AGENT_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('AgentConflictError', () => {
    it('should create agent conflict error', () => {
      const error = new AgentConflictError('existing.agent');
      expect(error.message).toBe('Agent already exists: existing.agent');
      expect(error.code).toBe('AGENT_CONFLICT');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with details', () => {
      const details = { name: ['Name is required'] };
      const error = new ValidationError('Validation failed', details);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError('Too many requests', 60);
      expect(error.message).toBe('Too many requests');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60);
    });
  });
});
