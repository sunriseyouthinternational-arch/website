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
    <div className="container">
      <div className="admin-login-page">
        <div className="card admin-login-card">
          <div className="admin-login-header">
            <h2>{t('adminPanel')}</h2>
            <p>{t('language') === 'zh' ? '請登入以訪問管理員控制面板' : 'Please login to access admin control panel'}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('language') === 'zh' ? '用戶名' : 'Username'}</label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>{t('language') === 'zh' ? '密碼' : 'Password'}</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
              {loading ? t('loading') : t('login')}
            </button>
          </form>

          <div className="admin-info">
            <p><small>{t('language') === 'zh' ? '默認用戶名: admin, 密碼: admin123' : 'Default username: admin, password: admin123'}</small></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
