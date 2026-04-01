import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

function ActivityCard({ activityData, onClick }) {
  const { t } = useLanguage();

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: t('upcoming') || 'Upcoming', bg: 'bg-primary-container', color: 'text-on-primary-container' },
      completed: { text: t('completed') || 'Completed', bg: 'bg-tertiary-container', color: 'text-on-tertiary-container' },
      cancelled: { text: t('cancelled') || 'Cancelled', bg: 'bg-error-container', color: 'text-on-error' }
    };
    return badges[status] || badges.upcoming;
  };

  const badge = getStatusBadge(activityData.status);
  const banner = activityData.activityInfoId?.banner || 'https://via.placeholder.com/400x200';
  const instructor = activityData.activityInfoId?.instructor || {};
  const capacity = activityData.capacity || 0;
  const enrolled = activityData.enrolledMembers?.length || 0;

  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={banner}
          alt={activityData.activityInfoId?.name || 'Activity'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <span className={`absolute top-4 right-4 ${badge.bg} ${badge.color} px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase`}>
          {badge.text}
        </span>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-on-surface">
            {activityData.activityInfoId?.name || 'Untitled Activity'}
          </h3>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            {instructor.name || 'Instructor TBA'}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            <span>{new Date(activityData.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">schedule</span>
            <span>{activityData.startTime} - {activityData.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">location_on</span>
            <span>{activityData.location || 'Location TBA'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-surface-container-low">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            {t('capacity') || 'Capacity'}
          </span>
          <span className="text-sm font-extrabold text-on-surface">
            {enrolled}/{capacity} {t('spots') || 'spots'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;
