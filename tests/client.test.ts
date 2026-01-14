/**
 * WebANS Client Tests
 */

import { WebANSClient, APIKeyAuth } from '../src';

describe('WebANSClient', () => {
  it('should create client with default config', () => {
    const client = new WebANSClient();
    expect(client).toBeDefined();
    expect(client.agents).toBeDefined();
    expect(client.protocols).toBeDefined();
  });

  it('should create client with custom base URL', () => {
    const client = new WebANSClient({
      baseUrl: 'https://custom.webans.org',
    });
    expect(client).toBeDefined();
  });

  it('should create client with API key auth', () => {
    const client = new WebANSClient({
      auth: new APIKeyAuth({ apiKey: 'test-key' }),
    });
    expect(client).toBeDefined();
  });

  it('should create SSE client', () => {
    const client = new WebANSClient();
    const sseClient = client.createSSEClient();
    expect(sseClient).toBeDefined();
  });

  it('should create WebSocket client', () => {
    const client = new WebANSClient();
    const wsClient = client.createWebSocketClient();
    expect(wsClient).toBeDefined();
  });

  it('should expose HTTP client for advanced usage', () => {
    const client = new WebANSClient();
    const httpClient = client.getHttpClient();
    expect(httpClient).toBeDefined();
    expect(httpClient.defaults.baseURL).toBe('https://api.webans.org');
  });

  it('should use custom timeout', () => {
    const client = new WebANSClient({ timeout: 60000 });
    const httpClient = client.getHttpClient();
    expect(httpClient.defaults.timeout).toBe(60000);
  });

  it('should use custom headers', () => {
    const client = new WebANSClient({
      headers: { 'X-Custom-Header': 'custom-value' },
    });
    const httpClient = client.getHttpClient();
    expect(httpClient.defaults.headers['X-Custom-Header']).toBe('custom-value');
  });
});
