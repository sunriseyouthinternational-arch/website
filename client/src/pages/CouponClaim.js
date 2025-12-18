import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

function CouponClaim() {
  const { t } = useLanguage();
  const { token } = useParams();
  const [couponData, setCouponData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchCouponDetails = async () => {
      try {
        const response = await axios.get(`/api/coupon-claim?token=${token}`);
        setCouponData(response.data);
        setStatus(response.data.status);
      } catch (err) {
        setError(err.response?.data?.message || (t('language') === 'zh' ? '載入失敗' : 'Failed to load'));
        setStatus(err.response?.data?.status || 'error');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCouponDetails();
    }
  }, [token, t]);

  const getLineAddFriendUrl = () => {
    const lineChannelId = process.env.REACT_APP_LINE_CHANNEL_ID || '@907xmpck';
    // Ensure @ symbol is present for LINE Official Account URL
    const channelIdWithAt = lineChannelId.startsWith('@') ? lineChannelId : `@${lineChannelId}`;
    return `https://line.me/ti/p/${channelIdWithAt}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h3 style={{ color: '#667eea' }}>
            {t('language') === 'zh' ? '載入中...' : 'Loading...'}
          </h3>
        </div>
      </div>
    );
  }

  if (status === 'claimed') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#2b8a3e', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '優惠券已被領取' : 'Coupon Already Claimed'}
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {t('language') === 'zh'
              ? '此優惠券已經被其他人領取了。'
              : 'This coupon has already been claimed by someone else.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'expired' || error) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#c92a2a', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '優惠券已過期' : 'Coupon Expired'}
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {error || (t('language') === 'zh'
              ? '此優惠券或分享連結已過期。'
              : 'This coupon or share link has expired.')}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'available' && couponData) {
    const { coupon, senderName, expiresAt } = couponData;

    return (
      <div className="container">
        <div className="page-title">
          <h2>🎁 {t('language') === 'zh' ? '您收到了優惠券！' : 'You Received a Coupon!'}</h2>
        </div>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Sender Info */}
          <div style={{
            background: '#f8f9ff',
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '30px',
            textAlign: 'center',
            border: '2px solid #d3e0ff'
          }}>
            <p style={{ margin: 0, color: '#667eea', fontSize: '15px' }}>
              {t('language') === 'zh' ? '來自：' : 'From: '}<strong>{senderName}</strong>
            </p>
          </div>

          {/* Coupon Preview */}
          <div style={{
            border: '3px solid #667eea',
            borderRadius: '16px',
            padding: '30px',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
          }}>
            {coupon.image && (
              <img
                src={coupon.image}
                alt={coupon.name}
                loading="lazy"
                decoding="async"
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '2px solid #e0e0e0'
                }}
              />
            )}

            <div style={{ marginBottom: '15px' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 16px',
                background: coupon.type === 'trial' ? '#d3f9d8' : '#ffe3e3',
                color: coupon.type === 'trial' ? '#2b8a3e' : '#c92a2a',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {coupon.type === 'trial'
                  ? (t('language') === 'zh' ? '體驗券' : 'Trial Coupon')
                  : (t('language') === 'zh' ? '折扣券' : 'Discount Coupon')}
              </span>
            </div>

            <h2 style={{ color: '#667eea', marginBottom: '15px', fontSize: '28px' }}>
              {coupon.name}
            </h2>

            <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
              {coupon.description}
            </p>

            {coupon.type === 'discount' && (
              <div style={{
                background: '#fff3cd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#c92a2a' }}>
                  {coupon.discountPercent}% {t('language') === 'zh' ? '折扣' : 'OFF'}
                </p>
              </div>
            )}

            {coupon.expiryDate && (
              <p style={{ fontSize: '14px', color: '#856404', margin: 0 }}>
                ⏰ {t('language') === 'zh' ? '優惠券有效期至：' : 'Valid until: '}
                {new Date(coupon.expiryDate).toLocaleDateString(t('language') === 'zh' ? 'zh-TW' : 'en-US')}
              </p>
            )}
          </div>

          {/* Instructions */}
          <div style={{
            background: '#e7f3ff',
            border: '2px solid #b3d9ff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{ color: '#004085', marginBottom: '15px', fontSize: '18px' }}>
              {t('language') === 'zh' ? '📋 如何領取' : '📋 How to Claim'}
            </h3>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#004085', lineHeight: '1.8' }}>
              <li>
                {t('language') === 'zh'
                  ? '點擊下方「加入 LINE」按鈕加入晨光國際少年團官方帳號'
                  : 'Click "Add LINE Account" button below to add our official account'}
              </li>
              <li>
                {t('language') === 'zh'
                  ? '按照 LINE 訊息中的指示完成註冊'
                  : 'Follow the instructions in LINE messages to complete registration'}
              </li>
              <li>
                {t('language') === 'zh'
                  ? '註冊完成後，將此頁面的連結傳送給 LINE 官方帳號'
                  : 'After registration, send this page\'s URL to our LINE Official Account'}
              </li>
              <li>
                {t('language') === 'zh'
                  ? '我們會為您領取優惠券！'
                  : 'We will claim the coupon for you!'}
              </li>
            </ol>
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: '#fff8dc',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#856404'
            }}>
              💡 {t('language') === 'zh'
                ? '建議：將此頁面加入書籤，以便稍後傳送連結'
                : 'Tip: Bookmark this page to easily send the link later'}
            </div>
          </div>

          {/* Add LINE Button */}
          <a
            href={getLineAddFriendUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '20px',
              background: '#06C755',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '18px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(6, 199, 85, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#05b34b';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(6, 199, 85, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#06C755';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(6, 199, 85, 0.3)';
            }}
          >
            {t('language') === 'zh' ? '➕ 加入 LINE 官方帳號' : '➕ Add LINE Official Account'}
          </a>

          {/* Expiry Warning */}
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
              ⚠️ {t('language') === 'zh'
                ? `此連結將於 ${new Date(expiresAt).toLocaleDateString('zh-TW')} 過期`
                : `This link expires on ${new Date(expiresAt).toLocaleDateString('en-US')}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default CouponClaim;
