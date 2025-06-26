# Cryptocurrency Payment Integration

This document outlines the implementation of Coinbase cryptocurrency payments alongside existing Stripe payments for the Battle Creek Drone marketplace.

## Overview

Users can now choose between traditional credit card payments (Stripe) and cryptocurrency payments (Coinbase) when purchasing drone footage and images.

## Features Implemented

### 🔄 Dual Payment System
- **Stripe Integration**: Credit card payments for traditional users
- **Coinbase Integration**: Cryptocurrency payments for crypto enthusiasts
- **Unified Interface**: Single payment modal with method selection

### 💰 Supported Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- USD Coin (USDC)
- Tether (USDT)

### 🗄️ Database Enhancement
- Extended `purchases` table with crypto payment fields
- New `crypto_payments` table for detailed tracking
- Payment method differentiation (`stripe` vs `crypto`)
- Transaction hash and confirmation tracking

### 🔐 Security Features
- Row Level Security (RLS) policies for crypto payments
- Secure webhook handling for payment confirmations
- Payment expiration and cleanup mechanisms

## Files Added/Modified

### New Components
- `src/components/PaymentModal.tsx` - Unified payment method selection
- `src/components/CryptoPaymentModal.tsx` - Cryptocurrency payment interface
- `src/lib/coinbase.ts` - Coinbase SDK integration
- `src/styles/crypto-payment.css` - Payment modal styling

### Database Changes
- `supabase/migrations/20250626000000_add_crypto_payments.sql` - Schema updates
- Added crypto payment fields to purchases table
- Created crypto_payments tracking table
- Added indexes and triggers

### Updated Services
- `src/lib/supabase.ts` - Extended with crypto payment methods
- Added `CryptoPaymentService` for crypto payment management
- Updated `Purchase` interface with crypto fields

## Environment Variables Required

```env
# Coinbase Developer Platform
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
NETWORK_ID=base-sepolia  # or base-mainnet for production
COINBASE_API_KEY=your_coinbase_api_key
```

## Usage Example

```tsx
import PaymentModal from '../components/PaymentModal';

// In your component
<PaymentModal
  isOpen={showPayment}
  onClose={() => setShowPayment(false)}
  mediaAsset={{
    id: 'asset-123',
    title: 'Aerial Photography',
    individual_price: 25.00
  }}
  licenseType="standard"
  buyerEmail="user@example.com"
  onPaymentSuccess={(purchaseId) => {
    console.log('Payment successful:', purchaseId);
  }}
  onPaymentError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

## Payment Flow

### Stripe Flow
1. User selects credit card payment
2. Purchase record created with `payment_method: 'stripe'`
3. Redirect to Stripe Checkout
4. Payment confirmation updates purchase status

### Crypto Flow
1. User selects cryptocurrency payment
2. Crypto payment modal opens with currency selection
3. Real-time price conversion displayed
4. Payment details generated (wallet address, amount)
5. User sends crypto from their wallet
6. Payment confirmation tracked via webhooks
7. Purchase status updated on confirmation

## Database Schema

### Updated Purchases Table
```sql
ALTER TABLE purchases ADD COLUMN payment_method text DEFAULT 'stripe';
ALTER TABLE purchases ADD COLUMN crypto_charge_id text;
ALTER TABLE purchases ADD COLUMN crypto_currency text;
ALTER TABLE purchases ADD COLUMN crypto_amount text;
ALTER TABLE purchases ADD COLUMN crypto_wallet_address text;
ALTER TABLE purchases ADD COLUMN crypto_transaction_hash text;
ALTER TABLE purchases ADD COLUMN crypto_confirmation_count integer DEFAULT 0;
```

### New Crypto Payments Table
```sql
CREATE TABLE crypto_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id),
  charge_id text UNIQUE NOT NULL,
  currency text NOT NULL,
  amount text NOT NULL,
  wallet_address text NOT NULL,
  status text DEFAULT 'pending',
  transaction_hash text,
  confirmation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  expires_at timestamptz NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);
```

## Security Considerations

### Payment Security
- All crypto payments expire after 15 minutes
- Payment confirmation requires blockchain verification
- Webhook signature validation for payment updates
- Row Level Security policies restrict access to payment data

### Data Protection
- Crypto wallet addresses and transaction hashes are stored securely
- Personal information is never logged in payment metadata
- Payment amounts are validated before processing

## Testing

### Demo Page
Visit `/payment-demo` to see the payment integration in action.

### Test Flow
1. Navigate to payment demo page
2. Click "Purchase with Payment Options"
3. Select between Stripe and Crypto payments
4. Follow the respective payment flow

## Production Deployment

### Prerequisites
1. Coinbase Developer Platform account
2. API keys configured in environment
3. Database migration applied
4. Webhook endpoints configured

### Environment Setup
```bash
# Install dependencies
npm install @coinbase/coinbase-sdk crypto-js

# Run database migration
# (Apply the SQL from the migration file to your Supabase database)

# Set environment variables
CDP_API_KEY_ID=your_production_key
CDP_API_KEY_SECRET=your_production_secret
NETWORK_ID=base-mainnet
```

## Monitoring and Analytics

### Payment Tracking
- All payments tracked in `purchases` table
- Crypto-specific details in `crypto_payments` table
- Real-time status updates via webhooks
- Failed payment cleanup via scheduled jobs

### Business Intelligence
- Payment method preferences (Stripe vs Crypto)
- Cryptocurrency adoption rates
- Average transaction values by payment method
- Geographic distribution of crypto payments

## Future Enhancements

### Planned Features
- [ ] QR code generation for crypto payments
- [ ] Multi-signature wallet support
- [ ] Automatic refund processing
- [ ] Payment method recommendations
- [ ] Loyalty rewards for crypto users

### Technical Improvements
- [ ] Real-time exchange rate APIs
- [ ] Advanced payment analytics dashboard
- [ ] Automated tax reporting integration
- [ ] Multi-chain support (Polygon, Arbitrum)

## Support

For issues related to crypto payments:
1. Check payment status in the database
2. Verify webhook delivery
3. Review transaction on blockchain explorer
4. Contact Coinbase support for SDK issues

## License

This crypto payment integration is part of the Battle Creek Drone platform and follows the same licensing terms.