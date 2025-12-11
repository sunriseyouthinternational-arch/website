import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './RedeemGifts.css';

function RedeemGifts() {
  const { t } = useLanguage();

  return (
    <div className="container redeem-gifts-container">
      <div className="under-construction">
        <div className="construction-icon">🚧</div>
        <h1>
          {t('language') === 'zh' ? '禮物兌換' : 'Redeem Gifts'}
        </h1>
        <p className="construction-message">
          {t('language') === 'zh' ? '施工中' : 'Under Construction'}
        </p>
        <p className="construction-description">
          {t('language') === 'zh'
            ? '此功能正在開發中，敬請期待！'
            : 'This feature is currently under development. Stay tuned!'}
        </p>
      </div>
    </div>
  );
}

export default RedeemGifts;
