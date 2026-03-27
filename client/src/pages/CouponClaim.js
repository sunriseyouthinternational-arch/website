import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

function CouponClaim() {
  const { t } = useLanguage();
  const { token } = useParams();
  const navigate = useNavigate();
  const [couponData, setCouponData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchCouponDetails();
  }, [token]);

  const fetchCouponDetails = async () => {
    try {
      const response = await axios.get(`/api/coupon-claim?token=${token}`);
      setCouponData(response.data);
      setStatus(response.data.status);
    } catch (err) {
      setError(err.response?.data?.message || t('failed_to_load'));
      setStatus(err.response?.data?.status || 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();

    if (!memberId.trim()) {
      setError(t('language') === 'zh' ? '請輸入團員編號' : 'Please enter member ID');
      return;
    }

    setClaiming(true);
    setError(null);

    try {
      const response = await axios.post('/api/coupon-claim', {
        token,
        memberId: memberId.trim()
      });

      if (response.data.success) {
        setStatus('claimed');
        setCouponData(prev => ({
          ...prev,
          coupon: response.data.coupon
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('failed_to_claim'));
      if (err.response?.data?.hasCompletedClasses) {
        setStatus('completed_classes');
      }
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p style={{ fontSize: '18px' }}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (status === 'claimed') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#667eea', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '領取成功！' : 'Claimed Successfully!'}
          </h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            {t('language') === 'zh'
              ? '優惠券已加入您的帳戶。您可以在個人檔案中查看。'
              : 'The coupon has been added to your account. You can view it in your profile.'}
          </p>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {t('language') === 'zh' ? '前往個人檔案' : 'Go to Profile'}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error' || status === 'expired' || error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#e74c3c', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '無法領取' : 'Cannot Claim'}
          </h2>
          <p style={{ color: '#666' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (status === 'completed_classes') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#f39c12', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '不符合資格' : 'Not Eligible'}
          </h2>
          <p style={{ color: '#666' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ color: '#667eea', marginBottom: '20px', textAlign: 'center' }}>
          {t('language') === 'zh' ? '領取優惠券' : 'Claim Coupon'}
        </h2>

        {couponData && (
          <div style={{
            background: '#f8f9ff',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '2px solid #d3e0ff'
          }}>
            {couponData.coupon.image && (
              <img
                src={couponData.coupon.image}
                alt={couponData.coupon.name}
                style={{
                  width: '100%',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}
              />
            )}
            <div style={{ marginBottom: '10px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: couponData.coupon.type === 'trial' ? '#d3f9d8' : '#ffe3e3',
                color: couponData.coupon.type === 'trial' ? '#2b8a3e' : '#c92a2a',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {couponData.coupon.type === 'trial' ? t('trial') : t('discount')}
              </span>
            </div>
            <h4 style={{ color: '#667eea', marginBottom: '10px' }}>
              {couponData.coupon.name}
            </h4>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
              {couponData.coupon.description}
            </p>
            <p style={{ color: '#999', fontSize: '13px' }}>
              {t('language') === 'zh' ? '分享者：' : 'Shared by: '}{couponData.senderName}
            </p>
          </div>
        )}

        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '25px'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
            ℹ️ {t('language') === 'zh'
              ? '此優惠券僅限尚未完成任何課程的會員領取'
              : 'This coupon can only be claimed by members who have not completed any classes'}
          </p>
        </div>

        <form onSubmit={handleClaim}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#333'
            }}>
              {t('language') === 'zh' ? '團員編號' : 'Member ID'} *
            </label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder={t('language') === 'zh' ? '請輸入您的團員編號' : 'Enter your member ID'}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              disabled={claiming}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={claiming}
            style={{
              width: '100%',
              background: claiming ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: claiming ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {claiming ? (t('language') === 'zh' ? '領取中...' : 'Claiming...') : (t('language') === 'zh' ? '領取優惠券' : 'Claim Coupon')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CouponClaim;
