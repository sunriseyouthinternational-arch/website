import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

function ClassCard({ classData, onClick }) {
  const { t } = useLanguage();

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: t('upcoming') || 'Upcoming', bg: 'bg-primary-container', color: 'text-on-primary-container' },
      completed: { text: t('completed') || 'Completed', bg: 'bg-tertiary-container', color: 'text-on-tertiary-container' },
      cancelled: { text: t('cancelled') || 'Cancelled', bg: 'bg-error-container', color: 'text-on-error' }
    };
    return badges[status] || badges.upcoming;
  };

  const badge = getStatusBadge(classData.status);
  const banner = classData.classInfoId?.banner || 'https://via.placeholder.com/400x200';
  const instructor = classData.classInfoId?.instructor || {};
  const capacity = classData.capacity || 0;
  const enrolled = classData.enrolledMembers?.length || 0;

  return (
    <div
      onClick={onClick}
      className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={banner}
          alt={classData.classInfoId?.name || 'Class'}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <span className={`absolute top-4 right-4 ${badge.bg} ${badge.color} px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase`}>
          {badge.text}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-on-surface">
            {classData.classInfoId?.name || 'Untitled Class'}
          </h3>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            {instructor.name || 'Instructor TBA'}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            <span>{new Date(classData.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">schedule</span>
            <span>{classData.startTime} - {classData.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">location_on</span>
            <span>{classData.location || 'Location TBA'}</span>
          </div>
        </div>

        {/* Capacity */}
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

export default ClassCard;
