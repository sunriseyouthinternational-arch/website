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
  // Tracking LIFF initialization - currently not used in UI but kept for future debugging
  // const [liffInitialized, setLiffInitialized] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Debug: log the token
  useEffect(() => {
    console.log('=== CouponClaim Debug ===');
    console.log('Token from URL:', token);
    console.log('Token type:', typeof token);
    console.log('Token length:', token ? token.length : 0);
    console.log('Full URL:', window.location.href);
    console.log('Path:', window.location.pathname);
    console.log('LIFF available:', typeof window.liff !== 'undefined');
    console.log('LIFF ID configured:', !!process.env.REACT_APP_LIFF_ID);
    console.log('========================');
  }, [token]);

  // Fetch coupon details
  const fetchCouponDetails = async () => {
    try {
      // Get token from URL or localStorage
      let claimToken = token;
      if (!claimToken) {
        claimToken = localStorage.getItem('couponClaimToken');
      }

      if (!claimToken) {
        setError(t('invalid_coupon_link'));
        setStatus('error');
        setLoading(false);
        return;
      }

      const response = await axios.get(`/api/coupon-claim?token=${claimToken}`);
      setCouponData(response.data);
      setStatus(response.data.status);
    } catch (err) {
      setError(err.response?.data?.message || (t('failed_to_load')));
      setStatus(err.response?.data?.status || 'error');
    } finally {
      setLoading(false);
    }
  };

  // Attempt automatic coupon claiming with LIFF
  const attemptAutoClaim = async (lineUserId, couponToken) => {
    const tokenToUse = couponToken || token;

    if (!tokenToUse || !lineUserId) {
      console.error('Missing token or lineUserId for auto-claim');
      return;
    }

    console.log('Attempting auto-claim with token:', tokenToUse);
    console.log('Attempting auto-claim with lineUserId:', lineUserId);
    setClaiming(true);
    try {
      const response = await axios.post('/api/coupon-claim', {
        token: tokenToUse,
        lineUserId
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Auto-claim response:', response.data);

      if (response.data.success) {
        // For registered members with 0 completed classes, need to call the claim-pending-coupon action
        try {
          console.log('Calling claim-pending-coupon action to finalize coupon claim');
          const sessionToken = localStorage.getItem('sessionToken');
          const memberId = response.data.member?.memberId;

          if (memberId) {
            const claimResponse = await axios.post(`/api/members?memberId=${memberId}&action=claim-pending-coupon`, {
              pendingToken: response.data.couponToken || token
            }, {
              headers: {
                'Content-Type': 'application/json',
                ...(sessionToken && { 'Authorization': `Bearer ${sessionToken}` })
              }
            });

            console.log('Pending coupon claimed successfully');
            setStatus('claimed');
            setCouponData({
              coupon: claimResponse.data.coupon,
              senderName: response.data.senderName
            });
            setLoading(false);
          } else {
            // Fallback if no member ID in response
            setStatus('claimed');
            setCouponData({
              coupon: response.data.coupon,
              senderName: response.data.senderName
            });
            setLoading(false);
          }
        } catch (claimError) {
          console.error('Error finalizing coupon claim:', claimError);
          setStatus('claimed');
          setCouponData({
            coupon: response.data.coupon,
            senderName: response.data.senderName
          });
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Auto-claim error:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);

      // Check if member has completed classes
      if (err.response?.data?.hasCompletedClasses) {
        setError(err.response.data.message);
        setStatus('completed_classes');
        setLoading(false);
      }
      // Check if already registered
      else if (err.response?.data?.alreadyRegistered) {
        setError(err.response.data.message);
        setStatus('already_registered');
        setLoading(false);
      }
      // Check if user needs to complete registration
      else if (err.response?.data?.needsRegistration) {
        setError(err.response.data.message);
        setStatus('needs_registration');
        setLoading(false);
      } else {
        // For other errors, show manual flow
        fetchCouponDetails();
      }
    } finally {
      setClaiming(false);
    }
  };

  // Initialize LIFF on component mount
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        const liffId = process.env.REACT_APP_LIFF_ID;

        // If LIFF ID not configured, fall back to manual flow
        if (!liffId || !window.liff) {
          console.log('LIFF not configured, using manual claim flow');
          fetchCouponDetails();
          return;
        }

        await window.liff.init({ liffId });
        // setLiffInitialized(true);

        // Check if we have a token from URL or from localStorage
        let claimToken = token;

        // If no token in URL, check localStorage (in case we're coming back from LIFF login)
        if (!claimToken) {
          const savedToken = localStorage.getItem('couponClaimToken');
          if (savedToken) {
            console.log('Retrieved token from localStorage:', savedToken);
            claimToken = savedToken;
            // Clear it after retrieval
            localStorage.removeItem('couponClaimToken');
          }
        }

        if (!claimToken) {
          console.error('No token available for claiming');
          setError(t('invalid_coupon_link'));
          setStatus('error');
          setLoading(false);
          return;
        }

        console.log('Token for claiming:', claimToken);

        // Set up listener for login status changes (handles redirect-back from liff.login)
        window.liff.onLoginStatusUpdate((isLoggedIn) => {
          console.log('LIFF login status updated:', isLoggedIn);
          if (isLoggedIn) {
            console.log('User now logged in, attempting auto-claim');
            window.liff.getProfile().then(profile => {
              attemptAutoClaim(profile.userId, claimToken);
            }).catch(err => {
              console.error('Error getting profile after login:', err);
              setLoading(false);
            });
          }
        });

        // Check if user is logged in to LINE
        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile();
          console.log('User logged in via LIFF, attempting auto-claim');
          // Automatically try to claim coupon
          await attemptAutoClaim(profile.userId, claimToken);
        } else {
          // Save token to localStorage before redirecting to LINE login
          console.log('Saving token to localStorage before LIFF login:', claimToken);
          localStorage.setItem('couponClaimToken', claimToken);
          // If not logged in, redirect to LINE login
          console.log('User not logged in, redirecting to LINE login');
          window.liff.login();
        }
      } catch (err) {
        console.error('LIFF initialization error:', err);
        // Fall back to manual claim flow
        fetchCouponDetails();
      }
    };

    // Run LIFF initialization regardless of token (to handle redirect-back scenario)
    initializeLiff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getLineAddFriendUrl = () => {
    const lineChannelId = process.env.REACT_APP_LINE_CHANNEL_ID || '@907xmpck';
    // Ensure @ symbol is present for LINE Official Account URL
    const channelIdWithAt = lineChannelId.startsWith('@') ? lineChannelId : `@${lineChannelId}`;
    return `https://line.me/ti/p/${channelIdWithAt}`;
  };

  if (loading || claiming) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h3 style={{ color: '#667eea' }}>
            {claiming
              ? (t('auto_claiming'))
              : (t('loading'))
            }
          </h3>
          {claiming && (
            <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>
              {t('automatically_claiming_your_coupon_please_wait')}
            </p>
          )}
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
            {t('coupon_claimed_successfully')}
          </h2>

          {couponData && couponData.coupon && (
            <div style={{
              background: '#d3f9d8',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#2b8a3e', marginBottom: '10px', fontSize: '20px' }}>
                {couponData.coupon.name}
              </h3>
              <p style={{ color: '#2b8a3e', fontSize: '14px', margin: 0 }}>
                {t('language') === 'zh'
                  ? `來自：${couponData.senderName || '好友'}`
                  : `From: ${couponData.senderName || 'Friend'}`}
              </p>
            </div>
          )}

          <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
            {t('the_coupon_has_been_automatically_added_to_your_ac')}
          </p>

          <a
            href="/profile"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: '#667eea',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              marginTop: '10px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#5568d3';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {t('view_my_coupons')}
          </a>
        </div>
      </div>
    );
  }

  if (status === 'completed_classes') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
          <h2 style={{ color: '#d32f2f', marginBottom: '15px' }}>
            {t('coupon_not_eligible')}
          </h2>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
            {error || (t('coupons_for_members_with_no_completed_classes'))}
          </p>
          <a
            href="/profile"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: '#667eea',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#5568d3';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {t('go_to_my_profile')}
          </a>
        </div>
      </div>
    );
  }

  if (status === 'already_registered') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>ℹ️</div>
          <h2 style={{ color: '#1971c2', marginBottom: '15px' }}>
            {t('coupons_for_new_members_only')}
          </h2>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
            {error || (t('coupons_can_only_be_shared_to_new_members_you_are_'))}
          </p>
          <a
            href="/profile"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: '#667eea',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#5568d3';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {t('go_to_my_profile')}
          </a>
        </div>
      </div>
    );
  }

  if (status === 'needs_registration') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
          <h2 style={{ color: '#f59f00', marginBottom: '15px' }}>
            {t('registration_required')}
          </h2>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '25px' }}>
            {error || (t('please_complete_registration_before_claiming_the_c'))}
          </p>
          <div style={{
            background: '#e7f5ff',
            border: '2px solid #74c0fc',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <p style={{ color: '#1971c2', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>
              {t('after_registration_the_coupon_will_be_automaticall')}
            </p>
          </div>
          <a
            href={getLineAddFriendUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              background: '#06C755',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '15px',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#05b34b';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#06C755';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {t('add_line_and_register')}
          </a>
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
            {t('coupon_expired')}
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            {error || (t('this_coupon_or_share_link_has_expired'))}
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
          <h2>🎁 {t('you_received_a_coupon')}</h2>
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
              {t('from')}<strong>{senderName}</strong>
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
                  ? (t('trial_coupon'))
                  : (t('discount_coupon'))}
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
                  {coupon.discountPercent}% {t('off')}
                </p>
              </div>
            )}

            {coupon.expiryDate && (
              <p style={{ fontSize: '14px', color: '#856404', margin: 0 }}>
                ⏰ {t('valid_until')}
                {new Date(coupon.expiryDate).toLocaleDateString(t('en_us'))}
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
              {t('how_to_claim')}
            </h3>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#004085', lineHeight: '1.8' }}>
              <li>
                {t('click_add_line_account_button_below_to_add_our_official_account')}
              </li>
              <li>
                {t('follow_the_instructions_in_line_messages_to_comple')}
              </li>
              <li>
                {t('after_registration_send_this_page_url_to_our_line_official_account')}
              </li>
              <li>
                {t('we_will_claim_the_coupon_for_you')}
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
              💡 {t('tip_bookmark_this_page_to_easily_send_the_link_lat')}
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
            {t('add_line_official_account')}
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
