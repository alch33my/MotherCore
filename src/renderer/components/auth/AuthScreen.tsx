import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';
import MatrixRain from '../effects/matrix-rain';

interface AuthScreenProps {
  onAuthenticated: (password: string) => void;
  isSignUp?: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, isSignUp = false }) => {
  const [isNewUser, setIsNewUser] = useState(isSignUp);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    setIsLoading(true);

    if (isNewUser && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Use setTimeout to prevent UI freezing during authentication
      setTimeout(() => {
        onAuthenticated(password);
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError('Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Matrix Rain Background */}
      <div className="matrix-background">
        <MatrixRain />
      </div>

      {/* Auth Container */}
      <div className="auth-container">
        <div className="auth-panel">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="logo-symbol">⚡</div>
              <h1 className="logo-title">MOTHERCORE</h1>
            </div>
            <p className="auth-subtitle">
              Your Personal Knowledge Repository
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-section">
              <h2 className="form-title">
                {isNewUser ? 'Create Your Vault' : 'Access Your Vault'}
              </h2>
              <p className="form-description">
                {isNewUser 
                  ? 'Set a master password to secure your knowledge'
                  : 'Enter your master password to continue'
                }
              </p>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="input-container">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Master password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up) */}
            {isNewUser && (
              <div className="input-group">
                <div className="input-container">
                  <Shield className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password}
              className="auth-submit"
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                isNewUser ? 'Create Vault' : 'Access Vault'
              )}
            </button>

            {/* Toggle Mode */}
            <div className="auth-toggle">
              {isNewUser ? (
                <p>
                  Already have a vault?{' '}
                  <button
                    type="button"
                    onClick={() => setIsNewUser(false)}
                    className="toggle-link"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  First time here?{' '}
                  <button
                    type="button"
                    onClick={() => setIsNewUser(true)}
                    className="toggle-link"
                  >
                    Create Vault
                  </button>
                </p>
              )}
            </div>
          </form>

          {/* Security Notice */}
          <div className="security-notice">
            <Shield className="w-4 h-4" />
            <span>Your data is encrypted and stored locally</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen; 