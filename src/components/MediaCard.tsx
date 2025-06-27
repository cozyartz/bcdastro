import React, { useState } from 'react';
import VideoModal from './VideoModal';
import PaymentModal from './PaymentModal';
import type { CloudflareMedia } from '../lib/cloudflare-media-service';

interface MediaCardProps {
  media: CloudflareMedia;
  isPurchased?: boolean;
  userEmail?: string;
}

export default function MediaCard({ media, isPurchased = false, userEmail }: MediaCardProps) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const formatFileSize = (sizeStr: string) => {
    return sizeStr;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handlePreview = () => {
    if (media.type === 'video') {
      setShowVideoModal(true);
    } else {
      // For images, could show a lightbox or larger preview
      console.log('Preview image:', media.title);
    }
  };

  const handlePurchase = () => {
    if (media.type === 'video') {
      setShowVideoModal(true);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (purchaseId: string) => {
    setShowPaymentModal(false);
    console.log('Purchase successful:', purchaseId);
    // In a real app, you'd update the UI to reflect the purchase
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    // Show error message to user
  };

  return (
    <>
      <div className="media-card glass">
        <div className="media-preview">
          <img 
            src={media.thumbnailUrl} 
            alt={media.title}
            className="media-thumbnail"
            loading="lazy"
            onError={(e) => {
              // Fallback for missing thumbnails
              e.currentTarget.src = '/placeholder-thumbnail.jpg';
            }}
          />
          <div className="media-overlay">
            {media.type === 'video' ? (
              <i className="fas fa-play-circle media-icon"></i>
            ) : (
              <i className="fas fa-image media-icon"></i>
            )}
          </div>
          <div className="media-type-badge">
            <i className={media.type === 'video' ? 'fas fa-video' : 'fas fa-camera'}></i>
            {media.type === 'video' ? 'Video' : 'Photo'}
          </div>
          {isPurchased && (
            <div className="purchased-badge">
              <i className="fas fa-check-circle"></i>
              Owned
            </div>
          )}
        </div>
        
        <div className="media-content">
          <div className="media-header">
            <h3 className="media-title">{media.title}</h3>
            <span className="media-category">{media.category}</span>
          </div>
          
          <p className="media-description">{media.description}</p>
          
          <div className="media-specs">
            <div className="spec-item">
              <i className="fas fa-expand-arrows-alt"></i>
              <span>{media.resolution}</span>
            </div>
            {media.duration && (
              <div className="spec-item">
                <i className="fas fa-clock"></i>
                <span>{media.duration}</span>
              </div>
            )}
            {media.fileSize && (
              <div className="spec-item">
                <i className="fas fa-hdd"></i>
                <span>{media.fileSize}</span>
              </div>
            )}
          </div>
          
          <div className="media-tags">
            {media.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">#{tag}</span>
            ))}
          </div>
          
          <div className="media-footer">
            <div className="media-price">
              {!isPurchased && (
                <>
                  <span className="price-label">Starting at</span>
                  <span className="price-amount">{formatPrice(media.price)}</span>
                </>
              )}
              {isPurchased && (
                <span className="owned-label">
                  <i className="fas fa-check-circle"></i>
                  Purchased
                </span>
              )}
            </div>
            <div className="media-actions">
              <button 
                className="action-btn preview-btn" 
                onClick={handlePreview}
              >
                <i className="fas fa-eye"></i>
                {media.type === 'video' ? 'Watch' : 'Preview'}
              </button>
              {!isPurchased && (
                <button 
                  className="action-btn purchase-btn" 
                  onClick={handlePurchase}
                >
                  <i className="fas fa-shopping-cart"></i>
                  Purchase
                </button>
              )}
              {isPurchased && (
                <button className="action-btn download-btn">
                  <i className="fas fa-download"></i>
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal for video previews and purchases */}
      {showVideoModal && media.type === 'video' && (
        <VideoModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          video={{
            id: media.id,
            title: media.title,
            description: media.description,
            url: media.streamUrl || media.url, // Use HLS URL for video playback
            thumbnailUrl: media.thumbnailUrl,
            duration: media.duration,
            resolution: media.resolution,
            individual_price: media.price,
            category: media.category,
            tags: media.tags,
            type: 'video',
          }}
          isPurchased={isPurchased}
          userEmail={userEmail}
        />
      )}

      {/* Payment Modal for direct image purchases */}
      {showPaymentModal && media.type === 'image' && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          mediaAsset={{
            id: media.id,
            title: media.title,
            individual_price: media.price,
          }}
          licenseType="standard"
          buyerEmail={userEmail || ''}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </>
  );
}