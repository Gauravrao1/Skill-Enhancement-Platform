import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from '../components/PrivateRoute';
import axios from 'axios';
import './AdminPanel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('skills');
  const [skills, setSkills] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'students',
    icon: '📚',
    color: '#3498db'
  });
  const [resourceFormData, setResourceFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'youtube',
    learningType: 'free',
    category: 'students',
    skill: '',
    level: 'beginner',
    creator: '',
    verified: false
  });

  useEffect(() => {
    if (activeTab === 'skills') {
      fetchSkills();
    } else {
      fetchResources();
      fetchSkills(); // Need skills for dropdown
    }
  }, [activeTab]);

  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/skills`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Admin API returns {success: true, data: skills}
      setSkills(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      alert('Error fetching skills: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/resources`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Admin API returns {success: true, data: resources}
      setResources(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      alert('Error fetching resources: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSkillSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Transform form data to match backend Skill model structure
      const skillData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        icon: {
          type: 'emoji',
          emoji: formData.icon || '📚',
          value: 'BookOpen'
        },
        color: {
          primary: formData.color || '#3498db',
          secondary: '#E8F5E9'
        }
      };
      await axios.post(`${API_URL}/admin/skills`, skillData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Skill created successfully!');
      setFormData({
        name: '',
        description: '',
        category: 'students',
        icon: '📚',
        color: '#3498db'
      });
      fetchSkills();
    } catch (error) {
      alert('Error creating skill: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/admin/resources`, resourceFormData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Resource created successfully! URL verification is being performed automatically.');
      setResourceFormData({
        title: '',
        description: '',
        url: '',
        type: 'youtube',
        learningType: 'free',
        category: 'students',
        skill: '',
        level: 'beginner',
        creator: '',
        verified: false
      });
      fetchResources();
    } catch (error) {
      alert('Error creating resource: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResource = async (resourceId) => {
    if (!window.confirm('Verify this resource URL? This will check if the URL is accessible and working.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/admin/resources/${resourceId}/verify`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        alert('Resource verified successfully!');
        fetchResources();
      } else {
        alert(`Verification failed: ${response.data.message || 'URL is not accessible'}`);
        fetchResources(); // Refresh to show updated status
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Error verifying resource: ${errorMessage}`);
      if (error.response?.data?.verificationError) {
        console.error('Verification error:', error.response.data.verificationError);
      }
      fetchResources(); // Refresh anyway to show current status
    }
  };

  if (!isAdmin) {
    return (
      <PrivateRoute adminOnly={true}>
        <div className="container">
          <div className="error-message">Access denied. Admin privileges required.</div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage skills and resources</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Manage Skills
        </button>
        <button
          className={`admin-tab ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          Manage Resources
        </button>
      </div>

      {activeTab === 'skills' && (
        <div className="admin-section">
          <h2>Create New Skill</h2>
          <form onSubmit={handleSkillSubmit} className="admin-form">
            <div className="form-group">
              <label>Skill Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="children">Children</option>
                  <option value="students">Students</option>
                  <option value="senior_citizens">Senior Citizens</option>
                </select>
              </div>
              <div className="form-group">
                <label>Icon (emoji)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📚"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  className="input"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Skill'}
            </button>
          </form>

          <h2 style={{ marginTop: '40px' }}>Existing Skills</h2>
          <div className="admin-list">
            {skills.length === 0 ? (
              <p>No skills found. Create your first skill above!</p>
            ) : (
              skills.map((skill) => {
                // Handle icon as object or string
                const iconDisplay = typeof skill.icon === 'object' 
                  ? (skill.icon.emoji || skill.icon.value || '📚')
                  : (skill.icon || '📚');
                // Handle color as object or string
                const colorDisplay = typeof skill.color === 'object'
                  ? (skill.color.primary || '#3498db')
                  : (skill.color || '#3498db');
                
                return (
                  <div key={skill._id} className="admin-item">
                    <div>
                      <strong>{iconDisplay} {skill.name}</strong>
                      <p>{skill.description || 'No description'}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        <span className="badge badge-secondary">{skill.category}</span>
                        {skill.resourceCount !== undefined && (
                          <span className="badge badge-secondary">
                            {skill.resourceCount} {skill.resourceCount === 1 ? 'resource' : 'resources'}
                          </span>
                        )}
                        {skill.isActive === false && (
                          <span className="badge" style={{ backgroundColor: '#e74c3c', color: 'white' }}>Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="admin-section">
          <h2>Create New Resource</h2>
          <form onSubmit={handleResourceSubmit} className="admin-form">
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                className="input"
                value={resourceFormData.title}
                onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="input"
                value={resourceFormData.description}
                onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>URL *</label>
              <input
                type="url"
                className="input"
                value={resourceFormData.url}
                onChange={(e) => setResourceFormData({ ...resourceFormData, url: e.target.value })}
                required
                placeholder="https://..."
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type *</label>
                <select
                  className="input"
                  value={resourceFormData.type}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, type: e.target.value })}
                  required
                >
                  <option value="youtube">YouTube</option>
                  <option value="udemy">Udemy</option>
                  <option value="coursera">Coursera</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Learning Type *</label>
                <select
                  className="input"
                  value={resourceFormData.learningType}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, learningType: e.target.value })}
                  required
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  className="input"
                  value={resourceFormData.category}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, category: e.target.value })}
                  required
                >
                  <option value="children">Children</option>
                  <option value="students">Students</option>
                  <option value="senior_citizens">Senior Citizens</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Skill *</label>
                <select
                  className="input"
                  value={resourceFormData.skill}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, skill: e.target.value })}
                  required
                >
                  <option value="">Select a skill</option>
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name} ({skill.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Level</label>
                <select
                  className="input"
                  value={resourceFormData.level}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, level: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Creator</label>
              <input
                type="text"
                className="input"
                value={resourceFormData.creator}
                onChange={(e) => setResourceFormData({ ...resourceFormData, creator: e.target.value })}
                placeholder="Course creator name"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={resourceFormData.verified}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, verified: e.target.checked })}
                />
                Verified Resource
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Resource'}
            </button>
          </form>

          <h2 style={{ marginTop: '40px' }}>Existing Resources</h2>
          <div className="admin-list">
            {resources.length === 0 ? (
              <p>No resources found. Create your first resource above!</p>
            ) : (
              resources.map((resource) => (
                <div key={resource._id} className="admin-item">
                  <div style={{ flex: 1 }}>
                    <strong>{resource.title}</strong>
                    <p>{resource.description || 'No description'}</p>
                    {resource.url && (
                      <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', wordBreak: 'break-all' }}>
                        🔗 {resource.url}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      <span className={`badge badge-${resource.learningType}`}>
                        {resource.learningType === 'free' ? '🆓 Free' : '⭐ Premium'}
                      </span>
                      <span className={`badge ${resource.type === 'youtube' ? 'badge-youtube' : resource.type === 'udemy' ? 'badge-udemy' : resource.type === 'coursera' ? 'badge-coursera' : 'badge-secondary'}`}>
                        {resource.type ? resource.type.charAt(0).toUpperCase() + resource.type.slice(1) : 'Other'}
                      </span>
                      <span className="badge badge-secondary">{resource.category}</span>
                      {resource.verified ? (
                        <span className="badge" style={{ backgroundColor: '#27ae60', color: 'white' }}>✅ Verified</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#f39c12', color: 'white' }}>⚠️ Unverified</span>
                      )}
                      {resource.isActive === false && (
                        <span className="badge" style={{ backgroundColor: '#e74c3c', color: 'white' }}>Inactive</span>
                      )}
                      {resource.skill && typeof resource.skill === 'object' && (
                        <span className="badge badge-secondary">Skill: {resource.skill.name}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    {!resource.verified && (
                      <button
                        onClick={() => handleVerifyResource(resource._id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        title="Verify resource URL"
                      >
                        ✓ Verify
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
