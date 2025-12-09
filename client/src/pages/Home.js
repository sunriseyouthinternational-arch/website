import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

function Home() {
  const { t } = useLanguage();

  return (
    <div className="container">
      <div className="home-hero">
        <h1>{t('appTitle')}</h1>
        <p className="hero-subtitle">{t('appSubtitle')}</p>
        <p className="hero-description">
          {t('language') === 'zh'
            ? '歡迎來到晨光國際少年團會員管理系統。在這裡您可以註冊成為團員、查看個人檔案、報名課程和活動。'
            : 'Welcome to Sunrise Youth International member management system. Here you can register as a member, view your profile, and enroll in classes and activities.'}
        </p>

        <div className="action-buttons">
          <Link to="/register" className="btn btn-primary btn-large">
            {t('register')}
          </Link>
          <Link to="/profile" className="btn btn-secondary btn-large">
            {t('profile')}
          </Link>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">👥</div>
          <h3>{t('memberRegistration')}</h3>
          <p>
            {t('language') === 'zh'
              ? '快速註冊您的個人和家庭團員資料'
              : 'Quickly register your personal and family member information'}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <h3>{t('qrCode')}</h3>
          <p>
            {t('language') === 'zh'
              ? '每位團員都有專屬的 QR 碼和會員編號'
              : 'Each member has a unique QR code and member ID'}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <h3>{t('myCoursesActivities')}</h3>
          <p>
            {t('language') === 'zh'
              ? '瀏覽並報名參加課程和活動'
              : 'Browse and enroll in classes and activities'}
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚙️</div>
          <h3>{t('adminPanel')}</h3>
          <p>
            {t('language') === 'zh'
              ? '管理員可以管理團員、課程和活動'
              : 'Admins can manage members, classes, and activities'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
