/**
 * Authentication Tests
 */

import { APIKeyAuth, JWTAuth } from '../src/auth';

describe('APIKeyAuth', () => {
  it('should store and return API key', () => {
    const auth = new APIKeyAuth({ apiKey: 'test-api-key-123' });
    expect(auth.getAuthHeader()).toBe('test-api-key-123');
  });

  it('should use custom header name', () => {
    const auth = new APIKeyAuth({
      apiKey: 'test-key',
      headerName: 'X-Custom-Key',
    });
    expect(auth.getHeaderName()).toBe('X-Custom-Key');
  });

  it('should throw error if API key is missing', () => {
    expect(() => new APIKeyAuth({ apiKey: '' })).toThrow('API key is required');
  });

  it('should report as valid when API key exists', () => {
    const auth = new APIKeyAuth({ apiKey: 'test-key' });
    expect(auth.isValid()).toBe(true);
  });
});

describe('JWTAuth', () => {
  it('should return Bearer token header', async () => {
    const auth = new JWTAuth({ token: 'test-jwt-token' });
    const header = await auth.getAuthHeader();
    expect(header).toBe('Bearer test-jwt-token');
  });

  it('should throw error if token is missing', () => {
    expect(() => new JWTAuth({ token: '' })).toThrow('JWT token is required');
  });

  it('should report as valid when no expiry set', () => {
    const auth = new JWTAuth({ token: 'test-token' });
    expect(auth.isValid()).toBe(true);
  });

  it('should report as invalid when token expired', () => {
    const auth = new JWTAuth({
      token: 'test-token',
      expiresAt: new Date(Date.now() - 60000), // 1 minute ago
    });
    expect(auth.isValid()).toBe(false);
  });

  it('should report as valid when token not yet expired', () => {
    const auth = new JWTAuth({
      token: 'test-token',
      expiresAt: new Date(Date.now() + 60000), // 1 minute from now
    });
    expect(auth.isValid()).toBe(true);
  });

  it('should allow manual token update', () => {
    const auth = new JWTAuth({ token: 'old-token' });
    auth.setToken('new-token');
    expect(auth.getToken()).toBe('new-token');
  });

  it('should call refresh callback when token expired', async () => {
    const refreshFn = jest.fn().mockResolvedValue({
      accessToken: 'refreshed-token',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });

    const auth = new JWTAuth({
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 60000),
      onRefresh: refreshFn,
    });

    await auth.getAuthHeader();
    expect(refreshFn).toHaveBeenCalled();
    expect(auth.getToken()).toBe('refreshed-token');
  });
});
