import React, { useState } from 'react';
import CryptoPaymentModal from './CryptoPaymentModal';
import { PurchaseService, CryptoPaymentService } from '../lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaAsset?: {
    id: string;
    title: string;
    individual_price: number;
    package_price?: number;
    exclusive_price?: number;
  };
  packageData?: {
    id: string;
    title: string;
    package_price: number;
  };
  licenseType: 'standard' | 'commercial' | 'exclusive';
  buyerEmail: string;
  buyerName?: string;
  onPaymentSuccess: (purchaseId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  mediaAsset,
  packageData,
  licenseType,
  buyerEmail,
  buyerName,
  onPaymentSuccess,
  onPaymentError,
}: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'crypto' | null>(null);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate price based on license type
  const calculatePrice = () => {
    if (packageData) {
      return packageData.package_price;
    }

    if (mediaAsset) {
      switch (licenseType) {
        case 'standard':
          return mediaAsset.individual_price;
        case 'commercial':
          return mediaAsset.individual_price * 1.75; // +75% for commercial
        case 'exclusive':
          return mediaAsset.exclusive_price || mediaAsset.individual_price * 2.5; // +150% for exclusive
        default:
          return mediaAsset.individual_price;
      }
    }

    return 0;
  };

  const price = calculatePrice();
  const description = packageData 
    ? `${packageData.title} (Package)` 
    : `${mediaAsset?.title} (${licenseType} license)`;

  const handleStripePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Create purchase record
      const purchaseData = {
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        media_asset_id: mediaAsset?.id,
        package_id: packageData?.id,
        license_type: licenseType,
        price_paid: price,
        payment_method: 'stripe' as const,
        payment_status: 'pending' as const,
        max_downloads: licenseType === 'exclusive' ? 999 : 10,
      };

      const { data: purchase, error: purchaseError } = await PurchaseService.createPurchase(purchaseData);
      
      if (purchaseError || !purchase) {
        throw new Error(purchaseError?.message || 'Failed to create purchase');
      }

      // Redirect to Stripe Checkout
      // In production, you'd create a Stripe checkout session here
      // For now, we'll simulate successful payment
      setTimeout(() => {
        onPaymentSuccess(purchase.id);
      }, 2000);

    } catch (error) {
      console.error('Stripe payment failed:', error);
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCryptoPaymentStart = () => {
    setShowCryptoModal(true);
  };

  const handleCryptoPaymentSuccess = async (chargeId: string) => {
    try {
      // Create purchase record
      const purchaseData = {
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        media_asset_id: mediaAsset?.id,
        package_id: packageData?.id,
        license_type: licenseType,
        price_paid: price,
        payment_method: 'crypto' as const,
        payment_status: 'pending' as const,
        crypto_charge_id: chargeId,
        max_downloads: licenseType === 'exclusive' ? 999 : 10,
      };

      const { data: purchase, error: purchaseError } = await PurchaseService.createPurchase(purchaseData);
      
      if (purchaseError || !purchase) {
        throw new Error(purchaseError?.message || 'Failed to create purchase');
      }

      setShowCryptoModal(false);
      onPaymentSuccess(purchase.id);
    } catch (error) {
      console.error('Failed to process crypto payment:', error);
      onPaymentError(error instanceof Error ? error.message : 'Payment processing failed');
    }
  };

  const handleCryptoPaymentError = (error: string) => {
    setShowCryptoModal(false);
    onPaymentError(error);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-container payment-modal">
          <div className="modal-header">
            <h2>Choose Payment Method</h2>
            <button onClick={onClose} className="close-button">×</button>
          </div>

          <div className="modal-content">
            <div className="payment-summary">
              <h3>Purchase Summary</h3>
              <div className="summary-details">
                <div className="summary-row">
                  <span>Item:</span>
                  <span>{description}</span>
                </div>
                <div className="summary-row">
                  <span>License Type:</span>
                  <span className="license-badge">{licenseType}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span className="price">${price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              
              <div className="payment-options">
                <button
                  className={`payment-option ${selectedPaymentMethod === 'stripe' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentMethod('stripe')}
                >
                  <div className="payment-icon">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <div className="payment-details">
                    <h4>Credit Card</h4>
                    <p>Pay with Visa, Mastercard, or American Express</p>
                    <span className="payment-badge">Stripe</span>
                  </div>
                  <div className="payment-arrow">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </button>

                <button
                  className={`payment-option ${selectedPaymentMethod === 'crypto' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentMethod('crypto')}
                >
                  <div className="payment-icon">
                    <i className="fab fa-bitcoin"></i>
                  </div>
                  <div className="payment-details">
                    <h4>Cryptocurrency</h4>
                    <p>Pay with Bitcoin, Ethereum, or other crypto</p>
                    <span className="payment-badge">Coinbase</span>
                  </div>
                  <div className="payment-arrow">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </button>
              </div>
            </div>

            <div className="payment-actions">
              {selectedPaymentMethod === 'stripe' && (
                <button
                  onClick={handleStripePayment}
                  disabled={isProcessing}
                  className="pay-button stripe-button"
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card"></i>
                      Pay ${price.toFixed(2)} with Card
                    </>
                  )}
                </button>
              )}

              {selectedPaymentMethod === 'crypto' && (
                <button
                  onClick={handleCryptoPaymentStart}
                  className="pay-button crypto-button"
                >
                  <i className="fab fa-bitcoin"></i>
                  Pay ${price.toFixed(2)} with Crypto
                </button>
              )}

              {!selectedPaymentMethod && (
                <p className="select-payment-hint">
                  Please select a payment method to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCryptoModal && (
        <CryptoPaymentModal
          isOpen={showCryptoModal}
          onClose={() => setShowCryptoModal(false)}
          paymentData={{
            amount: price,
            description,
            buyerEmail,
            mediaAssetId: mediaAsset?.id,
            packageId: packageData?.id,
            licenseType,
          }}
          onPaymentSuccess={handleCryptoPaymentSuccess}
          onPaymentError={handleCryptoPaymentError}
        />
      )}
    </>
  );
}