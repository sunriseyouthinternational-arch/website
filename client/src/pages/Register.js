import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    englishAlias: '',
    gender: '男',
    birthDate: '',
    familyMembers: [],
    contact: {
      phone: '',
      mobile: '',
      lineId: ''
    },
    referralCode: ''
  });

  useEffect(() => {
    if (!token) {
      setError(t('language') === 'zh' ? '無效的註冊連結' : 'Invalid registration link');
      setLoading(false);
      return;
    }

    // Fetch member data using token
    const fetchMemberData = async () => {
      try {
        const response = await axios.get(`/api/members?token=${token}`);
        const memberData = response.data.member;

        setFormData({
          name: memberData.name || '',
          englishAlias: memberData.englishAlias || '',
          gender: memberData.gender || '男',
          birthDate: memberData.birthDate ? new Date(memberData.birthDate).toISOString().split('T')[0] : '',
          familyMembers: memberData.familyMembers || [],
          contact: memberData.contact || { phone: '', mobile: '', lineId: '' },
          referralCode: ''
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching member data:', err);
        if (err.response?.data?.redirectTo) {
          // Already registered, redirect to profile
          navigate(err.response.data.redirectTo);
        } else {
          setError(err.response?.data?.message || (t('language') === 'zh' ? '載入失敗' : 'Failed to load'));
        }
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [token, navigate, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    // Validate required fields
    if (!formData.contact.lineId) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請輸入 LINE ID' : 'Please enter LINE ID'
      });
      setSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`/api/members?token=${token}`, formData);

      setMessage({
        type: 'success',
        text: response.data.message || (t('language') === 'zh' ? '註冊成功！' : 'Registration successful!')
      });

      // Redirect to profile after 2 seconds
      setTimeout(() => {
        navigate(`/profile/${response.data.member.memberId}`);
      }, 2000);

    } catch (err) {
      console.error('Error completing registration:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || (t('language') === 'zh' ? '註冊失敗' : 'Registration failed')
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h3 style={{ color: '#667eea' }}>
            {t('language') === 'zh' ? '載入中...' : 'Loading...'}
          </h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <h3 style={{ color: '#e74c3c', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '錯誤' : 'Error'}
          </h3>
          <p style={{ color: '#666', fontSize: '16px' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ color: '#667eea', textAlign: 'center', marginBottom: '30px' }}>
          {t('language') === 'zh' ? '完成註冊' : 'Complete Registration'}
        </h2>

        {message.text && (
          <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('language') === 'zh' ? '姓名' : 'Name'} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>{t('language') === 'zh' ? '英文別名（可選）' : 'English Alias (Optional)'}</label>
            <input
              type="text"
              name="englishAlias"
              value={formData.englishAlias}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>{t('language') === 'zh' ? '性別' : 'Gender'} *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              className="form-control"
            >
              <option value="男">{t('language') === 'zh' ? '男' : 'Male'}</option>
              <option value="女">{t('language') === 'zh' ? '女' : 'Female'}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('language') === 'zh' ? '出生日期' : 'Birth Date'} *</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>{t('language') === 'zh' ? '電話（可選）' : 'Phone (Optional)'}</label>
            <input
              type="tel"
              name="contact.phone"
              value={formData.contact.phone}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>{t('language') === 'zh' ? '手機（可選）' : 'Mobile (Optional)'}</label>
            <input
              type="tel"
              name="contact.mobile"
              value={formData.contact.mobile}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>{t('language') === 'zh' ? 'LINE ID' : 'LINE ID'} *</label>
            <input
              type="text"
              name="contact.lineId"
              value={formData.contact.lineId}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>{t('language') === 'zh' ? '推薦碼（可選）' : 'Referral Code (Optional)'}</label>
            <input
              type="text"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleChange}
              className="form-control"
              placeholder={t('language') === 'zh' ? '例如：ABC123' : 'e.g., ABC123'}
            />
            <small style={{ color: '#666' }}>
              {t('language') === 'zh'
                ? '如果有朋友推薦您加入，請輸入他們的推薦碼'
                : 'If a friend referred you, enter their referral code'}
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', marginTop: '20px', fontSize: '16px', padding: '12px' }}
          >
            {submitting
              ? (t('language') === 'zh' ? '⏳ 提交中...' : '⏳ Submitting...')
              : (t('language') === 'zh' ? '完成註冊' : 'Complete Registration')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
