import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

const getLocale = (language) => (language === 'zh' ? 'zh-TW' : 'en-US');

const formatDateKey = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateLabel = (value, locale, options = {}) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, options);
};

const getStartTime = (timeStr) => {
  if (!timeStr) return '00:00';
  return timeStr.split('-')[0]?.trim() || '00:00';
};

const lineOfficialUrl = 'https://line.me/R/ti/p/@907xmpck';
const lineOfficialDeepLink = 'line://ti/p/@907xmpck';

const getGoogleMapsSearchUrl = (location) => {
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
};

const getGoogleMapsEmbedUrl = (location) => {
  if (!location) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(location)}&z=15&output=embed`;
};

const Modal = ({ open, children, onClose, wide = false }) => {
  if (!open) return null;

  return (
    <div className="stitch-modal-backdrop" onClick={onClose}>
      <div
        className={`stitch-modal ${wide ? 'stitch-modal-wide' : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

function Profile() {
  const { t, language, toggleLanguage } = useLanguage();
  const locale = getLocale(language);
  const isZh = language === 'zh';
  const { memberId: urlMemberId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('tab');
  const classIdFromUrl = searchParams.get('classId');
  const activityIdFromUrl = searchParams.get('activityId');
  const activityNameFromUrl = searchParams.get('activityName');

  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [couponsForSale, setCouponsForSale] = useState([]);
  const [associationMeetings, setAssociationMeetings] = useState([]);
  const [memberStats, setMemberStats] = useState(null);

  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'courses' || tabFromUrl === 'classes' ? 'classes'
      : tabFromUrl === 'activities' ? 'activities'
        : tabFromUrl === 'coupons' ? 'coupons'
          : tabFromUrl === 'association' || tabFromUrl === 'meetings' ? 'association'
            : 'profile'
  );

  const [selectedClassInfo, setSelectedClassInfo] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [liffInitializing, setLiffInitializing] = useState(true);
  const [loadingClassesAndActivities, setLoadingClassesAndActivities] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState(['self']);
  const [familyMemberCoupons, setFamilyMemberCoupons] = useState({});
  const [useAvailablePoints, setUseAvailablePoints] = useState(false);
  const [completingEnrollment, setCompletingEnrollment] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentConfirmationData, setPaymentConfirmationData] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [sharingCouponId, setSharingCouponId] = useState(null);
  const [purchasingCoupon, setPurchasingCoupon] = useState(null);

  const [showMembershipUpgrade, setShowMembershipUpgrade] = useState(false);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  const [showMembershipConfirmation, setShowMembershipConfirmation] = useState(false);
  const [showVolunteerHistoryModal, setShowVolunteerHistoryModal] = useState(false);

  const [registeringMeeting, setRegisteringMeeting] = useState(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceMeetingId, setAbsenceMeetingId] = useState(null);
  const [absenceFormImage, setAbsenceFormImage] = useState(null);
  const [uploadingAbsenceForm, setUploadingAbsenceForm] = useState(false);

  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [liffReady, setLiffReady] = useState(false);
  const [lineUserId, setLineUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    englishAlias: '',
    gender: '男',
    birthDate: '',
    familyMembers: [],
    contact: { mobile: '', lineId: '' },
    referralCode: ''
  });
  const [submittingRegistration, setSubmittingRegistration] = useState(false);

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
  const messageTimeoutRef = useRef(null);
  const liffId = process.env.REACT_APP_LIFF_ID_PROFILE || process.env.REACT_APP_LIFF_ID;

  useEffect(() => {
    if (!message.text) return undefined;

    if (messageTimeoutRef.current) {
      window.clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = window.setTimeout(() => {
      setMessage({ type: '', text: '' });
      messageTimeoutRef.current = null;
    }, 4000);

    return () => {
      if (messageTimeoutRef.current) {
        window.clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, [message]);

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    if (
      imagePath.startsWith('data:') ||
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://') ||
      imagePath.startsWith('blob:')
    ) return imagePath;
    const apiUrl = process.env.REACT_APP_API_URL || '';
    return `${apiUrl}${imagePath}`;
  };

  const attendanceProgress = member?.attendanceProgress || {
    completedCount: 0,
    targetCount: 12,
    remainingCount: 12,
    windowDays: 90
  };

  const fetchClassesAndActivities = async () => {
    setLoadingClassesAndActivities(true);
    try {
      const [classesRes, activitiesRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/activities')
      ]);
      const activeClasses = (classesRes.data.classes || [])
        .filter((entry) => entry.status === 'upcoming')
        .sort((a, b) => {
          const dateDiff = new Date(a.date) - new Date(b.date);
          if (dateDiff !== 0) return dateDiff;
          return getStartTime(a.time).localeCompare(getStartTime(b.time));
        });
      const activeActivities = (activitiesRes.data.activities || [])
        .filter((entry) => entry.status === 'upcoming')
        .sort((a, b) => {
          const dateDiff = new Date(a.date) - new Date(b.date);
          if (dateDiff !== 0) return dateDiff;
          return getStartTime(a.time).localeCompare(getStartTime(b.time));
        });
      setClasses(activeClasses);
      setActivities(activeActivities);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('failed_to_load_please_try_again') });
    } finally {
      setLoadingClassesAndActivities(false);
    }
  };

  const fetchCouponsForSale = async () => {
    try {
      const response = await axios.get('/api/coupons?resource=for-sale');
      setCouponsForSale((response.data.coupons || []).filter((coupon) => coupon.active && (coupon.stock === -1 || coupon.stock > 0)));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('failed_to_load_please_try_again') });
    }
  };

  const fetchAssociationMeetings = async () => {
    setLoadingMeetings(true);
    try {
      const response = await axios.get('/api/association-meetings?status=upcoming');
      setAssociationMeetings(response.data.meetings || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('failed_to_load_please_try_again') });
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchMemberStats = async (memberCode) => {
    if (!memberCode) return;
    try {
      const response = await axios.get(`/api/association-meetings?action=member-stats&memberId=${memberCode}`);
      setMemberStats(response.data);
    } catch (error) {
      console.error('member stats error', error);
    }
  };

  const fetchOrCreateMember = async (userId, profile) => {
    setLoading(true);
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

      setNeedsRegistration(false);
      setMember(memberData);
      navigate(`/profile/${memberData.memberId}${window.location.search}`, { replace: true });
      setLoading(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('failed_to_load_please_try_again') });
      setLoading(false);
    }
  };

  const initializeLIFF = async () => {
    if (!window.liff) {
      setTimeout(() => {
        if (window.liff) initializeLIFF();
        else {
          setMessage({ type: 'error', text: t('line_sdk_failed_to_load_please_refresh_the_page') });
          setLoading(false);
          setLiffInitializing(false);
        }
      }, 1000);
      return;
    }

    if (!liffId) {
      setMessage({ type: 'error', text: 'Missing LIFF ID' });
      setLoading(false);
      setLiffInitializing(false);
      return;
    }

    try {
      await window.liff.init({ liffId });
      setLiffReady(true);

      if (window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile();
        localStorage.setItem('lineUserCache', JSON.stringify({
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl
        }));
        setLineUserId(profile.userId);
        setIsLoggedIn(true);
        setLiffInitializing(false);
        await fetchOrCreateMember(profile.userId, profile);
      } else {
        localStorage.removeItem('lineUserCache');
        setLoading(false);
        setLiffInitializing(false);
        setIsLoggedIn(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'LIFF error' });
      setLoading(false);
      setLiffInitializing(false);
    }
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchClassesAndActivities();

    const initializeAuth = async () => {
      setLoading(true);
      const cached = localStorage.getItem('lineUserCache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed?.userId) {
            setLineUserId(parsed.userId);
            setIsLoggedIn(true);
            setLiffInitializing(false);
            await fetchOrCreateMember(parsed.userId, parsed);
            return;
          }
        } catch (error) {
          localStorage.removeItem('lineUserCache');
        }
      }
      await initializeLIFF();
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (classIdFromUrl && classes.length > 0) {
      const found = classes.find((entry) => entry._id === classIdFromUrl);
      if (found) {
        setSelectedClass(found);
        setActiveTab('classes');
      }
    }
  }, [classIdFromUrl, classes]);

  useEffect(() => {
    if ((activityIdFromUrl || activityNameFromUrl) && activities.length > 0) {
      const normalizedActivityName = activityNameFromUrl?.trim().toLowerCase();
      const found = activities.find((entry) => (
        (activityIdFromUrl && entry._id === activityIdFromUrl)
        || (normalizedActivityName && entry.name?.trim().toLowerCase() === normalizedActivityName)
      ));
      if (found) {
        setSelectedActivity(found);
        setActiveTab('activities');
      }
    }
  }, [activityIdFromUrl, activityNameFromUrl, activities]);

  const refreshMember = async (memberCode = member?.memberId || urlMemberId) => {
    if (!memberCode) return null;
    const response = await axios.get(`/api/members?memberId=${memberCode}`);
    setMember(response.data.member);
    return response.data.member;
  };

  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    setSubmittingRegistration(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await axios.post('/api/members/register', { lineUserId, ...registrationData });
      setMember(response.data.member);
      setNeedsRegistration(false);
      navigate(`/profile/${response.data.member.memberId}`, { replace: true });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('registration_failed_please_try_again') });
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
    setMember(null);
    setNeedsRegistration(false);
    navigate('/profile', { replace: true });
  };

  const openExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openLineOfficial = () => {
    window.location.href = lineOfficialDeepLink;
    window.setTimeout(() => {
      window.location.href = lineOfficialUrl;
    }, 800);
  };

  const showComingSoonMessage = (label) => {
    setDrawerOpen(false);
    setMessage({ type: 'success', text: `${label} is under construction.` });
  };

  const openAdminPortal = () => {
    setDrawerOpen(false);
    navigate('/admin');
  };

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
      setMessage({ type: 'success', text: response.data.message || t('update_successful') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('update_failed') });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = (type, item) => {
    if (!member) return;
    setCheckoutData({
      type,
      id: item._id,
      name: item.name,
      cost: type === 'class' ? Number(item.classInfoId?.cost || 0) : Number(item.cost || 0),
      classInfoId: type === 'class' ? item.classInfoId?._id : null
    });
    setSelectedFamilyMembers(['self']);
    setFamilyMemberCoupons({});
    setUseAvailablePoints(false);
    setShowCheckout(true);
  };

  const isCouponUsable = (coupon) => {
    const expired = coupon?.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now();
    return coupon && !expired && Number(coupon.usedCount || 0) < Number(coupon.quantity || 0);
  };

  const usableCoupons = useMemo(() => {
    if (!member?.coupons || !checkoutData) return [];
    return member.coupons.filter((coupon) => {
      if (!isCouponUsable(coupon)) return false;
      if (checkoutData.type === 'class' && coupon.type === 'trial') {
        return String(coupon.classInfoId) === String(checkoutData.classInfoId);
      }
      return true;
    });
  }, [member, checkoutData]);

  const familyOptions = [
    { key: 'self', label: `${member?.name || (isZh ? '本人' : 'Self')}${isZh ? '（本人）' : ' (self)'}` },
    ...((member?.familyMembers || []).map((person, index) => ({ key: String(index), label: person.name })))
  ];

  const getCheckoutPricing = () => {
    if (!checkoutData || !member) return { subtotal: 0, couponDiscount: 0, pointsDiscount: 0, finalCost: 0 };

    const subtotal = checkoutData.cost * selectedFamilyMembers.length;
    const couponDiscount = selectedFamilyMembers.reduce((sum, key) => {
      const couponId = familyMemberCoupons[key];
      const coupon = member.coupons.find((entry) => String(entry._id) === String(couponId));
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

  const handleCompleteEnrollment = async () => {
    if (!checkoutData || !member || selectedFamilyMembers.length === 0) return;
    setCompletingEnrollment(true);
    try {
      const endpoint = checkoutData.type === 'class'
        ? `/api/classes?id=${checkoutData.id}&action=enroll`
        : `/api/activities?id=${checkoutData.id}&action=enroll`;
      const response = await axios.post(endpoint, {
        memberId: member.memberId,
        paymentMethod: 'in-person',
        familyMembers: selectedFamilyMembers,
        familyMemberCoupons,
        pointsToUse: useAvailablePoints ? getCheckoutPricing().pointsDiscount : 0
      });

      setPaymentConfirmationData(response.data.pricing || getCheckoutPricing());
      await refreshMember(member.memberId);
      setShowCheckout(false);
      setShowPaymentConfirmation(true);
      setMessage({ type: 'success', text: response.data.message || t('enrollment_successful') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('enrollmentFailed') });
    } finally {
      setCompletingEnrollment(false);
    }
  };

  const handleGenerateShareLink = async (coupon) => {
    if (!member) return;
    setShowShareModal(true);
    setShareLoading(true);
    setShareLink(null);
    setSharingCouponId(coupon._id);
    try {
      const response = await axios.post('/api/members?action=generate-share-link', {
        memberId: member.memberId,
        couponId: coupon._id
      });
      setShareLink(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('failed_to_generate_share_link') });
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
      await fetchCouponsForSale();
      setMessage({ type: 'success', text: t('purchase_successful') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('purchase_failed') });
    } finally {
      setPurchasingCoupon(null);
    }
  };

  const handleUpgradeMembership = async () => {
    if (!member) return;
    setProcessingUpgrade(true);
    try {
      await axios.post('/api/members?action=upgrade-membership', {
        memberId: member.memberId,
        paymentMethod: 'in-person'
      });
      await refreshMember(member.memberId);
      setShowMembershipUpgrade(false);
      setShowMembershipConfirmation(true);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('upgrade_failed') });
    } finally {
      setProcessingUpgrade(false);
    }
  };

  const isEnrolled = (type, id) => (
    Boolean(member?.enrollments?.some((entry) => entry.type === type && String(entry.itemId) === String(id) && entry.status === 'active'))
  );

  const handleRegisterMeeting = async (meetingId) => {
    if (!member) return;
    setRegisteringMeeting(meetingId);
    try {
      await axios.post('/api/association-meetings?action=register', {
        meetingId,
        memberId: member.memberId
      });
      await fetchAssociationMeetings();
      setMessage({ type: 'success', text: t('registration_successful') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('registration_failed') });
    } finally {
      setRegisteringMeeting(null);
    }
  };

  const isMeetingRegistered = (meetingId) => {
    const meeting = associationMeetings.find((entry) => entry._id === meetingId);
    return Boolean(meeting?.participants?.some((participant) => participant.memberIdString === member?.memberId));
  };

  const getAbsenceStatus = (meetingId) => {
    const meeting = associationMeetings.find((entry) => entry._id === meetingId);
    return meeting?.absences?.find((absence) => absence.memberIdString === member?.memberId) || null;
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
      await axios.post(`/api/association-meetings?action=submit-absence&meetingId=${absenceMeetingId}`, {
        memberId: member.memberId,
        formImage: absenceFormImage
      });
      setShowAbsenceModal(false);
      setAbsenceMeetingId(null);
      setAbsenceFormImage(null);
      await fetchAssociationMeetings();
      setMessage({ type: 'success', text: t('absence_request_submitted_successfully') });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('submission_failed') });
    } finally {
      setUploadingAbsenceForm(false);
    }
  };

  const uniqueClassInfos = [...new Map(classes.filter((entry) => entry.classInfoId?._id).map((entry) => [entry.classInfoId._id, entry.classInfoId])).values()];

  const filteredClassesBase = classes.filter((entry) => selectedClassInfo === 'all' || entry.classInfoId?._id === selectedClassInfo);
  const classDateKeys = [...new Set(filteredClassesBase.map((entry) => formatDateKey(entry.date)).filter(Boolean))].sort();
  const activityDateKeys = [...new Set(activities.map((entry) => formatDateKey(entry.date)).filter(Boolean))].sort();
  const activeDateKeys = activeTab === 'activities' ? activityDateKeys : classDateKeys;

  const filteredClasses = filteredClassesBase.filter((entry) => selectedDate === 'all' || formatDateKey(entry.date) === selectedDate);
  const filteredActivities = activities.filter((entry) => selectedDate === 'all' || formatDateKey(entry.date) === selectedDate);

  const tabs = [
    { key: 'profile', label: 'Profile', icon: 'person' },
    { key: 'classes', label: 'Classes', icon: 'school' },
    { key: 'activities', label: 'Activities', icon: 'event' },
    { key: 'coupons', label: 'Coupons', icon: 'confirmation_number' },
    ...(member?.membershipStatus === '協會會員' ? [{ key: 'association', label: 'Meetings', icon: 'groups' }] : [])
  ];

  const activeEnrollments = member?.enrollments?.filter((entry) => entry.status === 'active') || [];
  const currentEnrollments = activeEnrollments.slice().sort((a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0));
  const volunteeringHistory = (member?.volunteeringHistory || [])
    .slice()
    .sort((a, b) => new Date(b.completedAt || b.date || 0) - new Date(a.completedAt || a.date || 0));
  const volunteeringHistoryPreview = volunteeringHistory.slice(0, 3);
  const ownedCoupons = (member?.coupons || []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const topTitle = {
    profile: 'PROFILE.',
    classes: 'CLASSES.',
    activities: 'ACTIVITIES.',
    coupons: 'COUPON STORE.',
    association: 'MEETINGS & SYNC'
  }[activeTab];

  const renderDateSelector = () => (
    <div className="stitch-date-strip">
      {activeDateKeys.map((dateKey, index) => {
        const date = new Date(dateKey);
        const active = selectedDate === dateKey || (selectedDate === 'all' && index === 0);
        return (
          <button
            key={dateKey}
            type="button"
            className={`stitch-date-pill ${active ? 'active' : ''}`}
            onClick={() => setSelectedDate(dateKey)}
          >
            <span>{formatDateLabel(date, locale, { weekday: 'short' })}</span>
            <strong>{formatDateLabel(date, locale, { day: 'numeric' })}</strong>
          </button>
        );
      })}
    </div>
  );

  if (loading || liffInitializing) {
    return (
      <div className="stitch-loading-screen">
        <div className="stitch-spinner" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="stitch-login-page">
        <header className="stitch-login-header">
          <div className="stitch-login-brand">
            <span className="material-symbols-outlined">menu</span>
            <h1>Member Portal</h1>
          </div>
        </header>
        <main className="stitch-login-main">
          <div className="stitch-login-visual">
            <img src="https://i.imgur.com/AtnfAtf.png" alt="Group of diverse youth smiling" />
            <div className="stitch-login-overlay" />
          </div>
          <div className="stitch-login-copy">
            <h2>WELCOME BACK</h2>
            <p>{isZh ? '加入社群的動能，回到你的會員入口。' : 'Join the energy. Your community is waiting for your next big spark.'}</p>
          </div>
          <div className="stitch-login-actions">
            <button
              type="button"
              className="stitch-line-button"
              onClick={() => {
                if (!liffId) {
                  setMessage({ type: 'error', text: 'Missing LIFF ID' });
                  return;
                }
                window.liff?.login({ liffId });
              }}
            >
              <span className="stitch-line-icon">LINE</span>
              <span>{isZh ? '使用 LINE 登入' : 'Login with LINE'}</span>
            </button>
            {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}
            <div className="stitch-legal-copy">
              <p>
                {isZh ? '繼續即代表同意條款與隱私政策' : 'By continuing, you agree to our Terms & Privacy Policy'}
              </p>
            </div>
          </div>
        </main>
        <div className="stitch-glow stitch-glow-right" />
        <div className="stitch-glow stitch-glow-left" />
      </div>
    );
  }

  if (needsRegistration) {
    return (
      <div className="stitch-portal-page">
        <div className="stitch-screen-shell">
          <header className="stitch-topbar">
            <div className="stitch-topbar-brand">
              <span className="material-symbols-outlined">menu</span>
              <h1>Member Portal</h1>
            </div>
          </header>
          <main className="stitch-screen-main">
            <div className="stitch-hero-header">
              <span>Member Registration</span>
              <h2>COMPLETE PROFILE.</h2>
            </div>
            {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}
            <form className="stitch-white-panel" onSubmit={handleRegistrationSubmit}>
              <div className="stitch-form-grid">
                <div className="form-group">
                  <label>{t('name_')}</label>
                  <input value={registrationData.name} onChange={(event) => setRegistrationData((prev) => ({ ...prev, name: event.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>{t('english_name_optional')}</label>
                  <input value={registrationData.englishAlias} onChange={(event) => setRegistrationData((prev) => ({ ...prev, englishAlias: event.target.value }))} />
                </div>
                <div className="form-group">
                  <label>{t('gender')}</label>
                  <select value={registrationData.gender} onChange={(event) => setRegistrationData((prev) => ({ ...prev, gender: event.target.value }))}>
                    <option value="男">{t('male')}</option>
                    <option value="女">{t('female')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('birth_date_')}</label>
                  <input type="date" value={registrationData.birthDate} onChange={(event) => setRegistrationData((prev) => ({ ...prev, birthDate: event.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>{t('mobile_number')}</label>
                  <input value={registrationData.contact.mobile} onChange={(event) => setRegistrationData((prev) => ({ ...prev, contact: { ...prev.contact, mobile: event.target.value } }))} required />
                </div>
                <div className="form-group">
                  <label>{t('line_id')}</label>
                  <input value={registrationData.contact.lineId} onChange={(event) => setRegistrationData((prev) => ({ ...prev, contact: { ...prev.contact, lineId: event.target.value } }))} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('referral_code_optional')}</label>
                <input value={registrationData.referralCode} onChange={(event) => setRegistrationData((prev) => ({ ...prev, referralCode: event.target.value }))} />
              </div>
              <div className="stitch-subpanel">
                <div className="stitch-subpanel-header">
                  <h3>{t('family_members_optional')}</h3>
                  <button type="button" className="stitch-small-pill" onClick={() => setRegistrationData((prev) => ({ ...prev, familyMembers: [...prev.familyMembers, { name: '', englishAlias: '', gender: '男', birthDate: '' }] }))}>
                    + {t('add_family_member')}
                  </button>
                </div>
                <div className="stitch-card-stack">
                  {registrationData.familyMembers.map((person, index) => (
                    <div className="stitch-mini-card" key={`registration-family-${index}`}>
                      <div className="stitch-form-grid">
                        <div className="form-group">
                          <label>{t('name_')}</label>
                          <input value={person.name} onChange={(event) => setRegistrationData((prev) => {
                            const next = [...prev.familyMembers];
                            next[index] = { ...next[index], name: event.target.value };
                            return { ...prev, familyMembers: next };
                          })} />
                        </div>
                        <div className="form-group">
                          <label>{t('english_name_optional')}</label>
                          <input value={person.englishAlias} onChange={(event) => setRegistrationData((prev) => {
                            const next = [...prev.familyMembers];
                            next[index] = { ...next[index], englishAlias: event.target.value };
                            return { ...prev, familyMembers: next };
                          })} />
                        </div>
                        <div className="form-group">
                          <label>{t('gender')}</label>
                          <select value={person.gender} onChange={(event) => setRegistrationData((prev) => {
                            const next = [...prev.familyMembers];
                            next[index] = { ...next[index], gender: event.target.value };
                            return { ...prev, familyMembers: next };
                          })}>
                            <option value="男">{t('male')}</option>
                            <option value="女">{t('female')}</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>{t('birth_date')}</label>
                          <input type="date" value={person.birthDate} onChange={(event) => setRegistrationData((prev) => {
                            const next = [...prev.familyMembers];
                            next[index] = { ...next[index], birthDate: event.target.value };
                            return { ...prev, familyMembers: next };
                          })} />
                        </div>
                      </div>
                      <button type="button" className="btn btn-danger" onClick={() => setRegistrationData((prev) => ({ ...prev, familyMembers: prev.familyMembers.filter((_, personIndex) => personIndex !== index) }))}>
                        {isZh ? '移除' : 'Remove'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" className="stitch-black-button" disabled={submittingRegistration}>
                {submittingRegistration ? t('submitting') : t('complete_registration')}
              </button>
            </form>
          </main>
        </div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div className="stitch-portal-page">
      {drawerOpen ? <div className="stitch-drawer-overlay" onClick={() => setDrawerOpen(false)} /> : null}
      <aside className={`stitch-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="stitch-drawer-header">
          <div className="stitch-language-selector">
            <button type="button" className={!isZh ? 'active' : ''} onClick={() => isZh && toggleLanguage()}>EN</button>
            <button type="button" className={isZh ? 'active' : ''} onClick={() => !isZh && toggleLanguage()}>中文</button>
          </div>
          <button type="button" className="stitch-close-drawer" onClick={() => setDrawerOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="stitch-drawer-links">
          <button type="button" onClick={() => showComingSoonMessage('Landing page')}>
            <span className="material-symbols-outlined">home</span>
            <span>
              <span className="stitch-drawer-under-construction">Landing Page</span>
              <small>Under Construction</small>
            </span>
            <span className="material-symbols-outlined">construction</span>
          </button>
          <button type="button" className="primary" onClick={() => setDrawerOpen(false)}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Member Portal</span>
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>
          <button type="button" onClick={openLineOfficial}>
            <span className="material-symbols-outlined">campaign</span>
            <span>Announcements</span>
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>
          <button type="button" onClick={openLineOfficial}>
            <span className="material-symbols-outlined">support_agent</span>
            <span>Contact Support</span>
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>
          <button type="button" onClick={openAdminPortal}>
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span>Admin Panel</span>
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>
        </nav>
        <div className="stitch-drawer-footer">
          <div className="stitch-social-row">
            <a href="https://www.facebook.com/profile.php?id=61581510167778" target="_blank" rel="noreferrer">
              <svg className="stitch-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/sunriseyouthinternational/" target="_blank" rel="noreferrer">
              <svg className="stitch-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href={lineOfficialUrl}
              onClick={(event) => {
                event.preventDefault();
                openLineOfficial();
              }}
            >
              <span className="stitch-line-social">LINE</span>
            </a>
            <a href="https://www.youtube.com/@SunriseYouthInternational" target="_blank" rel="noreferrer">
              <svg className="stitch-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
          <button type="button" className="stitch-logout-link" onClick={handleLineLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      <div className="stitch-screen-shell">
        <header className="stitch-topbar">
          <div className="stitch-topbar-brand">
            <button type="button" className="stitch-icon-button" onClick={() => setDrawerOpen(true)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1>Member Portal</h1>
          </div>
        </header>

        <main className="stitch-screen-main">
          {message.text ? <div className={`message ${message.type}`}>{message.text}</div> : null}

          {activeTab === 'profile' && (
            <>
              <div className="stitch-hero-header">
                <span>Member Dashboard</span>
                <h2>{topTitle}</h2>
              </div>
              <section className="stitch-profile-hero">
                <div className="stitch-profile-orb" />
                <div className="stitch-profile-content">
                  <div className="stitch-profile-copy">
                    <div className="stitch-pill-row stitch-profile-top-row">
                      <div className="stitch-status-pill">{member.membershipStatus === '協會會員' ? 'ASSOCIATION MEMBER' : 'ASSOCIATION FRIEND'}</div>
                      <button type="button" className="stitch-outline-pill" onClick={editMode ? () => setEditMode(false) : startEdit}>
                        <span className="material-symbols-outlined">edit</span>
                        {editMode ? 'CANCEL' : 'EDIT PROFILE'}
                      </button>
                    </div>
                    <h3>{member.name}</h3>
                    <p>{isZh ? `Member since ${formatDateLabel(member.membershipStartDate, locale, { year: 'numeric', month: 'long' })}` : `Member since ${formatDateLabel(member.membershipStartDate, locale, { year: 'numeric', month: 'long' })}`}</p>
                    <div className="stitch-point-total">
                      <strong>{member.points || 0}</strong>
                      <span>Available Points</span>
                    </div>
                  </div>
                  <div className="stitch-profile-actions">
                    <button type="button" className="stitch-action-pill">
                      <span className="material-symbols-outlined">groups</span>
                      <span>Family Group</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                    {member.membershipStatus !== '協會會員' ? (
                      <button type="button" className="stitch-black-button" onClick={() => setShowMembershipUpgrade(true)}>
                        UPGRADE TO MEMBER
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              {editMode && (
                <section className="stitch-white-panel">
                  <div className="stitch-form-grid">
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
                      <input type="date" value={editFormData.birthDate} onChange={(event) => setEditFormData((prev) => ({ ...prev, birthDate: event.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>{t('mobile_number')}</label>
                      <input value={editFormData.contact.mobile} onChange={(event) => setEditFormData((prev) => ({ ...prev, contact: { ...prev.contact, mobile: event.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label>{t('line_id')}</label>
                      <input value={editFormData.contact.lineId} onChange={(event) => setEditFormData((prev) => ({ ...prev, contact: { ...prev.contact, lineId: event.target.value } }))} />
                    </div>
                  </div>
                  <div className="stitch-inline-buttons stitch-edit-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditMode(false)}>{t('cancel')}</button>
                    <button type="button" className="stitch-black-button compact" onClick={saveEdit}>SAVE PROFILE</button>
                  </div>
                </section>
              )}

              <section className="stitch-white-panel">
                <div className="stitch-section-top">
                  <div className="stitch-section-heading">
                    <span className="material-symbols-outlined">calendar_today</span>
                    <h3>Current Enrollments</h3>
                  </div>
                </div>
                <div className="stitch-card-stack">
                  {currentEnrollments.length > 0 ? currentEnrollments.map((entry) => (
                    <div className="stitch-profile-class-card" key={entry.itemId}>
                      <div>
                        <p>{entry.itemName}</p>
                        <span>{entry.type === 'activity' ? 'ACTIVITY' : 'CLASS'} • {formatDateLabel(entry.enrolledAt, locale, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="stitch-check-badge">
                        <span className="material-symbols-outlined">check</span>
                      </div>
                    </div>
                  )) : (
                    <div className="stitch-empty-card">No current enrollments</div>
                  )}
                </div>
              </section>

              <section className="stitch-profile-grid">
                <div className="stitch-reward-panel">
                  <h3>Rewards & Referrals</h3>
                  <button type="button" className="stitch-referral-card" onClick={() => handleCopyToClipboard(member.referralCode || '')}>
                    <p>Your Referral Code</p>
                    <div>
                      <strong>{member.referralCode || 'N/A'}</strong>
                      <span className="stitch-referral-copy-icon">
                        <span className="material-symbols-outlined">content_copy</span>
                      </span>
                    </div>
                  </button>
                  <div className="stitch-reward-stats">
                    <div><p>Total Referred Members</p><strong>{member.referralCount || 0}</strong></div>
                    <div><p>Accumulated Points</p><strong>{member.points || 0}</strong></div>
                  </div>
                  <div className="stitch-progress-box">
                    <div className="stitch-progress-head">
                      <div>
                        <h4>Attendance Progress</h4>
                        <p>{attendanceProgress.completedCount}/{attendanceProgress.targetCount} Classes Completed</p>
                      </div>
                      <span>{Math.round((attendanceProgress.completedCount / Math.max(attendanceProgress.targetCount, 1)) * 100)}%</span>
                    </div>
                    <div className="stitch-progress-track"><div className="stitch-progress-fill" style={{ width: `${Math.min(100, (attendanceProgress.completedCount / Math.max(attendanceProgress.targetCount, 1)) * 100)}%` }} /></div>
                    <div className="stitch-progress-labels">
                      <span>Newcomer</span>
                      <span>Gold Member</span>
                    </div>
                  </div>
                </div>
                <div className="stitch-white-panel">
                  <div className="stitch-section-top">
                    <div className="stitch-section-heading">
                      <span className="material-symbols-outlined">volunteer_activism</span>
                      <h3>Volunteering History</h3>
                    </div>
                  </div>
                  <div className="stitch-card-stack">
                    {volunteeringHistoryPreview.length > 0 ? volunteeringHistoryPreview.map((entry) => (
                      <div className="stitch-volunteer-card" key={`${entry.itemId}-${entry.completedAt || entry.date}`}>
                        <div>
                          <p>{entry.itemName}</p>
                          <span>{formatDateLabel(entry.completedAt || entry.date, locale, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span className="material-symbols-outlined">verified</span>
                      </div>
                    )) : <div className="stitch-empty-card">{t('no_volunteering_history')}</div>}
                  </div>
                  <button type="button" className="stitch-outline-wide" onClick={() => setShowVolunteerHistoryModal(true)}>View All History</button>
                </div>
              </section>
            </>
          )}

          {(activeTab === 'classes' || activeTab === 'activities') && (
            <>
              <div className="stitch-hero-header large">
                <h2>{topTitle}</h2>
                <div className="stitch-filter-pill">
                  <span className="material-symbols-outlined">filter_list</span>
                  <span>Filter</span>
                </div>
              </div>
              {activeTab === 'classes' && (
                <div className="stitch-filter-select">
                  <select value={selectedClassInfo} onChange={(event) => setSelectedClassInfo(event.target.value)}>
                    <option value="all">All Classes</option>
                    {uniqueClassInfos.map((info) => <option key={info._id} value={info._id}>{info.name}</option>)}
                  </select>
                </div>
              )}
              {activeDateKeys.length > 0 ? renderDateSelector() : null}
              {loadingClassesAndActivities ? (
                <div className="stitch-empty-card padded"><div className="stitch-spinner" /></div>
              ) : (
                <section className="stitch-explorer-grid">
                  {(activeTab === 'classes' ? filteredClasses : filteredActivities).map((item, index) => {
                    const type = activeTab === 'classes' ? 'class' : 'activity';
                    const imageSrc = getImageSrc(type === 'class' ? item.classInfoId?.banner : item.banner);
                    const teacherName = item.teacher || (type === 'class' ? 'Class Host' : 'Host');
                    const price = type === 'class' ? Number(item.classInfoId?.cost || 0) : Number(item.cost || 0);
                    const capacity = type === 'class' ? item.classInfoId?.maxParticipants : item.maxParticipants;
                    const wide = index % 4 === 0 || index % 4 === 3;
                    const dark = index % 4 === 2;
                    return (
                      <article key={item._id} className={`stitch-explorer-card ${wide ? 'wide' : ''} ${dark ? 'dark' : ''}`}>
                        <div className="stitch-explorer-media">
                          {imageSrc ? <img src={imageSrc} alt={item.name} /> : <div className="stitch-image-fallback">{item.name?.slice(0, 1) || '?'}</div>}
                          {index === 0 ? <div className="stitch-media-chip">Featured</div> : null}
                        </div>
                        <div className="stitch-explorer-body">
                          <div>
                            <div className="stitch-explorer-head">
                              <h3>{item.name}</h3>
                              <strong>{price === 0 ? 'FREE' : `NT$ ${price}`}</strong>
                            </div>
                            <div className="stitch-host-row">
                              <div className="stitch-host-avatar">{teacherName.slice(0, 1)}</div>
                              <span>Host: {teacherName}</span>
                            </div>
                            <div className="stitch-explorer-meta">
                              <div>
                                <span className="material-symbols-outlined">schedule</span>
                                <strong>{item.time}</strong>
                              </div>
                              <div className="stitch-capacity">
                                <div className="stitch-capacity-head">
                                  <span>Capacity</span>
                                  <span>{item.currentParticipants || 0}/{capacity || 0} Enrolled</span>
                                </div>
                                <div className="stitch-capacity-track"><div style={{ width: `${capacity ? Math.min(100, ((item.currentParticipants || 0) / capacity) * 100) : 0}%` }} /></div>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`stitch-view-button ${dark ? 'light' : ''}`}
                            onClick={() => type === 'class' ? setSelectedClass(item) : setSelectedActivity(item)}
                          >
                            View Details
                            <span className="material-symbols-outlined">arrow_forward</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  {(activeTab === 'classes' ? filteredClasses : filteredActivities).length === 0 ? <div className="stitch-empty-card padded">No items available</div> : null}
                </section>
              )}
            </>
          )}

          {activeTab === 'coupons' && (
            <>
              <div className="stitch-hero-header">
                <h2>{topTitle}</h2>
              </div>
              <section className="stitch-wallet-section">
                <h3>MY WALLET</h3>
                <div className="stitch-wallet-grid">
                  <div className="stitch-wallet-card">
                    <span className="material-symbols-outlined">confirmation_number</span>
                    <div><p>Active Vouchers</p><strong>{ownedCoupons.filter((coupon) => isCouponUsable(coupon)).length}</strong></div>
                  </div>
                  <div className="stitch-wallet-card">
                    <span className="material-symbols-outlined">stars</span>
                    <div><p>Available Points</p><strong>{member.points || 0}</strong></div>
                  </div>
                </div>
              </section>

              <section className="stitch-ready-section">
                <h3>READY TO USE</h3>
                <div className="stitch-ready-strip">
                  {ownedCoupons.map((coupon) => (
                    <article className="stitch-owned-coupon" key={coupon._id}>
                      <div className="stitch-owned-top">
                        <div className="stitch-owned-thumb">
                          {getImageSrc(coupon.image) ? <img src={getImageSrc(coupon.image)} alt={coupon.name} /> : <span className="material-symbols-outlined">local_activity</span>}
                        </div>
                      <div>
                          <h4>{coupon.name}</h4>
                          <p>{coupon.expiryDate ? `Expires ${formatDateLabel(coupon.expiryDate, locale)}` : 'One-time use'}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setSelectedCoupon(coupon)}>View</button>
                    </article>
                  ))}
                  {ownedCoupons.length === 0 ? <div className="stitch-empty-card">No owned coupons yet</div> : null}
                </div>
              </section>

              <section className="stitch-store-section">
                <div className="stitch-store-header">
                  <h3>PURCHASE COUPONS</h3>
                  <span>View All</span>
                </div>
                <div className="stitch-store-grid">
                  {couponsForSale.map((coupon) => {
                    const profile = coupon.couponProfileId;
                    const imageSrc = getImageSrc(profile?.image || profile?.classInfoId?.banner);
                    return (
                      <article className="stitch-store-card" key={coupon._id}>
                        <div className="stitch-store-media">
                          {imageSrc ? <img src={imageSrc} alt={profile?.name} /> : <div className="stitch-image-fallback">{profile?.name?.slice(0, 1) || '?'}</div>}
                          <div className="stitch-media-chip">{profile?.type === 'trial' ? 'Trial' : 'Discount'}</div>
                          <div className="stitch-stock-chip">{coupon.stock === -1 ? 'Unlimited' : `${coupon.stock} Left`}</div>
                        </div>
                        <div className="stitch-store-body">
                          <h4>{profile?.name}</h4>
                          <p>{profile?.description}</p>
                          <div className="stitch-store-footer">
                            <strong>{coupon.price} PTS</strong>
                            <button type="button" disabled={purchasingCoupon === coupon._id} onClick={() => handlePurchaseCoupon(coupon)}>
                              Purchase
                              <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {activeTab === 'association' && (
            <>
              <div className="stitch-hero-header">
                <h2>{topTitle}</h2>
                <p>Your attendance is the heartbeat of our community progress. Track, register, and stay engaged.</p>
              </div>
              {memberStats ? (
                <div className="stitch-meeting-summary">
                  <span>{memberStats.meetingsAttendedThisYear} attended in {memberStats.currentYear}</span>
                  <strong>{associationMeetings.length} pending</strong>
                </div>
              ) : null}
              <section className="stitch-meeting-list">
                {loadingMeetings ? <div className="stitch-empty-card padded"><div className="stitch-spinner" /></div> : null}
                {!loadingMeetings && associationMeetings.map((meeting) => {
                  const absenceStatus = getAbsenceStatus(meeting._id);
                  const registered = isMeetingRegistered(meeting._id);
                  return (
                    <article className="stitch-meeting-card" key={meeting._id}>
                      <div className="stitch-meeting-date">
                        <span>{formatDateLabel(meeting.date, locale, { month: 'short' })}</span>
                        <strong>{formatDateLabel(meeting.date, locale, { day: '2-digit' })}</strong>
                      </div>
                      <div className="stitch-meeting-main">
                        <div className="stitch-pill-row">
                          {meeting.mandatory ? <span className="stitch-red-pill">Mandatory</span> : null}
                          <span className="stitch-soft-pill">{meeting.meetingType === 'zoom' ? 'Workshop' : 'Town Hall'}</span>
                        </div>
                        <h4>{meeting.agenda}</h4>
                        <p><span className="material-symbols-outlined">location_on</span>{meeting.location || meeting.zoomUrl || '-'}</p>
                        <div className="stitch-inline-buttons">
                          <button type="button" className="stitch-black-button compact" disabled={registered || registeringMeeting === meeting._id} onClick={() => handleRegisterMeeting(meeting._id)}>
                            {registered ? 'REGISTERED' : 'REGISTER NOW'}
                            <span className="material-symbols-outlined">arrow_forward</span>
                          </button>
                          {meeting.mandatory ? (
                            <button type="button" className="stitch-soft-action" disabled={Boolean(absenceStatus)} onClick={() => {
                              setAbsenceMeetingId(meeting._id);
                              setShowAbsenceModal(true);
                            }}>
                              {absenceStatus ? (absenceStatus.approved ? 'ABSENCE APPROVED' : 'ABSENCE PENDING') : 'CANNOT ATTEND'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {meeting.mandatory ? (
                        <div className="stitch-absence-alert">
                          <span className="material-symbols-outlined">warning</span>
                          <div>
                            <strong>Absence Policy</strong>
                            <p>Mandatory meeting. If you cannot attend, you must submit the absence form 48h prior.</p>
                            <button type="button" onClick={() => {
                              setAbsenceMeetingId(meeting._id);
                              setShowAbsenceModal(true);
                            }}>SUBMIT FORM</button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
                {!loadingMeetings && associationMeetings.length === 0 ? <div className="stitch-empty-card padded">No upcoming meetings</div> : null}
              </section>
            </>
          )}
        </main>

        <nav className="stitch-bottom-nav">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <Modal open={Boolean(selectedClass)} onClose={() => setSelectedClass(null)} wide>
        {selectedClass && (
          <div className="stitch-detail-screen">
            <div className="stitch-detail-topbar">
              <button type="button" className="stitch-back-button" onClick={() => setSelectedClass(null)}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span>Member Portal</span>
              <div className="stitch-topbar-spacer" />
            </div>
            <div className="stitch-detail-body">
              <div className="stitch-detail-header">
                <span>Upcoming Class</span>
                <h2>Class Details.</h2>
              </div>
              <div className="stitch-detail-banner">
                {getImageSrc(selectedClass.classInfoId?.banner) ? <img src={getImageSrc(selectedClass.classInfoId?.banner)} alt={selectedClass.name} /> : <div className="stitch-image-fallback">C</div>}
                <div className="stitch-detail-banner-overlay" />
                <h3>{selectedClass.name}</h3>
              </div>
              <section className="stitch-detail-card">
                <div className="stitch-detail-host">
                  <div className="stitch-host-info">
                    <div className="stitch-host-avatar large">{(selectedClass.teacher || 'T').slice(0, 1)}</div>
                    <div>
                      <p>Head Coach</p>
                      <h4>{selectedClass.teacher || 'Coach'}</h4>
                    </div>
                  </div>
                  <button type="button">View Details</button>
                </div>
                <div className="stitch-detail-grid">
                  <div><span className="material-symbols-outlined">calendar_today</span><strong>{formatDateLabel(selectedClass.date, locale)}</strong></div>
                  <div><span className="material-symbols-outlined">schedule</span><strong>{selectedClass.time}</strong></div>
                </div>
                <div className="stitch-detail-status">
                  <div className="stitch-detail-status-head">
                    <span>Enrollment Status</span>
                    <span>{selectedClass.currentParticipants || 0}/{selectedClass.classInfoId?.maxParticipants || 0} Enrolled</span>
                  </div>
                  <div className="stitch-capacity-track"><div style={{ width: `${selectedClass.classInfoId?.maxParticipants ? Math.min(100, ((selectedClass.currentParticipants || 0) / selectedClass.classInfoId.maxParticipants) * 100) : 0}%` }} /></div>
                </div>
                <div className="stitch-detail-footer">
                  <div><span className="material-symbols-outlined">location_on</span><strong>{selectedClass.location || '-'}</strong></div>
                  <strong className="stitch-price-big">NT$ {selectedClass.classInfoId?.cost || 0}</strong>
                </div>
              </section>
              <div className="stitch-description-card">
                <h4>Class Description</h4>
                <p>{selectedClass.description}</p>
                <div>
                  <h5>What To Bring:</h5>
                  <ul>
                    <li><span className="material-symbols-outlined">check_circle</span><span>Water Bottle</span></li>
                    <li><span className="material-symbols-outlined">check_circle</span><span>Sports Gear</span></li>
                  </ul>
                </div>
              </div>
              <section className="stitch-map-section">
                <h5>Location Map</h5>
                <div className="stitch-map-card">
                  {getGoogleMapsEmbedUrl(selectedClass.location) ? (
                    <a
                      className="stitch-map-link"
                      href={getGoogleMapsSearchUrl(selectedClass.location)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <iframe
                        title={`${selectedClass.name} map`}
                        src={getGoogleMapsEmbedUrl(selectedClass.location)}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </a>
                  ) : (
                    <div className="stitch-map-placeholder">Map preview</div>
                  )}
                </div>
              </section>
              <button type="button" className="stitch-black-button large" disabled={isEnrolled('class', selectedClass._id)} onClick={() => handleEnroll('class', selectedClass)}>
                {isEnrolled('class', selectedClass._id) ? 'ENROLLED' : 'ENROLL NOW'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(selectedActivity)} onClose={() => setSelectedActivity(null)} wide>
        {selectedActivity && (
          <div className="stitch-detail-screen">
            <div className="stitch-detail-topbar">
              <button type="button" className="stitch-back-button" onClick={() => setSelectedActivity(null)}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span>Member Portal</span>
              <div className="stitch-topbar-spacer" />
            </div>
            <div className="stitch-detail-body">
              <div className="stitch-detail-header">
                <span>Upcoming Activity</span>
                <h2>ACTIVITY DETAILS.</h2>
              </div>
              <div className="stitch-detail-banner activity">
                {getImageSrc(selectedActivity.banner) ? <img src={getImageSrc(selectedActivity.banner)} alt={selectedActivity.name} /> : <div className="stitch-image-fallback">A</div>}
                <div className="stitch-detail-banner-overlay" />
                {selectedActivity.isVolunteeringWork ? <div className="stitch-yellow-chip">Volunteering Work</div> : null}
                <h3>{selectedActivity.name}</h3>
              </div>
              <section className="stitch-detail-card">
                <div className="stitch-detail-host left">
                  <div className="stitch-host-info">
                    <div className="stitch-host-avatar large">{(selectedActivity.teacher || 'H').slice(0, 1)}</div>
                    <div>
                      <p>Hosted By</p>
                      <h4>{selectedActivity.teacher || 'Sunrise Youth Team'}</h4>
                      <button type="button">View Details</button>
                    </div>
                  </div>
                </div>
                <div className="stitch-detail-list">
                  <div><span className="material-symbols-outlined">calendar_today</span><div><p>Date</p><strong>{formatDateLabel(selectedActivity.date, locale)}</strong></div></div>
                  <div><span className="material-symbols-outlined">schedule</span><div><p>Time</p><strong>{selectedActivity.time}</strong></div></div>
                  <div><span className="material-symbols-outlined">location_on</span><div><p>Location</p><strong>{selectedActivity.location || '-'}</strong></div></div>
                  <div><span className="material-symbols-outlined">payments</span><div><p>Cost</p><strong>{Number(selectedActivity.cost || 0) === 0 ? 'FREE' : `NT$ ${selectedActivity.cost}`}</strong></div></div>
                </div>
                <div className="stitch-detail-status">
                  <div className="stitch-detail-status-head">
                    <span>Registration Capacity</span>
                    <span>{selectedActivity.currentParticipants || 0}/{selectedActivity.maxParticipants || 0} Registered</span>
                  </div>
                  <div className="stitch-capacity-track"><div style={{ width: `${selectedActivity.maxParticipants ? Math.min(100, ((selectedActivity.currentParticipants || 0) / selectedActivity.maxParticipants) * 100) : 0}%` }} /></div>
                </div>
              </section>
              <div className="stitch-description-card">
                <h4>The Impact</h4>
                <p>{selectedActivity.description}</p>
                <div>
                  <h5>What To Bring:</h5>
                  <ul>
                    <li><span className="material-symbols-outlined">check_circle</span><span>Water Bottle</span></li>
                    <li><span className="material-symbols-outlined">check_circle</span><span>Comfortable Shoes</span></li>
                  </ul>
                </div>
              </div>
              <div className="stitch-map-card activity">
                {getGoogleMapsEmbedUrl(selectedActivity.location) ? (
                  <a
                    className="stitch-map-link"
                    href={getGoogleMapsSearchUrl(selectedActivity.location)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <iframe
                      title={`${selectedActivity.name} map`}
                      src={getGoogleMapsEmbedUrl(selectedActivity.location)}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </a>
                ) : (
                  <div className="stitch-map-placeholder">Map preview</div>
                )}
                <button type="button" onClick={() => {
                  const mapsUrl = getGoogleMapsSearchUrl(selectedActivity.location);
                  if (mapsUrl) {
                    openExternalLink(mapsUrl);
                  }
                }}>Open In Maps</button>
              </div>
              <button type="button" className="stitch-black-button large" disabled={isEnrolled('activity', selectedActivity._id)} onClick={() => handleEnroll('activity', selectedActivity)}>
                {isEnrolled('activity', selectedActivity._id) ? 'ENROLLED' : 'JOIN ACTIVITY'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showCheckout && Boolean(checkoutData)} onClose={() => setShowCheckout(false)} wide>
        {checkoutData && (
          <div className="stitch-checkout-screen">
            <div className="stitch-detail-topbar">
              <button type="button" className="stitch-back-button" onClick={() => setShowCheckout(false)}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span>Member Portal</span>
              <div className="stitch-topbar-spacer" />
            </div>
            <div className="stitch-detail-body">
              <div className="stitch-detail-header">
                <h2>CHECKOUT.</h2>
                <p>Review your enrollment details below</p>
              </div>
              <section className="stitch-white-panel">
                <h3 className="stitch-checkout-title"><span className="material-symbols-outlined">group_add</span>Select People to Enroll</h3>
                <div className="stitch-card-stack">
                  {familyOptions.map((option) => (
                    <div className="stitch-enroll-person-card" key={option.key}>
                      <label className="stitch-checkbox-label">
                        <div className="stitch-checkbox-wrap">
                          <input
                            type="checkbox"
                            checked={selectedFamilyMembers.includes(option.key)}
                            onChange={(event) => {
                              if (event.target.checked) setSelectedFamilyMembers((prev) => [...prev, option.key]);
                              else setSelectedFamilyMembers((prev) => prev.filter((entry) => entry !== option.key));
                            }}
                          />
                          <span className="material-symbols-outlined">check</span>
                        </div>
                        <div>
                          <span>{option.label}</span>
                          <strong>NT$ {checkoutData.cost}</strong>
                        </div>
                      </label>
                      <div className="stitch-select-wrap">
                        <select
                          value={familyMemberCoupons[option.key] || ''}
                          onChange={(event) => setFamilyMemberCoupons((prev) => ({ ...prev, [option.key]: event.target.value }))}
                        >
                          <option value="">Select Coupon</option>
                          {usableCoupons.map((coupon) => (
                            <option key={coupon._id} value={coupon._id}>{coupon.name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="stitch-white-panel">
                <div className="stitch-points-toggle">
                  <div className="stitch-points-copy">
                    <div className="stitch-points-icon"><span className="material-symbols-outlined">stars</span></div>
                    <div>
                      <h3>Use Available Points</h3>
                      <p>{member.points || 0} Points Available</p>
                    </div>
                  </div>
                  <label className="stitch-switch">
                    <input type="checkbox" checked={useAvailablePoints} onChange={(event) => setUseAvailablePoints(event.target.checked)} />
                    <span />
                  </label>
                </div>
              </section>
              <section className="stitch-summary-panel">
                <h3>Order Summary</h3>
                <div><span>Subtotal</span><strong>NT$ {getCheckoutPricing().subtotal}</strong></div>
                <div><span>Coupon Discount</span><strong>- NT$ {getCheckoutPricing().couponDiscount}</strong></div>
                <div><span>Points Discount</span><strong>- NT$ {getCheckoutPricing().pointsDiscount}</strong></div>
                <div className="total"><div><span>Final Cost</span><strong>NT$ {getCheckoutPricing().finalCost}</strong></div><b>VAT Incl.</b></div>
              </section>
              <section className="stitch-payment-actions">
                <button type="button" className="stitch-black-button large" disabled={completingEnrollment} onClick={handleCompleteEnrollment}>
                  Pay in Person
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <div className="stitch-disabled-payments">
                  <button type="button" disabled><span className="material-symbols-outlined">credit_card</span>Credit Card</button>
                  <button type="button" disabled><span className="material-symbols-outlined">payments</span>LINE Pay</button>
                </div>
                <p>Online payment methods are currently under maintenance. Please proceed with "Pay in Person" to secure your spot.</p>
              </section>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showPaymentConfirmation} onClose={() => setShowPaymentConfirmation(false)}>
        <div className="stitch-simple-modal">
          <h3>Enrollment Complete</h3>
          <p>Final Cost: NT$ {paymentConfirmationData?.finalCost || 0}</p>
          <button type="button" className="stitch-black-button compact" onClick={() => setShowPaymentConfirmation(false)}>DONE</button>
        </div>
      </Modal>

      <Modal open={Boolean(selectedCoupon)} onClose={() => setSelectedCoupon(null)} wide>
        {selectedCoupon && (
          <div className="stitch-coupon-detail-screen">
            <div className="stitch-detail-topbar">
              <button type="button" className="stitch-back-button" onClick={() => setSelectedCoupon(null)}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <span>Member Portal</span>
              <div className="stitch-topbar-spacer" />
            </div>
            <div className="stitch-detail-body">
              <h2 className="stitch-coupon-title">COUPON DETAILS.</h2>
              <div className="stitch-coupon-canvas">
                <div className="stitch-coupon-visual">
                  {getImageSrc(selectedCoupon.image || selectedCoupon.classInfoId?.banner || selectedCoupon.saleMeta?.couponProfileId?.image) ? (
                    <img src={getImageSrc(selectedCoupon.image || selectedCoupon.classInfoId?.banner || selectedCoupon.saleMeta?.couponProfileId?.image)} alt={selectedCoupon.name} />
                  ) : <div className="stitch-image-fallback">C</div>}
                  <div className="stitch-media-chip">{selectedCoupon.type === 'trial' ? 'Trial Coupon' : 'Discount Coupon'}</div>
                </div>
                <div className="stitch-coupon-info">
                  <div className="stitch-coupon-head">
                    <div>
                      <h3>{selectedCoupon.name}</h3>
                      <p>{selectedCoupon.description}</p>
                    </div>
                    <div className="stitch-coupon-badge">{selectedCoupon.type === 'trial' ? 'Trial' : 'Discount'}</div>
                  </div>
                  <div className="stitch-coupon-stats">
                    <div>
                      <span>Status</span>
                      <strong>{selectedCoupon.saleMeta ? (selectedCoupon.saleMeta.stock === -1 ? 'Unlimited' : `${selectedCoupon.saleMeta.stock} Left`) : `${Math.max(0, Number(selectedCoupon.quantity || 0) - Number(selectedCoupon.usedCount || 0))} Left`}</strong>
                    </div>
                    <div>
                      <span>Expires</span>
                      <strong>{selectedCoupon.expiryDate ? formatDateLabel(selectedCoupon.expiryDate, locale) : 'No expiry'}</strong>
                    </div>
                  </div>
                  <div className="stitch-coupon-value">
                    <div>
                      <span>Value</span>
                      <strong>{selectedCoupon.type === 'trial' ? '100% OFF' : `${selectedCoupon.discountPercent || 0}% OFF`}</strong>
                    </div>
                    <div />
                    <div>
                      <span>Price</span>
                      <strong>{selectedCoupon.saleMeta ? `${selectedCoupon.saleMeta.price} PTS` : 'Owned'}</strong>
                    </div>
                  </div>
                  <div className="stitch-coupon-about">
                    <h4>About this treat</h4>
                    <p>{selectedCoupon.description}</p>
                  </div>
                  {selectedCoupon.saleMeta ? (
                    <button type="button" className="stitch-black-button" disabled={purchasingCoupon === selectedCoupon.saleMeta._id} onClick={() => handlePurchaseCoupon(selectedCoupon.saleMeta)}>
                      <span>Purchase Coupon</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  ) : (
                    <button type="button" className="stitch-black-button" disabled={!isCouponUsable(selectedCoupon) || sharingCouponId === selectedCoupon._id} onClick={() => handleGenerateShareLink(selectedCoupon)}>
                      <span>Share Coupon</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showShareModal} onClose={() => setShowShareModal(false)}>
        <div className="stitch-simple-modal">
          <h3>Share Coupon</h3>
          {shareLoading ? <div className="stitch-spinner" /> : null}
          {shareLink ? (
            <>
              <textarea readOnly value={shareLink.shareUrl || ''} className="stitch-share-box" />
              <div className="stitch-inline-buttons">
                <button type="button" className="btn btn-secondary" onClick={() => handleCopyToClipboard(shareLink.shareUrl || '')}>COPY LINK</button>
                <button type="button" className="stitch-black-button compact" onClick={() => handleCopyToClipboard(shareLink.shareMessage || shareLink.shareUrl || '')}>COPY MESSAGE</button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      <Modal open={showVolunteerHistoryModal} onClose={() => setShowVolunteerHistoryModal(false)}>
        <div className="stitch-simple-modal">
          <h3>Volunteering History</h3>
          <div className="stitch-card-stack">
            {volunteeringHistory.length > 0 ? volunteeringHistory.map((entry) => (
              <div className="stitch-volunteer-card" key={`modal-${entry.itemId}-${entry.completedAt || entry.date}`}>
                <div>
                  <p>{entry.itemName}</p>
                  <span>{formatDateLabel(entry.completedAt || entry.date, locale, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="material-symbols-outlined">verified</span>
              </div>
            )) : <div className="stitch-empty-card">{t('no_volunteering_history')}</div>}
          </div>
        </div>
      </Modal>

      <Modal open={showMembershipUpgrade} onClose={() => setShowMembershipUpgrade(false)}>
        <div className="stitch-simple-modal">
          <h3>UPGRADE TO MEMBER</h3>
          <p>NT$ 3,000 / year</p>
          <button type="button" className="stitch-black-button compact" disabled={processingUpgrade} onClick={handleUpgradeMembership}>
            PAY IN PERSON
          </button>
        </div>
      </Modal>

      <Modal open={showMembershipConfirmation} onClose={() => setShowMembershipConfirmation(false)}>
        <div className="stitch-simple-modal">
          <h3>UPGRADE REQUEST SENT</h3>
          <p>{t('please_pay_nt_3000_instructions')}</p>
          <button type="button" className="stitch-black-button compact" onClick={() => setShowMembershipConfirmation(false)}>DONE</button>
        </div>
      </Modal>

      <Modal open={showAbsenceModal} onClose={() => setShowAbsenceModal(false)}>
        <div className="stitch-simple-modal">
          <h3>SUBMIT FORM</h3>
          <div className="form-group">
            <label>{t('form')}</label>
            <input type="file" accept="image/*" onChange={handleAbsenceFormUpload} />
          </div>
          {absenceFormImage ? <img src={absenceFormImage} alt="Absence form" className="stitch-absence-preview" /> : null}
          <button type="button" className="stitch-black-button compact" disabled={uploadingAbsenceForm} onClick={handleSubmitAbsenceForm}>
            {uploadingAbsenceForm ? 'SUBMITTING' : 'SUBMIT FORM'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Profile;
