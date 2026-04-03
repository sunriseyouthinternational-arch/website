import React, { useState, useEffect } from 'react';
import { activitiesAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import ActivityCard from './ActivityCard';
import ActivityDetail from './ActivityDetail';

function ActivityExplorer() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll();
      const activityData = response.data.activities || [];
      setActivities(activityData);

      const uniqueDates = [...new Set(activityData.map(a => a.date))].sort();
      setDates(uniqueDates);
      if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = selectedDate
    ? activities.filter(a => a.date === selectedDate)
    : activities;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    };
  };

  return (
    <div className="min-h-screen bg-primary-container pb-32">
      <main className="px-6 max-w-4xl mx-auto space-y-8 pt-8">
        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">{t('discovery_mode') || 'Discovery Mode'}</span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none uppercase">{t('activities')}.</h1>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">{t('select_date') || 'Select Date'}</h2>
            <span className="text-sm font-semibold opacity-60">
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {dates.map((date) => {
              const { day, weekday } = formatDate(date);
              const isActive = date === selectedDate;
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-6 py-4 min-w-[80px] transition-all ${
                    isActive
                      ? 'bg-on-surface text-surface scale-105 shadow-lg'
                      : 'bg-surface-container-lowest text-on-surface hover:scale-105'
                  }`}
                >
                  <span className="text-xs font-bold tracking-widest">{weekday}</span>
                  <span className="text-3xl font-extrabold mt-1">{day}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">{t('available_activities') || 'Available Activities'}</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-on-surface border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity._id}
                  activityData={activity}
                  onClick={() => setSelectedActivity(activity)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedActivity && (
        <ActivityDetail
          activityData={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}

export default ActivityExplorer;
