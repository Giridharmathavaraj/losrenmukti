import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronDown, Bell, Mail, HelpCircle, User,
  Search, Pin, List, Plus, LogOut, UserCircle
} from 'lucide-react';
import { useNavigate, useLocation } from '@/Component/router-hooks';

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [username, setUsername] = useState('User');
  const [role, setRole] = useState('');
  const dropdownRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedRole) {
      setRole(storedRole);
    }

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('companyId');
    // Using window.location.href to fully reload the app state and let App.jsx catch the empty token
    window.location.href = '/login';
  };
  return (
    <>
      {/* HEADER */}
      <header className="main-header">
        <div className="header-left">
          <div className="logo-section">
            <span className="logo-text">Renmukti</span>
            <div className="separator"></div>
            <span className="sandbox-text">LOS</span>
          </div>
          <nav className="nav-menu">
            <a href="#" className={location.pathname === '/company-dashboard' ? "active" : ""} onClick={(e) => { e.preventDefault(); navigate('/company-dashboard'); }}>Dashboards</a>
            <a href="#" className={location.pathname === '/' ? "active" : ""} onClick={(e) => { e.preventDefault(); navigate('/'); }}>Loans</a>
            {role === 'superadmin' && (
              <a href="#" className={location.pathname === '/companies' ? "active" : ""} onClick={(e) => { e.preventDefault(); navigate('/companies'); }}>Companies</a>
            )}
            <a href="#">Tools <ChevronDown size={14} /></a>
            <a href="#">Reports <ChevronDown size={14} /></a>
            {(role === 'superadmin' || role === 'admin') && (
              <a href="#" className={location.pathname === '/Users' ? "active" : ""} onClick={(e) => { e.preventDefault(); navigate('/Users'); }}>Users <ChevronDown size={14} /></a>
            )}
            <div className="nav-dropdown" ref={settingsRef} style={{ position: 'relative', display: 'inline-block' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsSettingsOpen(!isSettingsOpen); }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                Settings <ChevronDown size={14} style={{ transform: isSettingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </a>
              {isSettingsOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'white', border: '1px solid #eee', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '150px', padding: '8px 0' }}>
                  <button 
                    onClick={() => { setIsSettingsOpen(false); navigate('/settings/states'); }} 
                    style={{ display: 'block', width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#333' }}
                    onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    State Configurations
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
        <div className="header-right">
          {/* <div className="sandbox-badge">
            <span className="dot"></span> Sandbox Environment
          </div> */}
          <HelpCircle className="icon" size={20} />
          <Mail className="icon" size={20} />
          <Bell className="icon" size={20} />
          <div className="user-profile" ref={dropdownRef}>
            <div
              className="user-profile-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div className="avatar"><User size={16} /></div>
              <span>{username}</span>
              <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {isDropdownOpen && (
              <div className="profile-dropdown-menu">
                <div className="dropdown-header">
                  <strong>{username}</strong>
                  <span className="user-role" style={{ textTransform: 'capitalize' }}>{role || 'User'}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => navigate('/particular-loan')}>
                  <UserCircle size={16} />
                  My Details
                </button>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>

  )
}

export default Nav




