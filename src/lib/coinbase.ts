import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

// Initialize Coinbase with environment variables
const coinbase = new Coinbase({
  apiKeyName: import.meta.env.CDP_API_KEY_ID || process.env.CDP_API_KEY_ID,
  privateKey: import.meta.env.CDP_API_KEY_SECRET || process.env.CDP_API_KEY_SECRET,
});

export interface CryptoPaymentRequest {
  amount: number;
  currency: string; // USD, EUR, etc.
  description: string;
  metadata?: Record<string, any>;
  buyerEmail: string;
  mediaAssetId?: string;
  packageId?: string;
  licenseType: 'standard' | 'commercial' | 'exclusive';
}

export interface CryptoPaymentResponse {
  chargeId: string;
  walletAddress: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  paymentUrl: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  expiryTime: string;
}

export class CoinbaseService {
  private static instance: CoinbaseService;
  private wallet: Wallet | null = null;

  static getInstance(): CoinbaseService {
    if (!CoinbaseService.instance) {
      CoinbaseService.instance = new CoinbaseService();
    }
    return CoinbaseService.instance;
  }

  async initializeWallet(): Promise<Wallet> {
    try {
      if (!this.wallet) {
        // Create or import wallet using Coinbase SDK
        const networkId = import.meta.env.NETWORK_ID || process.env.NETWORK_ID || 'base-sepolia';
        this.wallet = await coinbase.createWallet({ networkId });
      }
      return this.wallet;
    } catch (error) {
      console.error('Failed to initialize Coinbase wallet:', error);
      throw new Error('Wallet initialization failed');
    }
  }

  async createCryptoPayment(request: CryptoPaymentRequest): Promise<CryptoPaymentResponse> {
    try {
      const wallet = await this.initializeWallet();
      const address = await wallet.getDefaultAddress();

      // For demo purposes, we'll create a mock charge
      // In production, you'd use Coinbase Commerce API
      const chargeId = `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Convert USD to ETH (simplified - in production use real exchange rates)
      const ethPrice = 3000; // Mock ETH price in USD
      const cryptoAmount = (request.amount / ethPrice).toFixed(6);

      const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

      return {
        chargeId,
        walletAddress: address.getId(),
        cryptoAmount,
        cryptoCurrency: 'ETH',
        paymentUrl: `https://commerce.coinbase.com/charges/${chargeId}`,
        status: 'pending',
        expiryTime,
      };
    } catch (error) {
      console.error('Failed to create crypto payment:', error);
      throw new Error('Payment creation failed');
    }
  }

  async checkPaymentStatus(chargeId: string): Promise<string> {
    try {
      // In production, you'd query Coinbase Commerce API
      // For now, return mock status
      return 'pending';
    } catch (error) {
      console.error('Failed to check payment status:', error);
      return 'failed';
    }
  }

  async processWebhook(payload: any, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature (implement proper verification)
      // Process payment confirmation/failure events
      console.log('Webhook received:', payload);
      return true;
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return false;
    }
  }

  // Utility method to convert crypto amounts
  async convertUSDToCrypto(usdAmount: number, cryptoCurrency: string = 'ETH'): Promise<{amount: string, currency: string}> {
    // Mock conversion rates (in production, use real API)
    const rates: Record<string, number> = {
      'ETH': 3000,
      'BTC': 65000,
      'USDC': 1,
      'USDT': 1,
    };

    const rate = rates[cryptoCurrency] || rates['ETH'];
    const cryptoAmount = (usdAmount / rate).toFixed(6);

    return {
      amount: cryptoAmount,
      currency: cryptoCurrency,
    };
  }

  // Get supported cryptocurrencies
  getSupportedCurrencies(): Array<{code: string, name: string, symbol: string}> {
    return [
      { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
      { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
      { code: 'USDC', name: 'USD Coin', symbol: '$' },
      { code: 'USDT', name: 'Tether', symbol: '$' },
    ];
  }
}

export const coinbaseService = CoinbaseService.getInstance();