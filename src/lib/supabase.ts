import React, { useState, useEffect } from 'react';
import { AuthService, MediaService, User, MediaAsset } from '../lib/supabase';
import AuthModal from './AuthModal';
import UploadModal from './UploadModal';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userMedia, setUserMedia] = useState<MediaAsset[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMedia: 0,
    totalRevenue: 0,
    totalDownloads: 0,
    pendingApproval: 0
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserMedia();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch the full user profile from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: currentUser.user_metadata?.avatar_url,
            created_at: currentUser.created_at || '',
            is_verified: currentUser.email_confirmed_at ? true : false,
            subscription_tier: 'free',
            is_admin: false
          });
        } else {
          setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at,
            is_verified: userData.is_verified,
            subscription_tier: userData.subscription_tier,
            is_admin: userData.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch the full user profile from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: currentUser.user_metadata?.avatar_url,
            created_at: currentUser.created_at || '',
            is_verified: currentUser.email_confirmed_at ? true : false,
            subscription_tier: 'free',
            is_admin: false
          });
        } else {
          setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at,
            is_verified: userData.is_verified,
            subscription_tier: userData.subscription_tier,
            is_admin: userData.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch the full user profile from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data
        setUser({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || '',
          avatar_url: currentUser.user_metadata?.avatar_url,
          created_at: currentUser.created_at || '',
          is_verified: currentUser.email_confirmed_at ? true : false,
          subscription_tier: 'free',
          is_admin: false
        });
        } else {
          setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at,
            is_verified: userData.is_verified,
            subscription_tier: userData.subscription_tier,
            is_admin: userData.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch the full user profile from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: currentUser.user_metadata?.avatar_url,
            created_at: currentUser.created_at || '',
            is_verified: currentUser.email_confirmed_at ? true : false,
            subscription_tier: 'free',
            is_admin: false
          });
        } else {
          setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at,
            is_verified: userData.is_verified,
            subscription_tier: userData.subscription_tier,
            is_admin: userData.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch the full user profile from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: currentUser.user_metadata?.avatar_url,
            created_at: currentUser.created_at || '',
            is_verified: currentUser.email_confirmed_at ? true : false,
            subscription_tier: 'free',
            is_admin: false
          });
        } else {
          setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at,
            is_verified: userData.is_verified,
            subscription_tier: userData.subscription_tier,
            is_admin: userData.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch the full user profile from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: currentUser.user_metadata?.avatar_url,
            created_at: currentUser.created_at || '',
            is_verified: currentUser.email_confirmed_at ? true : false,
            subscription_tier: 'free',
            is_admin: false
          });
        } else {
          setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at,
            is_verified: userData.is_verified,
            subscription_tier: userData.subscription_tier,
            is_admin: userData.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        // Fetch the full user profile from our database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          // Fallback to auth user data
          setUser({
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: currentUser.user_metadata?.avatar_url,
            created_at: currentUser.created_at || '',
            is_verified: currentUser.email_confirmed_at ? true : false,
            subscription_tier: 'free',
            is_admin: false
          });
        } else {
          setUser({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            created_at: userData.created_at,
            is_verified: userData.is_verified,
            subscription_tier: userData.subscription_tier,
            is_admin: userData.is_admin || false
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUser = async () => {
    try {
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserMedia = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await MediaService.getUserMedia(user.id);
      if (error) throw error;
      
      setUserMedia(data || []);
      
      // Calculate stats
      const totalMedia = data?.length || 0;
      const totalRevenue = data?.reduce((sum, item) => sum + item.revenue, 0) || 0;
      const totalDownloads = data?.reduce((sum, item) => sum + item.downloads, 0) || 0;
      const pendingApproval = data?.filter(item => item.status === 'pending').length || 0;
      
      setStats({
        totalMedia,
        totalRevenue,
        totalDownloads,
        pendingApproval
      });
    } catch (error) {
      console.error('Error loading user media:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      setUserMedia([]);
      setStats({ totalMedia: 0, totalRevenue: 0, totalDownloads: 0, pendingApproval: 0 });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-hero">
          <h1>Creator Dashboard</h1>
          <p>Upload and manage your aerial media content. Earn revenue from your professional drone photography and videography.</p>
          
          <div className="auth-benefits">
            <div className="benefit-item">
              <i className="fas fa-cloud-upload-alt"></i>
              <h3>Upload Your Media</h3>
              <p>Share your professional aerial content with potential buyers</p>
            </div>
            <div className="benefit-item">
              <i className="fas fa-dollar-sign"></i>
              <h3>Flexible Pricing</h3>
              <p>Set individual, package, and exclusive pricing for maximum revenue</p>
            </div>
            <div className="benefit-item">
              <i className="fas fa-chart-line"></i>
              <h3>Track Performance</h3>
              <p>Monitor downloads, revenue, and engagement with detailed analytics</p>
            </div>
          </div>
          
          <div className="auth-actions">
            <button 
              className="professional-button"
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
            >
              <i className="fas fa-user-plus"></i>
              Create Account
            </button>
            <button 
              className="professional-button secondary"
              onClick={() => {
                setAuthMode('signin');
                setShowAuthModal(true);
              }}
            >
              <i className="fas fa-sign-in-alt"></i>
              Sign In
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onModeChange={setAuthMode}
        />
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <div className="user-details">
            <h2>Welcome back, {user.full_name || user.email}</h2>
            <p className="user-email">{user.email}</p>
            <span className={`subscription-badge ${user.subscription_tier}`}>
              {user.subscription_tier.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="professional-button"
            onClick={() => setShowUploadModal(true)}
          >
            <i className="fas fa-plus"></i>
            Upload Media
          </button>
          <button 
            className="professional-button secondary"
            onClick={handleSignOut}
          >
            <i className="fas fa-sign-out-alt"></i>
            Sign Out
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-images"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalMedia}</h3>
            <p>Total Media</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-download"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalDownloads}</h3>
            <p>Total Downloads</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pendingApproval}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-header">
          <h2>Your Media Library</h2>
          <p>Manage your uploaded content and track performance</p>
        </div>

        {userMedia.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-cloud-upload-alt"></i>
            <h3>No media uploaded yet</h3>
            <p>Start by uploading your first aerial photo or video to begin earning revenue.</p>
            <button 
              className="professional-button"
              onClick={() => setShowUploadModal(true)}
            >
              <i className="fas fa-plus"></i>
              Upload Your First Media
            </button>
          </div>
        ) : (
          <div className="media-grid">
            {userMedia.map(media => (
              <div key={media.id} className="media-item glass">
                <div className="media-preview">
                  {media.thumbnail_url ? (
                    <img src={media.thumbnail_url} alt={media.title} />
                  ) : (
                    <div className="placeholder-thumbnail">
                      <i className={media.type === 'video' ? 'fas fa-video' : 'fas fa-image'}></i>
                    </div>
                  )}
                  <div className="media-type-badge">
                    <i className={media.type === 'video' ? 'fas fa-video' : 'fas fa-camera'}></i>
                    {media.type}
                  </div>
                </div>
                
                <div className="media-info">
                  <h3>{media.title}</h3>
                  <p className="media-description">{media.description}</p>
                  
                  <div className="media-meta">
                    <span className="category">{media.category}</span>
                    <span 
                      className="status"
                      style={{ color: getStatusColor(media.status) }}
                    >
                      {media.status}
                    </span>
                  </div>
                  
                  <div className="pricing-info">
                    <div className="price-item">
                      <span className="price-label">Individual:</span>
                      <span className="price-value">{formatCurrency(media.individual_price)}</span>
                    </div>
                    {media.package_price && (
                      <div className="price-item">
                        <span className="price-label">Package:</span>
                        <span className="price-value">{formatCurrency(media.package_price)}</span>
                      </div>
                    )}
                    {media.exclusive_price && (
                      <div className="price-item">
                        <span className="price-label">Exclusive:</span>
                        <span className="price-value">{formatCurrency(media.exclusive_price)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="media-stats">
                    <div className="stat">
                      <i className="fas fa-download"></i>
                      <span>{media.downloads} downloads</span>
                    </div>
                    <div className="stat">
                      <i className="fas fa-dollar-sign"></i>
                      <span>{formatCurrency(media.revenue)} earned</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        userId={user.id}
      />
    </div>
  );
}