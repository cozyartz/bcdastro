import React, { useState, useEffect } from 'react';
import { AuthService } from '../lib/supabase';

interface Web3AuthProps {
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Web3Auth({ onSuccess, onError, className = '' }: Web3AuthProps) {
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState<string>('');

  useEffect(() => {
    // Detect wallet type
    if (typeof window !== 'undefined') {
      if (window.ethereum?.isMetaMask) {
        setWalletType('MetaMask');
      } else if (window.ethereum) {
        setWalletType('Web3 Wallet');
      }
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      onError('No Web3 wallet detected. Please install MetaMask or another Web3 wallet.');
      return;
    }

    setConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0];
      
      // Create a message for the user to sign
      const message = `Sign this message to authenticate with BCDAstro.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      // Authenticate with our backend
      const { data, error } = await AuthService.signInWithWallet(walletAddress, signature, message);
      
      if (error) {
        throw new Error(error.message);
      }

      onSuccess(data);

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      onError(error.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const connectCoinbaseWallet = async () => {
    try {
      // Check if Coinbase Wallet is available
      if (window.ethereum?.isCoinbaseWallet) {
        await connectWallet();
      } else {
        // Redirect to Coinbase Wallet
        window.open('https://www.coinbase.com/wallet', '_blank');
        onError('Please install Coinbase Wallet and try again.');
      }
    } catch (error: any) {
      onError(error.message || 'Failed to connect Coinbase Wallet');
    }
  };

  const connectWalletConnect = async () => {
    // For now, we'll use the generic wallet connection
    // In production, you'd integrate with WalletConnect library
    onError('WalletConnect integration coming soon. Please use MetaMask for now.');
  };

  if (!window.ethereum) {
    return (
      <div className={`web3-auth-container ${className}`}>
        <div className="no-wallet-detected">
          <i className="fas fa-wallet text-3xl text-gray-400 mb-4"></i>
          <h3>No Web3 Wallet Detected</h3>
          <p className="text-gray-600 mb-4">
            To use Web3 authentication, please install a Web3 wallet like MetaMask.
          </p>
          <div className="wallet-download-links">
            <a 
              href="https://metamask.io/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="professional-button"
            >
              <i className="fab fa-firefox-browser"></i>
              Install MetaMask
            </a>
            <a 
              href="https://www.coinbase.com/wallet" 
              target="_blank" 
              rel="noopener noreferrer"
              className="professional-button secondary"
            >
              <i className="fas fa-coins"></i>
              Get Coinbase Wallet
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`web3-auth-container ${className}`}>
      <div className="wallet-options">
        <h4>Connect with Web3 Wallet</h4>
        <p className="text-sm text-gray-600 mb-4">
          Connect your wallet to sign in. Crypto payments get 10% commission vs 15% for card payments.
        </p>
        
        <div className="wallet-buttons">
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="wallet-button metamask"
          >
            <div className="wallet-icon">
              <i className="fab fa-firefox-browser"></i>
            </div>
            <div className="wallet-info">
              <h5>{walletType || 'MetaMask'}</h5>
              <p>Connect using {walletType || 'MetaMask'}</p>
            </div>
            {connecting && <i className="fas fa-spinner fa-spin"></i>}
          </button>

          <button
            onClick={connectCoinbaseWallet}
            disabled={connecting}
            className="wallet-button coinbase"
          >
            <div className="wallet-icon">
              <i className="fas fa-coins"></i>
            </div>
            <div className="wallet-info">
              <h5>Coinbase Wallet</h5>
              <p>Connect using Coinbase Wallet</p>
            </div>
          </button>

          <button
            onClick={connectWalletConnect}
            disabled={connecting}
            className="wallet-button walletconnect"
          >
            <div className="wallet-icon">
              <i className="fas fa-link"></i>
            </div>
            <div className="wallet-info">
              <h5>WalletConnect</h5>
              <p>Scan with mobile wallet</p>
            </div>
          </button>
        </div>

        <div className="wallet-benefits">
          <div className="benefit-item">
            <i className="fas fa-percentage"></i>
            <span>Lower fees with crypto payments</span>
          </div>
          <div className="benefit-item">
            <i className="fas fa-shield-alt"></i>
            <span>Secure wallet authentication</span>
          </div>
          <div className="benefit-item">
            <i className="fas fa-coins"></i>
            <span>Direct crypto transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}