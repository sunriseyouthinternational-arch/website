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
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await activitiesAPI.getAll();
      const activityData = response.data.activities || [];
      setActivities(activityData);

      // Extract unique dates and filter to show only today and future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueDates = [...new Set(activityData.map(a => a.date))]
        .filter(dateStr => {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);
          return date >= today;
        })
        .sort();

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

  const moveDate = (direction) => {
    const currentIndex = dates.indexOf(selectedDate);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDate(dates[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < dates.length - 1) {
      setSelectedDate(dates[currentIndex + 1]);
    }
  };

  const hasActivities = (dateStr) => {
    return activities.some(a => a.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-[#fae44b] pb-32">
      <main className="px-6 max-w-4xl mx-auto space-y-8 pt-8">
        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">{t('member_dashboard') || 'Member Dashboard'}</span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none uppercase">{t('activities')}.</h1>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">{t('select_date') || 'Select Date'}</h2>
            <span className="text-sm font-semibold opacity-60">
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => moveDate('prev')}
              disabled={dates.indexOf(selectedDate) === 0}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            <div className="flex-1 flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {dates.slice(Math.max(0, dates.indexOf(selectedDate) - 2), dates.indexOf(selectedDate) + 3).map((date) => {
                const { day, weekday } = formatDate(date);
                const isActive = date === selectedDate;
                const hasActivity = hasActivities(date);
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-6 py-4 min-w-[80px] transition-all relative ${
                      isActive
                        ? 'bg-on-surface text-surface scale-105 shadow-lg'
                        : 'bg-surface-container-lowest text-on-surface hover:scale-105'
                    }`}
                  >
                    {hasActivity && (
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isActive ? 'bg-surface' : 'bg-primary'}`} />
                    )}
                    <span className="text-xs font-bold tracking-widest">{weekday}</span>
                    <span className="text-3xl font-extrabold mt-1">{day}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => moveDate('next')}
              disabled={dates.indexOf(selectedDate) === dates.length - 1}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center transition-all"
            >
              <span className="material-symbols-outlined">calendar_month</span>
            </button>
          </div>

          {/* Calendar Picker */}
          {showCalendar && (
            <div className="bg-surface-container-lowest rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">{t('select_date') || 'Select Date'}</h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {dates.map((date) => {
                  const { day, weekday } = formatDate(date);
                  const isActive = date === selectedDate;
                  const hasActivity = hasActivities(date);
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg p-3 transition-all relative ${
                        isActive
                          ? 'bg-on-surface text-surface'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {hasActivity && (
                        <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isActive ? 'bg-surface' : 'bg-primary'}`} />
                      )}
                      <span className="text-xs font-bold">{weekday}</span>
                      <span className="text-xl font-extrabold">{day}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
