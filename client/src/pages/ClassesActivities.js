import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import './ClassesActivities.css';

function ClassesActivities() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedDay, setSelectedDay] = useState('All');
  const [loading, setLoading] = useState(true);

  const days = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [selectedDay, classes]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, activitiesRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/activities')
      ]);

      const activeClasses = classesRes.data.classes.filter(c => c.status === 'active');
      const activeActivities = activitiesRes.data.activities.filter(a => a.status === 'active');

      setClasses(activeClasses);
      setActivities(activeActivities);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load classes and activities');
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    if (selectedDay === 'All') {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter(c =>
        c.daysOfWeek && c.daysOfWeek.includes(selectedDay)
      );
      setFilteredClasses(filtered);
    }
  };

  const handleEnroll = async (type, itemId, itemName) => {
    const memberId = prompt(t('enterMemberId'));
    if (!memberId) return;

    try {
      const response = await axios.post('/api/enroll', {
        memberId: memberId.trim(),
        type,
        itemId,
        itemName
      });

      if (response.data.success) {
        alert(t('enrollmentSuccess'));
        fetchData(); // Refresh data
      }
    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert(t('enrollmentFailed'));
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container classes-activities-container">
      <h1>{t('classes')} & {t('activities')}</h1>

      {/* Classes Section - Top Half */}
      <div className="classes-section">
        <div className="section-header">
          <h2>{t('classes')}</h2>
        </div>

        {/* Day Filter */}
        <div className="day-filter">
          {days.map(day => (
            <button
              key={day}
              className={`filter-button ${selectedDay === day ? 'active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day === 'All' ? t('language') === 'zh' ? '全部' : 'All' : day}
            </button>
          ))}
        </div>

        {/* Classes Grid */}
        <div className="items-grid scrollable">
          {filteredClasses.length > 0 ? (
            filteredClasses.map(classItem => (
              <div key={classItem._id} className="item-card">
                {classItem.banner && (
                  <img src={classItem.banner} alt={classItem.name} className="item-banner" />
                )}
                <h4>{classItem.name}</h4>
                <p className="item-description">{classItem.description}</p>
                <div className="item-details">
                  <p><strong>{t('time')}:</strong> {classItem.time}</p>
                  {classItem.daysOfWeek && classItem.daysOfWeek.length > 0 && (
                    <p><strong>{t('language') === 'zh' ? '上課日期' : 'Days'}:</strong> {classItem.daysOfWeek.join(', ')}</p>
                  )}
                  <p><strong>{t('teacher')}:</strong> {classItem.teacher}</p>
                  <p><strong>{t('cost')}:</strong> ${classItem.cost}</p>
                  <p><strong>{t('participants')}:</strong> {classItem.currentParticipants}/{classItem.maxParticipants}</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEnroll('class', classItem._id, classItem.name)}
                  disabled={classItem.currentParticipants >= classItem.maxParticipants}
                >
                  {classItem.currentParticipants >= classItem.maxParticipants ? t('classFull') : t('enroll')}
                </button>
              </div>
            ))
          ) : (
            <p className="empty-message">{t('noEnrolledClasses')}</p>
          )}
        </div>
      </div>

      {/* Activities Section - Bottom Half */}
      <div className="activities-section">
        <div className="section-header">
          <h2>{t('activities')}</h2>
        </div>

        {/* Activities Grid */}
        <div className="items-grid scrollable">
          {activities.length > 0 ? (
            activities.map(activity => (
              <div key={activity._id} className="item-card">
                {activity.banner && (
                  <img src={activity.banner} alt={activity.name} className="item-banner" />
                )}
                <h4>{activity.name}</h4>
                <p className="item-description">{activity.description}</p>
                <div className="item-details">
                  <p><strong>{t('time')}:</strong> {activity.time}</p>
                  <p><strong>{t('teacher')}:</strong> {activity.teacher}</p>
                  <p><strong>{t('cost')}:</strong> ${activity.cost}</p>
                  <p><strong>{t('participants')}:</strong> {activity.currentParticipants}/{activity.maxParticipants}</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleEnroll('activity', activity._id, activity.name)}
                  disabled={activity.currentParticipants >= activity.maxParticipants}
                >
                  {activity.currentParticipants >= activity.maxParticipants ? t('activityFull') : t('enroll')}
                </button>
              </div>
            ))
          ) : (
            <p className="empty-message">{t('noEnrolledActivities')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassesActivities;
