import { ethers } from 'ethers';
import { Checkout } from '@coinbase/onchainkit/checkout';

export async function createCharge(mediaId: string, amount: number, userId: string): Promise<string> {
  const response = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': import.meta.env.CDP_API_KEY_SECRET,
    },
    body: JSON.stringify({
      local_price: { amount: amount.toString(), currency: 'USDC' },
      metadata: { mediaId, userId },
    }),
  });
  const data = await response.json();
  return data.id;
}

export async function initiateX402Payment(mediaId: string, amount: number, userId: string, locals: any) {
  try {
    const chargeId = await createCharge(mediaId, amount, userId);
    const checkout = new Checkout({ chargeId });
    const payment = {
      id: chargeId,
      url: checkout.getPaymentUrl() || `${import.meta.env.SITE_URL}/media/${mediaId}?charge=${chargeId}`,
    };
    await locals.DB.prepare('INSERT INTO purchases (id, user_id, media_id, method, tx_hash, price_paid) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), userId, mediaId, 'web3', payment.id, amount * 100)
      .run();
    return payment.url;
  } catch (error) {
    console.error('x402pay error:', error);
    throw new Error('Payment initiation failed');
  }
}

export async function getWalletBalance(userId: string) {
  try {
    // Placeholder
    return { balance: '0.1 ETH' };
  } catch (error) {
    console.error('Wallet balance error:', error);
    throw new Error('Failed to retrieve wallet balance');
  }
}