/**
 * WebANS TypeScript SDK - Real-Time Events Example
 *
 * This example demonstrates subscribing to real-time events using SSE and WebSocket.
 */

import { WebANSClient, APIKeyAuth, SSEClient, WebSocketClient } from '@webans/sdk';

async function sseExample() {
  console.log('=== SSE (Server-Sent Events) Example ===\n');

  const client = new WebANSClient({
    baseUrl: 'https://api.webans.org',
    auth: new APIKeyAuth('your-api-key-here'),
  });

  // Create SSE client for real-time updates
  const sse = client.createSSEClient();

  // Subscribe to agent registration events
  const unsubscribeRegistration = sse.on('agent.registered', (event) => {
    console.log('New agent registered:', event.data);
  });

  // Subscribe to agent resolution events
  const unsubscribeResolution = sse.on('agent.resolved', (event) => {
    console.log('Agent resolved:', event.data);
  });

  // Subscribe to all events (wildcard)
  const unsubscribeAll = sse.on('*', (event) => {
    console.log(`[${event.type}]`, event.data);
  });

  // Handle errors
  const unsubscribeError = sse.onError((error) => {
    console.error('SSE Error:', error.message);
  });

  // Connect to the event stream
  await sse.connect();
  console.log('Connected to SSE stream');

  // Keep running for 30 seconds
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Cleanup
  unsubscribeRegistration();
  unsubscribeResolution();
  unsubscribeAll();
  unsubscribeError();
  sse.disconnect();
  console.log('Disconnected from SSE stream');
}

async function webSocketExample() {
  console.log('\n=== WebSocket Example ===\n');

  const client = new WebANSClient({
    baseUrl: 'https://api.webans.org',
    auth: new APIKeyAuth('your-api-key-here'),
  });

  // Create WebSocket client for bidirectional communication
  const ws = client.createWebSocketClient();

  // Subscribe to messages
  ws.on('agent.update', (message) => {
    console.log('Agent updated:', message.payload);
  });

  ws.on('pong', (message) => {
    console.log('Pong received:', message.timestamp);
  });

  // Handle errors
  ws.onError((error) => {
    console.error('WebSocket Error:', error.message);
  });

  // Connect
  await ws.connect();
  console.log('Connected to WebSocket');

  // Send a ping message
  await ws.send({
    type: 'ping',
    payload: { timestamp: new Date().toISOString() },
  });

  // Subscribe to a specific agent's updates
  await ws.send({
    type: 'subscribe',
    payload: {
      agentName: 'payment.processor.stripe',
      events: ['update', 'delete', 'certificate.renewed'],
    },
  });

  // Keep running for 30 seconds
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // Cleanup
  ws.disconnect();
  console.log('Disconnected from WebSocket');
}

async function main() {
  try {
    await sseExample();
    await webSocketExample();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
