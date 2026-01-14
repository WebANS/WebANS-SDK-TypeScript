/**
 * WebANS TypeScript SDK - Basic Usage Example
 *
 * This example demonstrates basic agent resolution and search operations.
 */

import { WebANSClient, APIKeyAuth } from '@webans/sdk';

async function main() {
  // Create client with API key authentication
  const client = new WebANSClient({
    baseUrl: 'https://api.webans.org',
    auth: new APIKeyAuth('your-api-key-here'),
  });

  try {
    // Check API health
    const health = await client.getHealth();
    console.log('API Health:', health.status);

    // Resolve an agent by name
    const agent = await client.agents.resolve('payment.processor.stripe');
    console.log('Resolved Agent:', {
      name: agent.name,
      endpoint: agent.endpoint,
      protocols: agent.protocols,
      version: agent.version,
    });

    // Search for agents by capability
    const searchResults = await client.agents.search({
      query: 'payment',
      protocols: ['a2a', 'mcp'],
      limit: 10,
    });
    console.log(`Found ${searchResults.total} agents matching 'payment'`);

    for (const result of searchResults.agents) {
      console.log(`  - ${result.name}: ${result.description || 'No description'}`);
    }

    // Get agent deletion impact assessment
    const impact = await client.agents.getDeletionImpact('payment.processor.stripe');
    console.log('Deletion Impact:', impact);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
