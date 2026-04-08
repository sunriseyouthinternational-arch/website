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
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [selectedClassInfo, setSelectedClassInfo] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [dateOffset, setDateOffset] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  const tabFromUrl = searchParams.get('tab');
  const sessionFromUrl = searchParams.get('session');
  const classIdFromUrl = searchParams.get('classId');
  const activityIdFromUrl = searchParams.get('activityId');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'courses' || tabFromUrl === 'classes' ? 'classes' :
    tabFromUrl === 'activities' ? 'activities' :
    tabFromUrl === 'coupons' ? 'coupons' :
    tabFromUrl === 'association' || tabFromUrl === 'meetings' ? 'association' :
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
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState([]);
  const [familyMemberCoupons, setFamilyMemberCoupons] = useState({});

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
  const [liffInitializing, setLiffInitializing] = useState(true);
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

        setMessage({ type: 'success', text: t('login_successful') });

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
        text: t('session_expired_please_login_again')
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
      const activeClasses = classesRes.data.classes.filter(c => c.status === 'upcoming');
      const activeActivities = activitiesRes.data.activities.filter(a => a.status === 'upcoming');

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
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    for (let i = dateOffset; i < dateOffset + 7; i++) {
      const date = new Date(year, month, day + i);
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
      filtered = filtered.filter(c => {
        const classDateStr = c.date.split('T')[0];
        return classDateStr === selectedDate;
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

    // Unified initialization that properly coordinates cache check and LIFF init
    const initializeAuth = async () => {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Check localStorage for cached LINE user first (for instant UX)
      const cachedLineUser = localStorage.getItem('lineUserCache');
      let hasCachedUser = false;

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
          setLiffInitializing(false);
          hasCachedUser = true;

          // Fetch member data with cached userId
          if (userData.userId) {
            await fetchOrCreateMember(userData.userId, {
              displayName: userData.displayName,
              pictureUrl: userData.pictureUrl
            });
          }
        } catch (error) {
          console.error('[Profile] Failed to parse cached user data:', error);
          localStorage.removeItem('lineUserCache');
          hasCachedUser = false;
        }
      }

      // If we used cached user successfully, skip LIFF init (cache implies already logged in)
      // Otherwise, initialize LIFF to check/refresh session
      if (!hasCachedUser) {
        await initializeLIFF();
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tabFromUrl === 'courses' || tabFromUrl === 'classes') {
      setActiveTab('classes');
    } else if (tabFromUrl === 'activities') {
      setActiveTab('activities');
    } else if (tabFromUrl === 'coupons') {
      setActiveTab('coupons');
    } else if (tabFromUrl === 'association' || tabFromUrl === 'meetings') {
      setActiveTab('association');
    } else if (tabFromUrl === 'profile') {
      setActiveTab('profile');
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (classIdFromUrl && classes.length > 0) {
      const classToOpen = classes.find(c => c._id === classIdFromUrl);
      if (classToOpen) {
        setSelectedClass(classToOpen);
        setActiveTab('classes');
      }
    }
  }, [classIdFromUrl, classes]);

  useEffect(() => {
    if (activityIdFromUrl && activities.length > 0) {
      const activityToOpen = activities.find(a => a._id === activityIdFromUrl);
      if (activityToOpen) {
        setSelectedActivity(activityToOpen);
        setActiveTab('activities');
      }
    }
  }, [activityIdFromUrl, activities]);

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
        text: t('registration_successful')
      });

      // Refresh meetings
      fetchAssociationMeetings();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('registration_failed'))
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
        text: t('please_upload_an_image_file')
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: t('image_size_cannot_exceed_5mb')
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
        text: t('please_upload_the_absence_form')
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
        text: response.data.message || (t('absence_request_submitted_successfully'))
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
        text: error.response?.data?.message || (t('submission_failed'))
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

      const queryString = window.location.search;
      navigate(`/profile/${memberData.memberId}${queryString}`, { replace: true });
      setLoading(false);

    } catch (error) {
      console.error('[Profile] Error checking member:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('failed_to_load_please_try_again'))
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
            text: t('line_sdk_failed_to_load_please_refresh_the_page')
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
        text: t('system_configuration_error_missing_liff_id_please_')
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
        setLiffInitializing(false);

        // fetchOrCreateMember will manage loading state
        await fetchOrCreateMember(profile.userId, profile);
      } else {
        console.log('[Profile] User not logged in, clearing cache');

        // Clear cache if user is not logged in
        localStorage.removeItem('lineUserCache');
        setIsLoggedIn(false);
        setLiffInitializing(false);
        setLineUserId(null);
        setLineProfile(null);
        // Only set loading=false if we're managing it from initializeLIFF
        // If called from initializeAuth parent, loading is already handled
        setLoading(false);
      }
    } catch (error) {
      console.error('[Profile] LIFF initialization failed:', error);
      console.error('[Profile] Error details:', error.message, error.stack);
      setLiffInitializing(false);
      setMessage({
        type: 'error',
        text: t('language') === 'zh'
          ? `LINE 登入失敗：${error.message || '未知錯誤'}`
          : `LINE login failed: ${error.message || 'Unknown error'}`
      });
      setLoading(false);
    }
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
        { name: '', englishAlias: '', gender: '男', birthDate: '' }
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

    if (!registrationData.name || !registrationData.contact.mobile) {
      setMessage({
        type: 'error',
        text: t('please_fill_in_all_required_fields')
      });
      setSubmittingRegistration(false);
      return;
    }

    const phoneNumber = registrationData.contact.mobile.replace(/\D/g, ''); // Remove non-digits
    if (phoneNumber.length < 9 || phoneNumber.length > 10) {
      setMessage({
        type: 'error',
        text: t('please_enter_a_valid_taiwan_phone_number_9_10_digi')
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
            type: 'error',
            text: t('language') === 'zh'
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
        text: t('registration_successful')
      });

      navigate(`/profile/${response.data.member.memberId}`, { replace: true });
    } catch (error) {
      console.error('[Profile] Registration failed:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('registration_failed_please_try_again'))
      });
    } finally {
      setSubmittingRegistration(false);
    }
  };

  const handleLineLogout = () => {
    console.log('[Profile] Logging out and clearing cache');

    // Clear localStorage cache
    localStorage.removeItem('lineUserCache');

    if (window.liff && liffReady && window.liff.isLoggedIn()) {
      window.liff.logout();
    }

    setIsLoggedIn(false);
    setLineUserId(null);
    setLineProfile(null);
    setMember(null);
    setMemberId('');
    setNeedsRegistration(false);
    navigate('/profile', { replace: true });
  };

  // eslint-disable-next-line no-unused-vars
  const fetchMemberById = async (id) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.get(`/api/members?memberId=${id}`);
      setMember(response.data.member);
      setMemberId(id);
      setMessage({ type: 'success', text: t('loaded_successfully') });
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
        text: response.data.message || (t('update_successful'))
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('update_failed'))
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
      setMessage({ type: 'error', text: t('item_not_found') });
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
    setSelectedFamilyMembers([]);
    setFamilyMemberCoupons({});
    setShowCheckout(true);
  };

  const handleCompleteEnrollment = async (paymentMethod, coupon = null) => {
    setCompletingEnrollment(true);
    try {
      // If no family members selected, show error
      if (selectedFamilyMembers.length === 0) {
        setMessage({ type: 'error', text: t('please_select_at_least_one_person') });
        setCompletingEnrollment(false);
        return;
      }

      const endpoint = checkoutData.type === 'class'
        ? `/api/classes?id=${checkoutData.id}&action=enroll`
        : `/api/activities?id=${checkoutData.id}&action=enroll`;

      const response = await axios.post(endpoint, {
        memberId: member.memberId,
        paymentMethod,
        couponId: coupon?._id,
        familyMembers: selectedFamilyMembers,
        familyMemberCoupons,
        enrollSelfOnly: false
      });

      // Calculate final price
      let originalCost = checkoutData.cost * selectedFamilyMembers.length;
      let finalCost = originalCost;
      let discount = 0;

      if (response.data.familyCouponsUsed && response.data.familyCouponsUsed.length > 0) {
        response.data.familyCouponsUsed.forEach(fmCoupon => {
          if (fmCoupon.type === 'trial') {
            finalCost -= checkoutData.cost;
            discount += checkoutData.cost;
          } else {
            const fmDiscount = Math.round(checkoutData.cost * fmCoupon.discountPercent / 100);
            finalCost -= fmDiscount;
            discount += fmDiscount;
          }
        });
      }

      // Store payment confirmation data
      setPaymentConfirmationData({
        type: checkoutData.type,
        item: checkoutData.type === 'class' ? response.data.class : response.data.activity,
        itemName: checkoutData.name,
        originalCost,
        finalCost,
        discount,
        familyCouponsUsed: response.data.familyCouponsUsed,
        paymentMethod,
        familyMembersCount: selectedFamilyMembers.length
      });

      const memberResponse = await axios.get(`/api/members?memberId=${member.memberId}`);
      setMember(memberResponse.data.member);

      setShowCheckout(false);
      setCheckoutData(null);
      setSelectedFamilyMembers([]);
      setFamilyMemberCoupons({});

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
        text: error.response?.data?.message || (t('failed_to_generate_share_link'))
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
      text: t('copied_to_clipboard')
    });
  };

  const handlePurchaseCoupon = async (couponForSale) => {
    if (!member) {
      setMessage({
        type: 'error',
        text: t('please_login_first')
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
        text: t('purchase_successful')
      });

      await fetchCouponsForSale();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('purchase_failed'))
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
      </div>      {liffInitializing || loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h3 style={{ color: '#667eea', marginBottom: '15px' }}>
            {t('loading')}
          </h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {t('initializing')}
          </p>
        </div>
      ) : !isLoggedIn ? (
        /* Show LINE login button if user is not logged in */
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <span className="sun-icon">☀️</span>
              <span className="logo-text">SUNRISE YOUTH</span>
            </div>
            <button className="close-button" onClick={() => navigate('/')}>✕</button>
          </div>

          <div className="login-image-container">
            <div className="login-image-placeholder">
              <span style={{ fontSize: '80px' }}>👥</span>
            </div>
          </div>

          <h1 className="login-title">WELCOME<br/>BACK</h1>

          <p className="login-subtitle">
            Join the energy. Your community<br/>is waiting for your next big spark.
          </p>

          <button
            onClick={() => window.liff.login()}
            className="login-button"
          >
            <span className="line-icon">💬</span>
            Login with LINE
          </button>

          <p className="login-terms">
            BY CONTINUING, YOU AGREE TO OUR<br/>
            <span style={{ textDecoration: 'underline', fontWeight: '700' }}>TERMS & PRIVACY POLICY</span>
          </p>
        </div>
      ) : needsRegistration ? (
        /* Show registration form if member needs to complete registration */
        <div className="card">
          <h2 style={{ color: '#667eea', marginBottom: '20px', textAlign: 'center' }}>
            {t('complete_registration')}
          </h2>

          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
            {t('welcome_please_fill_in_the_following_information_t')}
          </p>

          <form onSubmit={handleRegistrationSubmit}>            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('name_')}
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
                {t('english_name')}
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
                {t('gender')}
              </label>
              <select
                required
                value={registrationData.gender}
                onChange={(e) => setRegistrationData({...registrationData, gender: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="男">{t('male')}</option>
                <option value="女">{t('female')}</option>
                <option value="prefer-not-to-say">{t('preferNotToSay')}</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('birth_date_')}
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
                {t('mobile_number')}
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
                {t('line_id')} <span style={{ color: '#999', fontSize: '0.9em' }}>({t('optional')})</span>
              </label>
              <input
                type="text"
                value={registrationData.contact.lineId}
                onChange={(e) => setRegistrationData({
                  ...registrationData,
                  contact: {...registrationData.contact, lineId: e.target.value}
                })}
                placeholder={t('enter_your_line_id')}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                {t('referral_code_optional')}
              </label>
              <input
                type="text"
                value={registrationData.referralCode}
                onChange={(e) => setRegistrationData({...registrationData, referralCode: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
            </div>

            {/* Family Members Section */}
            <div style={{ marginBottom: '20px', marginTop: '25px' }}>
              <h4 style={{ marginBottom: '10px', borderBottom: '2px solid #1976d2', paddingBottom: '8px' }}>
                {t('family_members_optional')}
              </h4>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                {t('add_your_children_information')}
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
                      {t('name_')}
                    </label>
                    <input
                      type="text"
                      value={fm.name}
                      onChange={(e) => handleRegistrationFamilyMemberChange(index, 'name', e.target.value)}
                      placeholder={t('enter_name')}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      {t('english_name_optional')}
                    </label>
                    <input
                      type="text"
                      value={fm.englishAlias}
                      onChange={(e) => handleRegistrationFamilyMemberChange(index, 'englishAlias', e.target.value)}
                      placeholder={t('enter_english_name')}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'flex', gap: '15px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                        {t('gender')}
                      </label>
                      <select
                        value={fm.gender}
                        onChange={(e) => handleRegistrationFamilyMemberChange(index, 'gender', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                      >
                        <option value="男">{t('male')}</option>
                        <option value="女">{t('female')}</option>
                        <option value="prefer-not-to-say">{t('preferNotToSay')}</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                        {t('birth_date')}
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
                    {t('remove_member')}
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={addRegistrationFamilyMember}
                style={{ marginTop: '10px' }}
              >
                + {t('add_family_member')}
              </button>
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
                ? (t('submitting'))
                : (t('complete_registration'))}
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
                🚪 {t('logout')}
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
              {t('classes')}
            </button>
            <button
              className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              {t('activities')}
            </button>
            <button
              className={`tab-button ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              {t('coupons')}
            </button>
            {member && member.membershipStatus === '協會會員' && (
              <button
                className={`tab-button ${activeTab === 'association' ? 'active' : ''}`}
                onClick={() => setActiveTab('association')}
              >
                {t('association_meetings')}
              </button>
            )}
          </div>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          {activeTab === 'profile' && (
            <div className="card profile-card">
              {!editMode ? (
                <>
                  <div className="profile-header">
                    <div className="profile-info">
                      <h2>{member.name}</h2>
                      {member.englishAlias && (
                        <p><strong>{t('englishAlias')}</strong> {member.englishAlias}</p>
                      )}
                      <p><strong>{t('member_id')}</strong> {member.memberId}</p>
                      <p><strong>{t('gender')}</strong> {member.gender}</p>
                      <p><strong>{t('birthDate')}</strong> {formatDate(member.birthDate)}</p>
                    </div>
                  </div>

                  <div className="contact-info">
                    <h3>{t('contact_information')}</h3>
                    <p><strong>{t('mobile')}</strong> {member.contact?.mobile}</p>
                    {member.contact?.phone && <p><strong>{t('phone')}</strong> {member.contact.phone}</p>}
                    {member.contact?.lineId && <p><strong>{t('lineId')}</strong> {member.contact.lineId}</p>}
                  </div>

                  <div className="membership-status" style={{
                    background: member.membershipStatus === '協會會員' ? '#e7f5ff' : '#f8f9fa',
                    border: `2px solid ${member.membershipStatus === '協會會員' ? '#74c0fc' : '#dee2e6'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    marginTop: '20px'
                  }}>
                    <h3 style={{ marginBottom: '15px', color: '#495057' }}>
                      {t('membership_status')}
                    </h3>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                        <strong>{t('current_status')}</strong>
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
                      <strong>{t('member_since')}</strong>
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
                        ⭐ {t('upgrade_to_association_member')}
                      </button>
                    )}
                    {member.membershipStatus === '協會會員' && member.membershipUpgradedDate && (
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                        <strong>{t('upgraded_on')}</strong>
                        {formatDate(member.membershipUpgradedDate)}
                      </p>
                    )}
                  </div>

                  {member.familyMembers && member.familyMembers.length > 0 && (
                    <div className="family-members">
                      <h3>{t('familyMembers')}</h3>
                      {member.familyMembers.map((fm, index) => (
                        <div key={index} className="family-member-item">
                          <p><strong>{t('fullName')}</strong> {fm.name}</p>
                          {fm.englishAlias && (
                            <p><strong>{t('englishAlias')}</strong> {fm.englishAlias}</p>
                          )}
                          <p><strong>{t('gender')}</strong> {fm.gender}</p>
                          <p><strong>{t('birthDate')}</strong> {formatDate(fm.birthDate)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="profile-actions">
                    <button onClick={startEdit} className="btn btn-primary">
                      {t('edit_profile')}
                    </button>
                    <button onClick={() => setMember(null)} className="btn btn-secondary">
                      {t('logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="edit-profile-form">
                  <h3>{t('edit_profile')}</h3>

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
                      <option value="男">{t('male')}</option>
                      <option value="女">{t('female')}</option>
                      <option value="prefer-not-to-say">{t('preferNotToSay')}</option>
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

                  <h4>{t('contact_information')}</h4>

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
                    <label>{t('lineId')} <span style={{ color: '#999', fontSize: '0.9em' }}>({t('optional')})</span></label>
                    <input
                      type="text"
                      name="contact.lineId"
                      value={editFormData.contact.lineId}
                      onChange={handleEditChange}
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
                            <option value="男">{t('male')}</option>
                            <option value="女">{t('female')}</option>
                            <option value="prefer-not-to-say">{t('preferNotToSay')}</option>
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
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={addFamilyMember} className="btn btn-secondary">
                    {t('_add_family_member')}
                  </button>

                  <div className="profile-actions">
                    <button onClick={saveEdit} className="btn btn-primary" disabled={loading}>
                      {loading ? (t('saving')) : (t('save'))}
                    </button>
                    <button onClick={cancelEdit} className="btn btn-secondary" disabled={loading}>
                      {t('cancel')}
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

              <h2>{selectedClass.classInfoId?.name || t('noData')}</h2>

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
                    {t('class_details')}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <strong>{t('classDate')}</strong>
                      <p style={{ marginTop: '5px' }}>{formatDate(selectedClass.date)}</p>
                    </div>
                    <div>
                      <strong>{t('time')}</strong>
                      <p style={{ marginTop: '5px' }}>{selectedClass.time}</p>
                    </div>
                    <div>
                      <strong>{t('cost')}</strong>
                      <p style={{ marginTop: '5px' }}>NT$ {selectedClass.classInfoId?.cost || 0}</p>
                    </div>
                    <div>
                      <strong>{t('participants')}</strong>
                      <p style={{ marginTop: '5px' }}>{selectedClass.currentParticipants} / {selectedClass.classInfoId?.maxParticipants || 0}</p>
                    </div>
                    <div>
                      <strong>{t('recommendedAge')}</strong>
                      <p style={{ marginTop: '5px' }}>
                        {Array.isArray(selectedClass.classInfoId?.ageRange)
                          ? selectedClass.classInfoId.ageRange.join(', ')
                          : selectedClass.classInfoId?.ageRange || 'all'}
                      </p>
                    </div>
                    {selectedClass.location && (
                      <div>
                        <strong>{t('location')}</strong>
                        <p style={{ marginTop: '5px' }}>📍 {selectedClass.location}</p>
                      </div>
                    )}
                  </div>
                </div>                {selectedClass.teacherId && Array.isArray(selectedClass.teacherId) && selectedClass.teacherId.length > 0 && (
                  <div style={{
                    background: '#fff8f0',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '2px solid #f0e0c0'
                  }}>
                    <h3 style={{ marginBottom: '15px', color: '#667eea', fontSize: '20px' }}>{t('hostInfo')}</h3>
                    {selectedClass.teacherId.map((teacher, index) => (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center', marginBottom: index < selectedClass.teacherId.length - 1 ? '20px' : '0', paddingBottom: index < selectedClass.teacherId.length - 1 ? '20px' : '0', borderBottom: index < selectedClass.teacherId.length - 1 ? '1px solid #f0e0c0' : 'none' }}>
                        {teacher.photo && (
                          <img
                            src={getImageSrc(teacher.photo)}
                            alt={teacher.name}
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
                          <h4 style={{ marginBottom: '10px', fontSize: '18px', textAlign: 'center' }}>{teacher.name}</h4>
                          {teacher.bio && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong>{t('hostBio')}</strong>
                              <p style={{ marginTop: '5px', lineHeight: '1.6', fontSize: '14px' }}>{teacher.bio}</p>
                            </div>
                          )}
                          {teacher.specialties && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong>{t('hostSpecialties')}</strong>
                              <p style={{ marginTop: '5px', fontSize: '14px' }}>{teacher.specialties}</p>
                            </div>
                          )}
                          {teacher.education && (
                            <div style={{ marginBottom: '10px' }}>
                              <strong>{t('hostEducation')}</strong>
                              <p style={{ marginTop: '5px', fontSize: '14px' }}>{teacher.education}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>              {(!selectedClass.teacherId || (Array.isArray(selectedClass.teacherId) && selectedClass.teacherId.length === 0)) && selectedClass.teacher && (
                <div style={{
                  background: '#fff8f0',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '2px solid #f0e0c0'
                }}>
                  <h3 style={{ marginBottom: '10px', color: '#667eea' }}>{t('hostInfo')}</h3>
                  <p><strong>{t('host')}</strong> {selectedClass.teacher}</p>
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
                        errorMsg.innerHTML = `<p style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">📍 ${selectedClass.location}<br/><small style="color: #666;">${t('map_failed_to_load_please_use_the_address_directly')}</small></p>`;
                        e.target.parentNode.appendChild(errorMsg);
                      }}
                    />
                  </div>
                </div>
              )}

              {isEnrolled('class', selectedClass._id) && (
                <div style={{
                  background: '#f8f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '2px solid #e0e8ff',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ marginBottom: '15px', color: '#667eea' }}>{t('enrollment_summary')}</h3>
                  {selectedClass.participants
                    .filter(p => p.memberId.toString() === member._id.toString())
                    .map((p, idx) => {
                      const itemCost = selectedClass.classInfoId?.cost || 0;
                      const discount = p.couponDiscount || 0;
                      const final = Math.max(0, itemCost - discount);
                      return (
                        <div key={idx} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: idx < selectedClass.participants.filter(p => p.memberId.toString() === member._id.toString()).length - 1 ? '1px solid #e0e8ff' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{p.memberName}</span>
                            <span>
                              {discount > 0 ? (
                                <>
                                  <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '14px' }}>NT$ {itemCost}</span>
                                  {' '}
                                  <span style={{ color: final === 0 ? '#2b8a3e' : '#667eea', fontWeight: 'bold' }}>NT$ {final}</span>
                                </>
                              ) : (
                                <span>NT$ {itemCost}</span>
                              )}
                            </span>
                          </div>
                          {discount > 0 && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                              ✓ {t('coupon_applied')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #667eea', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                    <span>{t('total')}</span>
                    <span style={{ color: '#667eea' }}>
                      NT$ {selectedClass.participants
                        .filter(p => p.memberId.toString() === member._id.toString())
                        .reduce((sum, p) => sum + Math.max(0, (selectedClass.classInfoId?.cost || 0) - (p.couponDiscount || 0)), 0)}
                    </span>
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
                      const myParticipants = classItem?.participants?.filter(p => p.memberId.toString() === member._id.toString()) || [];
                      const itemCost = classItem?.classInfoId?.cost || 0;
                      const totalCost = myParticipants.reduce((sum, p) => sum + Math.max(0, itemCost - (p.couponDiscount || 0)), 0);
                      const totalOriginalCost = itemCost * myParticipants.length;
                      const hasDiscount = totalCost < totalOriginalCost;

                      return (
                        <div key={enrollment._id} className="enrolled-item">
                          <div style={{ flex: 1 }}>
                            <p><strong>{enrollment.itemName}</strong></p>
                            {classItem && (
                              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                                {formatDate(classItem.date)} • {classItem.time}
                              </p>
                            )}
                            {classItem && (
                              <p style={{ fontSize: '14px', marginTop: '5px' }}>
                                {hasDiscount ? (
                                  <>
                                    <span style={{ textDecoration: 'line-through', color: '#999' }}>
                                      NT$ {totalOriginalCost}
                                    </span>
                                    {' '}
                                    <span style={{ color: totalCost === 0 ? '#2b8a3e' : '#667eea', fontWeight: 'bold' }}>
                                      NT$ {totalCost}
                                    </span>
                                  </>
                                ) : (
                                  <span>NT$ {totalOriginalCost}</span>
                                )}
                                {myParticipants.length > 1 && (
                                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                                    ({myParticipants.length} {t('language') === 'zh' ? '人' : 'people'})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span className={`status-badge ${itemCost === 0 ? 'paid' : (myParticipants.every(p => p.paid) ? 'paid' : 'unpaid')}`}>
                              {itemCost === 0 ? t('free') : (myParticipants.every(p => p.paid) ? t('paid') : t('unpaid'))}
                            </span>
                            {classItem && (
                              <button
                                onClick={() => setSelectedClass(classItem)}
                                className="btn btn-small"
                                style={{ padding: '6px 12px', fontSize: '14px' }}
                              >
                                {t('view_details')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="empty-message">{t('no_enrolled_classes')}</p>
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
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
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
                      <h4>{classItem.classInfoId?.name || t('noData')}</h4>
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
                        <p><strong>{t('classDate')}</strong> {formatDate(classItem.date)}</p>
                        <p><strong>{t('host')}</strong> {classItem.teacher}</p>
                        <p><strong>{t('time')}</strong> {classItem.time}</p>
                        <p><strong>{t('cost')}</strong> NT$ {classItem.classInfoId?.cost || 0}</p>
                        <p><strong>{t('participants')}</strong> {classItem.currentParticipants} / {classItem.classInfoId?.maxParticipants || 0}</p>
                        <p><strong>{t('recommendedAge')}</strong> {Array.isArray(classItem.classInfoId?.ageRange) ? classItem.classInfoId.ageRange.join(', ') : classItem.classInfoId?.ageRange || 'all'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          onClick={() => setSelectedClass(classItem)}
                          className="btn btn-secondary"
                          style={{ flex: 1 }}
                        >
                          {t('view_details')}
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

          {activeTab === 'activities' && selectedActivity && (
            <div className="card">
              <button
                onClick={() => setSelectedActivity(null)}
                className="btn btn-secondary"
                style={{ marginBottom: '20px' }}
              >
                ← {t('back')}
              </button>

              <h2>{selectedActivity.name}</h2>

              {selectedActivity.banner && (
                <img
                  src={getImageSrc(selectedActivity.banner)}
                  alt={selectedActivity.name}
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
                {selectedActivity.description || ''}
              </p>

              <div style={{
                background: '#f8f9ff',
                padding: '20px',
                borderRadius: '8px',
                border: '2px solid #e0e8ff',
                marginBottom: '20px'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#667eea', fontSize: '20px' }}>
                  {t('activity_details')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <strong>{t('date')}</strong>
                    <p style={{ marginTop: '5px' }}>{formatDate(selectedActivity.date)}</p>
                  </div>
                  <div>
                    <strong>{t('time')}</strong>
                    <p style={{ marginTop: '5px' }}>{selectedActivity.time}</p>
                  </div>
                  {selectedActivity.location && (
                    <div>
                      <strong>{t('location')}</strong>
                      <p style={{ marginTop: '5px' }}>📍 {selectedActivity.location}</p>
                    </div>
                  )}
                  <div>
                    <strong>{t('host')}</strong>
                    <p style={{ marginTop: '5px' }}>{selectedActivity.teacher}</p>
                  </div>
                  <div>
                    <strong>{t('cost')}</strong>
                    <p style={{ marginTop: '5px' }}>NT$ {selectedActivity.cost}</p>
                  </div>
                  <div>
                    <strong>{t('participants')}</strong>
                    <p style={{ marginTop: '5px' }}>{selectedActivity.currentParticipants} / {selectedActivity.maxParticipants}</p>
                  </div>
                  <div>
                    <strong>{t('recommendedAge')}</strong>
                    <p style={{ marginTop: '5px' }}>
                      {Array.isArray(selectedActivity.ageRange)
                        ? selectedActivity.ageRange.join(', ')
                        : selectedActivity.ageRange || 'all'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedActivity.location && (
                <div style={{ marginBottom: '20px' }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedActivity.location)}&output=embed`}
                    width="100%"
                    height="300"
                    style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Activity Location Map"
                  />
                </div>
              )}

              {isEnrolled('activity', selectedActivity._id) ? (
                <button className="btn btn-secondary" disabled>{t('enrolled')}</button>
              ) : selectedActivity.currentParticipants >= selectedActivity.maxParticipants ? (
                <button className="btn btn-secondary" disabled>{t('full')}</button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleEnroll('activity', selectedActivity._id, selectedActivity.name)}
                >
                  {t('enroll')}
                </button>
              )}
            </div>
          )}

          {activeTab === 'activities' && !selectedActivity && (
            <div className="card">
              <h3>{t('activities')}</h3>

                <h4 className="section-subtitle">{t('registeredActivities')}</h4>
                <div className="enrolled-list">
                  {getEnrolledItems('activity').length > 0 ? (
                    getEnrolledItems('activity').map((enrollment) => {
                      const activity = activities.find(a => a._id === enrollment.itemId);
                      const myParticipants = activity?.participants?.filter(p => p.memberId.toString() === member._id.toString()) || [];
                      const itemCost = activity?.cost || 0;
                      const totalCost = myParticipants.reduce((sum, p) => sum + Math.max(0, itemCost - (p.couponDiscount || 0)), 0);
                      const totalOriginalCost = itemCost * myParticipants.length;
                      const hasDiscount = totalCost < totalOriginalCost;

                      return (
                      <div key={enrollment._id} className="enrolled-item">
                        <div style={{ flex: 1 }}>
                          <p><strong>{enrollment.itemName}</strong></p>
                          {activity && (
                            <p style={{ fontSize: '14px', marginTop: '5px' }}>
                              {hasDiscount ? (
                                <>
                                  <span style={{ textDecoration: 'line-through', color: '#999' }}>
                                    NT$ {totalOriginalCost}
                                  </span>
                                  {' '}
                                  <span style={{ color: totalCost === 0 ? '#2b8a3e' : '#667eea', fontWeight: 'bold' }}>
                                    NT$ {totalCost}
                                  </span>
                                </>
                              ) : (
                                <span>NT$ {totalOriginalCost}</span>
                              )}
                              {myParticipants.length > 1 && (
                                <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                                  ({myParticipants.length} {t('language') === 'zh' ? '人' : 'people'})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <span className={`status-badge ${itemCost === 0 ? 'paid' : (myParticipants.every(p => p.paid) ? 'paid' : 'unpaid')}`}>
                          {itemCost === 0 ? t('free') : (myParticipants.every(p => p.paid) ? t('paid') : t('unpaid'))}
                        </span>
                      </div>
                      );
                    })
                  ) : (
                    <p className="empty-message">{t('no_enrolled_activities')}</p>
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
                        <p><strong>{t('host')}</strong> {activity.teacher}</p>
                        <p><strong>{t('time')}</strong> {activity.time}</p>
                        {activity.location && (
                          <p><strong>{t('location')}</strong> 📍 {activity.location}</p>
                        )}
                        <p><strong>{t('cost')}</strong> NT$ {activity.cost}</p>
                        <p><strong>{t('participants')}</strong> {activity.currentParticipants} / {activity.maxParticipants}</p>
                        <p><strong>{t('recommendedAge')}</strong> {Array.isArray(activity.ageRange) ? activity.ageRange.join(', ') : activity.ageRange || 'all'}</p>
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
                {t('coupon_store')}
              </h3>

              {couponsForSale.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '20px', fontSize: '20px', textAlign: 'center' }}>
                    {t('purchase_coupons')}
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
                                ? (t('trial'))
                                : (t('discount'))}
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
                                {t('stock')}{couponForSale.stock}
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
                              {t('discount_')}{profile.discountPercent}%
                            </p>
                          )}
                          <p style={{ fontSize: '20px', marginBottom: '15px', fontWeight: 'bold', color: '#28a745' }}>
                            {t('price')}{couponForSale.price}
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
                              t('purchasing')
                            ) : couponForSale.stock !== -1 && couponForSale.stock <= 0 ? (
                              t('sold_out')
                            ) : (
                              <>💰 {t('purchase')}</>
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
                {t('my_owned_coupons')}
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
                  {t('reminder_coupons_can_only_be_shared_to_non_members')}
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
                              ? (t('trial'))
                              : (t('discount'))}
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
                              {t('used_up')}
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
                              {t('expired')}
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
                              ⚠️ {daysLeft} {t('days_left')}
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
                              {daysLeft} {t('days_left')}
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
                            {t('discount_')}{coupon.discountPercent}%
                          </p>
                        )}
                        <p style={{ fontSize: '14px', marginBottom: '8px', color: remainingUses > 0 ? '#495057' : '#868e96' }}>
                          <strong>{t('remaining_uses')}</strong>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: remainingUses > 0 ? '#667eea' : '#868e96' }}>
                            {remainingUses}
                          </span> / {coupon.quantity}
                        </p>
                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '15px' }}>
                          {t('created')}{formatDate(coupon.createdAt)}
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
                              t('loading')
                            ) : (
                              <>🔗 {t('share_to_new_friends')}</>
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
                    {t('no_coupons_yet')}
                  </h4>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {t('you_don_t_have_any_coupons_yet_follow_our_events_to_get_coupons')}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'association' && member && member.membershipStatus === '協會會員' && (
            <div className="card">
              <h3>{t('association_meetings')}</h3>

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
                    {t('member_statistics')}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {t('member_since_')}
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
                        {memberStats.meetingsAttendedThisYear} {t('times')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Registered Meetings */}
              <h4 className="section-subtitle">{t('registered_meetings')}</h4>
              {loadingMeetings ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                  <p style={{ color: '#666' }}>{t('loading')}</p>
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
                            {t('registered_')}
                          </span>
                          <button
                            onClick={() => setShowMeetingDetails(meeting)}
                            className="btn btn-small btn-primary"
                            style={{ padding: '5px 15px', fontSize: '13px' }}
                          >
                            {t('view_details')}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">{t('no_registered_meetings')}</p>
                  )}
                </div>
              )}

              {/* Upcoming Meetings */}
              <h4 className="section-subtitle">{t('upcoming_meetings')}</h4>
              {loadingMeetings ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                  <p style={{ color: '#666' }}>{t('loading')}</p>
                </div>
              ) : (
              <div className="grid">
                {associationMeetings.filter(m => !isMeetingRegistered(m._id)).length > 0 ? (
                  associationMeetings.filter(m => !isMeetingRegistered(m._id)).map((meeting) => (
                    <div key={meeting._id} className="item-card">
                      <h4>{meeting.agenda}</h4>
                      <div className="item-details">
                        <p><strong>{t('date')}</strong> {new Date(meeting.date).toLocaleDateString('zh-TW')}</p>
                        <p><strong>{t('time')}</strong> {meeting.time}</p>
                        {meeting.location && (
                          <p><strong>{t('location')}</strong> 📍 {meeting.location}</p>
                        )}
                        <p><strong>{t('type')}</strong> {meeting.memberType}</p>
                        <p>
                          <strong>{t('registered')}</strong> {meeting.participants.length}
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
                            ⚠️ {t('mandatory_meeting')}
                          </p>
                          <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '12px' }}>
                            {t('members_must_attend_or_submit_absence_form')}
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
                            ? (t('registering'))
                            : (t('register'))
                          }
                        </button>
                        {meeting.mandatory && !hasSubmittedAbsence(meeting._id) && (
                          <button
                            onClick={() => handleCannotAttend(meeting._id)}
                            className="btn btn-secondary"
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            {t('cannot_attend')}
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
                                  ? `✓ ${t('absence_approved')}`
                                  : `⏳ ${t('absence_pending')}`
                                }
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-message">{t('no_upcoming_meetings_available')}</p>
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
            {t('failed_to_load')}
          </h3>
          {message.text && (
            <div className={`message ${message.type}`} style={{ marginBottom: '20px' }}>
              {message.text}
            </div>
          )}
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            {t('please_refresh_the_page_or_contact_administrator')}
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
            {t('refresh_page')}
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
              {t('select_payment_method')}
            </h2>

            {member.familyMembers && member.familyMembers.length > 0 && (
              <div style={{
                background: '#fff9e6',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '2px solid #ffd700'
              }}>
                <h4 style={{ color: '#667eea', marginBottom: '15px' }}>
                  {t('language') === 'zh' ? '選擇要報名的人員' : 'Select People to Enroll'}
                </h4>

                {/* Main member */}
                {(() => {
                  const availableCoupons = member.coupons.filter(c => {
                    const remaining = c.quantity - c.usedCount;
                    if (remaining <= 0) return false;
                    if (c.type === 'trial' && checkoutData.classInfoId) {
                      return c.classInfoId?.toString() === checkoutData.classInfoId;
                    }
                    return c.type === 'discount';
                  });

                  return (
                    <div style={{ marginBottom: '15px', padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedFamilyMembers.includes('self')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFamilyMembers([...selectedFamilyMembers, 'self']);
                            } else {
                              setSelectedFamilyMembers(selectedFamilyMembers.filter(i => i !== 'self'));
                              const newFMCoupons = {...familyMemberCoupons};
                              delete newFMCoupons['self'];
                              setFamilyMemberCoupons(newFMCoupons);
                            }
                          }}
                          style={{ marginRight: '10px' }}
                        />
                        <strong>{member.name}</strong> (+NT$ {checkoutData.cost})
                      </label>
                      {selectedFamilyMembers.includes('self') && availableCoupons.length > 0 && (
                        <select
                          value={familyMemberCoupons['self'] || ''}
                          onChange={(e) => setFamilyMemberCoupons({...familyMemberCoupons, 'self': e.target.value})}
                          style={{ marginLeft: '30px', padding: '5px', width: 'calc(100% - 30px)' }}
                        >
                          <option value="">{t('language') === 'zh' ? '不使用優惠券' : 'No coupon'}</option>
                          {availableCoupons.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({c.type === 'trial' ? t('language') === 'zh' ? '免費' : 'Free' : `${c.discountPercent}% ${t('off')}`})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })()}

                {/* Family members */}
                {member.familyMembers.map((fm, index) => {
                  const availableCoupons = member.coupons.filter(c => {
                    const remaining = c.quantity - c.usedCount;
                    if (remaining <= 0) return false;
                    if (c.type === 'trial' && checkoutData.classInfoId) {
                      return c.classInfoId?.toString() === checkoutData.classInfoId;
                    }
                    return c.type === 'discount';
                  });

                  return (
                    <div key={index} style={{ marginBottom: '15px', padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedFamilyMembers.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFamilyMembers([...selectedFamilyMembers, index]);
                            } else {
                              setSelectedFamilyMembers(selectedFamilyMembers.filter(i => i !== index));
                              const newFMCoupons = {...familyMemberCoupons};
                              delete newFMCoupons[index];
                              setFamilyMemberCoupons(newFMCoupons);
                            }
                          }}
                          style={{ marginRight: '10px' }}
                        />
                        <strong>{fm.name}</strong> (+NT$ {checkoutData.cost})
                      </label>
                      {selectedFamilyMembers.includes(index) && availableCoupons.length > 0 && (
                        <select
                          value={familyMemberCoupons[index] || ''}
                          onChange={(e) => setFamilyMemberCoupons({...familyMemberCoupons, [index]: e.target.value})}
                          style={{ marginLeft: '30px', padding: '5px', width: 'calc(100% - 30px)' }}
                        >
                          <option value="">{t('language') === 'zh' ? '不使用優惠券' : 'No coupon'}</option>
                          {availableCoupons.map(c => (
                            <option key={c._id} value={c._id}>
                              {c.name} ({c.type === 'trial' ? t('language') === 'zh' ? '免費' : 'Free' : `${c.discountPercent}% ${t('off')}`})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{
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
                <strong>{t('cost')}</strong>
                <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                  NT$ {(() => {
                    let total = 0;
                    selectedFamilyMembers.forEach(fmIndex => {
                      let itemCost = checkoutData.cost;
                      const couponId = familyMemberCoupons[fmIndex];
                      if (couponId) {
                        const coupon = member.coupons.find(c => c._id === couponId);
                        if (coupon) {
                          if (coupon.type === 'trial') {
                            itemCost = 0;
                          } else {
                            itemCost = itemCost - Math.round(itemCost * coupon.discountPercent / 100);
                          }
                        }
                      }
                      total += itemCost;
                    });
                    return total;
                  })()}
                </span>
                {selectedFamilyMembers.length > 0 && (
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {' '}({selectedFamilyMembers.length} {t('language') === 'zh' ? '人' : 'person(s)'})
                  </span>
                )}
              </p>
            </div>            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              <button
                onClick={() => handleCompleteEnrollment('in-person', null)}
                className="btn btn-primary"
                disabled={completingEnrollment || selectedFamilyMembers.length === 0}
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
                  t('processing')
                ) : (
                  <>💵 {t('pay_in_person')}</>
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
                💳 {t('credit_card_under_construction')}
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
                💚 {t('line_pay_under_construction')}
              </button>
            </div>

            <button
              onClick={() => {
                setShowCheckout(false);
                setCheckoutData(null);
                setSelectedFamilyMembers([]);
                setFamilyMemberCoupons({});
              }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {showShareModal && shareCoupon && (
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
              {t('share_coupon_to_new_friends')}
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
                    {t('this_coupon_can_only_be_shared_with_friends_who_havent_added_our_line_official_account_yet')}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#856404' }}>
                    {t('when_your_friend_joins_via_the_link_and_completes_')}
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
                    ? (t('trial'))
                    : (t('discount'))}
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
                  {t('generating_share_link')}
                </p>
              </div>
            ) : shareLink ? (
              <>                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <p style={{ marginBottom: '15px', fontWeight: '600', color: '#333' }}>
                    {t('scan_qr_code_to_claim')}
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink.claimUrl)}`}
                    alt={t('qrCodeImage')}
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
                    {t('scan_to_visit_claim_page_and_follow_instructions')}
                  </p>
                </div>                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    {t('or_share_this_link')}
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
                      {t('copy')}
                    </button>
                  </div>
                </div>                <a
                  href={`https://line.me/R/msg/text/?${encodeURIComponent(
                    `${t('i_shared_a_coupon_with_youn')}${shareLink.claimUrl}`
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
                  💬 {t('share_via_line_to_new_friends')}
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
                    {t('recipients_need_to_add_the_line_official_account_a')}
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
              {t('close')}
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
                {t('enrollment_successful')}
              </h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {t('please_save_this_information_and_show_it_on_the_cl')}
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
                {t('enrollment_details')}
              </h3>

              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {paymentConfirmationData.type === 'class'
                    ? (t('class_name'))
                    : (t('activity_name'))}
                </p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  {paymentConfirmationData.itemName}
                </p>
              </div>

              {paymentConfirmationData.type === 'class' && paymentConfirmationData.item?.classInfoId && (
                <>
                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      {t('date')}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                      📅 {new Date(paymentConfirmationData.item.date).toLocaleDateString(
                        t('en_us'),
                        { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
                      )}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      {t('time')}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                      🕐 {paymentConfirmationData.item.time}
                    </p>
                  </div>

                  {paymentConfirmationData.item.location && (
                    <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                        {t('location')}
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
                  {t('payment_method')}
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {paymentConfirmationData.paymentMethod === 'in-person'
                    ? (t('pay_in_person'))
                    : (t('credit_card'))}
                </p>
              </div>

              {paymentConfirmationData.discount > 0 && (
                <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    {t('original_price')}
                  </p>
                  <p style={{ fontSize: '16px', textDecoration: 'line-through', color: '#999' }}>
                    NT$ {paymentConfirmationData.originalCost}
                  </p>
                  <p style={{ fontSize: '14px', color: '#c92a2a', fontWeight: 'bold', marginTop: '5px' }}>
                    {paymentConfirmationData.couponUsed?.type === 'trial'
                      ? (t('trial_coupon_applied_free'))
                      : (t('language') === 'zh'
                        ? `✓ 折扣券已使用 (-NT$ ${paymentConfirmationData.discount})`
                        : `✓ Discount Applied (-NT$ ${paymentConfirmationData.discount})`)}
                  </p>
                </div>
              )}

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #667eea' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {paymentConfirmationData.finalCost === 0
                    ? (t('amount_paid'))
                    : (paymentConfirmationData.paymentMethod === 'in-person'
                      ? (t('language') === 'zh' ? '應付金額' : 'Amount to Pay')
                      : (t('amount_paid')))}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: paymentConfirmationData.finalCost === 0 ? '#2b8a3e' : '#667eea' }}>
                  {paymentConfirmationData.finalCost === 0
                    ? (t('free'))
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
                  ⚠️ {t('please_remember_to_pay_at_the_venue')}
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
                💡 {t('please_show_this_confirmation_when_you_arrive_for_class_you_can_also_view_your_enrollment_in_my_courses')}
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
              {t('done')}
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
                {t('upgrade_to_association_member')}
              </h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {t('choose_payment_method_and_complete_upgrade')}
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
                {t('upgrade_fee')}
              </h3>

              <div style={{
                padding: '20px',
                background: 'white',
                border: '2px solid #4dabf7',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '8px', color: '#495057' }}>
                  {t('annual_fee')}
                </div>
                <div style={{ fontSize: '16px', color: '#666', marginBottom: '15px' }}>
                  NT$ 3,000 / {t('year')}
                </div>
              </div>

              <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '15px'
              }}>
                <p style={{ margin: 0, fontSize: '16px', color: '#856404', fontWeight: 'bold', textAlign: 'center' }}>
                  💰 {t('amount_to_pay')}
                  NT$ 3,000
                </p>
              </div>
            </div>

            <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#495057' }}>
              {t('choose_payment_method')}
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
                      text: error.response?.data?.message || (t('upgrade_failed'))
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
                  t('processing')
                ) : (
                  <>💵 {t('pay_in_person')}</>
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
                💳 {t('credit_card_under_construction')}
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
                💚 {t('line_pay_under_construction')}
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
                ℹ️ {t('you_will_immediately_enjoy_association_member_bene')}
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
              {t('cancel')}
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
                {t('upgrade_details')}
              </h3>

              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {t('upgrade_to')}
                </p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                  ⭐ 協會會員
                </p>
              </div>

              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e9ecef' }}>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  {t('payment_method')}
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  💵 {t('pay_in_person')}
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
                  ⚠️ {t('important_notice')}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#856404', lineHeight: '1.6' }}>
                  {t('1_please_pay_nt_3000_in_personn2_after_payment_adm')}
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
                💡 {t('you_can_view_your_membership_status_in_your_profil')}
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
              {t('done')}
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
              {t('meeting_details')}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '18px', marginBottom: '15px' }}>{showMeetingDetails.agenda}</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p><strong>{t('date')}</strong> {new Date(showMeetingDetails.date).toLocaleDateString('zh-TW')}</p>
                <p><strong>{t('time')}</strong> {showMeetingDetails.time}</p>
                <p><strong>{t('type')}</strong> {showMeetingDetails.memberType}</p>

                {showMeetingDetails.meetingType === 'in-person' && showMeetingDetails.location && (
                  <>
                    <p><strong>{t('location')}</strong> 📍 {showMeetingDetails.location}</p>
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
                    <p><strong>{t('zoom_url')}</strong></p>
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
                      ⚠️ {t('mandatory_meeting')}
                    </p>
                    <p style={{ margin: '5px 0 0 0', color: '#856404', fontSize: '12px' }}>
                      {t('members_must_attend_or_submit_absence_form')}
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
              {t('close')}
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
              {t('submit_absence_form')}
            </h3>

            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404', lineHeight: '1.6' }}>
                <strong>{t('please_follow_these_steps')}</strong>
              </p>
              <ol style={{ margin: '10px 0 0 20px', padding: 0, fontSize: '14px', color: '#856404' }}>
                <li>
                  {t('download_the_absence_form_template')}
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
                    📥 {t('click_to_download_form')}
                  </a>
                </li>
                <li>{t('print_and_fill_out_the_form')}</li>
                <li>{t('take_a_clear_photo_of_the_completed_form')}</li>
                <li>{t('upload_the_photo')}</li>
              </ol>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {t('upload_form_photo')}
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
                {t('supported_formats_jpg_png_max_5mb')}
              </p>
            </div>

            {absenceFormImage && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  {t('preview')}
                </p>
                <img
                  src={absenceFormImage}
                  alt={t('formPreview')}
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
                  ? (t('uploading'))
                  : (t('submit'))
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
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
