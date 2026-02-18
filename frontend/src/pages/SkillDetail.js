import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaBookmark, FaExternalLinkAlt } from 'react-icons/fa';
import './SkillDetail.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SkillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [skill, setSkill] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [learningType, setLearningType] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // Create axios instance with auth headers
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, []);

  // Extract a human-readable domain from the resource URL for display
  const getDomainFromUrl = useCallback((url) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./i, '');
    } catch {
      const match = url.match(/^https?:\/\/([^/]+)/i);
      return match ? match[1].replace(/^www\./i, '') : '';
    }
  }, []);

  // Fetch skill details
  const fetchSkill = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/skills/${id}`);
      // API returns {success: true, data: skill}
      setSkill(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching skill:', error);
      setError(error.response?.data?.message || 'Failed to load skill details');
    } finally {
      setLoading(false);
    }
  }, [id, axiosInstance]);

  // Fetch resources based on learning type
  const fetchResources = useCallback(async () => {
    if (!id) return;

    try {
      setResourcesLoading(true);
      const params = learningType ? { learningType } : {};
      const response = await axiosInstance.get(`/skills/${id}/resources`, { params });
      // Backend wraps data under data.resources
      setResources(response.data?.data?.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    } finally {
      setResourcesLoading(false);
    }
  }, [id, learningType, axiosInstance]);

  // Fetch user bookmarks
  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await axiosInstance.get('/bookmarks');
      const ids = new Set(response.data.map(r => r._id));
      setBookmarkedIds(ids);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      // Don't show error to user, bookmarks are non-critical
    }
  }, [isAuthenticated, axiosInstance]);

  // Toggle bookmark status
  const handleBookmark = useCallback(async (resourceId) => {
    if (!isAuthenticated) {
      alert('Please login to bookmark resources');
      return;
    }

    const isBookmarked = bookmarkedIds.has(resourceId);

    // Optimistic update
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (isBookmarked) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });

    try {
      if (isBookmarked) {
        await axiosInstance.delete(`/bookmarks/${resourceId}`);
      } else {
        await axiosInstance.post(`/bookmarks/${resourceId}`);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      
      // Revert optimistic update on error
      setBookmarkedIds(prev => {
        const newSet = new Set(prev);
        if (isBookmarked) {
          newSet.add(resourceId);
        } else {
          newSet.delete(resourceId);
        }
        return newSet;
      });

      alert(error.response?.data?.message || 'Failed to update bookmark');
    }
  }, [isAuthenticated, bookmarkedIds, axiosInstance]);

  // Open resource in new tab
  const handleResourceClick = useCallback((url) => {
    if (! url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // Get badge CSS class based on resource type
  const getTypeBadgeClass = useCallback((type) => {
    const badgeMap = {
      youtube: 'badge-youtube',
      udemy: 'badge-udemy',
      coursera: 'badge-coursera',
      other: 'badge-secondary'
    };
    return badgeMap[type?.toLowerCase()] || 'badge-secondary';
  }, []);

  // Toggle learning type filter
  const toggleLearningType = useCallback((type) => {
    setLearningType(prev => prev === type ? null : type);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSkill();
  }, [fetchSkill]);

  // Fetch resources when skill or learning type changes
  useEffect(() => {
    if (skill) {
      fetchResources();
    }
  }, [skill, fetchResources]);

  // Fetch bookmarks when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated, fetchBookmarks]);

  // Determine if learning type selector should be shown
  const showLearningTypeSelector = useMemo(() => {
    return skill?.category === 'students';
  }, [skill]);

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          {error}
          <button 
            onClick={fetchSkill} 
            className="btn btn-primary" 
            style={{ marginTop:  '16px' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Skill not found
  if (!skill) {
    return (
      <div className="container">
        <div className="error-message">
          Skill not found
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-secondary" 
            style={{ marginTop: '16px' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-secondary" 
        style={{ marginBottom: '20px' }}
        aria-label="Go back"
      >
        ← Back
      </button>

      <div className="skill-header">
        <div className="skill-header-icon" aria-hidden="true">
          {typeof skill.icon === 'object' 
            ? (skill.icon.emoji || skill.icon.value || '📚')
            : (skill.icon || '📚')}
        </div>
        <h1>{skill.name}</h1>
        {skill.description && <p>{skill.description}</p>}
        {skill.resources && skill.resources.length > 0 && (
          <p style={{ fontSize: '0.95rem', color: '#7f8c8d', marginTop: '8px' }}>
            {skill.resources.length} {skill.resources.length === 1 ? 'resource' : 'resources'} available
          </p>
        )}
      </div>

      {showLearningTypeSelector && (
        <div className="learning-type-selector" role="group" aria-label="Learning type filter">
          <button
            className={`learning-type-btn free ${learningType === 'free' ? 'active' : ''}`}
            onClick={() => toggleLearningType('free')}
            aria-pressed={learningType === 'free'}
          >
            🆓 Free Learning
          </button>
          <button
            className={`learning-type-btn premium ${learningType === 'premium' ? 'active' : ''}`}
            onClick={() => toggleLearningType('premium')}
            aria-pressed={learningType === 'premium'}
          >
            ⭐ Premium Learning
          </button>
        </div>
      )}

      {resourcesLoading ?  (
        <div className="spinner" style={{ margin: '40px auto' }}></div>
      ) : resources.length === 0 ? (
        <div className="no-results">
          <p>No resources available for this selection.</p>
          {learningType && (
            <button 
              onClick={() => setLearningType(null)} 
              className="btn btn-secondary"
              style={{ marginTop:  '16px' }}
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        <div className="resources-list">
          {resources.map((resource) => (
            <div key={resource._id} className="resource-card">
              <div className="resource-card-header">
                <div>
                  <h3 className="resource-card-title">{resource.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span className={`resource-badge badge-${resource.learningType}`}>
                      {resource.learningType === 'free' ?  '🆓 Free' :  '⭐ Premium'}
                    </span>
                    <span className={`resource-badge ${getTypeBadgeClass(resource.type)}`}>
                      {resource.type ?  resource.type.charAt(0).toUpperCase() + resource.type.slice(1) : 'Resource'}
                    </span>
                    {resource.level && (
                      <span className="resource-badge badge-secondary">
                        {resource.level}
                      </span>
                    )}
                  </div>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={() => handleBookmark(resource._id)}
                    className={`bookmark-btn ${bookmarkedIds.has(resource._id) ? 'bookmarked' : ''}`}
                    title={bookmarkedIds.has(resource._id) ? 'Remove bookmark' : 'Bookmark'}
                    aria-label={bookmarkedIds.has(resource._id) ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    <FaBookmark />
                  </button>
                )}
              </div>

              {resource.description && (
                <p className="resource-description">{resource.description}</p>
              )}

              <div className="resource-meta">
                {resource.creator && (
                  <p className="resource-creator">By: {resource.creator}</p>
                )}

                {resource.url && (
                  <p className="resource-source">
                    Source: {getDomainFromUrl(resource.url)}
                  </p>
                )}

                {resource.verified && (
                  <span className="resource-badge badge-secondary">
                    ✅ Verified source
                  </span>
                )}

                {resource.rating > 0 && (
                  <p className="resource-rating">⭐ {resource.rating}/5</p>
                )}
              </div>

              <button
                onClick={() => handleResourceClick(resource.url)}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                disabled={! resource.url}
                aria-label={`Open ${resource.title} in new tab`}
              >
                Open Resource <FaExternalLinkAlt style={{ marginLeft:  '8px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillDetail;