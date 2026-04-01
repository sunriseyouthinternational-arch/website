import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import MeetingCard from './MeetingCard';
import MeetingDetail from './MeetingDetail';
import AbsenceForm from './AbsenceForm';
import axios from 'axios';

function MeetingsView({ member }) {
  const { t } = useLanguage();
  const [meetings, setMeetings] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [absenceMeetingId, setAbsenceMeetingId] = useState(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/association-meetings?status=upcoming');
      setMeetings(response.data.meetings);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMemberStats = useCallback(async () => {
    try {
      const response = await axios.get(`/api/association-meetings?action=member-stats&memberId=${member.memberId}`);
      setMemberStats(response.data);
    } catch (error) {
      console.error('Failed to fetch member stats:', error);
    }
  }, [member]);

  useEffect(() => {
    if (member) {
      fetchMeetings();
      fetchMemberStats();
    }
  }, [member, fetchMeetings, fetchMemberStats]);

  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleAbsenceRequest = (meetingId) => {
    setAbsenceMeetingId(meetingId);
    setSelectedMeeting(null);
  };

  const handleRefresh = () => {
    fetchMeetings();
    fetchMemberStats();
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-8 text-center shadow-ambient-md">
        <h1 className="text-4xl font-black tracking-tight text-on-primary mb-2">
          {t('association_meetings') || 'ASSOCIATION MEETINGS'}
        </h1>
      </div>

      {/* Member Stats */}
      {memberStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">percent</span>
              <div>
                <p className="text-sm text-on-surface-variant font-medium">
                  {t('attendance_rate') || 'Attendance Rate'}
                </p>
                <p className="text-2xl font-black text-primary">
                  {memberStats.attendanceRate}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">event_available</span>
              <div>
                <p className="text-sm text-on-surface-variant font-medium">
                  {t('language') === 'zh' ? `${memberStats.currentYear}年參與會議` : `Meetings Attended in ${memberStats.currentYear}`}
                </p>
                <p className="text-2xl font-black text-primary">
                  {memberStats.meetingsAttendedThisYear} {t('times') || 'times'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-on-surface mb-4">
          {t('upcoming_meetings') || 'Upcoming Meetings'}
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant animate-spin">progress_activity</span>
            <p className="text-on-surface-variant mt-4">{t('loading') || 'Loading...'}</p>
          </div>
        ) : meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                member={member}
                onClick={() => handleMeetingClick(meeting)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-container-lowest rounded-xl">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">event_busy</span>
            <p className="text-on-surface-variant mt-4">{t('no_upcoming_meetings') || 'No upcoming meetings'}</p>
          </div>
        )}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <MeetingDetail
          meeting={selectedMeeting}
          member={member}
          onClose={() => setSelectedMeeting(null)}
          onAbsenceRequest={handleAbsenceRequest}
          onRefresh={handleRefresh}
        />
      )}

      {/* Absence Form Modal */}
      {absenceMeetingId && (
        <AbsenceForm
          meetingId={absenceMeetingId}
          member={member}
          onClose={() => setAbsenceMeetingId(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

export default MeetingsView;
