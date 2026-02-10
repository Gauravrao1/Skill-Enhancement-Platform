import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CategoryPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSkills();
  }, [category]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/skills`, {
        params: { category, search: searchTerm || undefined }
      });
      // API returns {success: true, data: {skills: [...], pagination: {...}}}
      const skillsData = response.data?.data?.skills || [];
      console.log(`Fetched ${skillsData.length} skills for category: ${category}`);
      setSkills(skillsData);
    } catch (error) {
      console.error('Error fetching skills:', error);
      console.error('Error details:', error.response?.data);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSkills();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSkillClick = (skillId) => {
    navigate(`/skill/${skillId}`);
  };

  const getCategoryInfo = () => {
    const categoryMap = {
      children: { name: 'Children', icon: '👶', className: 'children-section' },
      students: { name: 'Students', icon: '🎓', className: 'students-section' },
      senior_citizens: { name: 'Senior Citizens', icon: '👴', className: 'senior-section' }
    };
    return categoryMap[category] || categoryMap.students;
  };

  const categoryInfo = getCategoryInfo();

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={`container ${categoryInfo.className}`}>
      <div className="page-header">
        <h1>{categoryInfo.icon} {categoryInfo.name} Section</h1>
        <p>Choose a skill to start learning</p>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {skills.length === 0 ? (
        <div className="no-results">
          <p>No skills found for this category.</p>
          {searchTerm ? (
            <p style={{ marginTop: '10px', color: '#7f8c8d' }}>
              Try clearing your search or check back later.
            </p>
          ) : (
            <p style={{ marginTop: '10px', color: '#7f8c8d' }}>
              Skills will appear here once they are added to the platform.
            </p>
          )}
        </div>
      ) : (
        <div className="skills-grid">
          {skills.map((skill) => {
            // Handle icon as object or string
            const iconDisplay = typeof skill.icon === 'object' 
              ? (skill.icon.emoji || skill.icon.value || '📚')
              : (skill.icon || '📚');
            // Handle color as object or string
            const colorDisplay = typeof skill.color === 'object'
              ? (skill.color.primary || '#3498db')
              : (skill.color || '#3498db');
            
            return (
              <div
                key={skill._id}
                className="skill-card"
                onClick={() => handleSkillClick(skill._id)}
                style={{ borderLeftColor: colorDisplay }}
              >
                <div className="skill-card-icon">{iconDisplay}</div>
                <h3>{skill.name}</h3>
                {skill.description && <p>{skill.description}</p>}
                {skill.resourceCount !== undefined && skill.resourceCount > 0 && (
                  <p style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '8px' }}>
                    {skill.resourceCount} {skill.resourceCount === 1 ? 'resource' : 'resources'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
