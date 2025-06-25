import React, { useState } from 'react';
import { AuthService } from '../lib/supabase';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const { error } = await AuthService.signUp(email, password, fullName);
        if (error) throw error;
        alert('Check your email for the confirmation link!');
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