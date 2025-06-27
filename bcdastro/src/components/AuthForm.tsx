import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button'; // Assuming Button.tsx from prior refactor

interface AuthFormProps {
  onSuccess?: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = useCallback(() => {
    if (!email || !password) return 'Email and password are required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);
      setError(null);
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          if (onSuccess) onSuccess();
          else window.location.href = '/dashboard'; // Redirect to dashboard on success
        } else {
          const errorText = await res.text();
          setError(`Error: ${errorText || 'Authentication failed'}`);
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    },
    [isLogin, email, password, validateForm, onSuccess]
  );

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-gray-900 p-6 rounded-lg max-w-sm mx-auto shadow-lg card-hover"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      <h2 className="text-white text-xl mb-4 flex items-center">
        <i className={isLogin ? 'fas fa-sign-in-alt mr-2' : 'fas fa-user-plus mr-2'}></i>
        {isLogin ? 'Login' : 'Sign Up'}
      </h2>
      {error && (
        <p className="text-red-400 text-sm mb-4 flex items-center">
          <i className="fas fa-exclamation-circle mr-1"></i> {error}
        </p>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value.trim())}
        placeholder="Email"
        className="w-full p-3 mb-4 rounded bg-gray-800 text-white border border-gray-700 focus:border-cyan-500 focus:outline-none"
        required
        aria-label="Email address"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-3 mb-4 rounded bg-gray-800 text-white border border-gray-700 focus:border-cyan-500 focus:outline-none"
        required
        aria-label="Password"
      />
      <Button
        type="submit"
        className="w-full"
        loading={loading}
        icon={isLogin ? 'fas fa-sign-in-alt' : 'fas fa-user-plus'}
      >
        {isLogin ? 'Login' : 'Sign Up'}
      </Button>
      <motion.button
        type="button"
        onClick={toggleForm}
        className="text-blue-400 mt-4 text-sm hover:text-blue-300 transition-colors duration-300 flex items-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <i className="fas fa-exchange-alt mr-1"></i>
        {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
      </motion.button>
    </motion.form>
  );
}