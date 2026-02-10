import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBookmark, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';
import './Bookmarks.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get(`${API_URL}/bookmarks`);
      setBookmarks(response.data);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (resourceId) => {
    try {
      await axios.delete(`${API_URL}/bookmarks/${resourceId}`);
      setBookmarks(bookmarks.filter(b => b._id !== resourceId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const handleResourceClick = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getTypeBadgeClass = (type) => {
    const badgeMap = {
      youtube: 'badge-youtube',
      udemy: 'badge-udemy',
      coursera: 'badge-coursera',
      other: 'badge-secondary'
    };
    return badgeMap[type?.toLowerCase()] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>📑 My Bookmarks</h1>
        <p>Your saved learning resources</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="no-results">
          <FaBookmark style={{ fontSize: '4rem', color: '#ddd', marginBottom: '20px' }} />
          <p>You haven't bookmarked any resources yet.</p>
          <p style={{ marginTop: '10px', color: '#7f8c8d' }}>
            Start exploring skills and bookmark your favorite resources!
          </p>
        </div>
      ) : (
        <div className="bookmarks-list">
          {bookmarks.map((resource) => (
            <div key={resource._id} className="resource-card">
              <div className="resource-card-header">
                <div>
                  <h3 className="resource-card-title">{resource.title}</h3>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span className={`resource-badge badge-${resource.learningType}`}>
                      {resource.learningType === 'free' ? '🆓 Free' : '⭐ Premium'}
                    </span>
                    <span className={`resource-badge ${getTypeBadgeClass(resource.type)}`}>
                      {resource.type ? resource.type.charAt(0).toUpperCase() + resource.type.slice(1) : 'Resource'}
                    </span>
                    {resource.skill && (
                      <span className="resource-badge badge-secondary">
                        {resource.skill.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBookmark(resource._id)}
                  className="btn btn-danger btn-small"
                  title="Remove bookmark"
                >
                  <FaTrash />
                </button>
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
                    Source: {new URL(resource.url).hostname.replace(/^www\./i, '')}
                  </p>
                )}

                {resource.verified && (
                  <span className="resource-badge badge-secondary">
                    ✅ Verified source
                  </span>
                )}
              </div>

              <button
                onClick={() => handleResourceClick(resource.url)}
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
              >
                Open Resource <FaExternalLinkAlt style={{ marginLeft: '8px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
