import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    {
      id: 'children',
      name: 'Children',
      icon: '👶',
      description: 'Fun and engaging learning for kids',
      color: '#FF6B6B'
    },
    {
      id: 'students',
      name: 'Students',
      icon: '🎓',
      description: 'Academic and professional skills',
      color: '#4ECDC4'
    },
    {
      id: 'senior_citizens',
      name: 'Senior Citizens',
      icon: '👴',
      description: 'Digital literacy and wellness',
      color: '#95E1D3'
    }
  ];

  const handleCategoryClick = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Welcome, {user?.name}! 👋</h1>
        <p>Choose a category to start learning</p>
      </div>

      <div className="category-grid">
        {categories.map((category) => (
          <div
            key={category.id}
            className="category-card"
            onClick={() => handleCategoryClick(category.id)}
            style={{ borderLeftColor: category.color }}
          >
            <div className="category-card-icon">{category.icon}</div>
            <h2>{category.name}</h2>
            <p>{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
