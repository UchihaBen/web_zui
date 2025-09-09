import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <Link to="/dashboard">Social App</Link>
        </div>
        
        <div className="navbar-menu">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            🏠 Trang chủ
          </Link>
          <Link to="/friends" className={`nav-link ${isActive('/friends')}`}>
            👥 Bạn bè
          </Link>
          <Link to="/messages" className={`nav-link ${isActive('/messages')}`}>
            💬 Tin nhắn
          </Link>
          <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>
            👤 Trang cá nhân
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="user-name">{user?.name}</span>
          </div>
          <button onClick={logout} className="logout-btn">
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
