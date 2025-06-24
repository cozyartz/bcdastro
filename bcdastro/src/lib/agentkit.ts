import { AgentKit, Agent } from '@coinbase/onchainkit/agent';
import { base } from '@coinbase/onchainkit';
import { createPublicClient, http } from 'viem';

// Initialize AgentKit client
const client = createPublicClient({
  chain: base,
  transport: http(),
});

export class MediaAgent extends Agent {
  constructor(env: any) {
    super({
      client,
      apiKey: env.CDP_API_KEY_SECRET, // Use existing CDP key
      chainId: base.id,
    });
  }

  async processPayment(mediaId: string, userId: string, amount: number) {
    try {
      const payment = await this.execute({
        action: 'processPayment',
        params: { mediaId, userId, amount, currency: 'USDC' },
      });
      return payment.transactionHash;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  async checkAccess(mediaId: string, userId: string) {
    try {
      const access = await this.execute({
        action: 'checkAccess',
        params: { mediaId, userId },
      });
      return access.granted;
    } catch (error) {
      console.error('Access check failed:', error);
      return false;
    }
  }

  async suggestPrice(mediaType: 'video' | 'image', duration?: number) {
    try {
      const suggestion = await this.execute({
        action: 'suggestPrice',
        params: { mediaType, duration },
      });
      return suggestion.price;
    } catch (error) {
      console.error('Price suggestion failed:', error);
      return null;
    }
  }
}

export const initializeAgent = (env: any): MediaAgent => {
  return new MediaAgent(env);
};