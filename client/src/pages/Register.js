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
    referralCode: ''
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [registeredMember, setRegisteredMember] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: t('lineRegistrationRequired')
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
        referralCode: ''
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

  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Must be 9 or 10 digits
    if (cleaned.length < 9 || cleaned.length > 10) {
      return false;
    }

    // Must be all numbers
    return /^\d+$/.test(cleaned);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate phone number if provided
    if (formData.contact.phone && !validatePhoneNumber(formData.contact.phone)) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? '電話號碼格式錯誤，請輸入9或10位數字'
          : 'Invalid phone number format. Please enter 9 or 10 digits.'
      });
      return;
    }

    // Validate mobile number if provided
    if (formData.contact.mobile && !validatePhoneNumber(formData.contact.mobile)) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? '手機號碼格式錯誤，請輸入9或10位數字'
          : 'Invalid mobile number format. Please enter 9 or 10 digits.'
      });
      return;
    }

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
            <p>{t('registrationSteps')}:</p>
            <ol style={{ textAlign: 'left', display: 'inline-block' }}>
              <li>{t('step1')}</li>
              <li>{t('step2')}</li>
              <li>{t('step3')}</li>
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
            {registeredMember.referralCode && (
              <div style={{ marginTop: '25px', padding: '20px', background: '#e7f5ff', borderRadius: '8px', border: '2px solid #339af0' }}>
                <p style={{ fontSize: '1.1em', marginBottom: '10px' }}><strong>{t('yourReferralCode')}:</strong></p>
                <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#1971c2', letterSpacing: '0.2em', margin: '15px 0' }}>
                  {registeredMember.referralCode}
                </p>
                <p style={{ fontSize: '0.9em', color: '#364fc7' }}>
                  {t('shareReferralCode')}
                </p>
              </div>
            )}
            <p style={{ marginTop: '20px', fontSize: '0.95em', color: '#666' }}>
              {t('accessProfileViaLine')}
            </p>
          </div>
          <button
            onClick={() => navigate(`/profile/${registeredMember.memberId}`)}
            className="btn btn-primary"
          >
            {t('profile')}
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
            {t('fillInformation')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>{t('applicantInfo')}</h3>

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
              <label>{t('referralCode')}</label>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
                }}
                placeholder={t('referralCodePlaceholder')}
                maxLength="6"
                style={{ textTransform: 'uppercase' }}
              />
              <small style={{ color: '#666' }}>
                {t('referralCodeHelp')}
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
                pattern="\d{9,10}"
                placeholder="0912345678"
              />
              <small style={{ color: '#666' }}>
                {t('language') === 'zh' ? '請輸入9或10位數字' : 'Please enter 9 or 10 digits'}
              </small>
            </div>

            <div className="form-group">
              <label>{t('mobile')} *</label>
              <input
                type="tel"
                name="contact.mobile"
                value={formData.contact.mobile}
                onChange={handleChange}
                pattern="\d{9,10}"
                placeholder="0912345678"
                required
              />
              <small style={{ color: '#666' }}>
                {t('language') === 'zh' ? '請輸入9或10位數字（必填）' : 'Please enter 9 or 10 digits (required)'}
              </small>
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
            {t('completeRegistration')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
