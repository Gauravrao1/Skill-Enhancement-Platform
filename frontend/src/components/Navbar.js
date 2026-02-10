import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.navbar-user') && !event.target.closest('.navbar-menu')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCategoryBadge = (category) => {
    const badges = {
      children: { emoji: '👶', label: 'Child' },
      students: { emoji: '🎓', label: 'Student' },
      senior_citizens: { emoji: '👴', label: 'Senior' },
    };
    return badges[category] || { emoji: '👤', label: 'User' };
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
          <span className="navbar-logo-icon">🎓</span>
          <span className="navbar-logo-text">Skill Enhancement</span>
        </Link>

        {/* Desktop Menu */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'navbar-menu-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className={`navbar-link ${isActiveLink('/dashboard') ? 'navbar-link-active' : ''}`}
              >
                <span className="navbar-link-icon">📊</span>
                <span>Dashboard</span>
              </Link>
              
              <Link 
                to="/bookmarks" 
                className={`navbar-link ${isActiveLink('/bookmarks') ? 'navbar-link-active' : ''}`}
              >
                <span className="navbar-link-icon">🔖</span>
                <span>Bookmarks</span>
              </Link>

              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`navbar-link navbar-link-admin ${isActiveLink('/admin') ? 'navbar-link-active' : ''}`}
                >
                  <span className="navbar-link-icon">⚙️</span>
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User Menu */}
              <div className="navbar-user">
                <button 
                  className="navbar-user-button"
                  onClick={toggleUserMenu}
                  aria-expanded={showUserMenu}
                  aria-label="User menu"
                >
                  <div className="navbar-user-avatar">
                    {getUserInitials(user?.name)}
                  </div>
                  <div className="navbar-user-info">
                    <span className="navbar-username">{user?.name}</span>
                    <span className="navbar-user-category">
                      {getCategoryBadge(user?.category).emoji} {getCategoryBadge(user?.category).label}
                    </span>
                  </div>
                  <span className={`navbar-user-arrow ${showUserMenu ? 'navbar-user-arrow-open' : ''}`}>
                    ▼
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="navbar-dropdown">
                    <div className="navbar-dropdown-header">
                      <div className="navbar-dropdown-avatar">
                        {getUserInitials(user?.name)}
                      </div>
                      <div className="navbar-dropdown-info">
                        <div className="navbar-dropdown-name">{user?.name}</div>
                        <div className="navbar-dropdown-email">{user?.email}</div>
                      </div>
                    </div>
                    
                    <div className="navbar-dropdown-divider"></div>
                    
                    <Link to="/profile" className="navbar-dropdown-item">
                      <span className="navbar-dropdown-icon">👤</span>
                      <span>Profile</span>
                    </Link>
                    
                    <Link to="/settings" className="navbar-dropdown-item">
                      <span className="navbar-dropdown-icon">⚙️</span>
                      <span>Settings</span>
                    </Link>
                    
                    <div className="navbar-dropdown-divider"></div>
                    
                    <button 
                      onClick={handleLogout} 
                      className="navbar-dropdown-item navbar-dropdown-logout"
                    >
                      <span className="navbar-dropdown-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/" className={`navbar-link ${isActiveLink('/') ? 'navbar-link-active' : ''}`}>
                <span>Home</span>
              </Link>
              
              <Link to="/about" className={`navbar-link ${isActiveLink('/about') ? 'navbar-link-active' : ''}`}>
                <span>About</span>
              </Link>
              
              <Link to="/login" className="btn btn-outline btn-small">
                Login
              </Link>
              
              <Link to="/register" className="btn btn-primary btn-small">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`navbar-mobile-toggle ${isMobileMenuOpen ? 'navbar-mobile-toggle-open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="navbar-mobile-toggle-bar"></span>
          <span className="navbar-mobile-toggle-bar"></span>
          <span className="navbar-mobile-toggle-bar"></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="navbar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

export default Navbar;