import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createCharge } from '../lib/coinbase';
import { Checkout, CheckoutButton } from '@coinbase/onchainkit/checkout';

interface MediaCardProps {
  id: string;
  title: string;
  previewUrl: string;
  acceptsStripe: boolean;
  acceptsCrypto: boolean;
}

export default function MediaCard({
  id,
  title,
  previewUrl,
  acceptsStripe,
  acceptsCrypto
}: MediaCardProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/price/${id}`)
      .then(res => res.json())
      .then(data => setPrice(data.price / 100))
      .catch(() => setError('Failed to load price'));
  }, [id]);

  const handleCharge = async () => {
    if (!price) return;
    setLoading(true);
    try {
      // Get user session/token (you may need to implement proper auth context)
      const token = localStorage.getItem('authToken'); // Adjust based on your auth implementation
      
      const response = await fetch('/api/createCharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          local_price: { amount: price.toString(), currency: 'USDC' },
          metadata: { mediaId: id, userId: 'user123' }, // Replace with actual user ID from auth context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create charge');
      }

      const data = await response.json();
      window.location.href = `/media/${id}?charge=${data.id}`;
    } catch (error) {
      console.error('Charge creation error:', error);
      setError('Charge creation failed');
    }
    setLoading(false);
  };

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <motion.div className="bg-gray-800 p-4 rounded-lg shadow-md" whileHover={{ scale: 1.05 }}>
      <img src={previewUrl} alt={title} className="w-full h-48 object-cover rounded" />
      <h3 className="text-lg text-white mt-2">{title}</h3>
      <p className="text-gray-400">{price ? `$${price}` : 'Loading...'}</p>
      <div className="mt-2 flex gap-2">
        {acceptsCrypto && (
          <Checkout chargeHandler={handleCharge}>
            <CheckoutButton
              disabled={loading || !price}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Processing...' : 'Pay with Coinbase'}
            </CheckoutButton>
          </Checkout>
        )}
        {acceptsStripe && (
          <button
            onClick={() => {}}
            disabled={loading || !price}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {loading ? 'Processing...' : 'Pay with Card'}
          </button>
        )}
      </div>
    </motion.div>
  );
}