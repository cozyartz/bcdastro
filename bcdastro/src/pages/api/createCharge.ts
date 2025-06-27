import type { APIRoute } from 'astro';
import { getSession } from '../../lib/auth';
import { initializeAgent } from '../../lib/agentkit';

interface ChargeRequest {
  mediaId: string;
  amount: number; // Amount in USD cents
  userId: string;
}

export const POST: APIRoute = async ({ request, locals, env }) => {
  const session = await getSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: ChargeRequest;
  try {
    body = await request.json() as ChargeRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { mediaId, amount, userId } = body;
  
  // Validate required fields
  if (!mediaId || !amount || !userId || typeof amount !== 'number' || amount <= 0) {
    return new Response(JSON.stringify({ error: 'Missing or invalid required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify user authorization
  if (session.userId !== userId) {
    return new Response(JSON.stringify({ error: 'User ID mismatch' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const db = locals.DB;
    if (!db) throw new Error('Database connection unavailable');

    // Fetch media details and creator wallet
    const media = await db.prepare('SELECT user_id, individual_price FROM media_assets WHERE id = ?')
      .bind(mediaId)
      .first();

    if (!media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the amount matches the media price
    if (amount !== media.individual_price) {
      return new Response(JSON.stringify({ error: 'Amount does not match media price' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get creator's wallet address
    const creator = await db.prepare('SELECT id FROM users WHERE id = ?')
      .bind(media.user_id)
      .first();

    if (!creator) {
      return new Response(JSON.stringify({ error: 'Creator not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize AgentKit
    const agent = initializeAgent(env);
    
    // Convert USD cents to USDC (1:1 ratio, but in proper decimal format)
    const usdcAmount = amount / 100; // Convert cents to dollars for USDC transfer
    
    // Get USDC contract address from environment
    const usdcContractAddress = env.USDC_CONTRACT_ADDRESS;
    if (!usdcContractAddress) {
      return new Response(JSON.stringify({ error: 'USDC contract address not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Execute USDC transfer using AgentKit
    const transferResult = await agent.execute({
      action: 'erc20_transfer',
      params: {
        contractAddress: usdcContractAddress,
        to: creator.id, // Assuming creator.id is their wallet address
        amount: usdcAmount.toString(),
      },
    });

    if (!transferResult || !transferResult.transactionHash) {
      throw new Error('AgentKit transfer failed');
    }

    // Create purchase record
    const purchaseId = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO purchases (id, buyer_email, media_asset_id, license_type, price_paid, payment_intent_id, payment_status, purchase_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      purchaseId,
      session.userId, // Using userId as buyer identifier
      mediaId,
      'standard',
      amount,
      transferResult.transactionHash,
      'completed'
    ).run();

    return new Response(JSON.stringify({ 
      transactionHash: transferResult.transactionHash,
      purchaseId: purchaseId,
      success: true 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Charge creation error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to create charge' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};