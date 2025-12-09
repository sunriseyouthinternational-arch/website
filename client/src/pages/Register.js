import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Register.css';

function Register() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    gender: '男',
    birthDate: '',
    familyMembers: [],
    contact: {
      phone: '',
      mobile: '',
      lineId: ''
    }
  });

  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [registeredMember, setRegisteredMember] = useState(null);

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
      familyMembers: [...prev.familyMembers, { name: '', gender: '男', birthDate: '' }]
    }));
    setShowFamilyForm(true);
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
      const response = await axios.post('/api/members/register', formData);
      setMessage({ type: 'success', text: response.data.message });
      setRegisteredMember(response.data.member);

      // Reset form
      setFormData({
        name: '',
        gender: '男',
        birthDate: '',
        familyMembers: [],
        contact: { phone: '', mobile: '', lineId: '' }
      });
      setShowFamilyForm(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('error')
      });
    }
  };

  return (
    <div className="container">
      <div className="page-title">
        <h2>{t('memberRegistration')}</h2>
      </div>

      {registeredMember ? (
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
          <button onClick={() => setRegisteredMember(null)} className="btn btn-primary">
            {t('language') === 'zh' ? '註冊另一位團員' : 'Register Another Member'}
          </button>
        </div>
      ) : (
        <div className="card">
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
                      <label>{t('name')}</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                        required
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
              {t('submit')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Register;
