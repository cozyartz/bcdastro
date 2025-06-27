import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import PaymentModal from './PaymentModal';
import { AuthService } from '../lib/supabase';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnailUrl?: string;
    duration?: string;
    resolution?: string;
    individual_price: number;
    package_price?: number;
    exclusive_price?: number;
    category: string;
    tags?: string[];
    type: 'video' | 'image';
  };
  isPurchased?: boolean;
  userEmail?: string;
}

export default function VideoModal({
  isOpen,
  onClose,
  video,
  isPurchased = false,
  userEmail,
}: VideoModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<'standard' | 'commercial' | 'exclusive'>('standard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await AuthService.getCurrentUser();
      setIsAuthenticated(!!user);
      setCurrentUser(user);
    };
    
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const handlePurchase = (licenseType: 'standard' | 'commercial' | 'exclusive') => {
    setSelectedLicense(licenseType);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (purchaseId: string) => {
    setShowPaymentModal(false);
    // Refresh the modal to show purchased content
    // In a real app, you'd update the parent component state
    console.log('Purchase successful:', purchaseId);
    onClose();
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    // Show error message to user
  };

  const calculatePrice = (licenseType: 'standard' | 'commercial' | 'exclusive') => {
    switch (licenseType) {
      case 'standard':
        return video.individual_price;
      case 'commercial':
        return video.individual_price * 1.75; // +75%
      case 'exclusive':
        return video.exclusive_price || video.individual_price * 2.5; // +150%
      default:
        return video.individual_price;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="video-modal-overlay" onClick={onClose}>
        <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="video-modal-header">
            <div className="video-modal-title">
              <h2>{video.title}</h2>
              <div className="video-badges">
                <span className="video-type-badge">
                  <i className="fas fa-video"></i>
                  Video
                </span>
                <span className="video-category-badge">{video.category}</span>
                {video.resolution && (
                  <span className="video-quality-badge">{video.resolution}</span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="close-button">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="video-modal-content">
            <div className="video-section">
              <VideoPlayer
                src={video.url}
                poster={video.thumbnailUrl}
                title={video.title}
                controls={true}
                className="modal-video-player"
                isPreview={!isPurchased}
                previewDuration={30}
                onPlay={() => console.log('Video started playing')}
                onEnded={() => console.log('Video ended')}
              />
              
              {!isPurchased && (
                <div className="preview-notice">
                  <div className="preview-notice-content">
                    <i className="fas fa-info-circle"></i>
                    <span>This is a 30-second preview. Purchase to view the full video.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="video-details">
              <div className="video-info">
                <h3>Video Details</h3>
                <p className="video-description">{video.description}</p>
                
                <div className="video-specs">
                  {video.duration && (
                    <div className="spec-item">
                      <i className="fas fa-clock"></i>
                      <span>Duration: {video.duration}</span>
                    </div>
                  )}
                  {video.resolution && (
                    <div className="spec-item">
                      <i className="fas fa-expand-arrows-alt"></i>
                      <span>Resolution: {video.resolution}</span>
                    </div>
                  )}
                  <div className="spec-item">
                    <i className="fas fa-tag"></i>
                    <span>Category: {video.category}</span>
                  </div>
                </div>

                {video.tags && video.tags.length > 0 && (
                  <div className="video-tags">
                    <h4>Tags</h4>
                    <div className="tags-list">
                      {video.tags.map((tag, index) => (
                        <span key={index} className="tag">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!isPurchased && (
                <div className="licensing-section">
                  <h3>Choose Your License</h3>
                  <div className="license-options">
                    <div 
                      className={`license-option ${selectedLicense === 'standard' ? 'selected' : ''}`}
                      onClick={() => setSelectedLicense('standard')}
                    >
                      <div className="license-header">
                        <i className="fas fa-user"></i>
                        <div>
                          <h4>Standard License</h4>
                          <p>Personal and educational use</p>
                        </div>
                        <div className="license-price">
                          {formatPrice(calculatePrice('standard'))}
                        </div>
                      </div>
                      <ul className="license-features">
                        <li><i className="fas fa-check"></i> Personal projects</li>
                        <li><i className="fas fa-check"></i> Social media</li>
                        <li><i className="fas fa-check"></i> Educational use</li>
                      </ul>
                    </div>

                    <div 
                      className={`license-option ${selectedLicense === 'commercial' ? 'selected' : ''}`}
                      onClick={() => setSelectedLicense('commercial')}
                    >
                      <div className="license-header">
                        <i className="fas fa-briefcase"></i>
                        <div>
                          <h4>Commercial License</h4>
                          <p>Business and marketing use</p>
                        </div>
                        <div className="license-price">
                          {formatPrice(calculatePrice('commercial'))}
                        </div>
                      </div>
                      <ul className="license-features">
                        <li><i className="fas fa-check"></i> Commercial projects</li>
                        <li><i className="fas fa-check"></i> Marketing materials</li>
                        <li><i className="fas fa-check"></i> Website usage</li>
                        <li><i className="fas fa-check"></i> Print media</li>
                      </ul>
                    </div>

                    <div 
                      className={`license-option ${selectedLicense === 'exclusive' ? 'selected' : ''}`}
                      onClick={() => setSelectedLicense('exclusive')}
                    >
                      <div className="license-header">
                        <i className="fas fa-crown"></i>
                        <div>
                          <h4>Exclusive License</h4>
                          <p>Full rights and exclusivity</p>
                        </div>
                        <div className="license-price">
                          {formatPrice(calculatePrice('exclusive'))}
                        </div>
                      </div>
                      <ul className="license-features">
                        <li><i className="fas fa-check"></i> Exclusive rights</li>
                        <li><i className="fas fa-check"></i> Unlimited usage</li>
                        <li><i className="fas fa-check"></i> Resale permitted</li>
                        <li><i className="fas fa-check"></i> Custom modifications</li>
                      </ul>
                    </div>
                  </div>

                  <div className="purchase-actions">
                    <button 
                      onClick={() => handlePurchase(selectedLicense)}
                      className="purchase-button"
                      disabled={!isAuthenticated}
                    >
                      <i className="fas fa-shopping-cart"></i>
                      Purchase {selectedLicense} License - {formatPrice(calculatePrice(selectedLicense))}
                    </button>
                    
                    {!isAuthenticated && (
                      <p className="auth-notice">
                        <i className="fas fa-info-circle"></i>
                        Please sign in to purchase this video
                      </p>
                    )}
                  </div>
                </div>
              )}

              {isPurchased && (
                <div className="purchased-section">
                  <div className="purchased-notice">
                    <i className="fas fa-check-circle"></i>
                    <span>You own this video</span>
                  </div>
                  <div className="download-actions">
                    <button className="download-button">
                      <i className="fas fa-download"></i>
                      Download Video
                    </button>
                    <button className="share-button">
                      <i className="fas fa-share"></i>
                      Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          mediaAsset={{
            id: video.id,
            title: video.title,
            individual_price: video.individual_price,
            package_price: video.package_price,
            exclusive_price: video.exclusive_price,
          }}
          licenseType={selectedLicense}
          buyerEmail={currentUser?.email || userEmail || ''}
          buyerName={currentUser?.full_name}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </>
  );
}