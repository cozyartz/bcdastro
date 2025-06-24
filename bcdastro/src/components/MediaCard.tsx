import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { createCharge } from '../lib/coinbase';
import { Checkout, CheckoutButton } from '@coinbase/onchainkit/checkout';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface MediaCardProps {
  id: string;
  title: string;
  previewUrl: string;
  type: 'image' | 'video';
  acceptsStripe: boolean;
  acceptsCrypto: boolean;
  purchased: boolean;
  env?: any;
}

export default function MediaCard({
  id,
  title,
  previewUrl,
  type,
  acceptsStripe,
  acceptsCrypto,
  purchased,
  env,
}: MediaCardProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '50px' });

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`/api/price/${id}`);
      const data = await res.json();
      if (data.price !== undefined) setPrice(data.price / 100);
      else setError('Invalid price data');
    } catch (err) {
      setError('Failed to load price');
    }
  }, [id]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const handleCharge = async (): Promise<string> => {
    if (!price || !env) throw new Error('Missing price or environment');
    setLoading(true);
    try {
      const chargeId = await createCharge(id, price, 'user123', env);
      return chargeId;
    } catch (err) {
      setError('Charge creation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const mediaContent = type === 'video' ? (
    <iframe
      src={`https://iframe.videodelivery.net/${previewUrl}`}
      allow="autoplay; encrypted-media"
      allowFullScreen
      className="w-full h-56 object-cover bg-gray-800 rounded-t-lg"
      title={title}
    />
  ) : (
    <motion.img
      src={previewUrl}
      alt={title}
      loading="lazy"
      className="w-full h-56 object-cover bg-gray-800 rounded-t-lg filter brightness-90 hover:brightness-100 transition-all duration-300"
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    />
  );

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.3 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } },
    disabled: { opacity: 0.6, cursor: 'not-allowed' },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 hover-glow card-hover relative"
      whileHover={{ boxShadow: '0 0 20px rgba(125, 211, 252, 0.6)' }}
    >
      {mediaContent}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-white line-clamp-1 flex items-center">
          {type === 'video' ? <i className="fas fa-video mr-2"></i> : <i className="fas fa-image mr-2"></i>} {title}
        </h3>
        {error ? (
          <p className="text-sm text-red-400 flex items-center">
            <i className="fas fa-exclamation-triangle mr-1"></i> {error}
          </p>
        ) : price === null ? (
          <Skeleton height={20} width={80} className="bg-gray-800" />
        ) : (
          <p className="text-sm text-gray-300 flex items-center">
            <i className="fas fa-dollar-sign mr-1"></i> ${price.toFixed(2)}
          </p>
        )}

        {!purchased && (acceptsCrypto || acceptsStripe) && (
          <div className="flex gap-3 flex-wrap">
            {acceptsCrypto && (
              <Checkout chargeHandler={handleCharge}>
                <CheckoutButton
                  disabled={loading || !price}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl btn-primary transition-all duration-300 flex items-center"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner animate-spin mr-1"></i> Processing...
                    </>
                  ) : (
                    <>
                      <i className="fab fa-bitcoin mr-1"></i> Pay with Coinbase
                    </>
                  )}
                </CheckoutButton>
              </Checkout>
            )}
            {acceptsStripe && (
              <motion.button
                whileHover="hover"
                whileTap="tap"
                variants={buttonVariants}
                onClick={handleCharge}
                disabled={loading || !price}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl btn-primary transition-all duration-300 flex items-center"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-1"></i> Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-credit-card mr-1"></i> Pay with Card
                  </>
                )}
              </motion.button>
            )}
          </div>
        )}

        {purchased && (
          <motion.a
            href={`/api/download/${id}`}
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            className="flex justify-center bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl transition-all duration-300"
          >
            <i className="fas fa-download mr-1"></i> Download
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}