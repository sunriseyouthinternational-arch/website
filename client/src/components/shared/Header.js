import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from './Modal';

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
          <button
            onClick={() => setIsMenuOpen(true)}
            className="hover:bg-surface-container rounded-full p-2 transition-colors -ml-2"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
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

      <Modal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} size="default">
        <div className="pt-8">
          <h2 className="font-headline font-bold text-2xl mb-6 text-on-surface">
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
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  {item.underConstruction && (
                    <span className="text-sm bg-surface-container-highest px-3 py-1 rounded-full">
                      {language === 'zh' ? '建設中' : 'Under Construction'}
                    </span>
                  )}
                  {item.current && (
                    <span className="material-symbols-outlined">check_circle</span>
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </Modal>
    </>
  );
}

export default Header;
