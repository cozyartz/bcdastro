import React, { useState, useEffect } from 'react';
import { ClientProjectService, MediaService, ClientProject, MediaAsset, User } from '../lib/supabase';

interface ClientProjectManagerProps {
  user: User;
  onClose: () => void;
}

export default function ClientProjectManager({ user, onClose }: ClientProjectManagerProps) {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [projectMedia, setProjectMedia] = useState<MediaAsset[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    project_name: '',
    project_description: '',
    property_type: 'golf_course',
    property_address: '',
    shoot_date: '',
    delivery_deadline: '',
    total_budget: '',
    notes: ''
  });

  const propertyTypes = [
    { value: 'golf_course', label: 'Golf Course' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'commercial', label: 'Commercial Property' },
    { value: 'industrial', label: 'Industrial Facility' },
    { value: 'residential', label: 'Residential Development' },
    { value: 'hospitality', label: 'Hotel/Resort' },
    { value: 'agricultural', label: 'Agricultural' },
    { value: 'event_venue', label: 'Event Venue' },
    { value: 'construction', label: 'Construction Site' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectMedia(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await ClientProjectService.getUserProjects(user.id);
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMedia = async (projectId: string) => {
    try {
      const { data, error } = await ClientProjectService.getProjectMedia(projectId);
      if (error) throw error;
      setProjectMedia(data || []);
    } catch (error) {
      console.error('Error loading project media:', error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        ...newProject,
        user_id: user.id,
        total_budget: newProject.total_budget ? parseFloat(newProject.total_budget) : undefined,
        status: 'planning' as const
      };

      const { data, error } = await ClientProjectService.createProject(projectData);
      if (error) throw error;

      setProjects([data, ...projects]);
      setShowCreateModal(false);
      setNewProject({
        client_name: '',
        client_email: '',
        client_phone: '',
        project_name: '',
        project_description: '',
        property_type: 'golf_course',
        property_address: '',
        shoot_date: '',
        delivery_deadline: '',
        total_budget: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return '#6b7280';
      case 'in_progress': return '#f59e0b';
      case 'review': return '#8b5cf6';
      case 'delivered': return '#10b981';
      case 'completed': return '#059669';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="project-manager-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="project-manager-container">
      <div className="project-manager-header">
        <h2>Client Project Manager</h2>
        <div className="header-actions">
          <button 
            className="professional-button"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fas fa-plus"></i>
            New Project
          </button>
          <button 
            className="professional-button secondary"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
            Close
          </button>
        </div>
      </div>

      <div className="project-manager-content">
        {/* Projects List */}
        <div className="projects-sidebar">
          <h3>Projects ({projects.length})</h3>
          {projects.length === 0 ? (
            <div className="empty-projects">
              <i className="fas fa-folder-open"></i>
              <p>No projects yet</p>
              <p className="text-sm text-gray-500">Create your first client project to get started</p>
            </div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <div 
                  key={project.id}
                  className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="project-header">
                    <h4>{project.project_name}</h4>
                    <span 
                      className="project-status"
                      style={{ color: getStatusColor(project.status) }}
                    >
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="project-client">{project.client_name}</p>
                  <p className="project-type">{project.property_type.replace('_', ' ')}</p>
                  {project.total_budget && (
                    <p className="project-budget">{formatCurrency(project.total_budget)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="project-details">
          {selectedProject ? (
            <div className="project-detail-content">
              <div className="project-info">
                <h3>{selectedProject.project_name}</h3>
                <div className="project-meta">
                  <div className="meta-item">
                    <label>Client:</label>
                    <span>{selectedProject.client_name}</span>
                  </div>
                  <div className="meta-item">
                    <label>Property Type:</label>
                    <span>{selectedProject.property_type.replace('_', ' ')}</span>
                  </div>
                  <div className="meta-item">
                    <label>Status:</label>
                    <span style={{ color: getStatusColor(selectedProject.status) }}>
                      {selectedProject.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedProject.total_budget && (
                    <div className="meta-item">
                      <label>Budget:</label>
                      <span>{formatCurrency(selectedProject.total_budget)}</span>
                    </div>
                  )}
                </div>
                
                {selectedProject.project_description && (
                  <div className="project-description">
                    <h4>Description</h4>
                    <p>{selectedProject.project_description}</p>
                  </div>
                )}
              </div>

              <div className="project-media">
                <h4>Media Assets ({projectMedia.length})</h4>
                {projectMedia.length === 0 ? (
                  <div className="empty-media">
                    <i className="fas fa-images"></i>
                    <p>No media uploaded for this project yet</p>
                  </div>
                ) : (
                  <div className="media-grid">
                    {projectMedia.map(media => (
                      <div key={media.id} className="media-item">
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
                          </div>
                        </div>
                        <div className="media-info">
                          <h5>{media.title}</h5>
                          <p className="media-status" style={{ color: getStatusColor(media.status) }}>
                            {media.status}
                          </p>
                          <p className="media-price">{formatCurrency(media.individual_price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-project-selected">
              <i className="fas fa-arrow-left"></i>
              <p>Select a project to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal project-create-modal">
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button 
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="project-form">
              <div className="form-section">
                <h4>Client Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Client Name *</label>
                    <input
                      type="text"
                      value={newProject.client_name}
                      onChange={(e) => setNewProject({...newProject, client_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Client Email</label>
                    <input
                      type="email"
                      value={newProject.client_email}
                      onChange={(e) => setNewProject({...newProject, client_email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Client Phone</label>
                  <input
                    type="tel"
                    value={newProject.client_phone}
                    onChange={(e) => setNewProject({...newProject, client_phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Project Details</h4>
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Project Description</label>
                  <textarea
                    value={newProject.project_description}
                    onChange={(e) => setNewProject({...newProject, project_description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Property Type *</label>
                    <select
                      value={newProject.property_type}
                      onChange={(e) => setNewProject({...newProject, property_type: e.target.value})}
                      required
                    >
                      {propertyTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Total Budget</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProject.total_budget}
                      onChange={(e) => setNewProject({...newProject, total_budget: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Property Address</label>
                  <input
                    type="text"
                    value={newProject.property_address}
                    onChange={(e) => setNewProject({...newProject, property_address: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Shoot Date</label>
                    <input
                      type="date"
                      value={newProject.shoot_date}
                      onChange={(e) => setNewProject({...newProject, shoot_date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Delivery Deadline</label>
                    <input
                      type="date"
                      value={newProject.delivery_deadline}
                      onChange={(e) => setNewProject({...newProject, delivery_deadline: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={newProject.notes}
                    onChange={(e) => setNewProject({...newProject, notes: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  className="professional-button secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="professional-button"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}