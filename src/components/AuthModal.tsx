import React, { useState } from 'react';
import { AuthService, PilotCertService } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [pilotCertNumber, setPilotCertNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setLoading(true);
    setError('');

    try {
      const { error } = provider === 'github' 
        ? await AuthService.signInWithGitHub()
        : await AuthService.signInWithGoogle();
      
      if (error) throw error;
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // Validate pilot certificate first
        if (pilotCertNumber) {
          const { data: validation, error: validationError } = await PilotCertService.validateCertificate(pilotCertNumber, email);
          
          if (validationError) {
            throw new Error(`Certificate validation failed: ${validationError.message}`);
          }
          
          if (!validation?.validation?.isValid) {
            throw new Error(`Invalid pilot certificate number. Please check your FAA Part 107 certificate number.`);
          }
          
          if (validation.validation.confidence < 0.5) {
            const proceed = confirm(`Certificate validation returned low confidence (${Math.round(validation.validation.confidence * 100)}%). Do you want to proceed anyway?`);
            if (!proceed) {
              return;
            }
          }
        }
        
        const { error } = await AuthService.signUp(email, password, fullName, pilotCertNumber);
        if (error) throw error;
        
        setError('');
        alert('Account created successfully! Please check your email for a verification link to complete your registration.');
      } else {
        const { error } = await AuthService.signIn(email, password);
        if (error) throw error;
        window.location.reload();
      }
      onClose();
      
      // Dispatch custom event to update navigation
      window.dispatchEvent(new CustomEvent('authStateChanged'));
      
      // Dispatch custom event to update navigation
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="oauth-buttons">
          <button
            type="button"
            className="oauth-btn github-btn"
            onClick={() => handleOAuthSignIn('github')}
            disabled={loading}
          >
            <i className="fab fa-github"></i>
            Continue with GitHub
          </button>
          <button
            type="button"
            className="oauth-btn google-btn"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loading}
          >
            <i className="fab fa-google"></i>
            Continue with Google
          </button>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="fullName">
                <i className="fas fa-user"></i> Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="pilotCertNumber">
                <i className="fas fa-id-card"></i> Part 107 Pilot Certificate Number
              </label>
              <input
                type="text"
                id="pilotCertNumber"
                value={pilotCertNumber}
                onChange={(e) => setPilotCertNumber(e.target.value)}
                required
                placeholder="Your FAA Part 107 certificate number"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Your password"
              minLength={6}
            />
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <button type="submit" className="professional-button" disabled={loading}>
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className={mode === 'signin' ? 'fas fa-sign-in-alt' : 'fas fa-user-plus'}></i>
            )}
            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => onModeChange('signup')} className="link-btn">
                Sign up here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => onModeChange('signin')} className="link-btn">
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}