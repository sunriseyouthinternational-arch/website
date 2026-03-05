import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

function Profile() {
  const { t } = useLanguage();
  const { memberId: urlMemberId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // eslint-disable-next-line no-unused-vars
  const [memberId, setMemberId] = useState(urlMemberId || '');
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedClass, setSelectedClass] = useState(null);

  const [selectedClassInfo, setSelectedClassInfo] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [dateOffset, setDateOffset] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const tabFromUrl = searchParams.get('tab');
  const sessionFromUrl = searchParams.get('session');
  const classIdFromUrl = searchParams.get('classId');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'courses' ? 'courses' :
    tabFromUrl === 'points' ? 'points' :
    tabFromUrl === 'association' ? 'association' :
    'profile'
  );

  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    englishAlias: '',
    gender: '男',
    birthDate: '',
    familyMembers: [],
    contact: { phone: '', mobile: '', lineId: '' }
  });

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCoupon, setShareCoupon] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [sharingCouponId, setSharingCouponId] = useState(null);

  const [couponsForSale, setCouponsForSale] = useState([]);
  const [purchasingCoupon, setPurchasingCoupon] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const [enrollingClass, setEnrollingClass] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [enrollingActivity, setEnrollingActivity] = useState(null);
  const [completingEnrollment, setCompletingEnrollment] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentConfirmationData, setPaymentConfirmationData] = useState(null);

  const [showMembershipUpgrade, setShowMembershipUpgrade] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [membershipPaymentType, setMembershipPaymentType] = useState('monthly'); // 'monthly' or 'onetime'
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  const [showMembershipConfirmation, setShowMembershipConfirmation] = useState(false);
  const [membershipConfirmationData, setMembershipConfirmationData] = useState(null);

  const [associationMeetings, setAssociationMeetings] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [registeringMeeting, setRegisteringMeeting] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceMeetingId, setAbsenceMeetingId] = useState(null);
  const [absenceFormImage, setAbsenceFormImage] = useState(null);
  const [uploadingAbsenceForm, setUploadingAbsenceForm] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const [liffReady, setLiffReady] = useState(false);
  const [lineUserId, setLineUserId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [lineProfile, setLineProfile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  const [registrationData, setRegistrationData] = useState({
    name: '',
    englishAlias: '',
    gender: '男',
    birthDate: '',
    familyMembers: [],
    contact: { phone: '', mobile: '', lineId: '' },
    referralCode: ''
  });
  const [submittingRegistration, setSubmittingRegistration] = useState(false);

  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('data:')) return imagePath;

    const apiUrl = process.env.REACT_APP_API_URL || '';
    return `${apiUrl}${imagePath}`;
  };

  // eslint-disable-next-line no-unused-vars
  const validateAndSaveSession = async (sessionToken, id) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.get(`/api/members?memberId=${id}&sessionToken=${sessionToken}`);
      if (response.data.member) {
        setMember(response.data.member);
        setMemberId(id);

        setMessage({ type: 'success', text: t('language') === 'zh' ? '登入成功' : 'Login successful' });

        if (sessionFromUrl) {
          const newUrl = `/profile/${id}${tabFromUrl ? `?tab=${tabFromUrl}` : ''}`;
          navigate(newUrl, { replace: true });
        }
      } else {
        throw new Error('Invalid session');
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '登入失效，請重新登入' : 'Session expired, please login again'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesAndActivities = async () => {
    try {
      const [classesRes, activitiesRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/activities')
      ]);
      const activeClasses = classesRes.data.classes.filter(c => c.status === 'active');
      const activeActivities = activitiesRes.data.activities.filter(a => a.status === 'active');

      activeActivities.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }

        const getStartTime = (timeStr) => {
          if (!timeStr) return '00:00';
          const parts = timeStr.split('-');
          return parts[0] ? parts[0].trim() : '00:00';
        };

        const timeA = getStartTime(a.time);
        const timeB = getStartTime(b.time);

        return timeA.localeCompare(timeB);
      });

      setClasses(activeClasses);
      setActivities(activeActivities);
    } catch (error) {
      console.error('Error fetching classes/activities:', error);
    }
  };

  const fetchCouponsForSale = async () => {
    try {
      const response = await axios.get('/api/coupons?resource=for-sale');
      const activeCoupons = response.data.coupons.filter(c => c.active && (c.stock === -1 || c.stock > 0));
      setCouponsForSale(activeCoupons);
    } catch (error) {
      console.error('Error fetching coupons for sale:', error);
    }
  };

  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = dateOffset; i < dateOffset + 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getFilteredClasses = () => {
    let filtered = [...classes];

    if (selectedClassInfo !== 'all') {
      filtered = filtered.filter(c => c.classInfoId?._id === selectedClassInfo);
    }

    if (selectedDate !== 'all') {
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);

      filtered = filtered.filter(c => {
        const classDate = new Date(c.date);
        classDate.setHours(0, 0, 0, 0);
        return classDate.getTime() === selectedDateObj.getTime();
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }

      const getStartTime = (timeStr) => {
        if (!timeStr) return '00:00';
        const parts = timeStr.split('-');
        return parts[0] ? parts[0].trim() : '00:00';
      };

      const timeA = getStartTime(a.time);
      const timeB = getStartTime(b.time);

      return timeA.localeCompare(timeB);
    });

    return filtered;
  };

  const getUniqueClassInfos = () => {
    const seen = new Set();
    const uniqueClassInfos = [];

    classes.forEach(c => {
      if (c.classInfoId && !seen.has(c.classInfoId._id)) {
        seen.add(c.classInfoId._id);
        uniqueClassInfos.push(c.classInfoId);
      }
    });

    return uniqueClassInfos;
  };

  useEffect(() => {
    fetchClassesAndActivities();

    // Check localStorage for cached LINE user first (for instant UX)
    const cachedLineUser = localStorage.getItem('lineUserCache');
    if (cachedLineUser) {
      try {
        const userData = JSON.parse(cachedLineUser);
        console.log('[Profile] Found cached LINE user, restoring session:', userData.displayName);

        setLineUserId(userData.userId);
        setLineProfile({
          userId: userData.userId,
          displayName: userData.displayName,
          pictureUrl: userData.pictureUrl
        });
        setIsLoggedIn(true);

        // Fetch member data with cached userId
        if (userData.userId) {
          fetchOrCreateMember(userData.userId, {
            displayName: userData.displayName,
            pictureUrl: userData.pictureUrl
          });
        }
      } catch (error) {
        console.error('[Profile] Failed to parse cached user data:', error);
        localStorage.removeItem('lineUserCache');
      }
    }

    // Initialize LIFF in background to verify/update session
    initializeLIFF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tabFromUrl === 'courses') {
      setActiveTab('courses');
    } else if (tabFromUrl === 'points') {
      setActiveTab('points');
    } else if (tabFromUrl === 'profile') {
      setActiveTab('profile');
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (classIdFromUrl && classes.length > 0) {
      const classToOpen = classes.find(c => c._id === classIdFromUrl);
      if (classToOpen) {
        setSelectedClass(classToOpen);
        setActiveTab('courses'); // Switch to courses tab
      }
    }
  }, [classIdFromUrl, classes]);

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCouponsForSale();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'association' && member && member.membershipStatus === '協會會員') {
      fetchAssociationMeetings();
      fetchMemberStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, member]);

  const fetchAssociationMeetings = async () => {
    setLoadingMeetings(true);
    try {
      const response = await axios.get('/api/association-meetings?status=upcoming');
      setAssociationMeetings(response.data.meetings);
    } catch (error) {
      console.error('Failed to fetch association meetings:', error);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchMemberStats = async () => {
    if (!member) return;
    try {
      const response = await axios.get(`/api/association-meetings?action=member-stats&memberId=${member.memberId}`);
      setMemberStats(response.data);
    } catch (error) {
      console.error('Failed to fetch member stats:', error);
    }
  };

  const handleRegisterMeeting = async (meetingId) => {
    if (!member) return;

    setRegisteringMeeting(meetingId);
    try {
      await axios.post('/api/association-meetings?action=register', {
        meetingId,
        memberId: member.memberId
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '報名成功' : 'Registration successful'
      });

      // Refresh meetings
      fetchAssociationMeetings();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('language') === 'zh' ? '報名失敗' : 'Registration failed')
      });
    } finally {
      setRegisteringMeeting(null);
    }
  };

  const isMeetingRegistered = (meetingId) => {
    if (!member) return false;
    const meeting = associationMeetings.find(m => m._id === meetingId);
    if (!meeting) return false;
    return meeting.participants.some(p => p.memberIdString === member.memberId);
  };

  const hasSubmittedAbsence = (meetingId) => {
    if (!member) return false;
    const meeting = associationMeetings.find(m => m._id === meetingId);
    if (!meeting || !meeting.absences) return false;
    return meeting.absences.some(a => a.memberIdString === member.memberId);
  };

  const getAbsenceStatus = (meetingId) => {
    if (!member) return null;
    const meeting = associationMeetings.find(m => m._id === meetingId);
    if (!meeting || !meeting.absences) return null;
    return meeting.absences.find(a => a.memberIdString === member.memberId);
  };

  const handleCannotAttend = (meetingId) => {
    setAbsenceMeetingId(meetingId);
    setShowAbsenceModal(true);
  };

  const handleAbsenceFormUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片文件' : 'Please upload an image file'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片大小不能超過 5MB' : 'Image size cannot exceed 5MB'
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setAbsenceFormImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAbsenceForm = async () => {
    if (!absenceFormImage) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳請假表' : 'Please upload the absence form'
      });
      return;
    }

    setUploadingAbsenceForm(true);

    try {
      const response = await axios.post(`/api/association-meetings?action=submit-absence&meetingId=${absenceMeetingId}`, {
        memberId: member.memberId,
        formImage: absenceFormImage
      });

      setMessage({
        type: 'success',
        text: response.data.message || (t('language') === 'zh' ? '請假申請提交成功' : 'Absence request submitted successfully')
      });

      // Close modal and reset
      setShowAbsenceModal(false);
      setAbsenceMeetingId(null);
      setAbsenceFormImage(null);

      // Refresh meetings
      fetchAssociationMeetings();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('language') === 'zh' ? '提交失敗' : 'Submission failed')
      });
    } finally {
      setUploadingAbsenceForm(false);
    }
  };

  const fetchOrCreateMember = async (userId, profile) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log('[Profile] Checking member for LINE user ID:', userId);

    try {
      const response = await axios.post('/api/members/auth', {
        lineUserId: userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      });

      const { member: memberData, needsRegistration: needsReg, senderReferralCode } = response.data;

      if (!memberData || needsReg) {
        console.log('[Profile] Member needs to register');
        console.log('[Profile] Sender referral code from API:', senderReferralCode);
        setNeedsRegistration(true);

        setRegistrationData(prev => {
          const newData = {
            ...prev,
            name: profile.displayName || '',
            referralCode: senderReferralCode || ''
          };
          console.log('[Profile] Registration data after update:', newData);
          return newData;
        });
        setLoading(false);
        return;
      }

      console.log('[Profile] Found member:', memberData.memberId, 'Registered:', memberData.registrationCompleted);
      setMember(memberData);
      setMemberId(memberData.memberId);
      setNeedsRegistration(false);

      navigate(`/profile/${memberData.memberId}`, { replace: true });
      setLoading(false);

    } catch (error) {
      console.error('[Profile] Error checking member:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('language') === 'zh'
          ? '載入失敗，請稍後再試'
          : 'Failed to load, please try again')
      });
      setLoading(false);
    }
  };

  const initializeLIFF = async () => {
    console.log('[Profile] Starting LIFF initialization...');

    if (!window.liff) {
      console.error('[Profile] LIFF SDK not loaded! Waiting for SDK...');

      setTimeout(() => {
        if (window.liff) {
          console.log('[Profile] LIFF SDK now available, retrying...');
          initializeLIFF();
        } else {
          console.error('[Profile] LIFF SDK still not available after wait');
          setMessage({
            type: 'error',
            text: t('language') === 'zh'
              ? 'LINE SDK 載入失敗，請重新整理頁面'
              : 'LINE SDK failed to load, please refresh the page'
          });
          setLoading(false);
        }
      }, 1000);
      return;
    }

    const liffId = process.env.REACT_APP_LIFF_ID_PROFILE || process.env.REACT_APP_LIFF_ID;
    console.log('[Profile] LIFF ID:', liffId);

    if (!liffId) {
      console.error('[Profile] LIFF ID not configured!');
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? '系統設定錯誤 (缺少 LIFF ID)，請聯繫管理員'
          : 'System configuration error (missing LIFF ID), please contact administrator'
      });
      setLoading(false);
      return;
    }

    try {
      console.log('[Profile] Initializing LIFF with ID:', liffId);
      await window.liff.init({ liffId });
      console.log('[Profile] LIFF initialized successfully');
      setLiffReady(true);

      const isLoggedIn = window.liff.isLoggedIn();
      console.log('[Profile] Login status:', isLoggedIn);

      if (isLoggedIn) {
        const profile = await window.liff.getProfile();
        console.log('[Profile] User logged in:', profile.displayName, 'ID:', profile.userId);

        // Save to localStorage for persistent login
        const userCache = {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('lineUserCache', JSON.stringify(userCache));
        console.log('[Profile] Saved user to cache');

        setLineUserId(profile.userId);
        setLineProfile(profile);
        setIsLoggedIn(true);

        await fetchOrCreateMember(profile.userId, profile);
      } else {
        console.log('[Profile] User not logged in, clearing cache');

        // Clear cache if user is not logged in
        localStorage.removeItem('lineUserCache');
        setIsLoggedIn(false);
        setLineUserId(null);
        setLineProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('[Profile] LIFF initialization failed:', error);
      console.error('[Profile] Error details:', error.message, error.stack);
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? `LINE 登入失敗：${error.message || '未知錯誤'}`
          : `LINE login failed: ${error.message || 'Unknown error'}`
      });
      setLoading(false);
    }
  };

  };

  // Handler functions for managing family members during registration
  const handleRegistrationFamilyMemberChange = (index, field, value) => {
    const updatedMembers = [...registrationData.familyMembers];
    updatedMembers[index][field] = value;
    setRegistrationData({
      ...registrationData,
      familyMembers: updatedMembers
    });
  };

  const addRegistrationFamilyMember = () => {
    setRegistrationData({
      ...registrationData,
      familyMembers: [
        ...registrationData.familyMembers,
        { name: '', englishAlias: '', gender: ''男', birthDate: '' }
      ]
    });
  };

  const removeRegistrationFamilyMember = (index) => {
    setRegistrationData({
      ...registrationData,
      familyMembers: registrationData.familyMembers.filter((_, i) => i !== index)
    });
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRegistration(true);
    setMessage({ type: '', text: '' });

    if (!registrationData.name || !registrationData.contact.mobile || !registrationData.contact.lineId) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? '請填寫所有必填欄位'
          : 'Please fill in all required fields'
      });
      setSubmittingRegistration(false);
      return;
    }

    const phoneNumber = registrationData.contact.mobile.replace(/\D/g, ''); // Remove non-digits
    if (phoneNumber.length < 9 || phoneNumber.length > 10) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? '請輸入有效的台灣手機號碼（9-10位數字）'
          : 'Please enter a valid Taiwan phone number (9-10 digits)'
      });
      setSubmittingRegistration(false);
      return;
    }
    // Validate family members if any exist
    if (registrationData.familyMembers.length > 0) {
      for (let i = 0; i < registrationData.familyMembers.length; i++) {
        const fm = registrationData.familyMembers[i];
        if (!fm.name || !fm.gender || !fm.birthDate) {
          setMessage({
            type: ''error',
            text: t(''language') === ''zh'
              ? `請完整填寫第 ${i + 1} 位家庭成員的必填資料（姓名、性別、生日）`
              : `Please complete required fields for family member ${i + 1} (name, gender, birthdate)`
          });
          setSubmittingRegistration(false);
          return;
        }
      }
    }


    try {
      const response = await axios.post('/api/members/register', {
        lineUserId,
        ...registrationData
      });

      setMember(response.data.member);
      setNeedsRegistration(false);
      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '註冊成功！' : 'Registration successful!'
      });

      navigate(`/profile/${response.data.member.memberId}`, { replace: true });
    } catch (error) {
      console.error('[Profile] Registration failed:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('language') === 'zh'
          ? '註冊失敗，請稍後再試'
          : 'Registration failed, please try again')
      });
    } finally {
      setSubmittingRegistration(false);
    }
  };

  const handleLineLogout = () => {
    console.log('[Profile] Logging out and clearing cache');

    // Clear localStorage cache
    localStorage.removeItem('lineUserCache');

    if (window.liff && window.liff.isLoggedIn()) {
      window.liff.logout();
      setIsLoggedIn(false);
      setLineUserId(null);
      setLineProfile(null);
      setMember(null);
      setMemberId('');
      setNeedsRegistration(false);
      navigate('/profile', { replace: true });
    }
  };

  // eslint-disable-next-line no-unused-vars
  const fetchMemberById = async (id) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.get(`/api/members?memberId=${id}`);
      setMember(response.data.member);
      setMemberId(id);
      setMessage({ type: 'success', text: t('language') === 'zh' ? '載入成功' : 'Loaded successfully' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('error')
      });
      setMember(null);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditFormData({
      name: member.name || '',
      englishAlias: member.englishAlias || '',
      gender: member.gender || '男',
      birthDate: member.birthDate ? member.birthDate.split('T')[0] : '',
      familyMembers: member.familyMembers || [],
      contact: {
        phone: member.contact?.phone || '',
        mobile: member.contact?.mobile || '',
        lineId: member.contact?.lineId || ''
      }
    });
    setEditMode(true);
    setMessage({ type: '', text: '' });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setMessage({ type: '', text: '' });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setEditFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [contactField]: value }
      }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFamilyMemberChange = (index, field, value) => {
    setEditFormData(prev => {
      const newFamilyMembers = [...prev.familyMembers];
      newFamilyMembers[index] = { ...newFamilyMembers[index], [field]: value };
      return { ...prev, familyMembers: newFamilyMembers };
    });
  };

  const addFamilyMember = () => {
    setEditFormData(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, { name: '', englishAlias: '', gender: '男', birthDate: '' }]
    }));
  };

  const removeFamilyMember = (index) => {
    setEditFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/members?memberId=${member.memberId}`, editFormData);
      setMember(response.data.member);
      setEditMode(false);
      setMessage({
        type: 'success',
        text: response.data.message || (t('language') === 'zh' ? '更新成功' : 'Update successful')
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('language') === 'zh' ? '更新失敗' : 'Update failed')
      });
    } finally {
      setLoading(false);
    }
  };


  const handleEnroll = async (type, id, name) => {
    if (!member) {
      setMessage({ type: 'error', text: t('loginRequired') });
      return;
    }

    let item;
    if (type === 'class') {
      item = classes.find(c => c._id === id);
    } else {
      item = activities.find(a => a._id === id);
    }

    if (!item) {
      setMessage({ type: 'error', text: t('language') === 'zh' ? '找不到項目' : 'Item not found' });
      return;
    }

    setCheckoutData({
      type,
      id,
      name,
      cost: type === 'class' ? item.classInfoId?.cost : item.cost,
      classInfoId: type === 'class' ? item.classInfoId?._id : null,
      item
    });
    setShowCheckout(true);
  };

  const handleCompleteEnrollment = async (paymentMethod, coupon = null) => {
    setCompletingEnrollment(true);
    try {
      const endpoint = checkoutData.type === 'class'
        ? `/api/classes?id=${checkoutData.id}&action=enroll`
        : `/api/activities?id=${checkoutData.id}&action=enroll`;

      const response = await axios.post(endpoint, {
        memberId: member.memberId,
        paymentMethod,
        couponId: coupon?._id
      });

      // Calculate final price
      const originalCost = checkoutData.cost;
      let finalCost = originalCost;
      let discount = 0;

      if (response.data.couponUsed) {
        if (response.data.couponUsed.type === 'trial') {
          finalCost = 0;
          discount = originalCost;
        } else {
          discount = Math.round(originalCost * response.data.couponUsed.discountPercent / 100);
          finalCost = originalCost - discount;
        }
      }

      // Store payment confirmation data
      setPaymentConfirmationData({
        type: checkoutData.type,
        item: checkoutData.type === 'class' ? response.data.class : response.data.activity,
        itemName: checkoutData.name,
        originalCost,
        finalCost,
        discount,
        couponUsed: response.data.couponUsed,
        paymentMethod
      });

      const memberResponse = await axios.get(`/api/members?memberId=${member.memberId}`);
      setMember(memberResponse.data.member);

      setShowCheckout(false);
      setCheckoutData(null);
      setSelectedCoupon(null);

      // Show payment confirmation modal
      setShowPaymentConfirmation(true);
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
        text: error.response?.data?.message || (t('language') === 'zh' ? '生成分享連結失敗' : 'Failed to generate share link')
      });
      setShowShareModal(false);
    } finally {
      setShareLoading(false);
      setSharingCouponId(null);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({
      type: 'success',
      text: t('language') === 'zh' ? '已複製到剪貼簿' : 'Copied to clipboard'
    });
  };

  const handlePurchaseCoupon = async (couponForSale) => {
    if (!member) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請先登入' : 'Please login first'
      });
      return;
    }

    setPurchasingCoupon(couponForSale._id);

    try {

      const response = await axios.post('/api/members?action=purchase-coupon', {
        memberId: member.memberId,
        couponForSaleId: couponForSale._id
      });

      setMember(response.data.member);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '購買成功！' : 'Purchase successful!'
      });

      await fetchCouponsForSale();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('language') === 'zh' ? '購買失敗' : 'Purchase failed')
      });
    } finally {
      setPurchasingCoupon(null);
    }
  };

  const isEnrolled = (type, id) => {
    if (!member || !member.enrollments) return false;
    return member.enrollments.some(e => e.type === type && e.itemId === id);
  };

  const getEnrolledItems = (type) => {
    if (!member || !member.enrollments) return [];
    return member.enrollments.filter(e => e.type === type && e.status === 'active');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);

    return date.toLocaleDateString('zh-TW');
  };

  return (
    <div className="container">
      <div className="page-title">
        <h2>{t('myProfile')}</h2>
      </div>      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h3 style={{ color: '#667eea', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '載入中...' : 'Loading...'}
          </h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {t('language') === 'zh'
              ? '正在初始化...'
              : 'Initializing...'}
          </p>
        </div>
      ) : !isLoggedIn ? (
        /* Show LINE login button if user is not logged in */
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔐</div>
          <h2 style={{ color: '#667eea', marginBottom: '20px' }}>
            {t('language') === 'zh' ? '會員登入' : 'Member Login'}
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
            {t('language') === 'zh'
              ? '請使用 LINE 帳號登入以查看或註冊您的會員資料'
              : 'Please login with LINE to view or register your member profile'}
          </p>
          <button
            onClick={() => window.liff.login()}
            className="btn btn-primary"
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '15px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              margin: '0 auto'
            }}
          >
            <span style={{ fontSize: '20px' }}>📱</span>
            {t('language') === 'zh' ? '使用 LINE 登入' : 'Login with LINE'}
          </button>
        </div>
      ) : needsRegistration ? (
        /* Show registration form if member needs to complete registration */
        <div className="card">
          <h2 style={{ color: '#667eea', marginBottom: '20px', textAlign: 'center' }}>
            {t('language') === 'zh' ? '完成註冊' : 'Complete Registration'}
          </h2>

          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
            {t('language') === 'zh'
              ? '歡迎！請填寫以下資料完成註冊'
              : 'Welcome! Please fill in the following information to complete registration'}
          </p>

          <form onSubmit={handleRegistrationSubmit}>            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('language') === 'zh' ? '姓名 *' : 'Name *'}
              </label>
              <input
                type="text"
                required
                value={registrationData.name}
                onChange={(e) => setRegistrationData({...registrationData, name: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('language') === 'zh' ? '英文別名' : 'English Alias'}
              </label>
              <input
                type="text"
                value={registrationData.englishAlias}
                onChange={(e) => setRegistrationData({...registrationData, englishAlias: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('language') === 'zh' ? '性別 *' : 'Gender *'}
              </label>
              <select
                required
                value={registrationData.gender}
                onChange={(e) => setRegistrationData({...registrationData, gender: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="男">男 / Male</option>
                <option value="女">女 / Female</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('language') === 'zh' ? '出生日期 *' : 'Birth Date *'}
              </label>
              <input
                type="date"
                required
                value={registrationData.birthDate}
                onChange={(e) => setRegistrationData({...registrationData, birthDate: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('language') === 'zh' ? '手機號碼 *' : 'Mobile Number *'}
              </label>
              <input
                type="tel"
                required
                value={registrationData.contact.mobile}
                onChange={(e) => setRegistrationData({
                  ...registrationData,
                  contact: {...registrationData.contact, mobile: e.target.value}
                })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('language') === 'zh' ? 'LINE ID *' : 'LINE ID *'}
              </label>
              <input
                type="text"
                value={registrationData.contact.lineId}
                onChange={(e) => setRegistrationData({
                  ...registrationData,
                  contact: {...registrationData.contact, lineId: e.target.value}
                })}
                placeholder={t('language') === 'zh' ? '輸入您的 LINE ID' : 'Enter your LINE ID'}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            {/* Family Members Section */}
            <div style={{ marginBottom: '20px', marginTop: '25px' }}>
              <h4 style={{ marginBottom: '10px', borderBottom: '2px solid #1976d2', paddingBottom: '8px' }}>
                {t('language') === 'zh' ? '家庭成員資訊（選填）' : 'Family Members (Optional)'}
              </h4>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                {t('language') === 'zh' ? '添加您的孩子資料' : 'Add your children'\''s information'}
              </p>

              {registrationData.familyMembers.map((fm, index) => (
                <div key={index} className="family-member-form" style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <h5 style={{ marginBottom: '12px' }}>
                    {t('language') === 'zh' ? `家庭成員 ${index + 1}` : `Family Member ${index + 1}`}
                  </h5>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      {t('language') === 'zh' ? '姓名 *' : 'Name *'}
                    </label>
                    <input
                      type="text"
                      value={fm.name}
                      onChange={(e) => handleRegistrationFamilyMemberChange(index, 'name', e.target.value)}
                      placeholder={t('language') === 'zh' ? '輸入姓名' : 'Enter name'}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      {t('language') === 'zh' ? '英文名（選填）' : 'English Alias (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={fm.englishAlias}
                      onChange={(e) => handleRegistrationFamilyMemberChange(index, 'englishAlias', e.target.value)}
                      placeholder={t('language') === 'zh' ? '輸入英文名' : 'Enter English name'}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                        {t('language') === 'zh' ? '性別 *' : 'Gender *'}
                      </label>
                      <select
                        value={fm.gender}
                        onChange={(e) => handleRegistrationFamilyMemberChange(index, 'gender', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                      >
                        <option value="男">{t('language') === 'zh' ? '男' : 'Male'}</option>
                        <option value="女">{t('language') === 'zh' ? '女' : 'Female'}</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                        {t('language') === 'zh' ? '生日 *' : 'Birth Date *'}
                      </label>
                      <input
                        type="date"
                        value={fm.birthDate ? new Date(fm.birthDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleRegistrationFamilyMemberChange(index, 'birthDate', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => removeRegistrationFamilyMember(index)}
                    style={{ marginTop: '8px' }}
                  >
                    {t('language') === 'zh' ? '移除此成員' : 'Remove Member'}
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={addRegistrationFamilyMember}
                style={{ marginTop: '10px' }}
              >
                + {t('language') === 'zh' ? '新增家庭成員' : 'Add Family Member'}
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('language') === 'zh' ? '推薦碼（選填）' : 'Referral Code (Optional)'}
              </label>
              <input
                type="text"
                value={registrationData.referralCode}
                onChange={(e) => setRegistrationData({...registrationData, referralCode: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            {message.text && (
              <div className={`message ${message.type}`} style={{ marginBottom: '15px' }}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submittingRegistration}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            >
              {submittingRegistration
                ? (t('language') === 'zh' ? '提交中...' : 'Submitting...')
                : (t('language') === 'zh' ? '完成註冊' : 'Complete Registration')}
            </button>
          </form>
        </div>
      ) : member ? (
        <>          {isLoggedIn && lineUserId && (
            <div style={{ textAlign: 'right', marginBottom: '15px' }}>
              <button
                onClick={handleLineLogout}
                style={{
                  padding: '8px 16px',
                  background: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#e9ecef';
                  e.currentTarget.style.color = '#495057';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.color = '#666';
                }}
              >
                🚪 {t('language') === 'zh' ? '登出' : 'Logout'}
              </button>
            </div>
          )}

          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              {t('myProfile')}
            </button>
            <button
              className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              {t('language') === 'zh' ? '課程' : 'Classes'}
            </button>
            <button
              className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              {t('language') === 'zh' ? '活動' : 'Activities'}
            </button>
            <button
              className={`tab-button ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              {t('language') === 'zh' ? '優惠券' : 'Coupons'}
            </button>
            <button
              className={`tab-button ${activeTab === 'points' ? 'active' : ''}`}
              onClick={() => setActiveTab('points')}
            >
              {t('language') === 'zh' ? '點數與禮物' : 'Points & Gifts'}
            </button>
            {member && member.membershipStatus === '協會會員' && (
              <button
                className={`tab-button ${activeTab === 'association' ? 'active' : ''}`}
                onClick={() => setActiveTab('association')}
              >
                {t('language') === 'zh' ? '協會會議' : 'Association Meetings'}
              </button>
            )}
          </div>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          {activeTab === 'profile' && (
            <div className="card profile-card">
              {!editMode ? (
                <>
                  <div className="profile-header">
                    <div className="profile-picture-section">
                      {member.profilePicture ? (
                        <img src={getImageSrc(member.profilePicture)} alt="Profile" className="profile-picture" />
                      ) : (
                        <div className="profile-picture-placeholder">
                          <span>{member.name[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="profile-info">
                      <h2>{member.name}</h2>
                      {member.englishAlias && (
                        <p><strong>{t('englishAlias')}:</strong> {member.englishAlias}</p>
                      )}
                      <p><strong>{t('memberId')}:</strong> {member.memberId}</p>
                      <p><strong>{t('gender')}:</strong> {member.gender}</p>
                      <p><strong>{t('birthDate')}:</strong> {formatDate(member.birthDate)}</p>
                    </div>
                  </div>

                  <div className="contact-info">
                    <h3>{t('contactInfo')}</h3>
                    <p><strong>{t('mobile')}:</strong> {member.contact?.mobile}</p>
                    {member.contact?.phone && <p><strong>{t('phone')}:</strong> {member.contact.phone}</p>}
                    {member.contact?.lineId && <p><strong>{t('lineId')}:</strong> {member.contact.lineId}</p>}
                  </div>

                  <div className="membership-status" style={{
                    background: member.membershipStatus === '協會會員' ? '#e7f5ff' : '#f8f9fa',
                    border: `2px solid ${member.membershipStatus === '協會會員' ? '#74c0fc' : '#dee2e6'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    marginTop: '20px'
                  }}>
                    <h3 style={{ marginBottom: '15px', color: '#495057' }}>
                      {t('language') === 'zh' ? '會籍狀態' : 'Membership Status'}
                    </h3>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                        <strong>{t('language') === 'zh' ? '目前狀態：' : 'Current Status: '}</strong>
                        <span style={{
                          padding: '4px 12px',
                          background: member.membershipStatus === '協會會員' ? '#4dabf7' : '#868e96',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginLeft: '8px'
                        }}>
                          {member.membershipStatus || '會友'}
                        </span>
                      </p>
                    </div>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                      <strong>{t('language') === 'zh' ? '成為會員日期：' : 'Member Since: '}</strong>
                      {formatDate(member.membershipStartDate || member.createdAt)}
                    </p>
                    {member.membershipStatus === '會友' && (
                      <button
                        onClick={() => setShowMembershipUpgrade(true)}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '10px',
                          padding: '12px',
                          fontSize: '15px'
                        }}
                      >
                        ⭐ {t('language') === 'zh' ? '升級為協會會員' : 'Upgrade to Association Member'}
                      </button>
                    )}
                    {member.membershipStatus === '協會會員' && member.membershipUpgradedDate && (
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                        <strong>{t('language') === 'zh' ? '升級日期：' : 'Upgraded On: '}</strong>
                        {formatDate(member.membershipUpgradedDate)}
                      </p>
                    )}
                  </div>

                  {member.familyMembers && member.familyMembers.length > 0 && (
                    <div className="family-members">
                      <h3>{t('familyMembers')}</h3>
                      {member.familyMembers.map((fm, index) => (
                        <div key={index} className="family-member-item">
                          <p><strong>{t('fullName')}:</strong> {fm.name}</p>
                          {fm.englishAlias && (
                            <p><strong>{t('englishAlias')}:</strong> {fm.englishAlias}</p>
                          )}
                          <p><strong>{t('gender')}:</strong> {fm.gender}</p>
                          <p><strong>{t('birthDate')}:</strong> {formatDate(fm.birthDate)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="profile-actions">
                    <button onClick={startEdit} className="btn btn-primary">
                      {t('language') === 'zh' ? '編輯資料' : 'Edit Profile'}
                    </button>
                    <button onClick={() => setMember(null)} className="btn btn-secondary">
                      {t('logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="edit-profile-form">
                  <h3>{t('language') === 'zh' ? '編輯個人資料' : 'Edit Profile'}</h3>

                  <div className="form-group">
                    <label>{t('fullName')} *</label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('englishAlias')}</label>
                    <input
                      type="text"
                      name="englishAlias"
                      value={editFormData.englishAlias}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('gender')} *</label>
                    <select name="gender" value={editFormData.gender} onChange={handleEditChange}>
                      <option value="男">{t('language') === 'zh' ? '男' : 'Male'}</option>
                      <option value="女">{t('language') === 'zh' ? '女' : 'Female'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('birthDate')} *</label>
                    <input
                      type="date"
                      name="birthDate"
                      value={editFormData.birthDate}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <h4>{t('contactInfo')}</h4>

                  <div className="form-group">
                    <label>{t('mobile')} *</label>
                    <input
                      type="tel"
                      name="contact.mobile"
                      value={editFormData.contact.mobile}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('phone')}</label>
                    <input
                      type="tel"
                      name="contact.phone"
                      value={editFormData.contact.phone}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('lineId')} *</label>
                    <input
                      type="text"
                      name="contact.lineId"
                      value={editFormData.contact.lineId}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <h4>{t('familyMembers')}</h4>
                  {editFormData.familyMembers.map((fm, index) => (
                    <div key={index} className="family-member-form">
                      <div className="form-group">
                        <label>{t('fullName')} *</label>
                        <input
                          type="text"
                          value={fm.name}
                          onChange={(e) => handleFamilyMemberChange(index, 'name', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>{t('englishAlias')}</label>
                        <input
                          type="text"
                          value={fm.englishAlias}
                          onChange={(e) => handleFamilyMemberChange(index, 'englishAlias', e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>{t('gender')} *</label>
                          <select
                            value={fm.gender}
                            onChange={(e) => handleFamilyMemberChange(index, 'gender', e.target.value)}
                          >
                            <option value="男">{t('language') === 'zh' ? '男' : 'Male'}</option>
                            <option value="女">{t('language') === 'zh' ? '女' : 'Female'}</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>{t('birthDate')} *</label>
                          <input
                            type="date"
                            value={fm.birthDate ? fm.birthDate.split('T')[0] : ''}
                            onChange={(e) => handleFamilyMemberChange(index, 'birthDate', e.target.value)}
                            required
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFamilyMember(index)}
                          className="btn btn-danger btn-small"
                        >
                          {t('language') === 'zh' ? '移除' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addFamilyMember} className="btn btn-secondary">
                    {t('language') === 'zh' ? '+ 新增家庭成員' : '+ Add Family Member'}
                  </button>

                  <div className="profile-actions">
                    <button onClick={saveEdit} className="btn btn-primary" disabled={loading}>
                      {loading ? (t('language') === 'zh' ? '儲存中...' : 'Saving...') : (t('language') === 'zh' ? '儲存' : 'Save')}
                    </button>
                    <button onClick={cancelEdit} className="btn btn-secondary" disabled={loading}>
                      {t('language') === 'zh' ? '取消' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classes' && selectedClass && (
            <div className="card">
              <button
                onClick={() => setSelectedClass(null)}
                className="btn btn-secondary"
                style={{ marginBottom: '20px' }}
              >
                ← {t('back')}
              </button>

              <h2>{selectedClass.classInfoId?.name || 'N/A'}</h2>

              {selectedClass.classInfoId?.banner && (
                <img
                  src={getImageSrc(selectedClass.classInfoId.banner)}
                  alt={selectedClass.classInfoId?.name}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginTop: '15px',
                    marginBottom: '20px',
                    display: 'block'
                  }}
                />
              )}

              <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '20px', color: '#666' }}>
                {selectedClass.classInfoId?.description || ''}
              </p>              <div style={{
                display: 'grid',
                gridTemplateColumns: selectedClass.teacherId ? '1.5fr 1fr' : '1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>                <div style={{
                  background: '#f8f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '2px solid #e0e8ff'
                }}>
                  <h3 style={{ marginBottom: '15px', color: '#667eea', fontSize: '20px' }}>
                    {t('language') === 'zh' ? '課程詳情' : 'Class Details'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong>{t('classDate')}:</strong>
                      <p style={{ marginTop: '5px' }}>{formatDate(selectedClass.date)}</p>
                    </div>
                    <div>
                      <strong>{t('time')}:</strong>
                      <p style={{ marginTop: '5px' }}>{selectedClass.time}</p>
                    </div>
                    <div>
                      <strong>{t('cost')}:</strong>
                      <p style={{ marginTop: '5px' }}>NT$ {selectedClass.classInfoId?.cost || 0}</p>
                    </div>
                    <div>
                      <strong>{t('participants')}:</strong>
                      <p style={{ marginTop: '5px' }}>{selectedClass.currentParticipants} / {selectedClass.classInfoId?.maxParticipants || 0}</p>
                    </div>
                    {selectedClass.location && (
                      <div>
                        <strong>{t('location')}:</strong>
                        <p style={{ marginTop: '5px' }}>📍 {selectedClass.location}</p>
                      </div>
                    )}
                  </div>
                </div>                {selectedClass.teacherId && (
                  <div style={{
                    background: '#fff8f0',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '2px solid #f0e0c0'
                  }}>
                    <h3 style={{ marginBottom: '15px', color: '#667eea', fontSize: '20px' }}>{t('hostInfo')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center' }}>
                      {selectedClass.teacherId.photo && (
                        <img
                          src={getImageSrc(selectedClass.teacherId.photo)}
                          alt={selectedClass.teacherId.name}
                          style={{
                            width: '120px',
                            height: '120px',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '3px solid #667eea'
                          }}
                        />
                      )}
                      <div style={{ width: '100%', textAlign: 'left' }}>
                        <h4 style={{ marginBottom: '10px', fontSize: '18px', textAlign: 'center' }}>{selectedClass.teacherId.name}</h4>
                        {selectedClass.teacherId.bio && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong>{t('hostBio')}:</strong>
                            <p style={{ marginTop: '5px', lineHeight: '1.6', fontSize: '14px' }}>{selectedClass.teacherId.bio}</p>
                          </div>
                        )}
                        {selectedClass.teacherId.specialties && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong>{t('hostSpecialties')}:</strong>
                            <p style={{ marginTop: '5px', fontSize: '14px' }}>{selectedClass.teacherId.specialties}</p>
                          </div>
                        )}
                        {selectedClass.teacherId.education && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong>{t('hostEducation')}:</strong>
                            <p style={{ marginTop: '5px', fontSize: '14px' }}>{selectedClass.teacherId.education}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>              {!selectedClass.teacherId && selectedClass.teacher && (
                <div style={{
                  background: '#fff8f0',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '2px solid #f0e0c0'
                }}>
                  <h3 style={{ marginBottom: '10px', color: '#667eea' }}>{t('hostInfo')}</h3>
                  <p><strong>{t('host')}:</strong> {selectedClass.teacher}</p>
                </div>
              )}

              {selectedClass.location && (
                <div style={{ marginBottom: '20px' }}>
                  <h3>{t('locationMap')}</h3>
                  <div style={{ position: 'relative' }}>
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedClass.location)}&output=embed`}
                      width="100%"
                      height="400"
                      style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Class Location Map"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorMsg = document.createElement('div');
                        errorMsg.innerHTML = `<p style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">📍 ${selectedClass.location}<br/><small style="color: #666;">${t('language') === 'zh' ? '地圖載入失敗，請直接使用地址' : 'Map failed to load, please use the address directly'}</small></p>`;
                        e.target.parentNode.appendChild(errorMsg);
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                {isEnrolled('class', selectedClass._id) ? (
                  <button className="btn btn-secondary" disabled>{t('enrolled')}</button>
                ) : (
                  <button
                    onClick={() => {
                      handleEnroll('class', selectedClass._id, selectedClass.classInfoId?.name);
                      setSelectedClass(null);
                    }}
                    className="btn btn-primary"
                    disabled={selectedClass.currentParticipants >= (selectedClass.classInfoId?.maxParticipants || 0)}
                  >
                    {selectedClass.currentParticipants >= (selectedClass.classInfoId?.maxParticipants || 0) ? t('classFull') : t('enroll')}
                  </button>
                )}
                <button
                  onClick={() => setSelectedClass(null)}
                  className="btn btn-secondary"
                >
                  {t('back')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'classes' && !selectedClass && (
            <div className="card">
              <h3>{t('classes')}</h3>

                <h4 className="section-subtitle">{t('registeredClasses')}</h4>
                <div className="enrolled-list">
                  {getEnrolledItems('class').length > 0 ? (
                    getEnrolledItems('class').map((enrollment) => {
                      const classItem = classes.find(c => c._id === enrollment.itemId);
                      return (
                        <div key={enrollment._id} className="enrolled-item">
                          <div style={{ flex: 1 }}>
                            <p><strong>{enrollment.itemName}</strong></p>
                            {classItem && (
                              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                                {formatDate(classItem.date)} • {classItem.time}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span className={`status-badge ${enrollment.paid ? 'paid' : 'unpaid'}`}>
                              {enrollment.paid ? t('paid') : t('unpaid')}
                            </span>
                            {classItem && (
                              <button
                                onClick={() => setSelectedClass(classItem)}
                                className="btn btn-small"
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                {t('viewDetails')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="empty-message">{t('language') === 'zh' ? '尚無報名課程' : 'No enrolled classes'}</p>
                  )}
                </div>

                <h4 className="section-subtitle">{t('availableClasses')}</h4>                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#667eea' }}>
                    {t('filterByClass')}
                  </label>
                  <select
                    value={selectedClassInfo}
                    onChange={(e) => setSelectedClassInfo(e.target.value)}
                    style={{
                      padding: '10px',
                      border: '2px solid #667eea',
                      borderRadius: '8px',
                      fontSize: '16px',
                      width: '100%',
                      maxWidth: '400px'
                    }}
                  >
                    <option value="all">{t('allClasses')}</option>
                    {getUniqueClassInfos().map(classInfo => (
                      <option key={classInfo._id} value={classInfo._id}>
                        {classInfo.name}
                      </option>
                    ))}
                  </select>
                </div>                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#667eea' }}>
                    {t('filterByDate')}
                  </label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      onClick={() => setDateOffset(prev => Math.max(0, prev - 7))}
                      disabled={dateOffset === 0}
                      style={{
                        padding: '10px 15px',
                        background: dateOffset === 0 ? '#ccc' : '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: dateOffset === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ←
                    </button>

                    <button
                      onClick={() => setSelectedDate('all')}
                      style={{
                        padding: '10px 20px',
                        background: selectedDate === 'all' ? '#667eea' : 'white',
                        color: selectedDate === 'all' ? 'white' : '#667eea',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600'
                      }}
                    >
                      {t('all')}
                    </button>

                    {getDateOptions().map((date, index) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const isSelected = selectedDate === dateStr;
                      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(dateStr)}
                          style={{
                            padding: '10px 15px',
                            background: isSelected ? '#667eea' : 'white',
                            color: isSelected ? 'white' : '#667eea',
                            border: '2px solid #667eea',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            minWidth: '60px'
                          }}
                        >
                          {monthDay}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setDateOffset(prev => prev + 7)}
                      style={{
                        padding: '10px 15px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      →
                    </button>

                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        style={{
                          padding: '10px 20px',
                          background: '#764ba2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '15px',
                          fontWeight: '600'
                        }}
                      >
                        📅 {t('selectFromCalendar')}
                      </button>
                      {showCalendar && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '10px',
                          background: 'white',
                          padding: '15px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                          zIndex: 1000
                        }}>
                          <input
                            type="date"
                            onChange={(e) => {
                              setSelectedDate(e.target.value);
                              setShowCalendar(false);
                            }}
                            style={{
                              padding: '10px',
                              border: '2px solid #667eea',
                              borderRadius: '8px',
                              fontSize: '16px'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid">
                  {getFilteredClasses().map((classItem) => (
                    <div key={classItem._id} className="item-card">
                      <h4>{classItem.classInfoId?.name || 'N/A'}</h4>
                      {classItem.classInfoId?.banner && (
                        <img
                          src={getImageSrc(classItem.classInfoId.banner)}
                          alt={classItem.classInfoId?.name}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginTop: '10px',
                            marginBottom: '15px'
                          }}
                        />
                      )}
                      <p className="item-description">{classItem.classInfoId?.description || ''}</p>
                      <div className="item-details">
                        <p><strong>{t('classDate')}:</strong> {formatDate(classItem.date)}</p>
                        <p><strong>{t('host')}:</strong> {classItem.teacher}</p>
                        <p><strong>{t('time')}:</strong> {classItem.time}</p>
                        <p><strong>{t('cost')}:</strong> NT$ {classItem.classInfoId?.cost || 0}</p>
                        <p><strong>{t('participants')}:</strong> {classItem.currentParticipants} / {classItem.classInfoId?.maxParticipants || 0}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          onClick={() => setSelectedClass(classItem)}
                          className="btn btn-secondary"
                          style={{ flex: 1 }}
                        >
                          {t('viewDetails')}
                        </button>
                        {isEnrolled('class', classItem._id) ? (
                          <button className="btn btn-secondary" disabled style={{ flex: 1 }}>{t('enrolled')}</button>
                        ) : (
                          <button
                            onClick={() => handleEnroll('class', classItem._id, classItem.classInfoId?.name)}
                            className="btn btn-primary"
                            disabled={classItem.currentParticipants >= (classItem.classInfoId?.maxParticipants || 0)}
                            style={{ flex: 1 }}
                          >
                            {classItem.currentParticipants >= (classItem.classInfoId?.maxParticipants || 0) ? t('classFull') : t('enroll')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="card">
              <h3>{t('activities')}</h3>

                <h4 className="section-subtitle">{t('registeredActivities')}</h4>
                <div className="enrolled-list">
                  {getEnrolledItems('activity').length > 0 ? (
                    getEnrolledItems('activity').map((enrollment) => (
                      <div key={enrollment._id} className="enrolled-item">
                        <p><strong>{enrollment.itemName}</strong></p>
                        <span className={`status-badge ${enrollment.paid ? 'paid' : 'unpaid'}`}>
                          {enrollment.paid ? t('paid') : t('unpaid')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">{t('language') === 'zh' ? '尚無報名活動' : 'No enrolled activities'}</p>
                  )}
                </div>

                <h4 className="section-subtitle">{t('availableActivities')}</h4>
                <div className="grid">
                  {activities.map((activity) => (
                    <div key={activity._id} className="item-card">
                      <h4>{activity.name}</h4>
                      {activity.banner && (
                        <img
                          src={getImageSrc(activity.banner)}
                          alt={activity.name}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginTop: '10px',
                            marginBottom: '15px'
                          }}
                        />
                      )}
                      <p className="item-description">{activity.description}</p>
                      <div className="item-details">
                        <p><strong>{t('host')}:</strong> {activity.teacher}</p>
                        <p><strong>{t('time')}:</strong> {activity.time}</p>
                        {activity.location && (
                          <p><strong>{t('location')}:</strong> 📍 {activity.location}</p>
                        )}
                        <p><strong>{t('cost')}:</strong> NT$ {activity.cost}</p>
                        <p><strong>{t('participants')}:</strong> {activity.currentParticipants} / {activity.maxParticipants}</p>
                      </div>
                      {activity.location && (
                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                          <iframe
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(activity.location)}&output=embed`}
                            width="100%"
                            height="200"
                            style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Activity Location Map"
                          />
                        </div>
                      )}
                      {isEnrolled('activity', activity._id) ? (
                        <button className="btn btn-secondary" disabled>{t('enrolled')}</button>
                      ) : (
                        <button
                          onClick={() => handleEnroll('activity', activity._id, activity.name)}
                          className="btn btn-primary"
                          disabled={activity.currentParticipants >= activity.maxParticipants}
                        >
                          {activity.currentParticipants >= activity.maxParticipants ? t('activityFull') : t('enroll')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="card">
              <h3 style={{ color: '#667eea', marginBottom: '30px', textAlign: 'center' }}>
                {t('language') === 'zh' ? '優惠券商店' : 'Coupon Store'}
              </h3>

              {couponsForSale.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>
                    {t('language') === 'zh' ? '🛒 購買優惠券' : '🛒 Purchase Coupons'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {couponsForSale.map((couponForSale) => {
                      const profile = couponForSale.couponProfileId;
                      return (
                        <div
                          key={couponForSale._id}
                          style={{
                            background: 'white',
                            border: '2px solid #28a745',
                            borderRadius: '12px',
                            padding: '20px',
                            position: 'relative'
                          }}
                        >
                          {profile.image && (
                            <img
                              src={profile.image}
                              alt={profile.name}
                              loading="lazy"
                              decoding="async"
                              style={{
                                width: '100%',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginBottom: '15px'
                              }}
                            />
                          )}
                          <div style={{ marginBottom: '10px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                background: profile.type === 'trial' ? '#d3f9d8' : '#ffe3e3',
                                color: profile.type === 'trial' ? '#2b8a3e' : '#c92a2a',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                              }}
                            >
                              {profile.type === 'trial'
                                ? (t('language') === 'zh' ? '體驗券' : 'Trial')
                                : (t('language') === 'zh' ? '折扣券' : 'Discount')}
                            </span>
                            {couponForSale.stock !== -1 && (
                              <span
                                style={{
                                  marginLeft: '10px',
                                  padding: '4px 12px',
                                  background: couponForSale.stock > 0 ? '#e3f2fd' : '#ffebee',
                                  color: couponForSale.stock > 0 ? '#1976d2' : '#c62828',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {t('language') === 'zh' ? '庫存：' : 'Stock: '}{couponForSale.stock}
                              </span>
                            )}
                          </div>
                          <h4 style={{ color: '#667eea', marginBottom: '10px', fontSize: '18px' }}>
                            {profile.name}
                          </h4>
                          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px', lineHeight: '1.5' }}>
                            {profile.description}
                          </p>
                          {profile.type === 'discount' && (
                            <p style={{ fontSize: '16px', color: '#c92a2a', fontWeight: 'bold', marginBottom: '10px' }}>
                              {t('language') === 'zh' ? '折扣：' : 'Discount: '}{profile.discountPercent}%
                            </p>
                          )}
                          <p style={{ fontSize: '20px', marginBottom: '15px', fontWeight: 'bold', color: '#28a745' }}>
                            {t('language') === 'zh' ? '價格：$' : 'Price: $'}{couponForSale.price}
                          </p>
                          <button
                            onClick={() => handlePurchaseCoupon(couponForSale)}
                            className="btn btn-primary"
                            disabled={purchasingCoupon === couponForSale._id || (couponForSale.stock !== -1 && couponForSale.stock <= 0)}
                            style={{
                              width: '100%',
                              fontSize: '14px',
                              padding: '10px',
                              background: couponForSale.stock !== -1 && couponForSale.stock <= 0 ? '#ccc' : undefined
                            }}
                          >
                            {purchasingCoupon === couponForSale._id ? (
                              t('language') === 'zh' ? '⏳ 購買中...' : '⏳ Purchasing...'
                            ) : couponForSale.stock !== -1 && couponForSale.stock <= 0 ? (
                              t('language') === 'zh' ? '已售完' : 'Sold Out'
                            ) : (
                              <>💰 {t('language') === 'zh' ? '購買' : 'Purchase'}</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <hr style={{ border: 'none', borderTop: '2px solid #e9ecef', margin: '30px 0' }} />
                </div>
              )}

              <h4 style={{ color: '#667eea', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>
                {t('language') === 'zh' ? '📋 我擁有的優惠券' : '📋 My Owned Coupons'}
              </h4>

              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '15px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>ℹ️</span>
                <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                  {t('language') === 'zh'
                    ? '提醒：優惠券只能分享給非會員。已註冊的會員無法領取分享的優惠券。'
                    : 'Reminder: Coupons can only be shared to non-members. Registered members cannot claim shared coupons.'}
                </p>
              </div>

              {member.coupons && member.coupons.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {(() => {

                    const groupedCoupons = member.coupons.reduce((acc, coupon) => {

                      const key = JSON.stringify({
                        type: coupon.type,
                        classInfoId: coupon.classInfoId?._id || coupon.classInfoId,
                        discountPercent: coupon.discountPercent,
                        name: coupon.name,
                        expiryDate: coupon.expiryDate
                      });

                      if (!acc[key]) {
                        acc[key] = {
                          ...coupon,
                          count: 1,
                          ids: [coupon._id]
                        };
                      } else {
                        acc[key].count += 1;
                        acc[key].ids.push(coupon._id);

                        acc[key].quantity += coupon.quantity;
                        acc[key].usedCount += coupon.usedCount;
                      }

                      return acc;
                    }, {});

                    return Object.values(groupedCoupons).map((coupon, idx) => {
                    const remainingUses = coupon.quantity - coupon.usedCount;

                    let daysLeft = null;
                    let expiryUrgency = null;
                    if (coupon.expiryDate) {
                      const now = new Date();
                      const expiry = new Date(coupon.expiryDate);
                      const diffTime = expiry - now;
                      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                      if (daysLeft < 0) {
                        expiryUrgency = 'expired';
                      } else if (daysLeft <= 3) {
                        expiryUrgency = 'critical';
                      } else if (daysLeft <= 7) {
                        expiryUrgency = 'warning';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          background: remainingUses > 0 ? 'white' : '#f5f5f5',
                          border: `2px solid ${remainingUses > 0 ? '#667eea' : '#ddd'}`,
                          borderRadius: '12px',
                          padding: '20px',
                          opacity: remainingUses > 0 ? 1 : 0.6,
                          position: 'relative'
                        }}
                      >
                        {coupon.image && (
                          <img
                            src={coupon.image}
                            alt={coupon.name}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: '100%',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              marginBottom: '15px'
                            }}
                          />
                        )}
                        <div style={{ marginBottom: '10px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              background: coupon.type === 'trial' ? '#d3f9d8' : '#ffe3e3',
                              color: coupon.type === 'trial' ? '#2b8a3e' : '#c92a2a',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}
                          >
                            {coupon.type === 'trial'
                              ? (t('language') === 'zh' ? '體驗券' : 'Trial')
                              : (t('language') === 'zh' ? '折扣券' : 'Discount')}
                          </span>
                          {coupon.count > 1 && (
                            <span
                              style={{
                                marginLeft: '10px',
                                padding: '4px 12px',
                                background: '#667eea',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              ×{coupon.count}
                            </span>
                          )}
                          {remainingUses === 0 && (
                            <span
                              style={{
                                marginLeft: '10px',
                                padding: '4px 12px',
                                background: '#e9ecef',
                                color: '#868e96',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {t('language') === 'zh' ? '已用完' : 'Used Up'}
                            </span>
                          )}
                          {expiryUrgency === 'expired' && (
                            <span
                              style={{
                                marginLeft: '10px',
                                padding: '4px 12px',
                                background: '#ffe0e0',
                                color: '#c92a2a',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {t('language') === 'zh' ? '已過期' : 'Expired'}
                            </span>
                          )}
                          {expiryUrgency === 'critical' && daysLeft >= 0 && (
                            <span
                              style={{
                                marginLeft: '10px',
                                padding: '4px 12px',
                                background: '#ffe0e0',
                                color: '#c92a2a',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                animation: 'pulse 2s ease-in-out infinite'
                              }}
                            >
                              ⚠️ {daysLeft} {t('language') === 'zh' ? '天後過期' : 'days left'}
                            </span>
                          )}
                          {expiryUrgency === 'warning' && (
                            <span
                              style={{
                                marginLeft: '10px',
                                padding: '4px 12px',
                                background: '#fff3cd',
                                color: '#856404',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {daysLeft} {t('language') === 'zh' ? '天後過期' : 'days left'}
                            </span>
                          )}
                        </div>
                        <h4 style={{ color: '#667eea', marginBottom: '10px', fontSize: '18px' }}>
                          {coupon.name}
                        </h4>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px', lineHeight: '1.5' }}>
                          {coupon.description}
                        </p>
                        {coupon.type === 'discount' && (
                          <p style={{ fontSize: '16px', color: '#c92a2a', fontWeight: 'bold', marginBottom: '10px' }}>
                            {t('language') === 'zh' ? '折扣：' : 'Discount: '}{coupon.discountPercent}%
                          </p>
                        )}
                        <p style={{ fontSize: '14px', marginBottom: '8px', color: remainingUses > 0 ? '#495057' : '#868e96' }}>
                          <strong>{t('language') === 'zh' ? '剩餘使用次數：' : 'Remaining Uses: '}</strong>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: remainingUses > 0 ? '#667eea' : '#868e96' }}>
                            {remainingUses}
                          </span> / {coupon.quantity}
                        </p>
                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>
                          {t('language') === 'zh' ? '創建於 ' : 'Created '}{formatDate(coupon.createdAt)}
                        </p>
                        {remainingUses > 0 && (
                          <button
                            onClick={() => handleGenerateShareLink({ ...coupon, _id: coupon.ids[0] })}
                            className="btn btn-secondary"
                            disabled={sharingCouponId === coupon.ids[0]}
                            style={{
                              width: '100%',
                              fontSize: '14px',
                              padding: '10px'
                            }}
                          >
                            {sharingCouponId === coupon.ids[0] ? (
                              t('language') === 'zh' ? '⏳ 載入中...' : '⏳ Loading...'
                            ) : (
                              <>🔗 {t('language') === 'zh' ? '分享給新朋友' : 'Share to New Friends'}</>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })})()}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: '#f8f9ff',
                  borderRadius: '16px'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎫</div>
                  <h4 style={{ color: '#667eea', marginBottom: '15px' }}>
                    {t('language') === 'zh' ? '尚無優惠券' : 'No Coupons Yet'}
                  </h4>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {t('language') === 'zh'
                      ? '您目前沒有任何優惠券。請關注我們的活動以獲取優惠券！'
                      : 'You don\'t have any coupons yet. Follow our events to get coupons!'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div className="card">
              <div className="points-gifts-section">
                <div className="points-display-large">
                  <h3>{t('language') === 'zh' ? '您的會員點數' : 'Your Member Points'}</h3>
                  <div className="points-value-large">
                    <span className="points-number-large">{member.points || 0}</span>
                    <span className="points-label-large">{t('language') === 'zh' ? '點' : 'points'}</span>
                  </div>
                </div>

                <div className="gifts-under-construction">
                  <div className="construction-icon">🚧</div>
                  <h3>{t('language') === 'zh' ? '禮物兌換' : 'Gift Redemption'}</h3>
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
            </div>
          )}

          {activeTab === 'association' && member && member.membershipStatus === '協會會員' && (
            <div className="card">
              <h3>{t('language') === 'zh' ? '協會會議' : 'Association Meetings'}</h3>

              {/* Member Stats */}
              {memberStats && (
                <div style={{
                  background: '#e7f5ff',
                  border: '2px solid #74c0fc',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '30px'
                }}>
                  <h4 style={{ marginBottom: '15px', color: '#1971c2' }}>
                    {t('language') === 'zh' ? '會員統計' : 'Member Statistics'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {t('language') === 'zh' ? '成為協會會員日期' : 'Member Since'}
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1971c2' }}>
                        {memberStats.memberSince ? new Date(memberStats.memberSince).toLocaleDateString('zh-TW') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {t('language') === 'zh' ? `${memberStats.currentYear}年參與會議` : `Meetings Attended in ${memberStats.currentYear}`}
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1971c2' }}>
                        {memberStats.meetingsAttendedThisYear} {t('language') === 'zh' ? '次' : 'times'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Registered Meetings */}
              <h4 className="section-subtitle">{t('language') === 'zh' ? '已報名會議' : 'Registered Meetings'}</h4>
              {loadingMeetings ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                  <p style={{ color: '#666' }}>{t('language') === 'zh' ? '載入中...' : 'Loading...'}</p>
                </div>
              ) : (
                <div className="enrolled-list">
                  {associationMeetings.filter(m => isMeetingRegistered(m._id)).length > 0 ? (
                    associationMeetings.filter(m => isMeetingRegistered(m._id)).map((meeting) => (
                      <div key={meeting._id} className="enrolled-item">
                        <p><strong>{meeting.agenda}</strong></p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          {new Date(meeting.date).toLocaleDateString('zh-TW')} {meeting.time}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                          <span className="status-badge paid">
                            {t('language') === 'zh' ? '已報名' : 'Registered'}
                          </span>
                          <button
                            onClick={() => setShowMeetingDetails(meeting)}
                            className="btn btn-small btn-primary"
                            style={{ padding: '5px 15px', fontSize: '13px' }}
                          >
                            {t('language') === 'zh' ? '查看詳情' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">{t('language') === 'zh' ? '尚未報名任何會議' : 'No registered meetings'}</p>
                  )}
                </div>
              )}

              {/* Upcoming Meetings */}
              <h4 className="section-subtitle">{t('language') === 'zh' ? '即將舉行的會議' : 'Upcoming Meetings'}</h4>
              {loadingMeetings ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                  <p style={{ color: '#666' }}>{t('language') === 'zh' ? '載入中...' : 'Loading...'}</p>
                </div>
              ) : (
              <div className="grid">
                {associationMeetings.filter(m => !isMeetingRegistered(m._id)).length > 0 ? (
                  associationMeetings.filter(m => !isMeetingRegistered(m._id)).map((meeting) => (
                    <div key={meeting._id} className="item-card">
                      <h4>{meeting.agenda}</h4>
                      <div className="item-details">
                        <p><strong>{t('language') === 'zh' ? '日期' : 'Date'}:</strong> {new Date(meeting.date).toLocaleDateString('zh-TW')}</p>
                        <p><strong>{t('language') === 'zh' ? '時間' : 'Time'}:</strong> {meeting.time}</p>
                        {meeting.location && (
                          <p><strong>{t('location')}:</strong> 📍 {meeting.location}</p>
                        )}
                        <p><strong>{t('language') === 'zh' ? '類型' : 'Type'}:</strong> {meeting.memberType}</p>
                        <p>
                          <strong>{t('language') === 'zh' ? '已報名人數' : 'Registered'}:</strong> {meeting.participants.length}
                        </p>
                      </div>
                      {meeting.location && (
                        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                          <iframe
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(meeting.location)}&output=embed`}
                            width="100%"
                            height="200"
                            style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Meeting Location Map"
                          />
                        </div>
                      )}
                      {meeting.mandatory && (
                        <div style={{
                          background: '#fff3cd',
                          border: '2px solid #ffc107',
                          borderRadius: '8px',
                          padding: '10px',
                          marginTop: '10px',
                          marginBottom: '10px'
                        }}>
                          <p style={{ margin: 0, color: '#856404', fontSize: '14px', fontWeight: 'bold' }}>
                            ⚠️ {t('language') === 'zh' ? '強制參加會議' : 'Mandatory Meeting'}
                          </p>
                          <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '12px' }}>
                            {t('language') === 'zh'
                              ? '會員必須出席或提交請假表'
                              : 'Members must attend or submit absence form'}
                          </p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleRegisterMeeting(meeting._id)}
                          className="btn btn-primary"
                          disabled={registeringMeeting === meeting._id || hasSubmittedAbsence(meeting._id)}
                          style={{ flex: 1, minWidth: '120px' }}
                        >
                          {registeringMeeting === meeting._id
                            ? (t('language') === 'zh' ? '報名中...' : 'Registering...')
                            : (t('language') === 'zh' ? '報名' : 'Register')
                          }
                        </button>
                        {meeting.mandatory && !hasSubmittedAbsence(meeting._id) && (
                          <button
                            onClick={() => handleCannotAttend(meeting._id)}
                            className="btn btn-secondary"
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            {t('language') === 'zh' ? '無法出席' : 'Cannot Attend'}
                          </button>
                        )}
                        {hasSubmittedAbsence(meeting._id) && (() => {
                          const absenceStatus = getAbsenceStatus(meeting._id);
                          const isApproved = absenceStatus?.approved;

                          return (
                            <div style={{
                              background: isApproved ? '#d4edda' : '#d1ecf1',
                              border: `1px solid ${isApproved ? '#c3e6cb' : '#bee5eb'}`,
                              borderRadius: '4px',
                              padding: '8px 12px',
                              flex: 1,
                              minWidth: '120px',
                              textAlign: 'center'
                            }}>
                              <span style={{
                                color: isApproved ? '#155724' : '#0c5460',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}>
                                {isApproved
                                  ? `✓ ${t('language') === 'zh' ? '請假已核准' : 'Absence Approved'}`
                                  : `⏳ ${t('language') === 'zh' ? '請假待審核' : 'Absence Pending'}`
                                }
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-message">{t('language') === 'zh' ? '目前沒有可報名的會議' : 'No upcoming meetings available'}</p>
                )}
              </div>
              )}
            </div>
          )}

        </>
      ) : (
        /* Fallback: Show error message if something went wrong */
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{ color: '#667eea', marginBottom: '15px' }}>
            {t('language') === 'zh' ? '載入失敗' : 'Failed to Load'}
          </h3>
          {message.text && (
            <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
              {message.text}
            </div>
          )}
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            {t('language') === 'zh'
              ? '請重新整理頁面或聯繫管理員'
              : 'Please refresh the page or contact administrator'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {t('language') === 'zh' ? '重新整理' : 'Refresh Page'}
          </button>
        </div>
      )}      {showCheckout && checkoutData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ color: '#667eea', marginBottom: '30px', textAlign: 'center' }}>
              {t('language') === 'zh' ? '選擇付款方式' : 'Select Payment Method'}
            </h2>            <div style={{
              background: '#f8f9ff',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '2px solid #d3e0ff'
            }}>
              <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '20px' }}>
                {checkoutData.name}
              </h3>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                <strong>{t('language') === 'zh' ? '金額：' : 'Cost: '}</strong>
                {selectedCoupon ? (
                  <>
                    {selectedCoupon.type === 'trial' ? (
                      <span style={{ color: '#2b8a3e', fontWeight: 'bold' }}>
                        {t('language') === 'zh' ? '免費（體驗券）' : 'Free (Trial Coupon)'}
                      </span>
                    ) : (
                      <>
                        <span style={{ textDecoration: 'line-through', color: '#999' }}>
                          NT$ {checkoutData.cost}
                        </span>
                        {' → '}
                        <span style={{ color: '#c92a2a', fontWeight: 'bold' }}>
                          NT$ {Math.round(checkoutData.cost * (100 - selectedCoupon.discountPercent) / 100)}
                        </span>
                        <span style={{ color: '#c92a2a', fontSize: '14px' }}>
                          {' '}({selectedCoupon.discountPercent}% {t('language') === 'zh' ? '折扣' : 'off'})
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                    NT$ {checkoutData.cost}
                  </span>
                )}
              </p>
              {selectedCoupon && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '8px',
                  border: '2px solid #667eea'
                }}>
                  <p style={{ marginBottom: '5px', color: '#667eea', fontWeight: 'bold' }}>
                    ✓ {t('language') === 'zh' ? '已選擇優惠券：' : 'Coupon Selected: '}{selectedCoupon.name}
                  </p>
                  <button
                    onClick={() => setSelectedCoupon(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#c92a2a',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '14px',
                      padding: 0
                    }}
                  >
                    {t('language') === 'zh' ? '移除優惠券' : 'Remove Coupon'}
                  </button>
                </div>
              )}
            </div>            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              <button
                onClick={() => handleCompleteEnrollment('in-person', selectedCoupon)}
                className="btn btn-primary"
                disabled={completingEnrollment}
                style={{
                  padding: '20px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {completingEnrollment ? (
                  t('language') === 'zh' ? '⏳ 處理中...' : '⏳ Processing...'
                ) : (
                  <>💵 {t('language') === 'zh' ? '現場付款' : 'Pay in Person'}</>
                )}
              </button>

              <button
                disabled
                className="btn btn-secondary"
                style={{
                  padding: '20px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                💳 {t('language') === 'zh' ? '信用卡付款（施工中）' : 'Credit Card (Under Construction)'}
              </button>

              <button
                disabled
                className="btn btn-secondary"
                style={{
                  padding: '20px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                💚 {t('language') === 'zh' ? 'LINE Pay（施工中）' : 'LINE Pay (Under Construction)'}
              </button>

              <button
                onClick={() => setShowCouponModal(true)}
                className="btn"
                style={{
                  padding: '20px',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: selectedCoupon ? '#d3f9d8' : '#667eea',
                  color: 'white',
                  border: 'none'
                }}
              >
                🎫 {t('language') === 'zh' ? '使用優惠券' : 'Redeem Coupon'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowCheckout(false);
                setCheckoutData(null);
                setSelectedCoupon(null);
              }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              {t('language') === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      )}      {showCouponModal && checkoutData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ color: '#667eea', marginBottom: '30px', textAlign: 'center' }}>
              {t('language') === 'zh' ? '選擇優惠券' : 'Select Coupon'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {member.coupons && member.coupons.length > 0 ? (
                member.coupons
                  .filter(coupon => (coupon.quantity - coupon.usedCount) > 0) // Only show coupons with remaining quantity
                  .map((coupon, idx) => {

                    const isValid = coupon.type === 'discount' ||
                      (coupon.type === 'trial' && coupon.classInfoId === checkoutData.classInfoId);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isValid) {
                            setSelectedCoupon(coupon);
                            setShowCouponModal(false);
                          }
                        }}
                        style={{
                          background: isValid ? 'white' : '#f5f5f5',
                          border: `2px solid ${isValid ? '#667eea' : '#ddd'}`,
                          borderRadius: '12px',
                          padding: '20px',
                          cursor: isValid ? 'pointer' : 'not-allowed',
                          opacity: isValid ? 1 : 0.5,
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                      >
                        {coupon.image && (
                          <img
                            src={coupon.image}
                            alt={coupon.name}
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
                            background: coupon.type === 'trial' ? '#d3f9d8' : '#ffe3e3',
                            color: coupon.type === 'trial' ? '#2b8a3e' : '#c92a2a',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {coupon.type === 'trial'
                              ? (t('language') === 'zh' ? '體驗券' : 'Trial')
                              : (t('language') === 'zh' ? '折扣券' : 'Discount')}
                          </span>
                        </div>
                        <h4 style={{ color: '#667eea', marginBottom: '8px', fontSize: '16px' }}>
                          {coupon.name}
                        </h4>
                        <p style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
                          {coupon.description}
                        </p>
                        {coupon.type === 'discount' && (
                          <p style={{ fontSize: '14px', color: '#c92a2a', fontWeight: 'bold', marginBottom: '8px' }}>
                            {coupon.discountPercent}% {t('language') === 'zh' ? '折扣' : 'OFF'}
                          </p>
                        )}
                        <p style={{ fontSize: '13px', color: '#999' }}>
                          {t('language') === 'zh' ? '剩餘：' : 'Remaining: '}
                          {coupon.quantity - coupon.usedCount}
                        </p>
                        {!isValid && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}>
                            {t('language') === 'zh' ? '不適用此課程' : 'Not valid for this class'}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999', padding: '40px' }}>
                  {t('language') === 'zh' ? '您目前沒有可用的優惠券' : 'You have no available coupons'}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowCouponModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              {t('language') === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      )}      {showShareModal && shareCoupon && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ color: '#667eea', marginBottom: '20px', textAlign: 'center' }}>
              {t('language') === 'zh' ? '分享優惠券給新朋友' : 'Share Coupon to New Friends'}
            </h2>            <div style={{
              background: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '25px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '20px', marginTop: '2px' }}>ℹ️</span>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#856404', fontWeight: '600' }}>
                    {t('language') === 'zh'
                      ? '⚠️ 此優惠券僅能分享給尚未加入 LINE 官方帳號的朋友'
                      : '⚠️ This coupon can only be shared with friends who haven\'t added our LINE Official Account yet'}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#856404' }}>
                    {t('language') === 'zh'
                      ? '當您的朋友透過連結加入並完成註冊後，優惠券將自動加入他們的帳戶。'
                      : 'When your friend joins via the link and completes registration, the coupon will be automatically added to their account.'}
                  </p>
                </div>
              </div>
            </div>            <div style={{
              background: '#f8f9ff',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '30px',
              border: '2px solid #d3e0ff'
            }}>
              {shareCoupon.image && (
                <img
                  src={shareCoupon.image}
                  alt={shareCoupon.name}
                  loading="lazy"
                  decoding="async"
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
                  background: shareCoupon.type === 'trial' ? '#d3f9d8' : '#ffe3e3',
                  color: shareCoupon.type === 'trial' ? '#2b8a3e' : '#c92a2a',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {shareCoupon.type === 'trial'
                    ? (t('language') === 'zh' ? '體驗券' : 'Trial')
                    : (t('language') === 'zh' ? '折扣券' : 'Discount')}
                </span>
              </div>
              <h4 style={{ color: '#667eea', marginBottom: '10px' }}>
                {shareCoupon.name}
              </h4>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {shareCoupon.description}
              </p>
            </div>

            {shareLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <p style={{ color: '#667eea', fontSize: '16px' }}>
                  {t('language') === 'zh' ? '正在生成分享連結...' : 'Generating share link...'}
                </p>
              </div>
            ) : shareLink ? (
              <>                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <p style={{ marginBottom: '15px', fontWeight: '600', color: '#333' }}>
                    {t('language') === 'zh' ? '掃描 QR Code 領取優惠券' : 'Scan QR Code to Claim'}
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink.claimUrl)}`}
                    alt="QR Code"
                    style={{
                      width: '200px',
                      height: '200px',
                      border: '4px solid #667eea',
                      borderRadius: '12px',
                      padding: '10px',
                      background: 'white'
                    }}
                  />
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    {t('language') === 'zh'
                      ? '掃描後前往領取頁面，依照指示完成領取'
                      : 'Scan to visit claim page and follow instructions'}
                  </p>
                </div>                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {t('language') === 'zh' ? '或使用此連結分享' : 'Or Share This Link'}
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={shareLink.claimUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#f8f9fa'
                      }}
                    />
                    <button
                      onClick={() => handleCopyToClipboard(shareLink.claimUrl)}
                      className="btn btn-secondary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {t('language') === 'zh' ? '複製' : 'Copy'}
                    </button>
                  </div>
                </div>                <a
                  href={`https://line.me/R/msg/text/?${encodeURIComponent(
                    `${t('language') === 'zh' ? '🎁 我分享了一張優惠券給你！\n' : '🎁 I shared a coupon with you!\n'}${shareLink.claimUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '15px',
                    background: '#06C755',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    marginBottom: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#05b34b';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(6, 199, 85, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#06C755';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  💬 {t('language') === 'zh' ? '透過 LINE 分享給新朋友' : 'Share via LINE to New Friends'}
                </a>                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                    ⏰ {t('language') === 'zh'
                      ? `此分享連結將於 ${new Date(shareLink.expiresAt).toLocaleDateString('zh-TW')} 過期`
                      : `This share link expires on ${new Date(shareLink.expiresAt).toLocaleDateString('en-US')}`}
                  </p>
                </div>                <div style={{
                  background: '#e7f3ff',
                  border: '1px solid #b3d9ff',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#004085', lineHeight: '1.6' }}>
                    {t('language') === 'zh'
                      ? '💡 收件人點擊連結後需要加入 LINE 官方帳號並完成註冊，優惠券將自動加入他們的帳戶。'
                      : '💡 Recipients need to add the LINE Official Account and complete registration. The coupon will be automatically added to their account.'}
                  </p>
                </div>
              </>
            ) : null}

            <button
              onClick={() => {
                setShowShareModal(false);
                setShareCoupon(null);
                setShareLink(null);
              }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              {t('language') === 'zh' ? '關閉' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentConfirmation && paymentConfirmationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1003,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '64px', marginBottom: '15px' }}>✅</div>
              <h2 style={{ color: '#2b8a3e', marginBottom: '10px' }}>
                {t('language') === 'zh' ? '報名成功！' : 'Enrollment Successful!'}
              </h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {t('language') === 'zh'
                  ? '請保存以下資訊，並於課程當天出示'
                  : 'Please save this information and show it on the class day'}
              </p>
            </div>

            <div style={{
              background: '#f8f9ff',
              padding: '25px',
              borderRadius: '12px',
              marginBottom: '25px',
              border: '2px solid #d3e0ff'
            }}>
              <h3 style={{ color: '#667eea', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>
                {t('language') === 'zh' ? '報名詳情' : 'Enrollment Details'}
              </h3>

              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {paymentConfirmationData.type === 'class'
                    ? (t('language') === 'zh' ? '課程名稱' : 'Class Name')
                    : (t('language') === 'zh' ? '活動名稱' : 'Activity Name')}
                </p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {paymentConfirmationData.itemName}
                </p>
              </div>

              {paymentConfirmationData.type === 'class' && paymentConfirmationData.item?.classInfoId && (
                <>
                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      {t('language') === 'zh' ? '日期' : 'Date'}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                      📅 {new Date(paymentConfirmationData.item.date).toLocaleDateString(
                        t('language') === 'zh' ? 'zh-TW' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
                      )}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      {t('language') === 'zh' ? '時間' : 'Time'}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                      🕐 {paymentConfirmationData.item.time}
                    </p>
                  </div>

                  {paymentConfirmationData.item.location && (
                    <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {t('language') === 'zh' ? '地點' : 'Location'}
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        📍 {paymentConfirmationData.item.location}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {t('language') === 'zh' ? '付款方式' : 'Payment Method'}
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {paymentConfirmationData.paymentMethod === 'in-person'
                    ? (t('language') === 'zh' ? '💵 現場付款' : '💵 Pay in Person')
                    : (t('language') === 'zh' ? '💳 信用卡' : '💳 Credit Card')}
                </p>
              </div>

              {paymentConfirmationData.discount > 0 && (
                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    {t('language') === 'zh' ? '原價' : 'Original Price'}
                  </p>
                  <p style={{ fontSize: '16px', textDecoration: 'line-through', color: '#999' }}>
                    NT$ {paymentConfirmationData.originalCost}
                  </p>
                  <p style={{ fontSize: '14px', color: '#c92a2a', fontWeight: 'bold', marginTop: '5px' }}>
                    {paymentConfirmationData.couponUsed?.type === 'trial'
                      ? (t('language') === 'zh' ? '✓ 體驗券已使用（免費）' : '✓ Trial Coupon Applied (Free)')
                      : (t('language') === 'zh'
                        ? `✓ 折扣券已使用 (-NT$ ${paymentConfirmationData.discount})`
                        : `✓ Discount Applied (-NT$ ${paymentConfirmationData.discount})`)}
                  </p>
                </div>
              )}

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #667eea' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {paymentConfirmationData.finalCost === 0
                    ? (t('language') === 'zh' ? '應付金額' : 'Amount Paid')
                    : (paymentConfirmationData.paymentMethod === 'in-person'
                      ? (t('language') === 'zh' ? '應付金額' : 'Amount to Pay')
                      : (t('language') === 'zh' ? '已付金額' : 'Amount Paid'))}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: paymentConfirmationData.finalCost === 0 ? '#2b8a3e' : '#667eea' }}>
                  {paymentConfirmationData.finalCost === 0
                    ? (t('language') === 'zh' ? '免費' : 'FREE')
                    : `NT$ ${paymentConfirmationData.finalCost}`}
                </p>
              </div>
            </div>

            {paymentConfirmationData.paymentMethod === 'in-person' && paymentConfirmationData.finalCost > 0 && (
              <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <p style={{ margin: 0, fontSize: '15px', color: '#856404', fontWeight: 'bold', textAlign: 'center' }}>
                  ⚠️ {t('language') === 'zh'
                    ? '請記得於課程現場繳費'
                    : 'Please remember to pay at the venue'}
                </p>
              </div>
            )}

            <div style={{
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#004085', lineHeight: '1.6' }}>
                💡 {t('language') === 'zh'
                  ? '請於上課當天出示此確認資訊。您也可以在個人檔案的「我的課程」中查看報名記錄。'
                  : 'Please show this confirmation when you arrive for class. You can also view your enrollment in "My Courses" in your profile.'}
              </p>
            </div>

            <button
              onClick={() => {
                setShowPaymentConfirmation(false);
                setPaymentConfirmationData(null);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '15px', fontSize: '16px' }}
            >
              {t('language') === 'zh' ? '完成' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* Membership Upgrade Modal */}
      {showMembershipUpgrade && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1003,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '64px', marginBottom: '15px' }}>⭐</div>
              <h2 style={{ color: '#667eea', marginBottom: '10px' }}>
                {t('language') === 'zh' ? '升級為協會會員' : 'Upgrade to Association Member'}
              </h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {t('language') === 'zh'
                  ? '選擇付款方式並完成升級'
                  : 'Choose payment method and complete upgrade'}
              </p>
            </div>

            <div style={{
              background: '#f8f9ff',
              padding: '25px',
              borderRadius: '12px',
              marginBottom: '25px',
              border: '2px solid #d3e0ff'
            }}>
              <h3 style={{ color: '#667eea', marginBottom: '20px', fontSize: '18px' }}>
                {t('language') === 'zh' ? '升級費用' : 'Upgrade Fee'}
              </h3>

              <div style={{
                padding: '20px',
                background: 'white',
                border: '2px solid #4dabf7',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', color: '#495057' }}>
                  {t('language') === 'zh' ? '年費' : 'Annual Fee'}
                </div>
                <div style={{ fontSize: '16px', color: '#666', marginBottom: '15px' }}>
                  NT$ 3,000 / {t('language') === 'zh' ? '年' : 'year'}
                </div>
              </div>

              <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '15px'
              }}>
                <p style={{ margin: 0, fontSize: '16px', color: '#856404', fontWeight: 'bold', textAlign: 'center' }}>
                  💰 {t('language') === 'zh' ? '應付金額：' : 'Amount to Pay: '}
                  NT$ 3,000
                </p>
              </div>
            </div>

            <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#495057' }}>
              {t('language') === 'zh' ? '選擇付款方式' : 'Choose Payment Method'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <button
                onClick={async () => {
                  setProcessingUpgrade(true);
                  try {
                    const response = await axios.post('/api/members?action=upgrade-membership', {
                      memberId: member.memberId,
                      paymentMethod: 'in-person'
                    });

                    // Refresh member data
                    const memberResponse = await axios.get(`/api/members?memberId=${member.memberId}`);
                    setMember(memberResponse.data.member);

                    // Show confirmation statement
                    setMembershipConfirmationData({
                      amount: 3000,
                      paymentMethod: 'in-person',
                      requiresApproval: response.data.requiresApproval
                    });
                    setShowMembershipUpgrade(false);
                    setShowMembershipConfirmation(true);
                  } catch (error) {
                    console.error('Membership upgrade error:', error);
                    setMessage({
                      type: 'error',
                      text: error.response?.data?.message || (t('language') === 'zh' ? '升級失敗' : 'Upgrade failed')
                    });
                  } finally {
                    setProcessingUpgrade(false);
                  }
                }}
                className="btn btn-primary"
                disabled={processingUpgrade}
                style={{
                  padding: '18px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {processingUpgrade ? (
                  t('language') === 'zh' ? '⏳ 處理中...' : '⏳ Processing...'
                ) : (
                  <>💵 {t('language') === 'zh' ? '現場付款' : 'Pay in Person'}</>
                )}
              </button>

              <button
                disabled
                className="btn btn-secondary"
                style={{
                  padding: '18px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                💳 {t('language') === 'zh' ? '信用卡（施工中）' : 'Credit Card (Under Construction)'}
              </button>

              <button
                disabled
                className="btn btn-secondary"
                style={{
                  padding: '18px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                💚 {t('language') === 'zh' ? 'LINE Pay（施工中）' : 'LINE Pay (Under Construction)'}
              </button>
            </div>

            <div style={{
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#004085', lineHeight: '1.6' }}>
                ℹ️ {t('language') === 'zh'
                  ? '升級後將立即享有協會會員權益。請保存此確認資訊，並於現場出示繳費。'
                  : 'You will immediately enjoy association member benefits after upgrading. Please save this confirmation and show it when paying in person.'}
              </p>
            </div>

            <button
              onClick={() => {
                setShowMembershipUpgrade(false);
                setMembershipPaymentType('monthly');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              disabled={processingUpgrade}
            >
              {t('language') === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Membership Upgrade Confirmation Modal */}
      {showMembershipConfirmation && membershipConfirmationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1003,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ fontSize: '64px', marginBottom: '15px' }}>
                {membershipConfirmationData.requiresApproval ? '📋' : '✅'}
              </div>
              <h2 style={{ color: membershipConfirmationData.requiresApproval ? '#f59f00' : '#2b8a3e', marginBottom: '10px' }}>
                {t('language') === 'zh'
                  ? (membershipConfirmationData.requiresApproval ? '升級申請已提交！' : '升級成功！')
                  : (membershipConfirmationData.requiresApproval ? 'Upgrade Request Submitted!' : 'Upgrade Successful!')}
              </h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {t('language') === 'zh'
                  ? (membershipConfirmationData.requiresApproval
                      ? '請保存以下資訊，並於現場繳費後等待管理員確認'
                      : '請保存以下確認資訊')
                  : (membershipConfirmationData.requiresApproval
                      ? 'Please save this information and wait for admin confirmation after paying in person'
                      : 'Please save this confirmation information')}
              </p>
            </div>

            <div style={{
              background: '#f8f9ff',
              padding: '25px',
              borderRadius: '12px',
              marginBottom: '25px',
              border: '2px solid #d3e0ff'
            }}>
              <h3 style={{ color: '#667eea', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>
                {t('language') === 'zh' ? '升級詳情' : 'Upgrade Details'}
              </h3>

              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {t('language') === 'zh' ? '升級至' : 'Upgrade To'}
                </p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  ⭐ 協會會員
                </p>
              </div>

              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {t('language') === 'zh' ? '付款方式' : 'Payment Method'}
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  💵 {t('language') === 'zh' ? '現場付款' : 'Pay in Person'}
                </p>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #667eea' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {t('language') === 'zh' ? '應付金額' : 'Amount to Pay'}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>
                  NT$ {membershipConfirmationData.amount}
                </p>
              </div>
            </div>

            {membershipConfirmationData.requiresApproval && (
              <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '25px'
              }}>
                <p style={{ margin: 0, fontSize: '15px', color: '#856404', fontWeight: 'bold', marginBottom: '10px' }}>
                  ⚠️ {t('language') === 'zh' ? '重要提醒' : 'Important Notice'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#856404', lineHeight: '1.6' }}>
                  {t('language') === 'zh'
                    ? '1. 請於現場繳費 NT$ 3,000\n2. 繳費後，管理員將確認並更新您的會員狀態\n3. 確認後您將享有協會會員權益'
                    : '1. Please pay NT$ 3,000 in person\n2. After payment, admin will confirm and update your membership status\n3. You will enjoy association member benefits after confirmation'}
                </p>
              </div>
            )}

            <div style={{
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#004085', lineHeight: '1.6' }}>
                💡 {t('language') === 'zh'
                  ? '您可以在個人檔案中查看會籍狀態。'
                  : 'You can view your membership status in your profile.'}
              </p>
            </div>

            <button
              onClick={() => {
                setShowMembershipConfirmation(false);
                setMembershipConfirmationData(null);
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '15px', fontSize: '16px' }}
            >
              {t('language') === 'zh' ? '完成' : 'Done'}
            </button>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {showMeetingDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#667eea' }}>
              {t('language') === 'zh' ? '會議詳情' : 'Meeting Details'}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '18px', marginBottom: '15px' }}>{showMeetingDetails.agenda}</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p><strong>{t('language') === 'zh' ? '日期' : 'Date'}:</strong> {new Date(showMeetingDetails.date).toLocaleDateString('zh-TW')}</p>
                <p><strong>{t('language') === 'zh' ? '時間' : 'Time'}:</strong> {showMeetingDetails.time}</p>
                <p><strong>{t('language') === 'zh' ? '類型' : 'Type'}:</strong> {showMeetingDetails.memberType}</p>

                {showMeetingDetails.meetingType === 'in-person' && showMeetingDetails.location && (
                  <>
                    <p><strong>{t('location')}:</strong> 📍 {showMeetingDetails.location}</p>
                    <div style={{ marginTop: '10px' }}>
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(showMeetingDetails.location)}&output=embed`}
                        width="100%"
                        height="250"
                        style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Meeting Location Map"
                      />
                    </div>
                  </>
                )}

                {showMeetingDetails.meetingType === 'zoom' && showMeetingDetails.zoomUrl && (
                  <div>
                    <p><strong>{t('language') === 'zh' ? 'Zoom 連結' : 'Zoom URL'}:</strong></p>
                    <a
                      href={showMeetingDetails.zoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#667eea',
                        textDecoration: 'underline',
                        wordBreak: 'break-all',
                        display: 'inline-block',
                        marginTop: '5px'
                      }}
                    >
                      {showMeetingDetails.zoomUrl}
                    </a>
                  </div>
                )}

                {showMeetingDetails.mandatory && (
                  <div style={{
                    background: '#fff3cd',
                    border: '2px solid #ffc107',
                    borderRadius: '8px',
                    padding: '15px',
                    marginTop: '10px'
                  }}>
                    <p style={{ margin: 0, color: '#856404', fontSize: '14px', fontWeight: 'bold' }}>
                      ⚠️ {t('language') === 'zh' ? '強制參加會議' : 'Mandatory Meeting'}
                    </p>
                    <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '12px' }}>
                      {t('language') === 'zh'
                        ? '會員必須出席或提交請假表'
                        : 'Members must attend or submit absence form'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowMeetingDetails(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {t('language') === 'zh' ? '關閉' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Absence Form Upload Modal */}
      {showAbsenceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#667eea' }}>
              {t('language') === 'zh' ? '提交請假表' : 'Submit Absence Form'}
            </h3>

            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404', lineHeight: '1.6' }}>
                <strong>{t('language') === 'zh' ? '請按照以下步驟：' : 'Please follow these steps:'}</strong>
              </p>
              <ol style={{ margin: '10px 0 0 20px', padding: 0, fontSize: '14px', color: '#856404' }}>
                <li>
                  {t('language') === 'zh' ? '下載請假表範本' : 'Download the absence form template'}
                  <br />
                  <a
                    href="/forms/absence-form-template.docx"
                    download
                    style={{
                      color: '#667eea',
                      textDecoration: 'underline',
                      fontSize: '13px',
                      marginTop: '5px',
                      display: 'inline-block'
                    }}
                  >
                    📥 {t('language') === 'zh' ? '點擊下載表格' : 'Click to download form'}
                  </a>
                </li>
                <li>{t('language') === 'zh' ? '列印並填寫表格' : 'Print and fill out the form'}</li>
                <li>{t('language') === 'zh' ? '拍攝填妥表格的清晰照片' : 'Take a clear photo of the completed form'}</li>
                <li>{t('language') === 'zh' ? '上傳照片' : 'Upload the photo'}</li>
              </ol>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {t('language') === 'zh' ? '上傳請假表照片' : 'Upload Form Photo'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAbsenceFormUpload}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px dashed #667eea',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {t('language') === 'zh'
                  ? '支援格式：JPG, PNG｜最大 5MB'
                  : 'Supported formats: JPG, PNG | Max 5MB'}
              </p>
            </div>

            {absenceFormImage && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  {t('language') === 'zh' ? '預覽：' : 'Preview:'}
                </p>
                <img
                  src={absenceFormImage}
                  alt="Form preview"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button
                onClick={handleSubmitAbsenceForm}
                className="btn btn-primary"
                disabled={uploadingAbsenceForm || !absenceFormImage}
                style={{ flex: 1 }}
              >
                {uploadingAbsenceForm
                  ? (t('language') === 'zh' ? '上傳中...' : 'Uploading...')
                  : (t('language') === 'zh' ? '提交' : 'Submit')
                }
              </button>
              <button
                onClick={() => {
                  setShowAbsenceModal(false);
                  setAbsenceMeetingId(null);
                  setAbsenceFormImage(null);
                }}
                className="btn btn-secondary"
                disabled={uploadingAbsenceForm}
                style={{ flex: 1 }}
              >
                {t('language') === 'zh' ? '取消' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
