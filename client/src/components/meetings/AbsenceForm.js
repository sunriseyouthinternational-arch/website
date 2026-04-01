import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../shared/Modal';
import axios from 'axios';

function AbsenceForm({ meetingId, member, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [formImage, setFormImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('please_upload_an_image_file') || 'Please upload an image file'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: t('image_size_cannot_exceed_5mb') || 'Image size cannot exceed 5MB'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImage(reader.result);
      setMessage({ type: '', text: '' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formImage) {
      setMessage({
        type: 'error',
        text: t('please_upload_the_absence_form') || 'Please upload the absence form'
      });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`/api/association-meetings?action=submit-absence&meetingId=${meetingId}`, {
        memberId: member.memberId,
        formImage: formImage
      });

      setMessage({
        type: 'success',
        text: response.data.message || t('absence_request_submitted_successfully') || 'Absence request submitted successfully'
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('submission_failed') || 'Submission failed'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
            {t('submit_absence_form') || 'Submit Absence Form'}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {t('upload_your_absence_form_image') || 'Upload your absence form image'}
          </p>
        </div>

        {/* Upload Area */}
        <div>
          <label
            htmlFor="absence-form-upload"
            className="block w-full border-2 border-dashed border-surface-container rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {formImage ? (
              <div className="space-y-4">
                <img
                  src={formImage}
                  alt="Absence form preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <p className="text-sm text-on-surface-variant font-medium">
                  {t('click_to_change_image') || 'Click to change image'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant">upload_file</span>
                <div>
                  <p className="text-on-surface font-bold mb-1">
                    {t('click_to_upload') || 'Click to upload'}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {t('image_files_only_max_5mb') || 'Image files only, max 5MB'}
                  </p>
                </div>
              </div>
            )}
          </label>
          <input
            id="absence-form-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Messages */}
        {message.text && (
          <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-surface-container text-on-surface font-bold py-3 px-6 rounded-xl hover:bg-surface-container-high transition-colors"
          >
            {t('cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formImage || uploading}
            className="flex-1 bg-primary text-on-primary font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? t('submitting') || 'Submitting...' : t('submit') || 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default AbsenceForm;
