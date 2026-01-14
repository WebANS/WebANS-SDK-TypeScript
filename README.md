# WebANS TypeScript SDK

> **The Official TypeScript/JavaScript SDK for the WebANS Agent Name Service**

[![npm version](https://img.shields.io/npm/v/@webans/sdk.svg)](https://www.npmjs.com/package/@webans/sdk)
[![CI](https://github.com/WebANS/WebANS-SDK-TypeScript/actions/workflows/ci.yml/badge.svg)](https://github.com/WebANS/WebANS-SDK-TypeScript/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## Overview

WebANS (Web Agent Name Service) is the **DNS equivalent for AI agents**. This SDK provides a complete TypeScript/JavaScript client for:

- **Agent Discovery** - Resolve agent names to endpoints, certificates, and capabilities
- **Agent Registration** - Register new agents in the global registry
- **Multi-Protocol Support** - A2A (Google), MCP (Anthropic), UCP (Commerce), and custom protocols
- **Real-time Events** - SSE and WebSocket streaming for live updates
- **Certificate-Based Auth** - X.509 certificate authentication for agent-to-agent communication

---

## Installation

```bash
npm install @webans/sdk
# or
yarn add @webans/sdk
# or
pnpm add @webans/sdk
```

---

## Quick Start

```typescript
import { WebANSClient, APIKeyAuth } from '@webans/sdk';

// Create client with API key authentication
const client = new WebANSClient({
  auth: new APIKeyAuth({ apiKey: 'your-api-key' }),
});

// Resolve an agent
const { agent } = await client.agents.resolve('payment.processor.stripe.v2.1');
console.log(`Endpoint: ${agent.endpoint}`);
console.log(`Protocols: ${agent.protocols.join(', ')}`);

// Register a new agent
const newAgent = await client.agents.register({
  name: 'my.awesome.agent.v1',
  endpoint: 'https://api.example.com/agent',
  protocols: ['a2a', 'mcp'],
  capabilities: {
    authentication: ['jwt', 'certificate'],
    communication: ['rest', 'grpc'],
  },
});
```

---

## Authentication Methods

### API Key Authentication

```typescript
import { WebANSClient, APIKeyAuth } from '@webans/sdk';

const client = new WebANSClient({
  auth: new APIKeyAuth({ apiKey: 'your-api-key' }),
});
```

### JWT Authentication

```typescript
import { WebANSClient, JWTAuth } from '@webans/sdk';

const client = new WebANSClient({
  auth: new JWTAuth({
    token: 'your-jwt-token',
    expiresAt: new Date('2025-12-31'),
    onRefresh: async () => {
      // Return refreshed token
      return { accessToken: 'new-token', tokenType: 'Bearer' };
    },
  }),
});
```

### Certificate-Based Authentication (Agent-to-Agent)

```typescript
import { WebANSClient, CertificateAuth } from '@webans/sdk';
import { readFileSync } from 'fs';

const client = new WebANSClient({
  auth: new CertificateAuth({
    certificate: readFileSync('agent.crt', 'utf-8'),
    privateKey: readFileSync('agent.key', 'utf-8'),
  }),
});

// Authentication happens automatically via challenge-response
const { agent } = await client.agents.resolve('target.agent.v1');
```

---

## Agent Operations

### Resolve Agent

```typescript
// Simple resolution
const { agent, ttl, cached } = await client.agents.resolve('payment.processor.stripe');

// Resolution with protocol hint
const { agent } = await client.agents.resolve('my.agent', 'mcp');
```

### Search Agents

```typescript
const results = await client.agents.search({
  query: 'payment',
  protocols: ['a2a'],
  status: 'active',
  limit: 10,
});

for (const agent of results.agents) {
  console.log(`${agent.name} - ${agent.endpoint}`);
}
```

### Register Agent

```typescript
const agent = await client.agents.register({
  name: 'company.service.agent.v1',
  endpoint: 'https://api.company.com/agent',
  protocols: ['a2a', 'mcp', 'ucp'],
  capabilities: {
    authentication: ['jwt', 'certificate'],
    dataFormats: ['json', 'protobuf'],
  },
  metadata: {
    owner: 'team@company.com',
    description: 'Production payment processing agent',
  },
});
```

### Update Agent

```typescript
const updated = await client.agents.update('my.agent.v1', {
  endpoint: 'https://new-endpoint.com/agent',
  capabilities: {
    authentication: ['jwt', 'certificate', 'oauth2'],
  },
});
```

### Delete Agent (Soft Delete)

```typescript
// Soft delete with recovery period
await client.agents.delete('my.agent.v1');

// Check deletion impact before deleting
const impact = await client.agents.getDeletionImpact('my.agent.v1');
console.log(`Dependents: ${impact.dependents.join(', ')}`);

// Recover within recovery period
const recovered = await client.agents.recover('my.agent.v1');
```

---

## Protocol Negotiation

```typescript
// Negotiate protocol with target agent
const session = await client.protocols.negotiate('target.agent.v1', {
  protocols: ['a2a', 'mcp', 'ucp'],
  capabilities: {
    a2a: { versions: ['1.0'] },
    mcp: { versions: ['1.0'], tools: ['invoke', 'query'] },
  },
  streaming: {
    sse: true,
    websocket: true,
  },
});

console.log(`Negotiated: ${session.protocol} v${session.version}`);
console.log(`Session: ${session.sessionId}`);
```

---

## Real-time Streaming

### Server-Sent Events (SSE)

```typescript
const sse = client.createSSEClient();

// Subscribe to events
sse.on('agent.registered', (event) => {
  console.log('New agent registered:', event.data);
});

sse.on('agent.updated', (event) => {
  console.log('Agent updated:', event.data);
});

// Error handling
sse.onError((error) => {
  console.error('SSE error:', error);
});

// Connect
await sse.connect();

// Later: disconnect
sse.disconnect();
```

### WebSocket (Bidirectional)

```typescript
const ws = client.createWebSocketClient();

// Subscribe to messages
ws.on('agent.event', (message) => {
  console.log('Agent event:', message.payload);
});

// Connect
await ws.connect();

// Send messages
ws.send({
  type: 'subscribe',
  payload: { agents: ['my.agent.v1', 'other.agent.v1'] },
});

// Later: disconnect
ws.disconnect();
```

---

## Three-Word Names (DNS)

WebANS supports human-readable three-word names that resolve via DNS.

```typescript
// Generate a three-word name
const name = await client.agents.generateThreeWordName('my.long.agent.name.v1');
console.log(name.name); // e.g., "atlas.nova.cipher"

// Resolve three-word name
const resolved = await client.agents.resolveThreeWordName('atlas.nova.cipher');
console.log(resolved.agentName); // "my.long.agent.name.v1"
```

---

## Error Handling

```typescript
import {
  WebANSError,
  AuthenticationError,
  AgentNotFoundError,
  RateLimitError,
} from '@webans/sdk';

try {
  const { agent } = await client.agents.resolve('unknown.agent');
} catch (error) {
  if (error instanceof AgentNotFoundError) {
    console.log('Agent not found');
  } else if (error instanceof AuthenticationError) {
    console.log('Authentication failed');
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof WebANSError) {
    console.log(`Error: ${error.message} (${error.code})`);
    console.log(`Trace ID: ${error.traceId}`);
  }
}
```

---

## Configuration Options

```typescript
const client = new WebANSClient({
  // API base URL (default: https://api.webans.org)
  baseUrl: 'https://api.webans.org',

  // Authentication provider
  auth: new APIKeyAuth({ apiKey: 'key' }),

  // Request timeout in ms (default: 30000)
  timeout: 30000,

  // Retry attempts for failed requests (default: 3)
  retries: 3,

  // Retry delay in ms (default: 1000)
  retryDelay: 1000,

  // Custom headers
  headers: {
    'X-Request-ID': 'custom-id',
  },
});
```

---

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions:

```typescript
import type {
  Agent,
  AgentResolution,
  AgentRegistration,
  ProtocolNegotiationResponse,
  SSEEvent,
} from '@webans/sdk';
```

---

## Requirements

- Node.js 18.0.0 or later
- TypeScript 5.0+ (if using TypeScript)

---

## Links

- [WebANS Website](https://webans.org)
- [API Documentation](https://api.webans.org/docs)
- [OWASP ANS Specification](https://owasp.org/www-project-agent-name-service/)
- [GitHub Issues](https://github.com/WebANS/WebANS-SDK-TypeScript/issues)

---

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>WebANS</strong> - The DNS for AI Agents
</p>
