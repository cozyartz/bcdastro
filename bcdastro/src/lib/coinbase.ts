import { ethers } from 'ethers';
import { Checkout } from '@coinbase/onchainkit/checkout';
import { base } from '@coinbase/onchainkit';
import { crypto } from 'crypto';

interface PaymentResponse {
  id: string;
  url: string;
}

export async function createCharge(mediaId: string, amount: number, userId: string, env: any): Promise<string> {
  if (!env.CDP_API_KEY_SECRET) throw new Error('CDP_API_KEY_SECRET is missing');
  if (!amount || isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

  const response = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': env.CDP_API_KEY_SECRET,
    },
    body: JSON.stringify({
      local_price: { amount: amount.toString(), currency: 'USDC' },
      metadata: { mediaId, userId },
      naming: { checkoutPage: `Buy ${mediaId} from BCDAstro` },
      idempotencyKey: crypto.randomUUID(), // Prevent duplicates
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Charge creation failed: ${error.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.id;
}

export async function initiateX402Payment(mediaId: string, amount: number, userId: string, locals: any): Promise<string> {
  try {
    const chargeId = await createCharge(mediaId, amount, userId, locals.env);
    const checkout = new Checkout({ chargeId, theme: 'dark' });
    const paymentUrl = checkout.getPaymentUrl() || `${locals.env.SITE_URL}/media/${mediaId}?charge=${chargeId}`;

    const purchaseId = crypto.randomUUID();
    await locals.DB.prepare(`
      INSERT INTO purchases (id, user_id, media_id, method, stripe_payment_id, tx_hash, price_paid, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(purchaseId, userId, mediaId, 'web3', chargeId, null, amount * 100).run();

    if (!paymentUrl) throw new Error('Payment URL not generated');
    return paymentUrl;
  } catch (error) {
    console.error('x402pay error:', error instanceof Error ? error.message : 'Unknown error');
    throw error; // Re-throw for upstream handling
  }
}

export async function getWalletBalance(userId: string, env: any): Promise<{ balance: string; animated: boolean }> {
  try {
    const provider = new ethers.providers.JsonRpcProvider(env.RPC_URL || 'https://mainnet.base.org');
    const walletAddress = await getWalletAddress(userId, env);
    if (!ethers.utils.isAddress(walletAddress)) throw new Error('Invalid wallet address');

    const balance = await provider.getBalance(walletAddress);
    const formattedBalance = ethers.utils.formatEther(balance);

    return { balance: `${formattedBalance} ETH`, animated: true };
  } catch (error) {
    console.error('Wallet balance error:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Failed to retrieve wallet balance');
  }
}

// Helper function (to be implemented)
async function getWalletAddress(userId: string, env: any): Promise<string> {
  // Placeholder: Fetch from CDP Wallet API or users table
  const db = env.DB;
  if (db) {
    const user = await db.prepare('SELECT wallet_address FROM users WHERE id = ?').bind(userId).first();
    return user?.wallet_address || '0x...'; // Replace with actual logic
  }
  return '0x...'; // Fallback
}

export const balanceAnimation = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.5, type: 'spring' } },
};