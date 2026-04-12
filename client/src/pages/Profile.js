import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

const formatDateKey = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateLabel = (value, locale = 'zh-TW', options = {}) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, options);
};

const getStartTime = (timeStr) => {
  if (!timeStr) return '00:00';
  const parts = timeStr.split('-');
  return parts[0] ? parts[0].trim() : '00:00';
};

const isCouponExpired = (coupon) => {
  if (!coupon?.expiryDate) return false;
  return new Date(coupon.expiryDate).getTime() < Date.now();
};

const isCouponUsable = (coupon) => (
  coupon &&
  !isCouponExpired(coupon) &&
  Number(coupon.usedCount || 0) < Number(coupon.quantity || 0)
);

const getLocale = (language) => (language === 'zh' ? 'zh-TW' : 'en-US');

function PortalModal({ open, title, subtitle, onClose, children, wide = false }) {
  if (!open) return null;

  return (
    <div className="portal-modal-backdrop" onClick={onClose}>
      <div
        className={`portal-modal ${wide ? 'portal-modal-wide' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="portal-modal-header">
          <div>
            <p className="portal-kicker">{subtitle}</p>
            <h3>{title}</h3>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="portal-modal-body">{children}</div>
      </div>
    </div>
  );
}

function Profile() {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const { memberId: urlMemberId } = useParams();
  const [searchParams] = useSearchParams();
  const isZh = language === 'zh';
  const locale = getLocale(language);

  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [couponsForSale, setCouponsForSale] = useState([]);
  const [associationMeetings, setAssociationMeetings] = useState([]);
  const [memberStats, setMemberStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [liffInitializing, setLiffInitializing] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'classes' || tabFromUrl === 'courses') return 'classes';
    if (tabFromUrl === 'activities') return 'activities';
    if (tabFromUrl === 'coupons') return 'coupons';
    if (tabFromUrl === 'association' || tabFromUrl === 'meetings') return 'association';
    return 'profile';
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [selectedClassInfo, setSelectedClassInfo] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState(['self']);
  const [familyMemberCoupons, setFamilyMemberCoupons] = useState({});
  const [useAvailablePoints, setUseAvailablePoints] = useState(false);
  const [completingEnrollment, setCompletingEnrollment] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentConfirmationData, setPaymentConfirmationData] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCoupon, setShareCoupon] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [sharingCouponId, setSharingCouponId] = useState(null);
  const [purchasingCoupon, setPurchasingCoupon] = useState(null);

  const [showMembershipUpgrade, setShowMembershipUpgrade] = useState(false);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  const [showMembershipConfirmation, setShowMembershipConfirmation] = useState(false);
  const [membershipConfirmationData, setMembershipConfirmationData] = useState(null);

  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceMeetingId, setAbsenceMeetingId] = useState(null);
  const [absenceFormImage, setAbsenceFormImage] = useState(null);
  const [uploadingAbsenceForm, setUploadingAbsenceForm] = useState(false);
  const [registeringMeeting, setRegisteringMeeting] = useState(null);

  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [liffReady, setLiffReady] = useState(false);
  const [lineUserId, setLineUserId] = useState(null);
  const [lineProfile, setLineProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    englishAlias: '',
    gender: '男',
    birthDate: '',
    familyMembers: [],
    contact: { mobile: '', lineId: '' },
    referralCode: ''
  });

  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    englishAlias: '',
    gender: '男',
    birthDate: '',
    familyMembers: [],
    contact: { mobile: '', lineId: '' }
  });

  const initRef = useRef(false);

  const classIdFromUrl = searchParams.get('classId');
  const activityIdFromUrl = searchParams.get('activityId');

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    if (
      imagePath.startsWith('data:') ||
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://') ||
      imagePath.startsWith('blob:')
    ) {
      return imagePath;
    }
    const apiUrl = process.env.REACT_APP_API_URL || '';
    return `${apiUrl}${imagePath}`;
  };

  const attendanceProgress = member?.attendanceProgress || {
    completedCount: 0,
    targetCount: 12,
    remainingCount: 12,
    windowDays: 90
  };

  const refreshMember = async (memberId = member?.memberId || urlMemberId) => {
    if (!memberId) return null;
    const response = await axios.get(`/api/members?memberId=${memberId}`);
    setMember(response.data.member);
    return response.data.member;
  };

  const fetchClassesAndActivities = async () => {
    setLoadingCatalog(true);
    try {
      const [classesRes, activitiesRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/activities')
      ]);

      const upcomingClasses = (classesRes.data.classes || [])
        .filter((entry) => entry.status === 'upcoming')
        .sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          return getStartTime(a.time).localeCompare(getStartTime(b.time));
        });

      const upcomingActivities = (activitiesRes.data.activities || [])
        .filter((entry) => entry.status === 'upcoming')
        .sort((a, b) => {
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;
          return getStartTime(a.time).localeCompare(getStartTime(b.time));
        });

      setClasses(upcomingClasses);
      setActivities(upcomingActivities);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('failed_to_load_please_try_again')
      });
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchCouponsForSale = async () => {
    try {
      const response = await axios.get('/api/coupons?resource=for-sale');
      const activeCoupons = (response.data.coupons || []).filter(
        (coupon) => coupon.active && (coupon.stock === -1 || coupon.stock > 0)
      );
      setCouponsForSale(activeCoupons);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('failed_to_load_please_try_again')
      });
    }
  };

  const fetchAssociationMeetings = async () => {
    setLoadingMeetings(true);
    try {
      const response = await axios.get('/api/association-meetings?status=upcoming');
      setAssociationMeetings(response.data.meetings || []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('failed_to_load_please_try_again')
      });
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchMemberStats = async (memberCode = member?.memberId) => {
    if (!memberCode) return;
    try {
      const response = await axios.get(`/api/association-meetings?action=member-stats&memberId=${memberCode}`);
      setMemberStats(response.data);
    } catch (error) {
      console.error('Failed to fetch member stats:', error);
    }
  };

  const fetchOrCreateMember = async (userId, profile) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/members/auth', {
        lineUserId: userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      });

      const { member: memberData, needsRegistration: needsReg, senderReferralCode } = response.data;

      if (!memberData || needsReg) {
        setNeedsRegistration(true);
        setRegistrationData((prev) => ({
          ...prev,
          name: profile.displayName || prev.name,
          referralCode: senderReferralCode || prev.referralCode
        }));
        setLoading(false);
        return;
      }

      setMember(memberData);
      setNeedsRegistration(false);
      navigate(`/profile/${memberData.memberId}${window.location.search}`, { replace: true });
      setLoading(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('failed_to_load_please_try_again')
      });
      setLoading(false);
    }
  };

  const initializeLIFF = async () => {
    if (!window.liff) {
      setTimeout(() => {
        if (window.liff) {
          initializeLIFF();
        } else {
          setMessage({
            type: 'error',
            text: t('line_sdk_failed_to_load_please_refresh_the_page')
          });
          setLiffInitializing(false);
          setLoading(false);
        }
      }, 1000);
      return;
    }

    const liffId = process.env.REACT_APP_LIFF_ID_PROFILE || process.env.REACT_APP_LIFF_ID;

    if (!liffId) {
      setMessage({
        type: 'error',
        text: 'Missing LIFF ID'
      });
      setLiffInitializing(false);
      setLoading(false);
      return;
    }

    try {
      await window.liff.init({ liffId });
      setLiffReady(true);

      if (window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile();
        const cache = {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('lineUserCache', JSON.stringify(cache));
        setLineUserId(profile.userId);
        setLineProfile(profile);
        setIsLoggedIn(true);
        setLiffInitializing(false);
        await fetchOrCreateMember(profile.userId, profile);
      } else {
        localStorage.removeItem('lineUserCache');
        setIsLoggedIn(false);
        setLineUserId(null);
        setLineProfile(null);
        setLiffInitializing(false);
        setLoading(false);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `${isZh ? 'LINE 登入失敗' : 'LINE login failed'}: ${error.message || 'Unknown error'}`
      });
      setLiffInitializing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    fetchClassesAndActivities();

    const initializeAuth = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const cachedLineUser = localStorage.getItem('lineUserCache');
      let hasCachedUser = false;

      if (cachedLineUser) {
        try {
          const userData = JSON.parse(cachedLineUser);
          hasCachedUser = Boolean(userData?.userId);

          if (hasCachedUser) {
            setLineUserId(userData.userId);
            setLineProfile({
              userId: userData.userId,
              displayName: userData.displayName,
              pictureUrl: userData.pictureUrl
            });
            setIsLoggedIn(true);
            setLiffInitializing(false);
            await fetchOrCreateMember(userData.userId, userData);
          }
        } catch (error) {
          localStorage.removeItem('lineUserCache');
          hasCachedUser = false;
        }
      }

      if (!hasCachedUser) {
        await initializeLIFF();
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (classIdFromUrl && classes.length > 0) {
      const match = classes.find((entry) => entry._id === classIdFromUrl);
      if (match) {
        setActiveTab('classes');
        setSelectedClass(match);
      }
    }
  }, [classIdFromUrl, classes]);

  useEffect(() => {
    if (activityIdFromUrl && activities.length > 0) {
      const match = activities.find((entry) => entry._id === activityIdFromUrl);
      if (match) {
        setActiveTab('activities');
        setSelectedActivity(match);
      }
    }
  }, [activityIdFromUrl, activities]);

  useEffect(() => {
    if (activeTab === 'coupons' && member) {
      fetchCouponsForSale();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, member]);

  useEffect(() => {
    if (activeTab === 'association' && member?.membershipStatus === '協會會員') {
      fetchAssociationMeetings();
      fetchMemberStats(member.memberId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, member]);

  useEffect(() => {
    if (activeTab !== 'classes' && activeTab !== 'activities') {
      setSelectedDate('all');
    }
  }, [activeTab]);

  const currentDateKeys = [
    ...new Set(
      (activeTab === 'activities' ? activities : classes)
        .filter((entry) => activeTab === 'activities' || selectedClassInfo === 'all' || entry.classInfoId?._id === selectedClassInfo)
        .map((entry) => formatDateKey(entry.date))
        .filter(Boolean)
    )
  ].sort();

  const filteredClasses = classes.filter((entry) => {
    if (selectedClassInfo !== 'all' && entry.classInfoId?._id !== selectedClassInfo) return false;
    if (selectedDate !== 'all' && formatDateKey(entry.date) !== selectedDate) return false;
    return true;
  });

  const filteredActivities = activities.filter((entry) => {
    if (selectedDate !== 'all' && formatDateKey(entry.date) !== selectedDate) return false;
    return true;
  });

  const familyOptions = [
    { key: 'self', label: member?.name || (isZh ? '本人' : 'Self') },
    ...((member?.familyMembers || []).map((person, index) => ({
      key: String(index),
      label: person.name
    })))
  ];

  const getCheckoutPricing = () => {
    if (!checkoutData || !member) {
      return {
        subtotal: 0,
        couponDiscount: 0,
        pointsDiscount: 0,
        finalCost: 0
      };
    }

    const subtotal = checkoutData.cost * selectedFamilyMembers.length;
    const couponDiscount = selectedFamilyMembers.reduce((sum, personKey) => {
      const couponId = familyMemberCoupons[personKey];
      const coupon = (member.coupons || []).find((entry) => String(entry._id) === String(couponId));
      if (!coupon) return sum;
      if (coupon.type === 'trial') return sum + checkoutData.cost;
      return sum + Math.round(checkoutData.cost * Number(coupon.discountPercent || 0) / 100);
    }, 0);

    const totalAfterCoupons = Math.max(0, subtotal - couponDiscount);
    const pointsDiscount = useAvailablePoints ? Math.min(Number(member.points || 0), totalAfterCoupons) : 0;

    return {
      subtotal,
      couponDiscount,
      pointsDiscount,
      finalCost: Math.max(0, totalAfterCoupons - pointsDiscount)
    };
  };

  const usableCoupons = (checkoutData && member?.coupons
    ? member.coupons.filter((coupon) => {
      if (!isCouponUsable(coupon)) return false;
      if (checkoutData.type === 'class' && coupon.type === 'trial') {
        return String(coupon.classInfoId) === String(checkoutData.classInfoId);
      }
      return true;
    })
    : []);

  const startEdit = () => {
    if (!member) return;
    setEditFormData({
      name: member.name || '',
      englishAlias: member.englishAlias || '',
      gender: member.gender || '男',
      birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
      familyMembers: member.familyMembers || [],
      contact: {
        mobile: member.contact?.mobile || '',
        lineId: member.contact?.lineId || ''
      }
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const response = await axios.put(`/api/members?memberId=${member.memberId}`, editFormData);
      setMember(response.data.member);
      setEditMode(false);
      setMessage({
        type: 'success',
        text: response.data.message || t('update_successful')
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('update_failed')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationFamilyMemberChange = (index, field, value) => {
    setRegistrationData((prev) => {
      const next = [...prev.familyMembers];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, familyMembers: next };
    });
  };

  const addRegistrationFamilyMember = () => {
    setRegistrationData((prev) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { name: '', englishAlias: '', gender: '男', birthDate: '' }]
    }));
  };

  const removeRegistrationFamilyMember = (index) => {
    setRegistrationData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    setSubmittingRegistration(true);
    setMessage({ type: '', text: '' });

    if (!registrationData.name || !registrationData.contact.mobile) {
      setMessage({ type: 'error', text: t('please_fill_in_all_required_fields') });
      setSubmittingRegistration(false);
      return;
    }

    try {
      const response = await axios.post('/api/members/register', {
        lineUserId,
        ...registrationData
      });
      setMember(response.data.member);
      setNeedsRegistration(false);
      setMessage({ type: 'success', text: t('registration_successful') });
      navigate(`/profile/${response.data.member.memberId}`, { replace: true });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('registration_failed_please_try_again')
      });
    } finally {
      setSubmittingRegistration(false);
    }
  };

  const handleLineLogout = () => {
    localStorage.removeItem('lineUserCache');
    if (window.liff && liffReady && window.liff.isLoggedIn()) {
      window.liff.logout();
    }
    setIsLoggedIn(false);
    setLineUserId(null);
    setLineProfile(null);
    setMember(null);
    setNeedsRegistration(false);
    navigate('/profile', { replace: true });
  };

  const handleEnroll = (type, item) => {
    if (!member) {
      setMessage({ type: 'error', text: t('please_login_first') });
      return;
    }

    setCheckoutData({
      type,
      id: item._id,
      name: item.name,
      cost: type === 'class' ? Number(item.classInfoId?.cost || 0) : Number(item.cost || 0),
      classInfoId: item.classInfoId?._id || null,
      item
    });
    setSelectedFamilyMembers(['self']);
    setFamilyMemberCoupons({});
    setUseAvailablePoints(false);
    setShowCheckout(true);
  };

  const handleCompleteEnrollment = async (paymentMethod = 'in-person') => {
    if (!checkoutData || !member) return;

    if (selectedFamilyMembers.length === 0) {
      setMessage({ type: 'error', text: t('please_select_at_least_one_person') });
      return;
    }

    setCompletingEnrollment(true);
    try {
      const endpoint = checkoutData.type === 'class'
        ? `/api/classes?id=${checkoutData.id}&action=enroll`
        : `/api/activities?id=${checkoutData.id}&action=enroll`;

      const response = await axios.post(endpoint, {
        memberId: member.memberId,
        paymentMethod,
        familyMembers: selectedFamilyMembers,
        familyMemberCoupons,
        pointsToUse: useAvailablePoints ? getCheckoutPricing().pointsDiscount : 0
      });

      const pricing = response.data.pricing || getCheckoutPricing();

      setPaymentConfirmationData({
        itemName: checkoutData.name,
        finalCost: pricing.finalCost,
        couponDiscount: pricing.couponDiscount,
        pointsDiscount: pricing.pointsDiscount,
        familyMembersCount: selectedFamilyMembers.length,
        paymentMethod
      });

      await refreshMember(member.memberId);

      setShowCheckout(false);
      setCheckoutData(null);
      setShowPaymentConfirmation(true);
      setMessage({ type: 'success', text: response.data.message || t('enrollment_successful') });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('enrollmentFailed')
      });
    } finally {
      setCompletingEnrollment(false);
    }
  };

  const handleGenerateShareLink = async (coupon) => {
    if (!member) return;
    setSharingCouponId(coupon._id);
    setShareCoupon(coupon);
    setShowShareModal(true);
    setShareLoading(true);
    setShareLink(null);

    try {
      const response = await axios.post('/api/members?action=generate-share-link', {
        memberId: member.memberId,
        couponId: coupon._id
      });
      setShareLink(response.data);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('failed_to_generate_share_link')
      });
      setShowShareModal(false);
    } finally {
      setShareLoading(false);
      setSharingCouponId(null);
    }
  };

  const handleCopyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: t('copied_to_clipboard') });
  };

  const handlePurchaseCoupon = async (couponForSale) => {
    if (!member) return;
    setPurchasingCoupon(couponForSale._id);

    try {
      const response = await axios.post('/api/members?action=purchase-coupon', {
        memberId: member.memberId,
        couponForSaleId: couponForSale._id
      });
      setMember(response.data.member);
      setMessage({ type: 'success', text: t('purchase_successful') });
      await fetchCouponsForSale();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('purchase_failed')
      });
    } finally {
      setPurchasingCoupon(null);
    }
  };

  const handleUpgradeMembership = async () => {
    if (!member) return;
    setProcessingUpgrade(true);
    try {
      const response = await axios.post('/api/members?action=upgrade-membership', {
        memberId: member.memberId,
        paymentMethod: 'in-person'
      });

      await refreshMember(member.memberId);

      setMembershipConfirmationData({
        amount: 3000,
        paymentMethod: 'in-person',
        requiresApproval: response.data.requiresApproval
      });
      setShowMembershipUpgrade(false);
      setShowMembershipConfirmation(true);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('upgrade_failed')
      });
    } finally {
      setProcessingUpgrade(false);
    }
  };

  const isEnrolled = (type, id) => {
    if (!member?.enrollments) return false;
    return member.enrollments.some((entry) => entry.type === type && String(entry.itemId) === String(id) && entry.status === 'active');
  };

  const activeEnrollments = member?.enrollments?.filter((entry) => entry.status === 'active') || [];

  const openItemFromEnrollment = (enrollment) => {
    if (enrollment.type === 'class') {
      const match = classes.find((entry) => String(entry._id) === String(enrollment.itemId));
      setActiveTab('classes');
      if (match) setSelectedClass(match);
    } else {
      const match = activities.find((entry) => String(entry._id) === String(enrollment.itemId));
      setActiveTab('activities');
      if (match) setSelectedActivity(match);
    }
  };

  const isMeetingRegistered = (meetingId) => {
    if (!member) return false;
    const meeting = associationMeetings.find((entry) => entry._id === meetingId);
    if (!meeting) return false;
    return (meeting.participants || []).some((participant) => participant.memberIdString === member.memberId);
  };

  const hasSubmittedAbsence = (meetingId) => {
    if (!member) return false;
    const meeting = associationMeetings.find((entry) => entry._id === meetingId);
    if (!meeting) return false;
    return (meeting.absences || []).some((absence) => absence.memberIdString === member.memberId);
  };

  const getAbsenceStatus = (meetingId) => {
    if (!member) return null;
    const meeting = associationMeetings.find((entry) => entry._id === meetingId);
    if (!meeting) return null;
    return (meeting.absences || []).find((absence) => absence.memberIdString === member.memberId) || null;
  };

  const handleRegisterMeeting = async (meetingId) => {
    if (!member) return;
    setRegisteringMeeting(meetingId);
    try {
      await axios.post('/api/association-meetings?action=register', {
        meetingId,
        memberId: member.memberId
      });
      setMessage({ type: 'success', text: t('registration_successful') });
      await fetchAssociationMeetings();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('registration_failed')
      });
    } finally {
      setRegisteringMeeting(null);
    }
  };

  const handleAbsenceFormUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('please_upload_an_image_file') });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('image_size_cannot_exceed_5mb') });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAbsenceFormImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitAbsenceForm = async () => {
    if (!absenceMeetingId || !absenceFormImage || !member) return;
    setUploadingAbsenceForm(true);

    try {
      const response = await axios.post(`/api/association-meetings?action=submit-absence&meetingId=${absenceMeetingId}`, {
        memberId: member.memberId,
        formImage: absenceFormImage
      });
      setMessage({
        type: 'success',
        text: response.data.message || t('absence_request_submitted_successfully')
      });
      setShowAbsenceModal(false);
      setAbsenceMeetingId(null);
      setAbsenceFormImage(null);
      await fetchAssociationMeetings();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('submission_failed')
      });
    } finally {
      setUploadingAbsenceForm(false);
    }
  };

  const uniqueClassInfos = [
    ...new Map(classes.filter((entry) => entry.classInfoId?._id).map((entry) => [entry.classInfoId._id, entry.classInfoId])).values()
  ];

  const heroTitleMap = {
    profile: isZh ? 'PROFILE.' : 'PROFILE.',
    classes: isZh ? 'CLASSES.' : 'CLASSES.',
    activities: isZh ? 'ACTIVITIES.' : 'ACTIVITIES.',
    coupons: isZh ? 'COUPONS.' : 'COUPONS.',
    association: isZh ? 'MEETINGS.' : 'MEETINGS.'
  };

  const tabItems = [
    { key: 'profile', label: t('myProfile') },
    { key: 'classes', label: t('classes') },
    { key: 'activities', label: t('activities') },
    { key: 'coupons', label: t('coupons') },
    ...(member?.membershipStatus === '協會會員' ? [{ key: 'association', label: t('association_meetings') }] : [])
  ];

  const renderLoginScreen = () => (
    <div className="portal-auth-screen">
      <div className="portal-topbar simple">
        <div className="portal-brand">Member Portal</div>
        <button type="button" className="portal-language-pill" onClick={toggleLanguage}>
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
      <div className="portal-auth-card">
        <div className="portal-auth-visual">
          <img src="https://i.imgur.com/AtnfAtf.png" alt="Sunrise Youth" />
        </div>
        <div className="portal-auth-copy">
          <p className="portal-kicker">{isZh ? '會員入口' : 'Member Portal'}</p>
          <h1>{isZh ? '歡迎回來' : 'WELCOME BACK'}</h1>
          <p>
            {isZh
              ? '連上你的 LINE 帳號，回到社群、課程、活動與會員福利。'
              : 'Reconnect through LINE and jump back into classes, activities, and member rewards.'}
          </p>
        </div>
        <button type="button" className="portal-line-button" onClick={() => window.liff?.login()}>
          <span>LINE</span>
          <strong>{isZh ? '使用 LINE 登入' : 'Login with LINE'}</strong>
        </button>
      </div>
    </div>
  );

  const renderRegistrationScreen = () => (
    <div className="portal-auth-screen">
      <div className="portal-topbar simple">
        <div className="portal-brand">Member Portal</div>
        <button type="button" className="portal-language-pill" onClick={toggleLanguage}>
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
      <div className="portal-registration-shell">
        <div className="portal-editorial-header">
          <p className="portal-kicker">{isZh ? '新會員註冊' : 'New Member Setup'}</p>
          <h1>{isZh ? '完成資料' : 'COMPLETE YOUR PROFILE'}</h1>
          <p>
            {isZh
              ? '我們會沿用既有後端流程，這裡只是在全新的介面中完成註冊。'
              : 'Same backend flow, rebuilt in the new interface. Finish a few basics to enter the portal.'}
          </p>
        </div>

        <form className="portal-form-card" onSubmit={handleRegistrationSubmit}>
          {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}

          <div className="portal-form-grid">
            <div className="form-group">
              <label>{t('name_')}</label>
              <input
                value={registrationData.name}
                onChange={(event) => setRegistrationData((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('english_name_optional')}</label>
              <input
                value={registrationData.englishAlias}
                onChange={(event) => setRegistrationData((prev) => ({ ...prev, englishAlias: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>{t('gender')}</label>
              <select
                value={registrationData.gender}
                onChange={(event) => setRegistrationData((prev) => ({ ...prev, gender: event.target.value }))}
              >
                <option value="男">{t('male')}</option>
                <option value="女">{t('female')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('birth_date_')}</label>
              <input
                type="date"
                value={registrationData.birthDate}
                onChange={(event) => setRegistrationData((prev) => ({ ...prev, birthDate: event.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('mobile_number')}</label>
              <input
                type="tel"
                value={registrationData.contact.mobile}
                onChange={(event) => setRegistrationData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, mobile: event.target.value }
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('line_id')}</label>
              <input
                value={registrationData.contact.lineId}
                onChange={(event) => setRegistrationData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, lineId: event.target.value }
                }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('referral_code_optional')}</label>
            <input
              value={registrationData.referralCode}
              onChange={(event) => setRegistrationData((prev) => ({ ...prev, referralCode: event.target.value }))}
            />
          </div>

          <div className="portal-subcard">
            <div className="portal-subcard-header">
              <div>
                <p className="portal-kicker">{t('family_members_optional')}</p>
                <h3>{isZh ? '家庭成員' : 'Family Members'}</h3>
              </div>
              <button type="button" className="btn btn-secondary" onClick={addRegistrationFamilyMember}>
                {isZh ? '新增成員' : 'Add Member'}
              </button>
            </div>

            <div className="portal-stack">
              {registrationData.familyMembers.length === 0 ? (
                <div className="portal-empty-state compact">
                  <p>{isZh ? '目前沒有新增家庭成員。' : 'No family members added yet.'}</p>
                </div>
              ) : null}

              {registrationData.familyMembers.map((person, index) => (
                <div className="portal-mini-card" key={`registration-family-${index}`}>
                  <div className="portal-form-grid">
                    <div className="form-group">
                      <label>{t('name_')}</label>
                      <input
                        value={person.name}
                        onChange={(event) => handleRegistrationFamilyMemberChange(index, 'name', event.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('english_name_optional')}</label>
                      <input
                        value={person.englishAlias}
                        onChange={(event) => handleRegistrationFamilyMemberChange(index, 'englishAlias', event.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('gender')}</label>
                      <select
                        value={person.gender}
                        onChange={(event) => handleRegistrationFamilyMemberChange(index, 'gender', event.target.value)}
                      >
                        <option value="男">{t('male')}</option>
                        <option value="女">{t('female')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('birth_date')}</label>
                      <input
                        type="date"
                        value={person.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : ''}
                        onChange={(event) => handleRegistrationFamilyMemberChange(index, 'birthDate', event.target.value)}
                      />
                    </div>
                  </div>
                  <button type="button" className="btn btn-danger" onClick={() => removeRegistrationFamilyMember(index)}>
                    {isZh ? '移除' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary portal-primary-submit" disabled={submittingRegistration}>
            {submittingRegistration ? t('submitting') : t('complete_registration')}
          </button>
        </form>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="portal-stack portal-stack-lg">
      <section className="portal-hero-card">
        <div className="portal-hero-bubble" />
        <div className="portal-hero-content">
          <div>
            <div className="portal-inline-meta">
              <span className="portal-pill subtle">{member.membershipStatus || t('association_friend')}</span>
              <button type="button" className="portal-outline-button" onClick={editMode ? () => setEditMode(false) : startEdit}>
                <span className="material-symbols-outlined">edit</span>
                {editMode ? t('cancel') : t('edit_profile')}
              </button>
            </div>
            <h2>{member.name}</h2>
            <p>
              {isZh
                ? `會員編號 ${member.memberId} · ${member.contact?.mobile || 'No phone'}`
                : `Member ${member.memberId} · ${member.contact?.mobile || 'No phone'}`}
            </p>
            {lineProfile?.pictureUrl ? (
              <div className="portal-avatar-row">
                <img src={lineProfile.pictureUrl} alt={lineProfile.displayName || member.name} className="portal-avatar" />
                <div>
                  <strong>{lineProfile.displayName || member.name}</strong>
                  <span>{isZh ? 'LINE 已連結' : 'LINE connected'}</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="portal-hero-actions">
            <div className="portal-points-block">
              <span>{isZh ? '可用點數' : 'Available Points'}</span>
              <strong>{member.points || 0}</strong>
            </div>
            {member.membershipStatus !== '協會會員' ? (
              <button type="button" className="btn btn-primary" onClick={() => setShowMembershipUpgrade(true)}>
                {isZh ? '升級為協會會員' : 'Upgrade Membership'}
              </button>
            ) : null}
            <button type="button" className="btn btn-secondary" onClick={handleLineLogout}>
              {t('logout')}
            </button>
          </div>
        </div>
      </section>

      {editMode ? (
        <section className="portal-panel">
          <div className="portal-section-header">
            <div>
              <p className="portal-kicker">{t('edit_profile')}</p>
              <h3>{isZh ? '更新會員資料' : 'Update Member Profile'}</h3>
            </div>
          </div>
          <div className="portal-form-grid">
            <div className="form-group">
              <label>{t('name_')}</label>
              <input value={editFormData.name} onChange={(event) => setEditFormData((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>{t('english_name_optional')}</label>
              <input value={editFormData.englishAlias} onChange={(event) => setEditFormData((prev) => ({ ...prev, englishAlias: event.target.value }))} />
            </div>
            <div className="form-group">
              <label>{t('gender')}</label>
              <select value={editFormData.gender} onChange={(event) => setEditFormData((prev) => ({ ...prev, gender: event.target.value }))}>
                <option value="男">{t('male')}</option>
                <option value="女">{t('female')}</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('birth_date')}</label>
              <input
                type="date"
                value={editFormData.birthDate}
                onChange={(event) => setEditFormData((prev) => ({ ...prev, birthDate: event.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>{t('mobile_number')}</label>
              <input
                value={editFormData.contact.mobile}
                onChange={(event) => setEditFormData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, mobile: event.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label>{t('line_id')}</label>
              <input
                value={editFormData.contact.lineId}
                onChange={(event) => setEditFormData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, lineId: event.target.value }
                }))}
              />
            </div>
          </div>

          <div className="portal-subcard">
            <div className="portal-subcard-header">
              <div>
                <p className="portal-kicker">{t('family_members_optional')}</p>
                <h3>{isZh ? '家庭成員' : 'Family Members'}</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditFormData((prev) => ({
                  ...prev,
                  familyMembers: [...prev.familyMembers, { name: '', englishAlias: '', gender: '男', birthDate: '' }]
                }))}
              >
                {isZh ? '新增成員' : 'Add Member'}
              </button>
            </div>

            <div className="portal-stack">
              {(editFormData.familyMembers || []).map((person, index) => (
                <div className="portal-mini-card" key={`edit-family-${index}`}>
                  <div className="portal-form-grid">
                    <div className="form-group">
                      <label>{t('name_')}</label>
                      <input
                        value={person.name}
                        onChange={(event) => {
                          const next = [...editFormData.familyMembers];
                          next[index] = { ...next[index], name: event.target.value };
                          setEditFormData((prev) => ({ ...prev, familyMembers: next }));
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('english_name_optional')}</label>
                      <input
                        value={person.englishAlias}
                        onChange={(event) => {
                          const next = [...editFormData.familyMembers];
                          next[index] = { ...next[index], englishAlias: event.target.value };
                          setEditFormData((prev) => ({ ...prev, familyMembers: next }));
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('gender')}</label>
                      <select
                        value={person.gender}
                        onChange={(event) => {
                          const next = [...editFormData.familyMembers];
                          next[index] = { ...next[index], gender: event.target.value };
                          setEditFormData((prev) => ({ ...prev, familyMembers: next }));
                        }}
                      >
                        <option value="男">{t('male')}</option>
                        <option value="女">{t('female')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{t('birth_date')}</label>
                      <input
                        type="date"
                        value={person.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : ''}
                        onChange={(event) => {
                          const next = [...editFormData.familyMembers];
                          next[index] = { ...next[index], birthDate: event.target.value };
                          setEditFormData((prev) => ({ ...prev, familyMembers: next }));
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setEditFormData((prev) => ({
                      ...prev,
                      familyMembers: prev.familyMembers.filter((_, itemIndex) => itemIndex !== index)
                    }))}
                  >
                    {isZh ? '移除' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="portal-inline-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>
              {t('cancel')}
            </button>
            <button type="button" className="btn btn-primary" onClick={saveEdit}>
              {isZh ? '儲存更新' : 'Save Changes'}
            </button>
          </div>
        </section>
      ) : null}

      <section className="portal-grid portal-grid-two">
        <div className="portal-panel">
          <div className="portal-section-header">
            <div>
              <p className="portal-kicker">{isZh ? '獎勵與推薦' : 'Rewards & Referrals'}</p>
              <h3>{isZh ? '會員成長面板' : 'Member Growth Panel'}</h3>
            </div>
          </div>
          <div className="portal-stat-grid">
            <div className="portal-stat-card">
              <span>{isZh ? '推薦碼' : 'Referral Code'}</span>
              <strong>{member.referralCode || 'N/A'}</strong>
            </div>
            <div className="portal-stat-card">
              <span>{isZh ? '推薦人數' : 'Referred Members'}</span>
              <strong>{member.referralCount || 0}</strong>
            </div>
            <div className="portal-stat-card">
              <span>{isZh ? '點數餘額' : 'Point Balance'}</span>
              <strong>{member.points || 0}</strong>
            </div>
          </div>

          <div className="portal-progress-card">
            <div className="portal-progress-header">
              <div>
                <h4>{t('attendance_progress')}</h4>
                <p>{attendanceProgress.completedCount}/{attendanceProgress.targetCount}</p>
              </div>
              <strong>
                {Math.round((attendanceProgress.completedCount / Math.max(attendanceProgress.targetCount, 1)) * 100)}%
              </strong>
            </div>
            <div className="portal-progress-track">
              <div
                className="portal-progress-fill"
                style={{
                  width: `${Math.min(100, (attendanceProgress.completedCount / Math.max(attendanceProgress.targetCount, 1)) * 100)}%`
                }}
              />
            </div>
            <p className="portal-progress-note">
              {attendanceProgress.remainingCount > 0
                ? `${t('classes_until_next_reward')}: ${attendanceProgress.remainingCount}`
                : t('attendance_reward_ready')}
            </p>
          </div>
        </div>

        <div className="portal-panel">
          <div className="portal-section-header">
            <div>
              <p className="portal-kicker">{isZh ? '聯絡與家庭' : 'Contact & Family'}</p>
              <h3>{isZh ? '會員資料快覽' : 'Member Snapshot'}</h3>
            </div>
          </div>
          <div className="portal-list">
            <div className="portal-list-item">
              <span>{t('member_id')}</span>
              <strong>{member.memberId}</strong>
            </div>
            <div className="portal-list-item">
              <span>{t('birth_date')}</span>
              <strong>{formatDateLabel(member.birthDate, locale)}</strong>
            </div>
            <div className="portal-list-item">
              <span>{t('mobile_number')}</span>
              <strong>{member.contact?.mobile || '-'}</strong>
            </div>
            <div className="portal-list-item">
              <span>{t('line_id')}</span>
              <strong>{member.contact?.lineId || '-'}</strong>
            </div>
          </div>

          <div className="portal-subcard">
            <div className="portal-subcard-header">
              <div>
                <p className="portal-kicker">{t('family_members_optional')}</p>
                <h3>{isZh ? '家庭成員名單' : 'Family Roster'}</h3>
              </div>
            </div>
            <div className="portal-stack">
              {(member.familyMembers || []).length === 0 ? (
                <div className="portal-empty-state compact">
                  <p>{isZh ? '目前沒有家庭成員資料。' : 'No family members yet.'}</p>
                </div>
              ) : (member.familyMembers || []).map((person, index) => (
                <div key={`family-${index}`} className="portal-mini-card">
                  <strong>{person.name}</strong>
                  <span>{person.englishAlias || (isZh ? '無英文名' : 'No English alias')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="portal-panel">
        <div className="portal-section-header">
          <div>
            <p className="portal-kicker">{isZh ? '當前報名' : 'Current Enrollments'}</p>
            <h3>{isZh ? '已報名課程與活動' : 'What You Are Already In'}</h3>
          </div>
        </div>
        <div className="portal-stack">
          {activeEnrollments.length === 0 ? (
            <div className="portal-empty-state">
              <p>{isZh ? '目前還沒有進行中的報名。' : 'No active enrollments yet.'}</p>
            </div>
          ) : activeEnrollments.map((entry) => (
            <button
              type="button"
              key={`${entry.type}-${entry.itemId}`}
              className="portal-enrollment-card"
              onClick={() => openItemFromEnrollment(entry)}
            >
              <div>
                <span className="portal-pill subtle">{entry.type === 'class' ? t('classes') : t('activities')}</span>
                <h4>{entry.itemName}</h4>
                <p>{formatDateLabel(entry.enrolledAt, locale)}</p>
              </div>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ))}
        </div>
      </section>

      <section className="portal-panel">
        <div className="portal-section-header">
          <div>
            <p className="portal-kicker">{t('volunteering_history')}</p>
            <h3>{isZh ? '志工完成紀錄' : 'Volunteering History'}</h3>
          </div>
        </div>
        <div className="portal-stack">
          {(member.volunteeringHistory || []).length === 0 ? (
            <div className="portal-empty-state">
              <p>{t('no_volunteering_history')}</p>
            </div>
          ) : member.volunteeringHistory.map((entry) => (
            <div className="portal-volunteer-row" key={`${entry.itemId}-${entry.completedAt || entry.date}`}>
              <div>
                <strong>{entry.itemName}</strong>
                <p>{formatDateLabel(entry.completedAt || entry.date, locale)}</p>
              </div>
              <span className="material-symbols-outlined">verified</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderCatalogToolbar = (type) => (
    <section className="portal-toolbar">
      {type === 'class' ? (
        <select value={selectedClassInfo} onChange={(event) => setSelectedClassInfo(event.target.value)}>
          <option value="all">{isZh ? '全部課程模板' : 'All class templates'}</option>
          {uniqueClassInfos.map((info) => (
            <option key={info._id} value={info._id}>{info.name}</option>
          ))}
        </select>
      ) : (
        <div className="portal-toolbar-spacer" />
      )}

      <div className="portal-date-pills">
        <button type="button" className={selectedDate === 'all' ? 'active' : ''} onClick={() => setSelectedDate('all')}>
          {t('all')}
        </button>
        {currentDateKeys.map((dateKey) => (
          <button
            type="button"
            key={dateKey}
            className={selectedDate === dateKey ? 'active' : ''}
            onClick={() => setSelectedDate(dateKey)}
          >
            {formatDateLabel(dateKey, locale, { month: 'short', day: 'numeric' })}
          </button>
        ))}
      </div>
    </section>
  );

  const renderItemGrid = (items, type) => (
    <div className="portal-grid portal-grid-cards">
      {items.map((item) => {
        const price = type === 'class' ? Number(item.classInfoId?.cost || 0) : Number(item.cost || 0);
        const participantLabel = `${item.currentParticipants || 0}/${type === 'class' ? item.classInfoId?.maxParticipants || 0 : item.maxParticipants || 0}`;

        return (
          <article key={item._id} className="portal-catalog-card">
            <div className="portal-catalog-image">
              {getImageSrc(type === 'class' ? item.classInfoId?.banner : item.banner) ? (
                <img
                  src={getImageSrc(type === 'class' ? item.classInfoId?.banner : item.banner)}
                  alt={item.name}
                />
              ) : (
                <div className="portal-image-fallback">{item.name?.slice(0, 1) || '?'}</div>
              )}
            </div>
            <div className="portal-catalog-body">
              <div className="portal-catalog-topline">
                <span className="portal-pill subtle">
                  {formatDateLabel(item.date, locale, { month: 'short', day: 'numeric' })}
                </span>
                <strong>{price === 0 ? t('free') : `NT$ ${price}`}</strong>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="portal-catalog-meta">
                <span>{item.time}</span>
                <span>{participantLabel}</span>
              </div>
              <div className="portal-inline-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => type === 'class' ? setSelectedClass(item) : setSelectedActivity(item)}
                >
                  {isZh ? '查看詳情' : 'View Details'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isEnrolled(type, item._id)}
                  onClick={() => handleEnroll(type, item)}
                >
                  {isEnrolled(type, item._id) ? t('enrolled') : t('create')}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderClassesTab = () => (
    <div className="portal-stack portal-stack-lg">
      {renderCatalogToolbar('class')}
      {loadingCatalog ? (
        <div className="portal-loading-card">
          <div className="portal-spinner" />
          <p>{t('loading')}</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="portal-empty-state">
          <p>{t('no_enrolled_classes')}</p>
        </div>
      ) : renderItemGrid(filteredClasses, 'class')}
    </div>
  );

  const renderActivitiesTab = () => (
    <div className="portal-stack portal-stack-lg">
      {renderCatalogToolbar('activity')}
      {loadingCatalog ? (
        <div className="portal-loading-card">
          <div className="portal-spinner" />
          <p>{t('loading')}</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="portal-empty-state">
          <p>{t('no_enrolled_activities')}</p>
        </div>
      ) : renderItemGrid(filteredActivities, 'activity')}
    </div>
  );

  const renderCouponsTab = () => {
    const ownedCoupons = (member?.coupons || []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return (
      <div className="portal-stack portal-stack-lg">
        <section className="portal-panel">
          <div className="portal-section-header">
            <div>
              <p className="portal-kicker">{t('my_owned_coupons')}</p>
              <h3>{isZh ? '我的優惠券庫' : 'My Coupon Vault'}</h3>
            </div>
          </div>

          <div className="portal-grid portal-grid-cards">
            {ownedCoupons.length === 0 ? (
              <div className="portal-empty-state">
                <p>{t('no_coupons_yet')}</p>
              </div>
            ) : ownedCoupons.map((coupon) => (
              <article key={coupon._id} className="portal-coupon-card">
                <div className="portal-coupon-image">
                  {getImageSrc(coupon.image) ? (
                    <img src={getImageSrc(coupon.image)} alt={coupon.name} />
                  ) : (
                    <div className="portal-image-fallback">{coupon.name?.slice(0, 1) || '?'}</div>
                  )}
                </div>
                <div className="portal-coupon-body">
                  <div className="portal-catalog-topline">
                    <span className="portal-pill subtle">{coupon.type === 'trial' ? 'Trial' : `${coupon.discountPercent || 0}% OFF`}</span>
                    <strong>{Math.max(0, Number(coupon.quantity || 0) - Number(coupon.usedCount || 0))}</strong>
                  </div>
                  <h3>{coupon.name}</h3>
                  <p>{coupon.description}</p>
                  <div className="portal-inline-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedCoupon(coupon)}>
                      {isZh ? '查看詳情' : 'Details'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!isCouponUsable(coupon) || sharingCouponId === coupon._id}
                      onClick={() => handleGenerateShareLink(coupon)}
                    >
                      {sharingCouponId === coupon._id ? t('generating_share_link') : (isZh ? '分享' : 'Share')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="portal-panel">
          <div className="portal-section-header">
            <div>
              <p className="portal-kicker">{t('coupon_store')}</p>
              <h3>{isZh ? '優惠券商店' : 'Coupon Store'}</h3>
            </div>
          </div>

          <div className="portal-grid portal-grid-cards">
            {couponsForSale.length === 0 ? (
              <div className="portal-empty-state">
                <p>{t('no_coupons_for_sale_yet')}</p>
              </div>
            ) : couponsForSale.map((coupon) => {
              const profile = coupon.couponProfileId;
              const imageSrc = getImageSrc(profile?.image || profile?.classInfoId?.banner);

              return (
                <article key={coupon._id} className="portal-coupon-card">
                  <div className="portal-coupon-image">
                    {imageSrc ? <img src={imageSrc} alt={profile?.name} /> : <div className="portal-image-fallback">{profile?.name?.slice(0, 1) || '?'}</div>}
                  </div>
                  <div className="portal-coupon-body">
                    <div className="portal-catalog-topline">
                      <span className="portal-pill subtle">{profile?.type === 'trial' ? 'Trial' : `${profile?.discountPercent || 0}% OFF`}</span>
                      <strong>{coupon.price} PTS</strong>
                    </div>
                    <h3>{profile?.name}</h3>
                    <p>{profile?.description}</p>
                    <div className="portal-inline-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setSelectedCoupon({ ...profile, saleMeta: coupon })}>
                        {isZh ? '查看詳情' : 'Details'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={purchasingCoupon === coupon._id}
                        onClick={() => handlePurchaseCoupon(coupon)}
                      >
                        {purchasingCoupon === coupon._id ? t('loading') : (isZh ? '立即購買' : 'Purchase')}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderAssociationTab = () => (
    <div className="portal-stack portal-stack-lg">
      {memberStats ? (
        <section className="portal-grid portal-grid-three">
          <div className="portal-stat-card bold">
            <span>{isZh ? '入會日期' : 'Member Since'}</span>
            <strong>{formatDateLabel(memberStats.memberSince, locale)}</strong>
          </div>
          <div className="portal-stat-card bold">
            <span>{isZh ? `${memberStats.currentYear} 出席次數` : `${memberStats.currentYear} Attended`}</span>
            <strong>{memberStats.meetingsAttendedThisYear}</strong>
          </div>
          <div className="portal-stat-card bold">
            <span>{isZh ? '待處理會議' : 'Upcoming Meetings'}</span>
            <strong>{associationMeetings.length}</strong>
          </div>
        </section>
      ) : null}

      <section className="portal-stack">
        {loadingMeetings ? (
          <div className="portal-loading-card">
            <div className="portal-spinner" />
            <p>{t('loading')}</p>
          </div>
        ) : associationMeetings.length === 0 ? (
          <div className="portal-empty-state">
            <p>{isZh ? '目前沒有即將到來的會議。' : 'No upcoming meetings right now.'}</p>
          </div>
        ) : associationMeetings.map((meeting) => {
          const absenceStatus = getAbsenceStatus(meeting._id);
          const registered = isMeetingRegistered(meeting._id);
          const submittedAbsence = hasSubmittedAbsence(meeting._id);

          return (
            <article key={meeting._id} className="portal-meeting-card">
              <div className="portal-meeting-date">
                <span>{formatDateLabel(meeting.date, locale, { month: 'short' })}</span>
                <strong>{formatDateLabel(meeting.date, locale, { day: '2-digit' })}</strong>
              </div>
              <div className="portal-meeting-body">
                <div className="portal-inline-meta">
                  {meeting.mandatory ? <span className="portal-pill danger">{isZh ? '強制出席' : 'Mandatory'}</span> : null}
                  <span className="portal-pill subtle">{meeting.meetingType === 'zoom' ? 'Zoom' : t('in_person')}</span>
                </div>
                <h3>{meeting.agenda}</h3>
                <p>{meeting.time} · {meeting.location || meeting.zoomUrl || '-'}</p>
                <div className="portal-inline-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={registered || registeringMeeting === meeting._id}
                    onClick={() => handleRegisterMeeting(meeting._id)}
                  >
                    {registered ? t('registered') : (registeringMeeting === meeting._id ? t('loading') : (isZh ? '報名參加' : 'Register'))}
                  </button>
                  {meeting.mandatory ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={submittedAbsence}
                      onClick={() => {
                        setAbsenceMeetingId(meeting._id);
                        setShowAbsenceModal(true);
                      }}
                    >
                      {submittedAbsence
                        ? (absenceStatus?.approved ? t('absence_approved') : t('absence_pending'))
                        : t('cannot_attend')}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );

  if (loading || liffInitializing) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-loading-card splash">
          <div className="portal-spinner" />
          <h2>{t('loading')}</h2>
          <p>{t('initializing')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return renderLoginScreen();
  }

  if (needsRegistration) {
    return renderRegistrationScreen();
  }

  if (!member) {
    return (
      <div className="portal-loading-screen">
        <div className="portal-loading-card splash">
          <p>{t('failed_to_load_please_try_again')}</p>
        </div>
      </div>
    );
  }

  const heroSubtitle = {
    profile: isZh ? 'Member Dashboard' : 'Member Dashboard',
    classes: isZh ? 'Class Explorer' : 'Class Explorer',
    activities: isZh ? 'Activity Explorer' : 'Activity Explorer',
    coupons: isZh ? 'Coupon Store' : 'Coupon Store',
    association: isZh ? 'Association Sync' : 'Association Sync'
  };

  return (
    <div className="portal-page">
      {drawerOpen ? <div className="portal-drawer-overlay" onClick={() => setDrawerOpen(false)} /> : null}

      <aside className={`portal-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="portal-drawer-header">
          <div className="portal-language-switch">
            <button type="button" className={language === 'en' ? 'active' : ''} onClick={toggleLanguage}>EN</button>
            <button type="button" className={language === 'zh' ? 'active' : ''} onClick={toggleLanguage}>中文</button>
          </div>
          <button type="button" className="icon-button solid" onClick={() => setDrawerOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="portal-drawer-nav">
          {tabItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={activeTab === item.key ? 'active' : ''}
              onClick={() => {
                setActiveTab(item.key);
                setDrawerOpen(false);
              }}
            >
              <span>{item.label}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ))}
        </nav>
        <button type="button" className="portal-drawer-footer" onClick={handleLineLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span>{t('logout')}</span>
        </button>
      </aside>

      <header className="portal-topbar">
        <button type="button" className="icon-button" onClick={() => setDrawerOpen(true)}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="portal-brand">Member Portal</div>
        <button type="button" className="portal-language-pill" onClick={toggleLanguage}>
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </header>

      <main className="portal-main">
        <section className="portal-editorial-header">
          <p className="portal-kicker">{heroSubtitle[activeTab]}</p>
          <h1>{heroTitleMap[activeTab]}</h1>
          <p>
            {activeTab === 'profile' && (isZh ? '用全新的視覺節奏管理會員資料、福利與參與紀錄。' : 'Manage your member identity, rewards, and activity from the redesigned dashboard.')}
            {activeTab === 'classes' && (isZh ? '探索即將到來的課程，直接在這裡查看詳情與報名。' : 'Explore upcoming classes and enroll without leaving the new experience.')}
            {activeTab === 'activities' && (isZh ? '活動探索頁維持原本後端，但整體互動節奏已全面更新。' : 'The activity flow keeps the same backend logic with a completely new front-end rhythm.')}
            {activeTab === 'coupons' && (isZh ? '集中查看已擁有的優惠券，以及可用點數購買的新福利。' : 'Browse your owned coupons and spend points on new perks in one place.')}
            {activeTab === 'association' && (isZh ? '追蹤協會會議出席、註冊與請假提交。' : 'Track association meetings, confirm attendance, and submit absence forms here.')}
          </p>
        </section>

        <nav className="portal-tab-strip">
          {tabItems.map((item) => (
            <button
              type="button"
              key={item.key}
              className={activeTab === item.key ? 'active' : ''}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}

        {activeTab === 'profile' ? renderProfileTab() : null}
        {activeTab === 'classes' ? renderClassesTab() : null}
        {activeTab === 'activities' ? renderActivitiesTab() : null}
        {activeTab === 'coupons' ? renderCouponsTab() : null}
        {activeTab === 'association' ? renderAssociationTab() : null}
      </main>

      <PortalModal
        open={Boolean(selectedClass)}
        title={selectedClass?.name || ''}
        subtitle={t('class_details')}
        onClose={() => setSelectedClass(null)}
        wide
      >
        {selectedClass ? (
          <div className="portal-detail-layout">
            <div className="portal-detail-hero">
              {getImageSrc(selectedClass.classInfoId?.banner) ? (
                <img src={getImageSrc(selectedClass.classInfoId?.banner)} alt={selectedClass.name} />
              ) : (
                <div className="portal-image-fallback tall">{selectedClass.name?.slice(0, 1) || '?'}</div>
              )}
            </div>
            <div className="portal-detail-copy">
              <div className="portal-detail-stats">
                <div>
                  <span>{t('date')}</span>
                  <strong>{formatDateLabel(selectedClass.date, locale)}</strong>
                </div>
                <div>
                  <span>{t('time')}</span>
                  <strong>{selectedClass.time}</strong>
                </div>
                <div>
                  <span>{t('cost')}</span>
                  <strong>{Number(selectedClass.classInfoId?.cost || 0) === 0 ? t('free') : `NT$ ${selectedClass.classInfoId?.cost}`}</strong>
                </div>
                <div>
                  <span>{t('location')}</span>
                  <strong>{selectedClass.location || '-'}</strong>
                </div>
              </div>
              <p>{selectedClass.description}</p>
              <div className="portal-inline-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedClass(null)}>
                  {t('close')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isEnrolled('class', selectedClass._id)}
                  onClick={() => {
                    setSelectedClass(null);
                    handleEnroll('class', selectedClass);
                  }}
                >
                  {isEnrolled('class', selectedClass._id) ? t('enrolled') : (isZh ? '立即報名' : 'Enroll Now')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PortalModal>

      <PortalModal
        open={Boolean(selectedActivity)}
        title={selectedActivity?.name || ''}
        subtitle={t('activity_details')}
        onClose={() => setSelectedActivity(null)}
        wide
      >
        {selectedActivity ? (
          <div className="portal-detail-layout">
            <div className="portal-detail-hero">
              {getImageSrc(selectedActivity.banner) ? (
                <img src={getImageSrc(selectedActivity.banner)} alt={selectedActivity.name} />
              ) : (
                <div className="portal-image-fallback tall">{selectedActivity.name?.slice(0, 1) || '?'}</div>
              )}
            </div>
            <div className="portal-detail-copy">
              <div className="portal-detail-stats">
                <div>
                  <span>{t('date')}</span>
                  <strong>{formatDateLabel(selectedActivity.date, locale)}</strong>
                </div>
                <div>
                  <span>{t('time')}</span>
                  <strong>{selectedActivity.time}</strong>
                </div>
                <div>
                  <span>{t('cost')}</span>
                  <strong>{Number(selectedActivity.cost || 0) === 0 ? t('free') : `NT$ ${selectedActivity.cost}`}</strong>
                </div>
                <div>
                  <span>{t('location')}</span>
                  <strong>{selectedActivity.location || '-'}</strong>
                </div>
              </div>
              <p>{selectedActivity.description}</p>
              <div className="portal-inline-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedActivity(null)}>
                  {t('close')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isEnrolled('activity', selectedActivity._id)}
                  onClick={() => {
                    setSelectedActivity(null);
                    handleEnroll('activity', selectedActivity);
                  }}
                >
                  {isEnrolled('activity', selectedActivity._id) ? t('enrolled') : (isZh ? '立即報名' : 'Enroll Now')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PortalModal>

      <PortalModal
        open={Boolean(selectedCoupon)}
        title={selectedCoupon?.name || ''}
        subtitle={t('coupon_details')}
        onClose={() => setSelectedCoupon(null)}
      >
        {selectedCoupon ? (
          <div className="portal-stack">
            {getImageSrc(selectedCoupon.image || selectedCoupon.classInfoId?.banner) ? (
              <img
                className="portal-coupon-detail-image"
                src={getImageSrc(selectedCoupon.image || selectedCoupon.classInfoId?.banner)}
                alt={selectedCoupon.name}
              />
            ) : null}
            <div className="portal-detail-stats">
              <div>
                <span>{t('coupon_type')}</span>
                <strong>{selectedCoupon.type === 'trial' ? 'Trial' : `${selectedCoupon.discountPercent || 0}% OFF`}</strong>
              </div>
              <div>
                <span>{isZh ? '庫存/剩餘' : 'Stock / Remaining'}</span>
                <strong>
                  {selectedCoupon.saleMeta
                    ? (selectedCoupon.saleMeta.stock === -1 ? 'Unlimited' : selectedCoupon.saleMeta.stock)
                    : Math.max(0, Number(selectedCoupon.quantity || 0) - Number(selectedCoupon.usedCount || 0))}
                </strong>
              </div>
            </div>
            <p>{selectedCoupon.description}</p>
            {selectedCoupon.saleMeta ? (
              <button type="button" className="btn btn-primary" onClick={() => handlePurchaseCoupon(selectedCoupon.saleMeta)}>
                {isZh ? `用 ${selectedCoupon.saleMeta.price} 點購買` : `Purchase for ${selectedCoupon.saleMeta.price} pts`}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isCouponUsable(selectedCoupon)}
                onClick={() => handleGenerateShareLink(selectedCoupon)}
              >
                {isZh ? '產生分享連結' : 'Generate Share Link'}
              </button>
            )}
          </div>
        ) : null}
      </PortalModal>

      <PortalModal
        open={showCheckout && Boolean(checkoutData)}
        title={checkoutData?.name || ''}
        subtitle={isZh ? '結帳與報名' : 'Checkout & Enrollment'}
        onClose={() => setShowCheckout(false)}
      >
        {checkoutData ? (
          <div className="portal-stack">
            <div className="portal-subcard">
              <div className="portal-subcard-header">
                <div>
                  <p className="portal-kicker">{isZh ? '選擇報名對象' : 'Who is attending'}</p>
                  <h3>{isZh ? '參與人員' : 'Participants'}</h3>
                </div>
              </div>
              <div className="portal-checkbox-grid">
                {familyOptions.map((option) => (
                  <label key={option.key} className={`portal-check-card ${selectedFamilyMembers.includes(option.key) ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedFamilyMembers.includes(option.key)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedFamilyMembers((prev) => [...prev, option.key]);
                        } else {
                          setSelectedFamilyMembers((prev) => prev.filter((entry) => entry !== option.key));
                          setFamilyMemberCoupons((prev) => {
                            const next = { ...prev };
                            delete next[option.key];
                            return next;
                          });
                        }
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="portal-subcard">
              <div className="portal-subcard-header">
                <div>
                  <p className="portal-kicker">{isZh ? '優惠券與點數' : 'Discounts & Points'}</p>
                  <h3>{isZh ? '折抵設定' : 'Apply Discounts'}</h3>
                </div>
              </div>

              <div className="portal-stack">
                {selectedFamilyMembers.map((personKey) => (
                  <div key={`coupon-${personKey}`} className="form-group">
                    <label>{familyOptions.find((option) => option.key === personKey)?.label}</label>
                    <select
                      value={familyMemberCoupons[personKey] || ''}
                      onChange={(event) => setFamilyMemberCoupons((prev) => ({
                        ...prev,
                        [personKey]: event.target.value
                      }))}
                    >
                      <option value="">{isZh ? '不使用優惠券' : 'No coupon'}</option>
                      {usableCoupons.map((coupon) => (
                        <option key={coupon._id} value={coupon._id}>
                          {coupon.name} {coupon.type === 'trial' ? '(Trial)' : `(${coupon.discountPercent || 0}% off)`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <label className={`portal-check-card ${useAvailablePoints ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={useAvailablePoints}
                    onChange={(event) => setUseAvailablePoints(event.target.checked)}
                  />
                  <span>{isZh ? `使用可用點數 (${member.points || 0})` : `Use available points (${member.points || 0})`}</span>
                </label>
              </div>
            </div>

            <div className="portal-pricing-box">
              <div className="portal-list-item">
                <span>{isZh ? '小計' : 'Subtotal'}</span>
                <strong>NT$ {getCheckoutPricing().subtotal}</strong>
              </div>
              <div className="portal-list-item">
                <span>{t('coupon_discount')}</span>
                <strong>- NT$ {getCheckoutPricing().couponDiscount}</strong>
              </div>
              <div className="portal-list-item">
                <span>{isZh ? '點數折抵' : 'Points Discount'}</span>
                <strong>- NT$ {getCheckoutPricing().pointsDiscount}</strong>
              </div>
              <div className="portal-list-item total">
                <span>{isZh ? '應付總額' : 'Final Cost'}</span>
                <strong>NT$ {getCheckoutPricing().finalCost}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={completingEnrollment}
              onClick={() => handleCompleteEnrollment('in-person')}
            >
              {completingEnrollment ? t('loading') : (isZh ? '確認報名' : 'Confirm Enrollment')}
            </button>
          </div>
        ) : null}
      </PortalModal>

      <PortalModal
        open={showShareModal}
        title={shareCoupon?.name || ''}
        subtitle={isZh ? '分享優惠券' : 'Share Coupon'}
        onClose={() => setShowShareModal(false)}
      >
        <div className="portal-stack">
          {shareLoading ? (
            <div className="portal-loading-card compact">
              <div className="portal-spinner" />
              <p>{t('generating_share_link')}</p>
            </div>
          ) : null}
          {shareLink ? (
            <>
              <div className="portal-link-box">
                <strong>{shareLink.shareUrl}</strong>
              </div>
              <div className="portal-inline-actions">
                <button type="button" className="btn btn-secondary" onClick={() => handleCopyToClipboard(shareLink.shareUrl)}>
                  {t('copy')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCopyToClipboard(shareLink.shareMessage || shareLink.shareUrl)}
                >
                  {isZh ? '複製分享訊息' : 'Copy Share Text'}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </PortalModal>

      <PortalModal
        open={showPaymentConfirmation}
        title={isZh ? '報名成功' : 'Enrollment Complete'}
        subtitle={isZh ? '付款提醒' : 'Payment Reminder'}
        onClose={() => setShowPaymentConfirmation(false)}
      >
        {paymentConfirmationData ? (
          <div className="portal-stack">
            <div className="portal-pricing-box">
              <div className="portal-list-item">
                <span>{isZh ? '項目' : 'Item'}</span>
                <strong>{paymentConfirmationData.itemName}</strong>
              </div>
              <div className="portal-list-item">
                <span>{isZh ? '參與人數' : 'Participants'}</span>
                <strong>{paymentConfirmationData.familyMembersCount}</strong>
              </div>
              <div className="portal-list-item total">
                <span>{isZh ? '最終金額' : 'Final Cost'}</span>
                <strong>NT$ {paymentConfirmationData.finalCost}</strong>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setShowPaymentConfirmation(false)}>
              {t('done')}
            </button>
          </div>
        ) : null}
      </PortalModal>

      <PortalModal
        open={showMembershipUpgrade}
        title={isZh ? '升級為協會會員' : 'Upgrade Membership'}
        subtitle={isZh ? '年費方案' : 'Annual Plan'}
        onClose={() => setShowMembershipUpgrade(false)}
      >
        <div className="portal-stack">
          <div className="portal-pricing-box">
            <div className="portal-list-item">
              <span>{t('annual_fee')}</span>
              <strong>NT$ 3,000</strong>
            </div>
            <div className="portal-list-item total">
              <span>{t('choose_payment_method')}</span>
              <strong>{isZh ? '現場付款' : 'Pay in Person'}</strong>
            </div>
          </div>
          <button type="button" className="btn btn-primary" disabled={processingUpgrade} onClick={handleUpgradeMembership}>
            {processingUpgrade ? t('loading') : (isZh ? '送出升級申請' : 'Submit Upgrade Request')}
          </button>
        </div>
      </PortalModal>

      <PortalModal
        open={showMembershipConfirmation}
        title={isZh ? '升級申請已送出' : 'Upgrade Request Sent'}
        subtitle={isZh ? '請於現場繳費' : 'Next Step'}
        onClose={() => setShowMembershipConfirmation(false)}
      >
        {membershipConfirmationData ? (
          <div className="portal-stack">
            <div className="portal-pricing-box">
              <div className="portal-list-item total">
                <span>{t('amount_to_pay')}</span>
                <strong>NT$ {membershipConfirmationData.amount}</strong>
              </div>
            </div>
            <p>{t('please_pay_nt_3000_instructions')}</p>
            <button type="button" className="btn btn-primary" onClick={() => setShowMembershipConfirmation(false)}>
              {t('done')}
            </button>
          </div>
        ) : null}
      </PortalModal>

      <PortalModal
        open={showAbsenceModal}
        title={isZh ? '提交請假表' : 'Submit Absence Form'}
        subtitle={isZh ? '會議請假' : 'Meeting Absence'}
        onClose={() => setShowAbsenceModal(false)}
      >
        <div className="portal-stack">
          <div className="form-group">
            <label>{t('form')}</label>
            <input type="file" accept="image/*" onChange={handleAbsenceFormUpload} />
          </div>
          {absenceFormImage ? <img className="portal-absence-preview" src={absenceFormImage} alt="Absence form" /> : null}
          <button type="button" className="btn btn-primary" disabled={uploadingAbsenceForm} onClick={handleSubmitAbsenceForm}>
            {uploadingAbsenceForm ? t('loading') : (isZh ? '送出請假表' : 'Submit Form')}
          </button>
        </div>
      </PortalModal>
    </div>
  );
}

export default Profile;
