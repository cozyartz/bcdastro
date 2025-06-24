import { motion, AnimatePresence } from 'framer-motion';
import { useCallback } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  icon?: string; // Optional FA icon class
  loading?: boolean; // Optional loading state
  onClick?: () => void;
}

export const Button = ({
  type = 'button',
  className = '',
  children,
  disabled = false,
  icon,
  loading = false,
  onClick,
  ...props
}: ButtonProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading || !onClick) return;
      onClick();
    },
    [disabled, loading, onClick]
  );

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
    disabled: { opacity: 0.6, cursor: 'not-allowed' },
  };

  return (
    <motion.button
      type={type}
      className={`bg-cyan-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 ${className}`}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? 'hover' : undefined}
      whileTap={!disabled && !loading ? 'tap' : undefined}
      variants={buttonVariants}
      initial={disabled || loading ? 'disabled' : 'rest'}
      animate={disabled || loading ? 'disabled' : 'rest'}
      onClick={handleClick}
      aria-label={loading ? 'Loading...' : typeof children === 'string' ? children : undefined}
      {...props}
    >
      <AnimatePresence>
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center"
          >
            <i className="fas fa-spinner animate-spin mr-2"></i> Loading...
          </motion.span>
        ) : (
          <motion.span
            key="content"
            className="flex items-center"
          >
            {icon && <i className={icon} className="mr-2" />}
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};