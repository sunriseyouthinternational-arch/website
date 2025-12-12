import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import './App.css';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <div className="logo-section">
                <h1>{t('appTitle')}</h1>
                <p className="subtitle">{t('appSubtitle')}</p>
              </div>
              <div className="header-actions">
                <button onClick={toggleLanguage} className="language-toggle">
                  {language === 'zh' ? 'English' : '中文'}
                </button>
              </div>
            </div>
            <nav className="main-nav">
              <Link to="/profile" className="nav-link">{t('profile')}</Link>
              <Link to="/admin" className="nav-link">{t('admin')}</Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:memberId" element={<Profile />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="container">
            <p>&copy; 2024 {t('appTitle')} - All rights reserved</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
