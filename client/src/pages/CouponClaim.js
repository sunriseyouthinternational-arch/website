import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

function CouponClaim() {
  const { t, language } = useLanguage();
  const { token } = useParams();
  const navigate = useNavigate();
  const isZh = language === 'zh';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    initializeLiff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const initializeLiff = async () => {
    const liffId = process.env.REACT_APP_LIFF_ID_COUPON_CLAIM;

    if (!liffId) {
      setError(isZh ? '系統設定錯誤，請聯繫管理員' : 'System configuration error');
      setLoading(false);
      return;
    }

    try {
      await window.liff.init({ liffId });

      if (!window.liff.isLoggedIn()) {
        window.liff.login({ redirectUri: window.location.href });
        return;
      }

      await attemptAutoClaim();
    } catch (err) {
      setError(isZh ? '無法連接 LINE，請稍後再試' : 'Cannot connect to LINE');
      setLoading(false);
    }
  };

  const attemptAutoClaim = async () => {
    try {
      const profile = await window.liff.getProfile();
      const lineUserId = profile.userId;
      const memberResponse = await axios.get(`/api/members?lineUserId=${lineUserId}`);

      if (!memberResponse.data.member) {
        setError(isZh ? '找不到您的會員資料，請先完成註冊' : 'Member not found, please complete registration first');
        setStatus('not_registered');
        setLoading(false);
        return;
      }

      const memberId = memberResponse.data.member.memberId;
      const claimResponse = await axios.post('/api/coupon-claim', {
        token,
        memberId
      });

      if (claimResponse.data.success) {
        setStatus('claimed');
      }
    } catch (err) {
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

  const titleMap = {
    claimed: isZh ? '領取成功' : 'Coupon Claimed',
    not_registered: isZh ? '請先完成註冊' : 'Complete Registration First',
    completed_classes: isZh ? '無法領取此優惠券' : 'This Coupon Is Not Eligible',
    error: isZh ? '領取失敗' : 'Claim Failed',
    loading: t('loading')
  };

  const descriptionMap = {
    claimed: isZh ? '優惠券已加入你的帳戶，現在可以回到會員頁面查看。' : 'The coupon is now in your account and ready in the member portal.',
    not_registered: error,
    completed_classes: error,
    error
  };

  const iconMap = {
    claimed: 'check_circle',
    not_registered: 'person_add',
    completed_classes: 'warning',
    error: 'error'
  };

  const renderClaimCard = (currentStatus) => (
    <div className="portal-auth-screen">
      <div className="portal-topbar simple">
        <div className="portal-brand">Member Portal</div>
      </div>
      <div className="portal-auth-card">
        <div className="portal-auth-copy">
          <p className="portal-kicker">{isZh ? '優惠券領取' : 'Coupon Claim'}</p>
          <h1>{titleMap[currentStatus]}</h1>
          <p>{descriptionMap[currentStatus]}</p>
        </div>

        <div className="portal-panel" style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, marginBottom: 16 }}>
            {iconMap[currentStatus]}
          </span>
        </div>

        {currentStatus === 'claimed' ? (
          <button type="button" className="btn btn-primary" onClick={() => window.liff.closeWindow()}>
            {isZh ? '關閉' : 'Close'}
          </button>
        ) : null}

        {currentStatus === 'not_registered' ? (
          <button type="button" className="btn btn-primary" onClick={() => navigate('/profile')}>
            {isZh ? '前往註冊' : 'Go to Registration'}
          </button>
        ) : null}

        {currentStatus === 'error' || currentStatus === 'completed_classes' ? (
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/profile')}>
            {isZh ? '返回會員頁面' : 'Back to Member Portal'}
          </button>
        ) : null}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-loading-card splash">
          <div className="portal-spinner" />
          <h2>{t('loading')}</h2>
          <p>{t('automatically_claiming_your_coupon_please_wait')}</p>
        </div>
      </div>
    );
  }

  return renderClaimCard(status || 'error');
}

export default CouponClaim;
