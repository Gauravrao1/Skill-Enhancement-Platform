import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="navbar-logo">
          🎓 Skill Enhancement
        </Link>

        {/* Desktop Menu */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'navbar-menu-open' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className={`navbar-link ${isActiveLink('/dashboard') ? 'navbar-link-active' : ''}`}
              >
                Dashboard
              </Link>
              
              <Link 
                to="/bookmarks" 
                className={`navbar-link ${isActiveLink('/bookmarks') ? 'navbar-link-active' : ''}`}
              >
                Bookmarks
              </Link>

              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`navbar-link ${isActiveLink('/admin') ? 'navbar-link-active' : ''}`}
                >
                  Admin
                </Link>
              )}

              <span className="navbar-username">{user?.name}</span>
              
              <button onClick={handleLogout} className="navbar-logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              
              <Link to="/register" className="navbar-register-btn">
                Register
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