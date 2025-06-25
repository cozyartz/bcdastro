import React, { useState } from 'react';
import { MediaService } from '../lib/supabase';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function UploadModal({ isOpen, onClose, userId }: UploadModalProps) {
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
    file_size: '',
    duration: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Urban', 'Agricultural', 'Nature', 'Industrial', 
    'Real Estate', 'Construction', 'Events', 'Golf Courses'
  ];

  const propertyTypes = [
    'Golf Course', 'Residential', 'Commercial', 'Industrial',
    'Agricultural', 'Recreational', 'Municipal', 'Educational'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect file type and set some defaults
      const isVideo = selectedFile.type.startsWith('video/');
      const fileSize = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
      
      setFormData(prev => ({
        ...prev,
        file_size: fileSize,
        resolution: isVideo ? '4K UHD' : '8K RAW'
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real implementation, you would upload to Cloudflare first
      // For now, we'll simulate with a mock Cloudflare ID
      const mockCloudflareId = `cf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const mediaData = {
        user_id: userId,
        title: formData.title,
        description: formData.description,
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
        category: formData.category,
        cloudflare_id: mockCloudflareId,
        resolution: formData.resolution,
        file_size: formData.file_size,
        duration: formData.duration || undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        individual_price: parseFloat(formData.individual_price),
        package_price: formData.package_price ? parseFloat(formData.package_price) : undefined,
        exclusive_price: formData.exclusive_price ? parseFloat(formData.exclusive_price) : undefined,
        is_exclusive: false,
        location: formData.location,
        property_type: formData.property_type
      };

      const { error } = await MediaService.uploadMedia(mediaData);
      if (error) throw error;

      alert('Media uploaded successfully! It will be reviewed before appearing in the gallery.');
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" onClick={onClose}>
      <div className="upload-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="upload-modal-header">
          <h2>Upload Media</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="file">
                <i className="fas fa-cloud-upload-alt"></i> Media File
              </label>
              <input
                type="file"
                id="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                required
              />
            </div>
          </div>

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

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <button type="submit" className="professional-button" disabled={loading}>
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-cloud-upload-alt"></i>
            )}
            {loading ? 'Uploading...' : 'Upload Media'}
          </button>
        </form>
      </div>
    </div>
  );
}