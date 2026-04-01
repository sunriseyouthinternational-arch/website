import React from 'react';

function BottomNav({ activeTab, onTabChange, showMeetings = false }) {
  const tabs = [
    { id: 'profile', icon: 'person', label: 'Profile' },
    { id: 'classes', icon: 'school', label: 'Classes' },
    { id: 'activities', icon: 'event', label: 'Activities' },
    { id: 'coupons', icon: 'confirmation_number', label: 'Coupons' },
  ];

  if (showMeetings) {
    tabs.push({ id: 'meetings', icon: 'groups', label: 'Meetings' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-xl rounded-t-[3rem] shadow-ambient z-50 flex items-center justify-around px-4 py-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all ${
            activeTab === tab.id
              ? 'bg-primary-container text-on-primary-fixed scale-105'
              : 'text-secondary hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined">{tab.icon}</span>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest mt-1">
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;
