import React, { useState, useEffect } from 'react';
import { MediaService } from '../lib/supabase';
import { cloudflareUploadService, type UploadProgress, type UploadResult } from '../lib/cloudflare-upload';

interface EnhancedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UploadState {
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  error?: string;
  result?: UploadResult;
}

export default function EnhancedUploadModal({ isOpen, onClose, userId }: EnhancedUploadModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    property_type: '',
    individual_price: '',
    package_price: '',
    exclusive_price: '',
    tags: '',
    resolution: '',
    duration: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    currentStep: 'Ready to upload'
  });
  
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [vendorInfo, setVendorInfo] = useState({
    storageUsed: 0,
    storageLimit: 10 * 1024 * 1024 * 1024, // 10GB default
    uploadsThisMonth: 0,
    uploadLimit: 100
  });

  const categories = [
    'Urban', 'Agricultural', 'Nature', 'Industrial', 
    'Real Estate', 'Construction', 'Events', 'Golf Courses'
  ];

  const propertyTypes = [
    'Golf Course', 'Residential', 'Commercial', 'Industrial',
    'Agricultural', 'Recreational', 'Municipal', 'Educational'
  ];

  useEffect(() => {
    // Load vendor upload quotas and usage
    loadVendorInfo();
  }, [userId]);

  const loadVendorInfo = async () => {
    try {
      // In production, this would fetch from your database
      // For now, using mock data
      setVendorInfo({
        storageUsed: 2.5 * 1024 * 1024 * 1024, // 2.5GB used
        storageLimit: 10 * 1024 * 1024 * 1024, // 10GB limit
        uploadsThisMonth: 23,
        uploadLimit: 100
      });
    } catch (error) {
      console.error('Failed to load vendor info:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file before setting
    const validation = cloudflareUploadService.validateFile(selectedFile);
    if (!validation.isValid) {
      setUploadState({
        status: 'error',
        progress: 0,
        currentStep: 'File validation failed',
        error: validation.error
      });
      return;
    }

    setFile(selectedFile);
    setUploadState({
      status: 'idle',
      progress: 0,
      currentStep: 'File selected and validated'
    });

    // Auto-detect file type and set defaults
    const isVideo = selectedFile.type.startsWith('video/') || validation.fileType === 'video';
    const fileSize = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
    
    setFormData(prev => ({
      ...prev,
      resolution: isVideo ? '4K UHD' : '8K RAW'
    }));

    // Create preview for images
    if (validation.fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleProgressUpdate = (progress: UploadProgress) => {
    setUploadState(prev => ({
      ...prev,
      progress: progress.percentage,
      currentStep: `Uploading... ${progress.percentage}%`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadState({
        status: 'error',
        progress: 0,
        currentStep: 'No file selected',
        error: 'Please select a file to upload'
      });
      return;
    }

    // Check upload quotas
    if (vendorInfo.uploadsThisMonth >= vendorInfo.uploadLimit) {
      setUploadState({
        status: 'error',
        progress: 0,
        currentStep: 'Upload limit exceeded',
        error: `You have reached your monthly upload limit of ${vendorInfo.uploadLimit} files.`
      });
      return;
    }

    if (vendorInfo.storageUsed + file.size > vendorInfo.storageLimit) {
      setUploadState({
        status: 'error',
        progress: 0,
        currentStep: 'Storage limit exceeded',
        error: 'This upload would exceed your storage limit. Please upgrade your plan or delete some files.'
      });
      return;
    }

    try {
      setUploadState({
        status: 'validating',
        progress: 0,
        currentStep: 'Validating file and preparing upload...'
      });

      // Prepare metadata for Cloudflare
      const metadata = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        property_type: formData.property_type,
        tags: formData.tags,
        uploaded_by: userId,
        upload_date: new Date().toISOString()
      };

      setUploadState({
        status: 'uploading',
        progress: 0,
        currentStep: 'Starting upload to Cloudflare...'
      });

      // Upload to Cloudflare (Stream, R2, or Images based on file type and size)
      const validation = cloudflareUploadService.validateFile(file);
      let uploadResult: UploadResult;

      if (validation.fileType === 'video') {
        uploadResult = await cloudflareUploadService.uploadVideo(file, metadata, handleProgressUpdate);
      } else {
        uploadResult = await cloudflareUploadService.uploadImage(file, metadata, handleProgressUpdate);
      }

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      setUploadState({
        status: 'processing',
        progress: 95,
        currentStep: 'Processing and saving metadata...'
      });

      // Save metadata to Supabase
      const mediaData = {
        user_id: userId,
        title: formData.title,
        description: formData.description,
        type: validation.fileType,
        category: formData.category,
        cloudflare_id: uploadResult.id,
        thumbnail_url: uploadResult.thumbnailUrl,
        resolution: formData.resolution,
        file_size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        duration: formData.duration || undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        individual_price: parseFloat(formData.individual_price),
        package_price: formData.package_price ? parseFloat(formData.package_price) : undefined,
        exclusive_price: formData.exclusive_price ? parseFloat(formData.exclusive_price) : undefined,
        is_exclusive: false,
        location: formData.location,
        property_type: formData.property_type,
        status: 'pending' // Will be reviewed before approval
      };

      const { error: dbError } = await MediaService.createMediaAsset(mediaData);
      if (dbError) throw dbError;

      setUploadState({
        status: 'completed',
        progress: 100,
        currentStep: 'Upload completed successfully!',
        result: uploadResult
      });

      // Update vendor stats
      setVendorInfo(prev => ({
        ...prev,
        storageUsed: prev.storageUsed + file.size,
        uploadsThisMonth: prev.uploadsThisMonth + 1
      }));

      // Auto-close after success message
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 3000);

    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadState({
        status: 'error',
        progress: 0,
        currentStep: 'Upload failed',
        error: error.message || 'An unexpected error occurred'
      });
    }
  };

  const resetUpload = () => {
    setUploadState({
      status: 'idle',
      progress: 0,
      currentStep: 'Ready to upload'
    });
    setFile(null);
    setFilePreview(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (): number => {
    return (vendorInfo.storageUsed / vendorInfo.storageLimit) * 100;
  };

  const getUploadPercentage = (): number => {
    return (vendorInfo.uploadsThisMonth / vendorInfo.uploadLimit) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="enhanced-upload-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2>
            <i className="fas fa-cloud-upload-alt"></i>
            Upload Media to Cloudflare
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Vendor Usage Stats */}
        <div className="vendor-stats">
          <div className="stat-item">
            <div className="stat-header">
              <i className="fas fa-hdd"></i>
              <span>Storage Usage</span>
            </div>
            <div className="stat-bar">
              <div 
                className="stat-fill storage"
                style={{ width: `${getStoragePercentage()}%` }}
              ></div>
            </div>
            <div className="stat-text">
              {formatFileSize(vendorInfo.storageUsed)} / {formatFileSize(vendorInfo.storageLimit)}
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-header">
              <i className="fas fa-upload"></i>
              <span>Monthly Uploads</span>
            </div>
            <div className="stat-bar">
              <div 
                className="stat-fill uploads"
                style={{ width: `${getUploadPercentage()}%` }}
              ></div>
            </div>
            <div className="stat-text">
              {vendorInfo.uploadsThisMonth} / {vendorInfo.uploadLimit}
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {uploadState.status !== 'idle' && (
          <div className="upload-status">
            <div className="status-header">
              <span className={`status-indicator ${uploadState.status}`}>
                {uploadState.status === 'uploading' && <i className="fas fa-spinner fa-spin"></i>}
                {uploadState.status === 'processing' && <i className="fas fa-cog fa-spin"></i>}
                {uploadState.status === 'completed' && <i className="fas fa-check-circle"></i>}
                {uploadState.status === 'error' && <i className="fas fa-exclamation-triangle"></i>}
              </span>
              <span>{uploadState.currentStep}</span>
            </div>
            
            {uploadState.status === 'uploading' && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
            )}

            {uploadState.error && (
              <div className="error-details">
                <p>{uploadState.error}</p>
                <button onClick={resetUpload} className="retry-btn">
                  <i className="fas fa-redo"></i>
                  Try Again
                </button>
              </div>
            )}

            {uploadState.status === 'completed' && uploadState.result && (
              <div className="success-details">
                <p>
                  <i className="fas fa-check"></i>
                  File uploaded successfully to Cloudflare!
                </p>
                <div className="upload-details">
                  <p><strong>ID:</strong> {uploadState.result.id}</p>
                  <p><strong>URL:</strong> <a href={uploadState.result.url} target="_blank" rel="noopener noreferrer">View File</a></p>
                  {uploadState.result.thumbnailUrl && (
                    <p><strong>Thumbnail:</strong> <a href={uploadState.result.thumbnailUrl} target="_blank" rel="noopener noreferrer">View Thumbnail</a></p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {uploadState.status === 'idle' && (
          <form onSubmit={handleSubmit} className="upload-form">
            {/* File Upload Section */}
            <div className="file-upload-section">
              <div className="file-drop-zone">
                <input
                  type="file"
                  id="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  required
                  className="file-input"
                />
                <label htmlFor="file" className="file-drop-label">
                  {file ? (
                    <div className="file-selected">
                      <i className={`fas ${file.type.startsWith('video/') ? 'fa-video' : 'fa-image'}`}></i>
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      {filePreview && (
                        <div className="file-preview">
                          <img src={filePreview} alt="Preview" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="file-prompt">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <h3>Drop your file here or click to browse</h3>
                      <p>Supports videos up to 30GB and images up to 100MB</p>
                      <p>Automatically optimized and distributed globally</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="form-fields">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">
                    <i className="fas fa-heading"></i> Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Professional title for your media"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <i className="fas fa-align-left"></i> Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Detailed description of the content and what it shows"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">
                    <i className="fas fa-folder"></i> Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="property_type">
                    <i className="fas fa-building"></i> Property Type
                  </label>
                  <select
                    id="property_type"
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select property type</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">
                    <i className="fas fa-map-marker-alt"></i> Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="City, State or specific location"
                  />
                </div>
              </div>

              <div className="pricing-section">
                <h3><i className="fas fa-dollar-sign"></i> Pricing Structure</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="individual_price">Individual Price ($)</label>
                    <input
                      type="number"
                      id="individual_price"
                      name="individual_price"
                      value={formData.individual_price}
                      onChange={handleInputChange}
                      required
                      min="1"
                      step="0.01"
                      placeholder="Price per individual item"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="package_price">Package Price ($)</label>
                    <input
                      type="number"
                      id="package_price"
                      name="package_price"
                      value={formData.package_price}
                      onChange={handleInputChange}
                      min="1"
                      step="0.01"
                      placeholder="Price for complete package"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="exclusive_price">Exclusive Rights ($)</label>
                    <input
                      type="number"
                      id="exclusive_price"
                      name="exclusive_price"
                      value={formData.exclusive_price}
                      onChange={handleInputChange}
                      min="1"
                      step="0.01"
                      placeholder="Price for exclusive rights"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="resolution">
                    <i className="fas fa-expand-arrows-alt"></i> Resolution
                  </label>
                  <input
                    type="text"
                    id="resolution"
                    name="resolution"
                    value={formData.resolution}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 4K UHD, 8K RAW"
                  />
                </div>

                {file?.type.startsWith('video/') && (
                  <div className="form-group">
                    <label htmlFor="duration">
                      <i className="fas fa-clock"></i> Duration
                    </label>
                    <input
                      type="text"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 2:45"
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="tags">
                  <i className="fas fa-tags"></i> Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Comma-separated tags (e.g., aerial, golf, sunset)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="upload-btn professional-button"
                disabled={!file || uploadState.status !== 'idle'}
              >
                <i className="fas fa-cloud-upload-alt"></i>
                Upload to Cloudflare
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}