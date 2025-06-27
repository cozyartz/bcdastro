import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';
import { getSession } from '../../lib/auth';

interface ChargeStatsProps {
  userId: string;
}

interface Stats {
  count: number;
  total: number;
}

export default function ChargeStats({ userId }: ChargeStatsProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [stats, setStats] = useState<Stats>({ count: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession(new Request('http://localhost'), { env: { D1: Astro.locals.DB } } as any);
      if (!session || session.userId !== userId) {
        setError('Unauthorized or invalid user');
        return;
      }

      const result = await Astro.locals.DB.prepare(`
        SELECT COUNT(*) as count, SUM(price_paid) as total FROM purchases WHERE user_id = ?
      `).bind(userId).first();
      setStats({ count: result.count || 0, total: result.total / 100 || 0 });
      setError(null);
    } catch (err) {
      setError('Failed to fetch stats');
      console.error('Stats fetch error:', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = new Chart(chartRef.current, {
        type: 'bar',
        data: {
          labels: ['Total Charges', 'Total Spent (USD)'],
          datasets: [{
            label: 'Your Stats',
            data: [stats.count, stats.total],
            backgroundColor: ['#7dd3fc', '#a78bfa'],
            borderWidth: 1,
            borderRadius: 5,
            borderColor: '#d1d5db',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, title: { display: true, text: 'Value', color: '#d1d5db' } } },
          plugins: {
            legend: { position: 'top', labels: { color: '#d1d5db', font: { size: 14 } } },
            tooltip: { backgroundColor: '#1a1a2e', titleColor: '#fff', bodyColor: '#fff' },
          },
        },
      });
    }
    return () => chartInstance.current?.destroy();
  }, [stats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 rounded-lg p-6 shadow-lg card-hover hover-glow"
    >
      <h2 className="text-2xl font-bold mb-4 text-center text-white flex items-center justify-center">
        <i className="fas fa-chart-bar mr-2 text-cyan-400"></i> Charge Stats
      </h2>
      {error ? (
        <p className="text-red-400 text-center flex items-center justify-center">
          <i className="fas fa-exclamation-triangle mr-1"></i> {error}
        </p>
      ) : loading ? (
        <div className="text-center flex items-center justify-center">
          <i className="fas fa-spinner animate-spin text-cyan-400 mr-2"></i> Loading...
        </div>
      ) : (
        <div className="h-64">
          <canvas ref={chartRef} />
        </div>
      )}
    </motion.div>
  );
}