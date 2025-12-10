import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Register.css';

function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState('');
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
    referrer: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [registeredMember, setRegisteredMember] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? '⚠️ 請先加入 LINE 官方帳號以開始註冊\n請掃描 QR Code 或搜尋官方帳號'
          : '⚠️ Please add our LINE Official Account first to start registration\nScan the QR code or search for our official account'
      });
      return;
    }

    // Fetch member data with token
    fetchMemberData();
  }, [token]);

  const fetchMemberData = async () => {
    try {
      const response = await axios.get(`/api/members?token=${token}`);
      const member = response.data.member;

      setMemberId(member.memberId);
      setFormData({
        name: member.name || '',
        englishAlias: member.englishAlias || '',
        gender: member.gender || '男',
        birthDate: member.birthDate ? member.birthDate.split('T')[0] : '',
        familyMembers: member.familyMembers || [],
        contact: member.contact || { phone: '', mobile: '', lineId: '' },
        referrer: ''
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('error')
      });

      // If already completed, redirect to profile
      if (error.response?.data?.redirectTo) {
        setTimeout(() => {
          navigate(error.response.data.redirectTo);
        }, 2000);
      }
    }
  };

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
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { name: '', englishAlias: '', gender: '男', birthDate: '' }]
    }));
  };

  const updateFamilyMember = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  const removeFamilyMember = (index) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`/api/members?token=${token}`, formData);
      setMessage({ type: 'success', text: response.data.message });
      setRegisteredMember(response.data.member);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('error')
      });
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="page-title">
          <h2>{t('memberRegistration')}</h2>
        </div>
        <div className="card">
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  // No token - show error
  if (!token) {
    return (
      <div className="container">
        <div className="page-title">
          <h2>{t('memberRegistration')}</h2>
        </div>
        <div className="card">
          <div className="message error">
            {message.text}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>{t('language') === 'zh' ? '註冊流程：' : 'Registration Process:'}</p>
            <ol style={{ textAlign: 'left', display: 'inline-block' }}>
              <li>{t('language') === 'zh' ? '加入 LINE 官方帳號' : 'Add LINE Official Account'}</li>
              <li>{t('language') === 'zh' ? '收到註冊連結' : 'Receive registration link'}</li>
              <li>{t('language') === 'zh' ? '點擊連結完成註冊' : 'Click link to complete registration'}</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Registration successful
  if (registeredMember) {
    return (
      <div className="container">
        <div className="page-title">
          <h2>{t('memberRegistration')}</h2>
        </div>
        <div className="card registration-success">
          <h3>{t('registerSuccess')}</h3>
          <div className="success-details">
            <p><strong>{t('memberId')}:</strong> {registeredMember.memberId}</p>
            <p><strong>{t('name')}:</strong> {registeredMember.name}</p>
            {registeredMember.qrCode && (
              <div className="qr-code-display">
                <img src={registeredMember.qrCode} alt="QR Code" />
                <p>{t('language') === 'zh' ? '請保存此 QR 碼' : 'Please save this QR code'}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate(`/profile/${registeredMember.memberId}`)}
            className="btn btn-primary"
          >
            {t('language') === 'zh' ? '查看個人檔案' : 'View Profile'}
          </button>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="container">
      <div className="page-title">
        <h2>{t('memberRegistration')}</h2>
      </div>

      <div className="card">
        <div className="info-banner">
          <p>
            <strong>{t('memberId')}:</strong> {memberId}
          </p>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            {t('language') === 'zh'
              ? '請填寫您的個人資料以完成註冊'
              : 'Please fill in your information to complete registration'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>{t('language') === 'zh' ? '申請人資料' : 'Applicant Information'}</h3>

            <div className="form-group">
              <label>{t('applicantName')} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('englishAlias')}</label>
              <input
                type="text"
                name="englishAlias"
                value={formData.englishAlias}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t('gender')} *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="男">{t('male')}</option>
                <option value="女">{t('female')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('birthDate')} *</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('language') === 'zh' ? '推薦人 (選填)' : 'Referrer (Optional)'}</label>
              <input
                type="text"
                name="referrer"
                value={formData.referrer}
                onChange={handleChange}
                placeholder={t('language') === 'zh' ? '誰推薦您加入？' : 'Who referred you?'}
              />
              <small style={{ color: '#666' }}>
                {t('language') === 'zh'
                  ? '如果有人推薦您加入，請填寫他們的姓名'
                  : 'If someone referred you, please enter their name'}
              </small>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>{t('familyMembers')}</h3>
              <button type="button" onClick={addFamilyMember} className="btn btn-secondary btn-small">
                {t('addFamilyMember')}
              </button>
            </div>

            {formData.familyMembers.map((member, index) => (
              <div key={index} className="family-member-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('fullName')}</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('englishAlias')}</label>
                    <input
                      type="text"
                      value={member.englishAlias}
                      onChange={(e) => updateFamilyMember(index, 'englishAlias', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('gender')}</label>
                    <select
                      value={member.gender}
                      onChange={(e) => updateFamilyMember(index, 'gender', e.target.value)}
                      required
                    >
                      <option value="男">{t('male')}</option>
                      <option value="女">{t('female')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('birthDate')}</label>
                    <input
                      type="date"
                      value={member.birthDate}
                      onChange={(e) => updateFamilyMember(index, 'birthDate', e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFamilyMember(index)}
                    className="btn btn-danger btn-small"
                  >
                    {t('removeFamilyMember')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>{t('contactInfo')}</h3>

            <div className="form-group">
              <label>{t('phone')}</label>
              <input
                type="tel"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>{t('mobile')} *</label>
              <input
                type="tel"
                name="contact.mobile"
                value={formData.contact.mobile}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('lineId')}</label>
              <input
                type="text"
                name="contact.lineId"
                value={formData.contact.lineId}
                onChange={handleChange}
              />
            </div>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-large">
            {t('language') === 'zh' ? '完成註冊' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
