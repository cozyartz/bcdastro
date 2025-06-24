import { Server as MCPServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport as MCPTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getMcpTools } from '@coinbase/agentkit-model-context-protocol';
import {
  AgentKit,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  CdpWalletProvider,
  erc20ActionProvider,
  pythActionProvider,
  walletActionProvider,
  wethActionProvider,
} from '@coinbase/agentkit';

async function initializeAgent() {
  try {
    const walletProvider = await CdpWalletProvider.configureWithWallet({
      apiKeyId: process.env.CDP_API_KEY_ID,
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      networkId: process.env.NETWORK_ID || 'base-sepolia',
    });
    return AgentKit.from({
      walletProvider,
      actionProviders: [
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyId: process.env.CDP_API_KEY_ID,
          apiKeySecret: process.env.CDP_API_KEY_SECRET,
        }),
        cdpWalletActionProvider({
          apiKeyId: process.env.CDP_API_KEY_ID,
          apiKeySecret: process.env.CDP_API_KEY_SECRET,
        }),
      ],
    });
  } catch (error) {
    console.error('Error initializing agent:', error);
    throw new Error('Failed to initialize agent');
  }
}

async function startServer() {
  const agent = await initializeAgent();
  const { tools, toolHandler } = await getMcpTools(agent);
  const server = new MCPServer({
    name: 'agentkit',
    version: '0.1.0',
  }, {
    capabilities: { tools: {} },
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await toolHandler(request.params.name, request.params.arguments);
    } catch (error) {
      throw new Error(`Tool ${request.params.name} failed: ${error.message}`);
    }
  });

  const transport = new MCPTransport();
  await server.connect(transport).catch(console.error);
}

startServer().catch(console.error);