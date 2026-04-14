import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminLogin.css';

function AdminLogin() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/auth', credentials);
      localStorage.setItem('adminToken', response.data.token);
      setMessage({ type: 'success', text: response.data.message });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('invalidCredentials')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <header className="admin-login-topbar">
        <div className="admin-login-brand">Admin Portal</div>
      </header>

      <main className="admin-login-main">
        <div className="admin-login-card">
          <div className="admin-login-copy">
            <h1>Welcome Back.</h1>
            <p>Authenticate to access the management dashboard.</p>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <div className="admin-login-field">
              <label>System Identity</label>
              <div className="admin-login-input-row">
                <span className="material-symbols-outlined">person</span>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label>Secure Credential</label>
              <div className="admin-login-input-row">
                <span className="material-symbols-outlined">lock</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}

            <div className="admin-login-actions">
              <button type="button" className="admin-login-link">
                Forgot Access?
              </button>
              <button type="submit" className="admin-login-submit" disabled={loading}>
                <span>{loading ? t('loading') : t('login')}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </form>

          <div className="admin-login-notice">
            <span className="material-symbols-outlined">info</span>
            <div>
              <strong>Support Notice</strong>
              <p>
                If this is your first session, please refer to the documentation regarding{' '}
                <button type="button" className="admin-login-inline-link">
                  Default Credentials
                </button>{' '}
                for internal provisioning.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="admin-login-footer">
        <span>© 2024 Management Portal. High-Energy Precision.</span>
        <div className="admin-login-footer-links">
          <button type="button">Privacy Policy</button>
          <button type="button">Terms of Service</button>
          <button type="button">Security</button>
        </div>
      </footer>
    </div>
  );
}

export default AdminLogin;
