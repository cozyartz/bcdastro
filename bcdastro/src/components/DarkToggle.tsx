import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function DarkToggle({ userId }: { userId: string }) {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && document.documentElement.classList.contains('dark'));
    }
    return true; // Default to dark on server-side
  });

  useEffect(() => {
    const applyTheme = async () => {
      const isDark = dark || (dark === null && document.documentElement.classList.contains('dark'));
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Update DB with preference
      await fetch('/api/update-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, theme: isDark ? 'dark' : 'light' }),
      }).catch(console.error);
    };
    applyTheme();
  }, [dark, userId]);

  return (
    <motion.button
      onClick={() => setDark(prev => !prev)}
      whileTap={{ rotate: 360, scale: 0.9 }}
      whileHover={{ scale: 1.1, backgroundColor: dark ? '#1a1a2e' : '#f5f5f5' }}
      title="Toggle Dark Mode"
      className="text-white ml-4 p-2 rounded-full border border-gray-700 hover:border-cyan-400 transition-colors bg-gray-800 hover:bg-opacity-80"
    >
      {dark ? '🌙' : '☀️'}
    </motion.button>
  );
}