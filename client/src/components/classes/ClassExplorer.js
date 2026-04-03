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

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesAPI.getAll();
      const classData = response.data.classes || [];
      setClasses(classData);

      // Extract unique dates
      const uniqueDates = [...new Set(classData.map(c => c.date))].sort();
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

  return (
    <div className="min-h-screen bg-primary-container pb-32">
      <main className="px-6 max-w-4xl mx-auto space-y-8 pt-8">
        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">{t('discovery_mode') || 'Discovery Mode'}</span>
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
