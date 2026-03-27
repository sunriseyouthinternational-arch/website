import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

function CouponClaim() {
  const { t } = useLanguage();
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    initializeLiff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const initializeLiff = async () => {
    const liffId = process.env.REACT_APP_LIFF_ID || process.env.REACT_APP_LIFF_ID_PROFILE;

    console.log('[CouponClaim] LIFF ID:', liffId);
    console.log('[CouponClaim] Token:', token);

    if (!liffId) {
      console.error('[CouponClaim] No LIFF ID found');
      setError(t('language') === 'zh' ? '系統設定錯誤，請聯繫管理員' : 'System configuration error');
      setLoading(false);
      return;
    }

    try {
      console.log('[CouponClaim] Initializing LIFF...');
      await window.liff.init({ liffId });
      console.log('[CouponClaim] LIFF initialized, isLoggedIn:', window.liff.isLoggedIn());

      if (!window.liff.isLoggedIn()) {
        console.log('[CouponClaim] Not logged in, redirecting to login...');
        window.liff.login({ redirectUri: window.location.href });
        return;
      }

      console.log('[CouponClaim] Logged in, attempting auto claim...');
      await attemptAutoClaim();
    } catch (err) {
      console.error('LIFF init error:', err);
      setError(t('language') === 'zh' ? '無法連接 LINE，請稍後再試' : 'Cannot connect to LINE');
      setLoading(false);
    }
  };

  const attemptAutoClaim = async () => {
    try {
      console.log('[CouponClaim] Getting LIFF profile...');
      const profile = await window.liff.getProfile();
      const lineUserId = profile.userId;
      console.log('[CouponClaim] LINE User ID:', lineUserId);

      // Find member by LINE user ID
      console.log('[CouponClaim] Fetching member data...');
      const memberResponse = await axios.get(`/api/members?lineUserId=${lineUserId}`);
      console.log('[CouponClaim] Member response:', memberResponse.data);

      if (!memberResponse.data.member) {
        console.log('[CouponClaim] Member not found');
        setError(t('language') === 'zh' ? '找不到您的會員資料，請先完成註冊' : 'Member not found, please complete registration first');
        setStatus('not_registered');
        setLoading(false);
        return;
      }

      const memberId = memberResponse.data.member.memberId;
      console.log('[CouponClaim] Member ID:', memberId);

      // Attempt to claim
      console.log('[CouponClaim] Attempting to claim coupon...');
      const claimResponse = await axios.post('/api/coupon-claim', {
        token,
        memberId
      });
      console.log('[CouponClaim] Claim response:', claimResponse.data);

      if (claimResponse.data.success) {
        console.log('[CouponClaim] Claim successful');
        setStatus('claimed');
      }
    } catch (err) {
      console.error('[CouponClaim] Error:', err);
      console.error('[CouponClaim] Error response:', err.response?.data);
      setError(err.response?.data?.message || t('failed_to_claim'));
      if (err.response?.data?.hasCompletedClasses) {
        setStatus('completed_classes');
      } else if (err.response?.data?.status) {
        setStatus(err.response.data.status);
      } else {
        setStatus('error');
      }
    } finally {
      setLoading(false);
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
            onClick={() => window.liff.closeWindow()}
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
            {t('language') === 'zh' ? '關閉' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'not_registered') {
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
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
          <h2 style={{ color: '#667eea', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '請先完成註冊' : 'Please Complete Registration'}
          </h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            {error}
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
            {t('language') === 'zh' ? '前往註冊' : 'Go to Registration'}
          </button>
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

export default CouponClaim;
