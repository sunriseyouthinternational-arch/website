import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    {
      label: language === 'zh' ? '主網站/登陸頁' : 'Main Site/Landing Page',
      underConstruction: true
    },
    {
      label: language === 'zh' ? '會員入口' : 'Member Portal',
      underConstruction: false,
      current: true
    },
    {
      label: language === 'zh' ? '管理面板' : 'Admin Panel',
      underConstruction: true
    },
  ];

  return (
    <>
      <header className="w-full top-0 sticky bg-surface-container-highest text-on-surface flex items-center justify-between px-6 py-6 z-50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-surface-container rounded-full p-2 transition-colors -ml-2"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-3xl">menu</span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-transparent z-40"
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Dropdown Content */}
                <div className="absolute top-full left-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-[0_12px_40px_0_rgba(32,28,0,0.12)] z-50 overflow-hidden">
                  <div className="p-6">
                    <h2 className="font-headline font-bold text-xl mb-4 text-on-surface">
                      {language === 'zh' ? '導航選單' : 'Navigation Menu'}
                    </h2>
                    <nav className="space-y-2">
                      {menuItems.map((item, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${
                            item.current
                              ? 'bg-primary-container text-on-primary-container'
                              : item.underConstruction
                              ? 'bg-surface-container text-on-surface-variant opacity-60'
                              : 'bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.label}</span>
                            {item.underConstruction && (
                              <span className="text-xs bg-surface-container-highest px-2 py-1 rounded-full">
                                {language === 'zh' ? '建設中' : 'Under Construction'}
                              </span>
                            )}
                            {item.current && (
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </nav>
                  </div>
                </div>
              </>
            )}
          </div>
          <h1 className="font-headline font-extrabold tracking-tight text-2xl tracking-tighter">
            {t('member_portal') || 'Member Portal'}
          </h1>
        </div>

        <button
          onClick={toggleLanguage}
          className="bg-surface-container hover:bg-surface-container-high rounded-full px-4 py-2 transition-colors font-medium"
          aria-label="Toggle language"
        >
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </header>
    </>
  );
}

export default Header;
