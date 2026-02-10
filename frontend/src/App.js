import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import SkillDetail from './pages/SkillDetail';
import Bookmarks from './pages/Bookmarks';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/category/:category"
              element={
                <PrivateRoute>
                  <CategoryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/skill/:id"
              element={
                <PrivateRoute>
                  <SkillDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <PrivateRoute>
                  <Bookmarks />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminPanel />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
