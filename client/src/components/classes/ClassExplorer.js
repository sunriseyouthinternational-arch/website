import React, { useState, useEffect } from 'react';
import { classesAPI } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import ClassCard from './ClassCard';
import ClassDetail from './ClassDetail';

function ClassExplorer() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [dates, setDates] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesAPI.getAll();
      const classData = response.data.classes || [];
      setClasses(classData);

      // Extract unique dates and filter to show only today and future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const uniqueDates = [...new Set(classData.map(c => c.date))]
        .filter(dateStr => {
          const date = new Date(dateStr);
          date.setHours(0, 0, 0, 0);
          return date >= today;
        })
        .sort();

      setDates(uniqueDates);
      if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = selectedDate
    ? classes.filter(c => c.date === selectedDate)
    : classes;

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

  const hasClasses = (dateStr) => {
    return classes.some(c => c.date === dateStr);
  };

  return (
    <div className="min-h-screen bg-[#fae44b] pb-32">
      <main className="px-6 max-w-4xl mx-auto space-y-8 pt-8">
        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">{t('member_dashboard') || 'Member Dashboard'}</span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none uppercase">{t('classes')}.</h1>
        </div>

        {/* Date Selector */}
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
                const hasClass = hasClasses(date);
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
                    {hasClass && (
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
                  const hasClass = hasClasses(date);
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
                      {hasClass && (
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

        {/* Class Grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">{t('available_classes') || 'Available Classes'}</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-on-surface border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem) => (
                <ClassCard
                  key={classItem._id}
                  classData={classItem}
                  onClick={() => setSelectedClass(classItem)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Class Detail Modal */}
      {selectedClass && (
        <ClassDetail
          classData={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}
    </div>
  );
}

export default ClassExplorer;
