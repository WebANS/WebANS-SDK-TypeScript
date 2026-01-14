/**
 * WebANS TypeScript SDK - Certificate Authentication Example
 *
 * This example demonstrates X.509 certificate-based authentication
 * using the challenge-response flow.
 */

import { readFileSync } from 'fs';
import { WebANSClient, CertificateAuth } from '@webans/sdk';

async function main() {
  // Load certificate and private key from files
  const certificate = readFileSync('./certs/agent.crt', 'utf-8');
  const privateKey = readFileSync('./certs/agent.key', 'utf-8');

  // Create certificate auth provider
  const auth = new CertificateAuth({
    certificate,
    privateKey,
    // Optional: passphrase if key is encrypted
    // passphrase: 'your-passphrase',
    // Optional: callback when token is received
    onTokenReceived: (token) => {
      console.log('Token received, expires at:', token.expiresAt);
      console.log('Agent ID:', token.agentId);
    },
  });

  // Create client with certificate authentication
  const client = new WebANSClient({
    baseUrl: 'https://api.webans.org',
    auth,
  });

  try {
    // Register a new agent (requires authentication)
    const newAgent = await client.agents.register({
      name: 'my.secure.agent.v1',
      endpoint: 'https://api.mycompany.com/agent',
      protocols: ['a2a', 'mcp'],
      capabilities: {
        authentication: ['certificate', 'jwt'],
        communication: ['rest', 'grpc'],
      },
      version: '1.0.0',
      metadata: {
        owner: 'security@mycompany.com',
        description: 'Secure agent with certificate authentication',
      },
    });

    console.log('Agent registered successfully:', newAgent.name);
    console.log('Certificate serial:', newAgent.certificate?.serialNumber);

    // The auth provider automatically refreshes tokens as needed
    // subsequent requests will use the cached token
    const agent = await client.agents.resolve(newAgent.name);
    console.log('Agent resolved:', agent);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
