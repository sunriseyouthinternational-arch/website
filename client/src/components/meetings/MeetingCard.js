import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

function MeetingCard({ meeting, member, onClick }) {
  const { t } = useLanguage();

  const isRegistered = meeting.participants?.some(p => p.memberIdString === member.memberId);
  const hasAbsence = meeting.absences?.some(a => a.memberIdString === member.memberId);
  const absenceStatus = meeting.absences?.find(a => a.memberIdString === member.memberId);

  const getStatusBadge = () => {
    if (hasAbsence) {
      if (absenceStatus?.approved) {
        return { text: t('absence_approved') || 'Absence Approved', bg: 'bg-tertiary-container', color: 'text-on-tertiary-container', icon: 'check_circle' };
      }
      return { text: t('absence_pending') || 'Absence Pending', bg: 'bg-secondary-container', color: 'text-on-secondary-container', icon: 'pending' };
    }
    if (isRegistered) {
      return { text: t('registered_') || 'Registered', bg: 'bg-primary-container', color: 'text-on-primary-container', icon: 'event_available' };
    }
    return { text: t('not_registered') || 'Not Registered', bg: 'bg-surface-container', color: 'text-on-surface-variant', icon: 'event' };
  };

  const badge = getStatusBadge();

  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-xl p-6 shadow-lg hover:scale-105 transition-transform cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-extrabold tracking-tight text-on-surface flex-1">
          {meeting.agenda}
        </h3>
        <span className={`${badge.bg} ${badge.color} px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1`}>
          <span className="material-symbols-outlined text-sm">{badge.icon}</span>
          {badge.text}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">calendar_today</span>
          <span>{new Date(meeting.date).toLocaleDateString('zh-TW')}</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-lg">schedule</span>
          <span>{meeting.time}</span>
        </div>
        {meeting.location && (
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">location_on</span>
            <span>{meeting.location}</span>
          </div>
        )}
      </div>

      {meeting.mandatory && (
        <div className="mt-4 bg-error-container border-2 border-error rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error">warning</span>
            <span className="text-xs font-bold text-on-error-container uppercase tracking-widest">
              {t('mandatory_meeting') || 'Mandatory Meeting'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingCard;
