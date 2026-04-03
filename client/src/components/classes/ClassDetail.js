import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../shared/Modal';

function ClassDetail({ classData, onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showParticipants, setShowParticipants] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: t('upcoming') || 'Upcoming', bg: 'bg-primary-container', color: 'text-on-primary-container' },
      completed: { text: t('completed') || 'Completed', bg: 'bg-tertiary-container', color: 'text-on-tertiary-container' },
      cancelled: { text: t('cancelled') || 'Cancelled', bg: 'bg-error-container', color: 'text-on-error' }
    };
    return badges[status] || badges.upcoming;
  };

  const handleEnroll = () => {
    navigate(`/checkout/class/${classData._id}`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const generateAvatarColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const badge = getStatusBadge(classData.status);
  const banner = classData.classInfoId?.banner || 'https://via.placeholder.com/1200x400';
  const instructor = classData.classInfoId?.instructor || {};
  const enrolled = classData.enrolledMembers?.length || 0;
  const capacity = classData.capacity || 0;

  return (
    <Modal isOpen={true} onClose={onClose} size="large">
      <div className="space-y-8">
        {/* Hero Image */}
        <div className="relative -m-6 md:-m-8 mb-0 h-80 overflow-hidden rounded-t-xl">
          <img
            src={banner}
            alt={classData.classInfoId?.name || 'Class'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <div className="space-y-1">
              <span className={`inline-block ${badge.bg} ${badge.color} px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase`}>
                {badge.text}
              </span>
              <h1 className="text-white text-5xl font-extrabold tracking-tighter">
                {classData.classInfoId?.name || 'Untitled Class'}
              </h1>
            </div>
          </div>
        </div>

        {/* Instructor Card */}
        <div className="flex items-center justify-between gap-4 p-6 bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-4">
            <img
              src={instructor.photo || 'https://via.placeholder.com/64'}
              alt={instructor.name || 'Instructor'}
              className="w-16 h-16 rounded-full border-2 border-surface-container"
            />
            <div>
              <p className="text-xl font-extrabold text-on-surface">{instructor.name || 'Instructor TBA'}</p>
              <p className="text-sm text-on-surface-variant font-medium">{instructor.title || 'Instructor'}</p>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">calendar_today</span>
              <span className="text-xs font-bold uppercase tracking-widest">{t('date') || 'Date'}</span>
            </div>
            <p className="text-lg font-extrabold text-on-surface">
              {new Date(classData.date).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">schedule</span>
              <span className="text-xs font-bold uppercase tracking-widest">{t('time') || 'Time'}</span>
            </div>
            <p className="text-lg font-extrabold text-on-surface">
              {classData.startTime} - {classData.endTime}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">location_on</span>
              <span className="text-xs font-bold uppercase tracking-widest">{t('location') || 'Location'}</span>
            </div>
            <p className="text-lg font-extrabold text-on-surface">
              {classData.location || 'TBA'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">group</span>
              <span className="text-xs font-bold uppercase tracking-widest">{t('capacity') || 'Capacity'}</span>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-extrabold text-on-surface">
                {enrolled}/{capacity}
              </p>
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${capacity > 0 ? (enrolled / capacity) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">signal_cellular_alt</span>
              <span className="text-xs font-bold uppercase tracking-widest">{t('level') || 'Level'}</span>
            </div>
            <p className="text-lg font-extrabold text-on-surface">
              {classData.classInfoId?.level || 'All Levels'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined">timer</span>
              <span className="text-xs font-bold uppercase tracking-widest">{t('duration') || 'Duration'}</span>
            </div>
            <p className="text-lg font-extrabold text-on-surface">
              {classData.classInfoId?.duration || 'N/A'}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold tracking-tight text-on-surface">
            {t('description') || 'Description'}
          </h3>
          <p className="text-on-surface-variant leading-relaxed">
            {classData.classInfoId?.description || 'No description available.'}
          </p>
        </div>

        {/* Recent Joins */}
        {classData.participants && classData.participants.length > 0 && (
          <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-on-surface">
                {t('recent_joins') || 'Recent Joins'}
              </h3>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="text-sm font-bold text-primary hover:underline"
              >
                {showParticipants ? t('hide') || 'Hide' : t('view_all') || 'View All'}
              </button>
            </div>

            <div className="flex -space-x-2">
              {classData.participants.slice(0, 5).map((participant, idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 rounded-full ${generateAvatarColor(participant.memberName)} flex items-center justify-center text-white font-bold text-sm border-2 border-surface-container-low`}
                  title={participant.memberName}
                >
                  {getInitials(participant.memberName)}
                </div>
              ))}
              {classData.participants.length > 5 && (
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface font-bold text-xs border-2 border-surface-container-low">
                  +{classData.participants.length - 5}
                </div>
              )}
            </div>

            {showParticipants && (
              <div className="space-y-2 pt-4 border-t border-surface-container">
                {classData.participants.map((participant, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-surface-container rounded-lg">
                    <div className={`w-10 h-10 rounded-full ${generateAvatarColor(participant.memberName)} flex items-center justify-center text-white font-bold text-sm`}>
                      {getInitials(participant.memberName)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface">{participant.memberName}</p>
                      <p className="text-xs text-on-surface-variant">
                        {participant.paid ? t('paid') || 'Paid' : t('pending_payment') || 'Pending Payment'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Location Map */}
        {classData.location && (
          <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold tracking-tight text-on-surface">
              {t('location') || 'Location'}
            </h3>
            <div className="bg-surface-container rounded-lg p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
              <div>
                <p className="font-bold text-on-surface">{classData.location}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(classData.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {t('open_in_maps') || 'Open in Maps'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Attendee Financials */}
        {classData.participants && classData.participants.length > 0 && (
          <div className="bg-surface-container-low rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold tracking-tight text-on-surface">
              {t('financial_summary') || 'Financial Summary'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  {t('total_revenue') || 'Total Revenue'}
                </p>
                <p className="text-2xl font-extrabold text-on-surface">
                  NT$ {classData.participants.reduce((sum, p) => sum + ((classData.classInfoId?.cost || 0) - (p.couponDiscount || 0)), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-surface-container rounded-lg p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  {t('paid_count') || 'Paid'}
                </p>
                <p className="text-2xl font-extrabold text-on-surface">
                  {classData.participants.filter(p => p.paid).length} / {classData.participants.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enroll Button */}
        <button
          onClick={handleEnroll}
          disabled={classData.status !== 'upcoming' || enrolled >= capacity}
          className="w-full bg-on-surface text-surface py-4 rounded-full font-black text-lg tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {t('enroll_now') || 'ENROLL NOW'}
        </button>
      </div>
    </Modal>
  );
}

export default ClassDetail;
