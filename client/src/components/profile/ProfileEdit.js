import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { membersAPI } from '../../services/api';
import Modal from '../shared/Modal';

function ProfileEdit({ isOpen, onClose, member, onSuccess }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: member.name || '',
    englishAlias: member.englishAlias || '',
    gender: member.gender || '',
    birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
    contact: {
      phone: member.contact?.phone || '',
      mobile: member.contact?.mobile || '',
      lineId: member.contact?.lineId || ''
    },
    familyMembers: member.familyMembers || []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFamilyMemberChange = (index, field, value) => {
    const updated = [...formData.familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, familyMembers: updated }));
  };

  const addFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { name: '', englishAlias: '', gender: '男', birthDate: '' }]
    }));
  };

  const removeFamilyMember = (index) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(t('name_required'));
      return false;
    }
    if (!formData.gender) {
      setError(t('gender_required'));
      return false;
    }
    if (!formData.birthDate) {
      setError(t('birth_date_required'));
      return false;
    }
    if (formData.contact.mobile) {
      const phoneNumber = formData.contact.mobile.replace(/\D/g, '');
      if (phoneNumber.length < 9 || phoneNumber.length > 10) {
        setError(t('invalid_phone_number'));
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await membersAPI.updateProfile(member.memberId, formData);
      onSuccess(response.data.member);
    } catch (err) {
      setError(err.response?.data?.message || t('update_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight uppercase">{t('edit_profile')}</h2>

        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight uppercase">{t('basic_information')}</h3>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                {t('name_')}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                {t('english_alias')}
              </label>
              <input
                type="text"
                name="englishAlias"
                value={formData.englishAlias}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                {t('gender_')}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
                required
              >
                <option value="">{t('select_gender')}</option>
                <option value="男">{t('male')}</option>
                <option value="女">{t('female')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                {t('birth_date')}
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight uppercase">{t('contact_information')}</h3>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                {t('mobile')}
              </label>
              <input
                type="tel"
                name="contact.mobile"
                value={formData.contact.mobile}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                {t('phone')}
              </label>
              <input
                type="tel"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                LINE ID
              </label>
              <input
                type="text"
                name="contact.lineId"
                value={formData.contact.lineId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-container-low rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Family Members */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight uppercase">{t('family_group')}</h3>
              <button
                type="button"
                onClick={addFamilyMember}
                className="text-sm font-bold tracking-widest uppercase text-primary underline underline-offset-4 decoration-2"
              >
                + {t('add_family_member')}
              </button>
            </div>

            {formData.familyMembers.map((fm, idx) => (
              <div key={idx} className="p-4 bg-surface-container-low rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                    {t('family_member')} {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFamilyMember(idx)}
                    className="text-error hover:text-error/80"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={t('name_')}
                  value={fm.name}
                  onChange={(e) => handleFamilyMemberChange(idx, 'name', e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
                  required
                />

                <input
                  type="text"
                  placeholder={t('english_alias')}
                  value={fm.englishAlias}
                  onChange={(e) => handleFamilyMemberChange(idx, 'englishAlias', e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
                />

                <select
                  value={fm.gender}
                  onChange={(e) => handleFamilyMemberChange(idx, 'gender', e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
                  required
                >
                  <option value="男">{t('male')}</option>
                  <option value="女">{t('female')}</option>
                </select>

                <input
                  type="date"
                  value={fm.birthDate ? new Date(fm.birthDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFamilyMemberChange(idx, 'birthDate', e.target.value)}
                  className="w-full px-4 py-2 bg-surface-container-lowest rounded-lg border-2 border-transparent focus:border-primary focus:outline-none"
                  required
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-surface-container text-on-surface rounded-full font-bold hover:bg-surface-container-high transition-colors"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-on-background text-on-primary rounded-full font-bold hover:opacity-90 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default ProfileEdit;
