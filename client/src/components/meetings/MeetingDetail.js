import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../shared/Modal';
import axios from 'axios';

function MeetingDetail({ meeting, member, onClose, onAbsenceRequest, onRefresh }) {
  const { t } = useLanguage();
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isRegistered = meeting.participants?.some(p => p.memberIdString === member.memberId);
  const hasAbsence = meeting.absences?.some(a => a.memberIdString === member.memberId);
  const absenceStatus = meeting.absences?.find(a => a.memberIdString === member.memberId);

  const handleRegister = async () => {
    setRegistering(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/api/association-meetings?action=register', {
        meetingId: meeting._id,
        memberId: member.memberId
      });

      setMessage({
        type: 'success',
        text: t('registration_successful') || 'Registration successful'
      });

      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('registration_failed') || 'Registration failed'
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleAbsence = () => {
    onAbsenceRequest(meeting._id);
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
            {meeting.agenda}
          </h2>
          <p className="text-sm text-on-surface-variant font-medium">
            {t('meeting_details') || 'Meeting Details'}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{t('date') || 'Date'}</p>
              <p className="text-on-surface font-medium">{new Date(meeting.date).toLocaleDateString('zh-TW')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary">schedule</span>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{t('time') || 'Time'}</p>
              <p className="text-on-surface font-medium">{meeting.time}</p>
            </div>
          </div>

          {meeting.location && (
            <>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{t('location') || 'Location'}</p>
                  <p className="text-on-surface font-medium">{meeting.location}</p>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-surface-container">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(meeting.location)}&output=embed`}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Meeting Location"
                />
              </div>
            </>
          )}

          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary">group</span>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{t('registered') || 'Registered'}</p>
              <p className="text-on-surface font-medium">{meeting.participants?.length || 0} {t('members') || 'members'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary">category</span>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{t('type') || 'Type'}</p>
              <p className="text-on-surface font-medium">{meeting.memberType}</p>
            </div>
          </div>
        </div>

        {/* Mandatory Warning */}
        {meeting.mandatory && (
          <div className="bg-error-container border-2 border-error rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-error text-2xl">warning</span>
              <div>
                <p className="font-bold text-on-error-container mb-1">
                  {t('mandatory_meeting') || 'Mandatory Meeting'}
                </p>
                <p className="text-sm text-on-error-container">
                  {t('members_must_attend_or_submit_absence_form') || 'Members must attend or submit absence form'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {message.text && (
          <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Absence Status */}
        {hasAbsence && (
          <div className={`p-4 rounded-xl ${absenceStatus?.approved ? 'bg-tertiary-container' : 'bg-secondary-container'}`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">{absenceStatus?.approved ? 'check_circle' : 'pending'}</span>
              <p className="font-bold">
                {absenceStatus?.approved ? t('absence_approved') || 'Absence Approved' : t('absence_pending') || 'Absence Pending'}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!isRegistered && !hasAbsence && (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="flex-1 bg-primary text-on-primary font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? t('registering') || 'Registering...' : t('register') || 'Register'}
            </button>
          )}

          {isRegistered && !hasAbsence && (
            <button
              onClick={handleAbsence}
              className="flex-1 bg-secondary text-on-secondary font-bold py-3 px-6 rounded-xl hover:bg-secondary/90 transition-colors"
            >
              {t('cannot_attend') || 'Cannot Attend'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default MeetingDetail;
