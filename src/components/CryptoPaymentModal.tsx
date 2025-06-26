import React, { useState, useEffect } from 'react';
import { coinbaseService, type CryptoPaymentRequest, type CryptoPaymentResponse } from '../lib/coinbase';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    amount: number;
    description: string;
    buyerEmail: string;
    mediaAssetId?: string;
    packageId?: string;
    licenseType: 'standard' | 'commercial' | 'exclusive';
  };
  onPaymentSuccess: (chargeId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function CryptoPaymentModal({
  isOpen,
  onClose,
  paymentData,
  onPaymentSuccess,
  onPaymentError,
}: CryptoPaymentModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState('ETH');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [paymentResponse, setPaymentResponse] = useState<CryptoPaymentResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'select' | 'processing' | 'waiting' | 'success' | 'error'>('select');
  const [countdown, setCountdown] = useState(0);

  const supportedCurrencies = coinbaseService.getSupportedCurrencies();

  useEffect(() => {
    if (selectedCurrency && paymentData.amount) {
      updateCryptoAmount();
    }
  }, [selectedCurrency, paymentData.amount]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setPaymentStatus('error');
            onPaymentError('Payment expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown, onPaymentError]);

  const updateCryptoAmount = async () => {
    try {
      const conversion = await coinbaseService.convertUSDToCrypto(paymentData.amount, selectedCurrency);
      setCryptoAmount(conversion.amount);
    } catch (error) {
      console.error('Failed to convert currency:', error);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const request: CryptoPaymentRequest = {
        amount: paymentData.amount,
        currency: 'USD',
        description: paymentData.description,
        buyerEmail: paymentData.buyerEmail,
        mediaAssetId: paymentData.mediaAssetId,
        packageId: paymentData.packageId,
        licenseType: paymentData.licenseType,
        metadata: {
          selectedCurrency,
          cryptoAmount,
        },
      };

      const response = await coinbaseService.createCryptoPayment(request);
      setPaymentResponse(response);
      setPaymentStatus('waiting');

      // Set countdown timer (15 minutes)
      const expiryTime = new Date(response.expiryTime).getTime();
      const now = Date.now();
      setCountdown(Math.floor((expiryTime - now) / 1000));

      // Start polling for payment status
      pollPaymentStatus(response.chargeId);
    } catch (error) {
      console.error('Payment creation failed:', error);
      setPaymentStatus('error');
      onPaymentError('Failed to create payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pollPaymentStatus = async (chargeId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await coinbaseService.checkPaymentStatus(chargeId);
        
        if (status === 'confirmed') {
          clearInterval(pollInterval);
          setPaymentStatus('success');
          onPaymentSuccess(chargeId);
        } else if (status === 'failed' || status === 'expired') {
          clearInterval(pollInterval);
          setPaymentStatus('error');
          onPaymentError('Payment failed or expired');
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 20 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 20 * 60 * 1000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container crypto-payment-modal">
        <div className="modal-header">
          <h2>Pay with Cryptocurrency</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="modal-content">
          {paymentStatus === 'select' && (
            <div className="payment-selection">
              <div className="payment-summary">
                <h3>Payment Summary</h3>
                <div className="summary-row">
                  <span>Amount:</span>
                  <span>${paymentData.amount}</span>
                </div>
                <div className="summary-row">
                  <span>License:</span>
                  <span>{paymentData.licenseType}</span>
                </div>
              </div>

              <div className="currency-selection">
                <h3>Select Cryptocurrency</h3>
                <div className="currency-grid">
                  {supportedCurrencies.map((currency) => (
                    <button
                      key={currency.code}
                      className={`currency-button ${selectedCurrency === currency.code ? 'selected' : ''}`}
                      onClick={() => setSelectedCurrency(currency.code)}
                    >
                      <span className="currency-symbol">{currency.symbol}</span>
                      <span className="currency-name">{currency.name}</span>
                      <span className="currency-code">{currency.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {cryptoAmount && (
                <div className="crypto-amount">
                  <p>You will pay: <strong>{cryptoAmount} {selectedCurrency}</strong></p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isProcessing || !cryptoAmount}
                className="pay-button crypto-pay-button"
              >
                {isProcessing ? 'Creating Payment...' : `Pay ${cryptoAmount} ${selectedCurrency}`}
              </button>
            </div>
          )}

          {paymentStatus === 'processing' && (
            <div className="processing-state">
              <div className="spinner"></div>
              <p>Creating your payment...</p>
            </div>
          )}

          {paymentStatus === 'waiting' && paymentResponse && (
            <div className="payment-waiting">
              <div className="payment-info">
                <h3>Send Payment</h3>
                <div className="countdown">
                  <span>Time remaining: {formatTime(countdown)}</span>
                </div>
                
                <div className="payment-details">
                  <div className="detail-row">
                    <label>Send exactly:</label>
                    <div className="copyable-field">
                      <span>{paymentResponse.cryptoAmount} {paymentResponse.cryptoCurrency}</span>
                      <button onClick={() => copyToClipboard(paymentResponse.cryptoAmount)}>
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>

                  <div className="detail-row">
                    <label>To address:</label>
                    <div className="copyable-field">
                      <span className="address">{paymentResponse.walletAddress}</span>
                      <button onClick={() => copyToClipboard(paymentResponse.walletAddress)}>
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="qr-placeholder">
                  {/* QR code would go here in production */}
                  <div className="qr-code">
                    <i className="fas fa-qrcode"></i>
                    <p>QR Code</p>
                  </div>
                </div>

                <div className="payment-instructions">
                  <h4>Instructions:</h4>
                  <ol>
                    <li>Copy the exact amount and wallet address</li>
                    <li>Open your crypto wallet</li>
                    <li>Send the payment to the address above</li>
                    <li>Wait for confirmation (usually 1-3 minutes)</li>
                  </ol>
                </div>
              </div>

              <div className="status-indicator">
                <div className="status-dot pending"></div>
                <span>Waiting for payment...</span>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="payment-success">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Payment Confirmed!</h3>
              <p>Your crypto payment has been confirmed. You can now download your content.</p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="payment-error">
              <div className="error-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h3>Payment Failed</h3>
              <p>Your payment could not be processed. Please try again or contact support.</p>
              <button 
                onClick={() => setPaymentStatus('select')}
                className="retry-button"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}