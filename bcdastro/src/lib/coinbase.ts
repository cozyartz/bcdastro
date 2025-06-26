import { initializeAgent } from './agentkit';

interface PaymentResponse {
  transactionHash: string;
  paymentUrl?: string;
}

export async function initiateAgentKitPayment(
  mediaId: string, 
  amountInCents: number, 
  userId: string
): Promise<string> {
  if (!mediaId || !amountInCents || !userId) {
    throw new Error('Missing required parameters for AgentKit payment');
  }

  if (amountInCents <= 0) {
    throw new Error('Invalid amount: must be greater than 0');
  }

  try {
    const response = await fetch('/api/createCharge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({
        mediaId,
        amount: amountInCents,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment initiation failed');
    }

    const data = await response.json();
    return data.transactionHash;
  } catch (error) {
    console.error('AgentKit payment error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function initiateX402Payment(
  mediaId: string, 
  amountInCents: number, 
  userId: string, 
  locals: any
): Promise<string> {
  try {
    const transactionHash = await initiateAgentKitPayment(mediaId, amountInCents, userId);
    
    if (!transactionHash) {
      throw new Error('Transaction hash not received from AgentKit payment');
    }

    // Create purchase record in database
    const purchaseId = crypto.randomUUID();
    await locals.DB?.prepare(`
      INSERT INTO purchases (id, user_id, media_id, method, tx_hash, price_paid, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(purchaseId, userId, mediaId, 'web3', transactionHash, amountInCents).run();

    // Return a success URL or transaction hash
    return `${locals.env.SITE_URL}/media/${mediaId}?success=true&tx=${transactionHash}`;
  } catch (error) {
    console.error('X402 payment error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function getWalletBalance(userId: string, env: any): Promise<{ balance: string; animated: boolean }> {
  try {
    const agent = initializeAgent(env);
    const walletData = await agent.getWalletDetails();
    
    if (!walletData || !walletData.balance) {
      throw new Error('Unable to retrieve wallet balance');
    }

    return { 
      balance: `${walletData.balance} ETH`, 
      animated: true 
    };
  } catch (error) {
    console.error('Wallet balance error:', error instanceof Error ? error.message : 'Unknown error');
    return { balance: '0.00 ETH', animated: false };
  }
}

export const balanceAnimation = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.5, type: 'spring' } },
};