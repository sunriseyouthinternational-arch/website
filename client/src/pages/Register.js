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
              <label>{t('referrer')}</label>
              <input
                type="text"
                name="referrer"
                value={formData.referrer}
                onChange={handleChange}
                placeholder={t('referrerPlaceholder')}
              />
              <small style={{ color: '#666' }}>
                {t('referrerHelp')}
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
            {t('completeRegistration')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
