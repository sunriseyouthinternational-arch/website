import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classInfos, setClassInfos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState({});
  const [referralLeaderboard, setReferralLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedClassInfo, setSelectedClassInfo] = useState(null);

  // Form states for adding new class info
  const [showAddClassInfoForm, setShowAddClassInfoForm] = useState(false);
  const [newClassInfo, setNewClassInfo] = useState({
    name: '',
    description: '',
    cost: '',
    maxParticipants: '',
    banner: ''
  });

  // Form states for adding new host class
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClass, setNewClass] = useState({
    classInfoId: '',
    teacherId: '',
    teacher: '',
    time: '',
    date: '',
    location: ''
  });

  // Form states for adding new activity
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    cost: '',
    teacherId: '',
    teacher: '',
    maxParticipants: '',
    banner: ''
  });

  // Form states for adding new teacher
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    bio: '',
    specialties: '',
    education: '',
    phone: '',
    lineId: '',
    photo: ''
  });

  // Form states for adding coupons to members
  const [showAddCouponForm, setShowAddCouponForm] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const [newCoupon, setNewCoupon] = useState({
    type: 'trial',
    classInfoId: '',
    discountPercent: '',
    name: '',
    description: '',
    image: '',
    quantity: 1,
    expiryDate: ''
  });

  // Coupon Management states
  const [couponProfiles, setCouponProfiles] = useState([]);
  const [couponsForSale, setCouponsForSale] = useState([]);
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);
  const [showAddForSaleForm, setShowAddForSaleForm] = useState(false);
  const [newProfile, setNewProfile] = useState({
    type: 'trial',
    classInfoId: '',
    discountPercent: '',
    name: '',
    description: '',
    image: ''
  });
  const [newForSale, setNewForSale] = useState({
    couponProfileId: '',
    price: '',
    stock: -1
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, classesRes, classInfosRes, activitiesRes, teachersRes, statsRes, leaderboardRes, profilesRes, forSaleRes] = await Promise.all([
        axios.get('/api/admin?resource=members'),
        axios.get('/api/classes'),
        axios.get('/api/class-info'),
        axios.get('/api/activities'),
        axios.get('/api/teachers'),
        axios.get('/api/admin?resource=stats'),
        axios.get('/api/admin?resource=referral-leaderboard'),
        axios.get('/api/coupon-profiles'),
        axios.get('/api/coupons-for-sale')
      ]);

      setMembers(membersRes.data.members);
      setClasses(classesRes.data.classes);
      setClassInfos(classInfosRes.data.classInfos);
      setActivities(activitiesRes.data.activities);
      setTeachers(teachersRes.data.teachers);
      setStats(statsRes.data);
      setReferralLeaderboard(leaderboardRes.data.leaderboard);
      setCouponProfiles(profilesRes.data.profiles);
      setCouponsForSale(forSaleRes.data.coupons);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin');
      }
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/admin');
  };

  const handleNewClassInfoBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // No file size restriction as per user request
    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewClassInfo({ ...newClassInfo, banner: reader.result });
      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '圖片上傳成功' : 'Image uploaded successfully'
      });
    };
    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片上傳失敗' : 'Failed to upload image'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleActivityBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片大小不能超過 2MB' : 'Image size must be less than 2MB'
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

    // Validate image dimensions (should be 500x300)
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        if (img.width !== 500 || img.height !== 300) {
          setMessage({
            type: 'error',
            text: t('language') === 'zh'
              ? `圖片尺寸必須為 500x300 像素（目前為 ${img.width}x${img.height}）`
              : `Image dimensions must be 500x300 pixels (current: ${img.width}x${img.height})`
          });
          return;
        }

        setNewActivity({ ...newActivity, banner: event.target.result });
        setMessage({
          type: 'success',
          text: t('language') === 'zh' ? '圖片上傳成功' : 'Image uploaded successfully'
        });
      };
      img.src = event.target.result;
    };

    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片上傳失敗' : 'Failed to upload image'
      });
    };

    reader.readAsDataURL(file);
  };

  const handleAddClassInfo = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/class-info', newClassInfo, {
        headers: { 'Content-Type': 'application/json' }
      });

      setMessage({
        type: 'success',
        text: t('classInfoAddSuccess')
      });
      setShowAddClassInfoForm(false);
      setNewClassInfo({
        name: '',
        description: '',
        cost: '',
        maxParticipants: '',
        banner: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding class info:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();

    // Validate time input
    const timeParts = newClass.time.split(/[:\s-]+/);
    if (timeParts.length !== 4) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請填寫完整的時間' : 'Please fill in complete time'
      });
      return;
    }

    const startHour = parseInt(timeParts[0]);
    const startMin = parseInt(timeParts[1]);
    const endHour = parseInt(timeParts[2]);
    const endMin = parseInt(timeParts[3]);

    // Check for invalid numbers
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '時間格式不正確' : 'Invalid time format'
      });
      return;
    }

    // Check time ranges
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '小時必須在 0-23 之間' : 'Hours must be between 0-23'
      });
      return;
    }

    if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '分鐘必須在 0-59 之間' : 'Minutes must be between 0-59'
      });
      return;
    }

    // Convert to minutes for comparison
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    // Check if end time is after start time
    if (endTotalMin <= startTotalMin) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time'
      });
      return;
    }

    // Check if duration is reasonable (at least 15 minutes, max 12 hours)
    const duration = endTotalMin - startTotalMin;
    if (duration < 15) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '課程時間至少需要 15 分鐘' : 'Class must be at least 15 minutes long'
      });
      return;
    }

    if (duration > 720) { // 12 hours
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '課程時間不可超過 12 小時' : 'Class cannot exceed 12 hours'
      });
      return;
    }

    // Format time properly
    const formattedTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    try {
      const response = await axios.post('/api/classes', { ...newClass, time: formattedTime }, {
        headers: { 'Content-Type': 'application/json' }
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '開課成功' : 'Class hosted successfully'
      });
      setShowAddClassForm(false);
      setNewClass({
        classInfoId: '',
        teacherId: '',
        teacher: '',
        time: '',
        date: '',
        location: ''
      });

      // Refresh only classes instead of all data
      const classesRes = await axios.get('/api/classes');
      setClasses(classesRes.data.classes);
    } catch (error) {
      console.error('Error adding class:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();

    // Validate time input
    const timeParts = newActivity.time.split(/[:\s-]+/);
    if (timeParts.length !== 4) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請填寫完整的時間' : 'Please fill in complete time'
      });
      return;
    }

    const startHour = parseInt(timeParts[0]);
    const startMin = parseInt(timeParts[1]);
    const endHour = parseInt(timeParts[2]);
    const endMin = parseInt(timeParts[3]);

    // Check for invalid numbers
    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '時間格式不正確' : 'Invalid time format'
      });
      return;
    }

    // Check time ranges
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '小時必須在 0-23 之間' : 'Hours must be between 0-23'
      });
      return;
    }

    if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '分鐘必須在 0-59 之間' : 'Minutes must be between 0-59'
      });
      return;
    }

    // Convert to minutes for comparison
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    // Check if end time is after start time
    if (endTotalMin <= startTotalMin) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time'
      });
      return;
    }

    // Check if duration is reasonable (at least 15 minutes, max 12 hours)
    const duration = endTotalMin - startTotalMin;
    if (duration < 15) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '活動時間至少需要 15 分鐘' : 'Activity must be at least 15 minutes long'
      });
      return;
    }

    if (duration > 720) { // 12 hours
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '活動時間不可超過 12 小時' : 'Activity cannot exceed 12 hours'
      });
      return;
    }

    // Format time properly
    const formattedTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    try {
      await axios.post('/api/activities', { ...newActivity, time: formattedTime }, {
        headers: { 'Content-Type': 'application/json' }
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '活動添加成功' : 'Activity added successfully'
      });
      setShowAddActivityForm(false);
      setNewActivity({
        name: '',
        description: '',
        date: '',
        time: '',
        location: '',
        cost: '',
        teacherId: '',
        teacher: '',
        maxParticipants: '',
        banner: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding activity:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleUpdateClassInfo = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/class-info?id=${selectedClassInfo._id}`, selectedClassInfo, {
        headers: { 'Content-Type': 'application/json' }
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '課程資訊更新成功' : 'Class info updated successfully'
      });

      // Refresh classInfos
      const classInfosRes = await axios.get('/api/class-info');
      setClassInfos(classInfosRes.data.classInfos);
      setSelectedClassInfo(null);
    } catch (error) {
      console.error('Error updating class info:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleDeleteClassInfo = async (id) => {
    if (!window.confirm(t('language') === 'zh' ? '確定要刪除嗎？此操作將影響所有使用此課程資訊的開課。' : 'Are you sure you want to delete? This will affect all classes using this info.')) {
      return;
    }

    try {
      // Optimistically update UI
      setClassInfos(prev => prev.filter(ci => ci._id !== id));
      setSelectedClassInfo(null);

      // Then delete on server
      await axios.delete(`/api/class-info?id=${id}`);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '課程資訊刪除成功' : 'Class info deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting class info:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
      // Refresh on error to get correct state
      const classInfosRes = await axios.get('/api/class-info');
      setClassInfos(classInfosRes.data.classInfos);
    }
  };

  const handleTeacherPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片大小不能超過 2MB' : 'Image size must be less than 2MB'
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTeacher({ ...newTeacher, photo: reader.result });
      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '圖片上傳成功' : 'Image uploaded successfully'
      });
    };
    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片上傳失敗' : 'Failed to upload image'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClassInfoBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // No file size restriction as per user request
    // Check file type
    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedClassInfo({ ...selectedClassInfo, banner: reader.result });
      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '圖片上傳成功' : 'Image uploaded successfully'
      });
    };
    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片上傳失敗' : 'Failed to upload image'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/teachers', newTeacher, {
        headers: { 'Content-Type': 'application/json' }
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '主辦人添加成功' : 'Host added successfully'
      });
      setShowAddTeacherForm(false);
      setNewTeacher({
        name: '',
        bio: '',
        specialties: '',
        education: '',
        phone: '',
        lineId: '',
        photo: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding teacher:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm(t('language') === 'zh' ? '確定要刪除嗎？' : 'Are you sure you want to delete?')) {
      return;
    }

    try {
      const endpoint = type === 'class' ? `/api/classes?id=${id}` : `/api/activities?id=${id}`;

      // Optimistically update UI
      if (type === 'class') {
        setClasses(prev => prev.filter(c => c._id !== id));
      } else {
        setActivities(prev => prev.filter(a => a._id !== id));
      }
      setSelectedItem(null);

      // Then delete on server
      await axios.delete(endpoint);

      setMessage({
        type: 'success',
        text: t('language') === 'zh'
          ? `${type === 'class' ? '課程' : '活動'}刪除成功`
          : `${type === 'class' ? 'Class' : 'Activity'} deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
      // Refresh on error to get correct state
      fetchData();
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm(t('language') === 'zh' ? '確定要刪除嗎？' : 'Are you sure you want to delete?')) {
      return;
    }

    try {
      await axios.delete(`/api/teachers?id=${id}`);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '主辦人刪除成功' : 'Host deleted successfully'
      });
      setSelectedTeacher(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  // Coupon handlers
  const handleCouponImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCoupon(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCouponTypeChange = (type) => {
    setNewCoupon(prev => {
      const updated = { ...prev, type };

      // Auto-fill name and description when type changes
      if (type === 'trial' && prev.classInfoId) {
        const classInfo = classInfos.find(c => c._id === prev.classInfoId);
        if (classInfo) {
          updated.name = t('language') === 'zh'
            ? `${classInfo.name} 體驗券`
            : `${classInfo.name} Trial Coupon`;
          updated.description = t('language') === 'zh'
            ? `此券可用於體驗 ${classInfo.name} 課程`
            : `This coupon can be used for a trial ${classInfo.name} class`;
        }
      } else if (type === 'discount') {
        updated.name = t('language') === 'zh'
          ? `折扣券 ${prev.discountPercent || ''}%`
          : `Discount Coupon ${prev.discountPercent || ''}%`;
        updated.description = t('language') === 'zh'
          ? `此券可用於所有課程，享 ${prev.discountPercent || ''} % 折扣`
          : `This coupon can be used for all classes with ${prev.discountPercent || ''}% discount`;
      }

      return updated;
    });
  };

  const handleCouponClassChange = (classInfoId) => {
    const classInfo = classInfos.find(c => c._id === classInfoId);
    setNewCoupon(prev => ({
      ...prev,
      classInfoId,
      name: classInfo ? (t('language') === 'zh'
        ? `${classInfo.name} 體驗券`
        : `${classInfo.name} Trial Coupon`) : '',
      description: classInfo ? (t('language') === 'zh'
        ? `此券可用於體驗 ${classInfo.name} 課程`
        : `This coupon can be used for a trial ${classInfo.name} class`) : ''
    }));
  };

  const handleCouponDiscountChange = (discountPercent) => {
    setNewCoupon(prev => ({
      ...prev,
      discountPercent,
      name: t('language') === 'zh'
        ? `折扣券 ${discountPercent}%`
        : `Discount Coupon ${discountPercent}%`,
      description: t('language') === 'zh'
        ? `此券可用於所有課程，享 ${discountPercent}% 折扣`
        : `This coupon can be used for all classes with ${discountPercent}% discount`
    }));
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();

    // Validation
    if (newCoupon.type === 'trial' && !newCoupon.classInfoId) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請選擇課程' : 'Please select a class'
      });
      return;
    }

    if (newCoupon.type === 'discount' && (!newCoupon.discountPercent || newCoupon.discountPercent <= 0 || newCoupon.discountPercent > 100)) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請輸入有效的折扣百分比 (1-100)' : 'Please enter a valid discount percentage (1-100)'
      });
      return;
    }

    if (!newCoupon.quantity || newCoupon.quantity <= 0) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請輸入有效的數量' : 'Please enter a valid quantity'
      });
      return;
    }

    setAddingCoupon(true);
    try {
      const couponData = {
        type: newCoupon.type,
        name: newCoupon.name,
        description: newCoupon.description,
        image: newCoupon.image,
        quantity: parseInt(newCoupon.quantity)
      };

      if (newCoupon.type === 'trial') {
        couponData.classInfoId = newCoupon.classInfoId;
        // For trial coupons, use the class banner image
        const selectedClassInfo = classInfos.find(c => c._id === newCoupon.classInfoId);
        if (selectedClassInfo && selectedClassInfo.banner) {
          couponData.image = selectedClassInfo.banner;
        }
      } else {
        couponData.discountPercent = parseInt(newCoupon.discountPercent);
      }

      // Add expiry date if provided
      if (newCoupon.expiryDate) {
        couponData.expiryDate = new Date(newCoupon.expiryDate);
      }

      await axios.post(`/api/members?memberId=${selectedMember.memberId}&action=add-coupon`, couponData);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '優惠券添加成功！' : 'Coupon added successfully!'
      });

      // Reset form
      setNewCoupon({
        type: 'trial',
        classInfoId: '',
        discountPercent: '',
        name: '',
        description: '',
        image: '',
        quantity: 1,
        expiryDate: ''
      });
      setShowAddCouponForm(false);

      // Refresh member data
      const res = await axios.get(`/api/members?memberId=${selectedMember.memberId}`);
      setSelectedMember(res.data.member);
      fetchData();
    } catch (error) {
      console.error('Error adding coupon:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm(t('language') === 'zh' ? '確定要刪除此優惠券嗎？' : 'Are you sure you want to delete this coupon?')) {
      return;
    }

    setDeletingCouponId(couponId);
    try {
      await axios.delete(`/api/members?memberId=${selectedMember.memberId}&action=delete-coupon&couponId=${couponId}`);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '優惠券刪除成功' : 'Coupon deleted successfully'
      });

      // Refresh member data
      const res = await axios.get(`/api/members?memberId=${selectedMember.memberId}`);
      setSelectedMember(res.data.member);
      fetchData();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    } finally {
      setDeletingCouponId(null);
    }
  };

  const updatePaymentStatus = async (type, itemId, participantId, paid) => {
    const key = `${type}-${itemId}-${participantId}`;
    console.log('[Payment Update] Starting payment status update:', { type, itemId, participantId, paid });

    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      console.log('[Payment Update] Loading state set to true');

      // Optimistically update UI first
      if (type === 'class') {
        setClasses(prev => prev.map(c =>
          c._id === itemId
            ? {
                ...c,
                participants: c.participants.map(p =>
                  p._id === participantId ? { ...p, paid } : p
                )
              }
            : c
        ));
        console.log('[Payment Update] Updated classes state');
      } else {
        setActivities(prev => prev.map(a =>
          a._id === itemId
            ? {
                ...a,
                participants: a.participants.map(p =>
                  p._id === participantId ? { ...p, paid } : p
                )
              }
            : a
        ));
        console.log('[Payment Update] Updated activities state');
      }

      // Update selected item if viewing details
      if (selectedItem && selectedItem._id === itemId) {
        setSelectedItem(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p._id === participantId ? { ...p, paid } : p
          )
        }));
        console.log('[Payment Update] Updated selectedItem state');
      }

      // Then sync with server
      const resource = type === 'class' ? 'class-payment' : 'activity-payment';
      const idParam = type === 'class' ? 'classId' : 'activityId';
      const endpoint = `/api/admin?resource=${resource}&${idParam}=${itemId}&participantId=${participantId}`;
      console.log('[Payment Update] Sending request to:', endpoint);

      const response = await axios.put(endpoint, { paid });
      console.log('[Payment Update] Server response:', response.data);
      setMessage({ type: 'success', text: t('paymentStatusUpdated') });
      console.log('[Payment Update] Success! Payment status updated');
    } catch (error) {
      console.error('[Payment Update] Error:', error);
      console.error('[Payment Update] Error response:', error.response?.data);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
      // Refresh on error to get correct state
      fetchData();
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      console.log('[Payment Update] Loading state set to false');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const getMemberReferralCount = (memberId) => {
    const entry = referralLeaderboard.find(item => item.memberId === memberId);
    return entry ? entry.referralCount : 0;
  };

  if (loading && members.length === 0) {
    return <div className="container"><div className="loading">{t('loading')}</div></div>;
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h2>{t('adminPanel')}</h2>
        <button onClick={handleLogout} className="btn btn-secondary">
          {t('logout')}
        </button>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          {t('dashboard')}
        </button>
        <button
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          {t('memberManagement')}
        </button>
        <button
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          {t('language') === 'zh' ? '課程與活動' : 'Classes & Activities'}
        </button>
        <button
          className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('teachers')}
        >
          {t('language') === 'zh' ? '主辦人管理' : 'Host Management'}
        </button>
        <button
          className={`tab-button ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          {t('language') === 'zh' ? '優惠券管理' : 'Coupon Management'}
        </button>
        <button
          className={`tab-button ${activeTab === 'memberDetail' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
          style={{ display: 'none' }}
        >
          {t('language') === 'zh' ? '會員詳情' : 'Member Details'}
        </button>
        <button
          className={`tab-button ${activeTab === 'itemDetail' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
          style={{ display: 'none' }}
        >
          {t('language') === 'zh' ? '詳細資料' : 'Item Details'}
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalMembers || 0}</h3>
              <p>{t('totalMembers')}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>{stats.activeClasses || 0}</h3>
              <p>{t('activeClasses')}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎉</div>
            <div className="stat-info">
              <h3>{stats.activeActivities || 0}</h3>
              <p>{t('activeActivities')}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && !selectedMember && (
        <div className="card">
          <h3>{t('memberManagement')}</h3>

          {/* Member List Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('memberId')}</th>
                  <th>{t('name')}</th>
                  <th>{t('language') === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member._id}>
                    <td>{member.memberId}</td>
                    <td>{member.name}</td>
                    <td>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => setSelectedMember(member)}
                      >
                        {t('language') === 'zh' ? '查看詳情' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Referral Leaderboard Box */}
          <div className="referral-box">
            <h4>{t('language') === 'zh' ? '推薦排行' : 'Top Referrers'}</h4>
            {referralLeaderboard.length > 0 ? (
              <div className="referral-list">
                {referralLeaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.memberId} className="referral-item">
                    <span className="referral-rank">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && `#${index + 1}`}
                    </span>
                    <span className="referral-name">{entry.name} ({entry.memberId})</span>
                    <span className="referral-count">{entry.referralCount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                {t('language') === 'zh' ? '目前沒有推薦記錄' : 'No referrals yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && selectedMember && (
        <div className="card">
          <div className="detail-header">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedMember(null)}
            >
              ← {t('language') === 'zh' ? '返回列表' : 'Back to List'}
            </button>
            <h3>{t('language') === 'zh' ? '會員詳細資料' : 'Member Details'}</h3>
          </div>

          <div className="member-detail-grid">
            <div className="detail-section">
              <h4>{t('language') === 'zh' ? '基本資料' : 'Basic Information'}</h4>
              <div className="detail-row">
                <strong>{t('memberId')}:</strong>
                <span>{selectedMember.memberId}</span>
              </div>
              <div className="detail-row">
                <strong>{t('name')}:</strong>
                <span>{selectedMember.name}</span>
              </div>
              <div className="detail-row">
                <strong>{t('englishAlias')}:</strong>
                <span>{selectedMember.englishAlias || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>{t('gender')}:</strong>
                <span>{selectedMember.gender}</span>
              </div>
              <div className="detail-row">
                <strong>{t('birthDate')}:</strong>
                <span>{formatDate(selectedMember.birthDate)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>{t('language') === 'zh' ? '聯絡資料' : 'Contact Information'}</h4>
              <div className="detail-row">
                <strong>{t('mobile')}:</strong>
                <span>{selectedMember.contact?.mobile || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>LINE ID:</strong>
                <span>{selectedMember.contact?.lineId || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>{t('language') === 'zh' ? '會員資訊' : 'Membership Info'}</h4>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '點數' : 'Points'}:</strong>
                <span style={{ fontSize: '1.2em', color: '#667eea', fontWeight: 'bold' }}>
                  {selectedMember.points || 0}
                </span>
              </div>
              <div className="detail-row">
                <strong>{t('yourReferralCode')}:</strong>
                <span style={{ fontWeight: 'bold', color: '#1971c2' }}>
                  {selectedMember.referralCode || 'N/A'}
                </span>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '已推薦人數' : 'Referrals'}:</strong>
                <span style={{ fontWeight: 'bold', color: '#2b8a3e' }}>
                  {getMemberReferralCount(selectedMember.memberId)}
                </span>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '報名項目' : 'Enrollments'}:</strong>
                <span>{selectedMember.enrollments?.length || 0}</span>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '註冊日期' : 'Registered'}:</strong>
                <span>{formatDate(selectedMember.createdAt)}</span>
              </div>
            </div>
          </div>

          {selectedMember.enrollments && selectedMember.enrollments.length > 0 && (
            <div className="detail-section" style={{ marginTop: '30px' }}>
              <h4>{t('language') === 'zh' ? '報名記錄' : 'Enrollment History'}</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('language') === 'zh' ? '類型' : 'Type'}</th>
                      <th>{t('name')}</th>
                      <th>{t('language') === 'zh' ? '報名日期' : 'Enrolled'}</th>
                      <th>{t('language') === 'zh' ? '狀態' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMember.enrollments.map((enrollment, idx) => (
                      <tr key={idx}>
                        <td>{enrollment.type === 'class' ? t('classes') : t('activities')}</td>
                        <td>{enrollment.itemName}</td>
                        <td>{formatDate(enrollment.enrolledAt)}</td>
                        <td>
                          <span className={`status-badge ${enrollment.status}`}>
                            {t(enrollment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Coupon Management Section */}
          <div className="detail-section" style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0 }}>{t('language') === 'zh' ? '優惠券管理' : 'Coupon Management'}</h4>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddCouponForm(!showAddCouponForm)}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                {showAddCouponForm
                  ? (t('language') === 'zh' ? '取消' : 'Cancel')
                  : (t('language') === 'zh' ? '+ 添加優惠券' : '+ Add Coupon')}
              </button>
            </div>

            {showAddCouponForm && (
              <form onSubmit={handleAddCoupon} className="add-form" style={{ marginBottom: '30px', background: '#f8f9ff', padding: '20px', borderRadius: '8px' }}>
                <div className="form-group">
                  <label>{t('language') === 'zh' ? '優惠券類型' : 'Coupon Type'}</label>
                  <select
                    value={newCoupon.type}
                    onChange={(e) => handleCouponTypeChange(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="trial">{t('language') === 'zh' ? '體驗券（特定課程）' : 'Trial Coupon (Specific Class)'}</option>
                    <option value="discount">{t('language') === 'zh' ? '折扣券（所有課程）' : 'Discount Coupon (All Classes)'}</option>
                  </select>
                </div>

                {newCoupon.type === 'trial' && (
                  <div className="form-group">
                    <label>{t('language') === 'zh' ? '選擇課程' : 'Select Class'}</label>
                    <select
                      value={newCoupon.classInfoId}
                      onChange={(e) => handleCouponClassChange(e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">{t('language') === 'zh' ? '-- 選擇課程 --' : '-- Select Class --'}</option>
                      {classInfos.map(classInfo => (
                        <option key={classInfo._id} value={classInfo._id}>
                          {classInfo.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newCoupon.type === 'discount' && (
                  <div className="form-group">
                    <label>{t('language') === 'zh' ? '折扣百分比 (1-100)' : 'Discount Percentage (1-100)'}</label>
                    <input
                      type="number"
                      value={newCoupon.discountPercent}
                      onChange={(e) => handleCouponDiscountChange(e.target.value)}
                      className="form-control"
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>{t('language') === 'zh' ? '優惠券名稱' : 'Coupon Name'}</label>
                  <input
                    type="text"
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, name: e.target.value }))}
                    className="form-control"
                    required
                  />
                  <small style={{ color: '#666' }}>
                    {t('language') === 'zh' ? '自動填入，可編輯' : 'Auto-filled, editable'}
                  </small>
                </div>

                <div className="form-group">
                  <label>{t('language') === 'zh' ? '優惠券描述' : 'Coupon Description'}</label>
                  <textarea
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                    className="form-control"
                    rows="3"
                  />
                  <small style={{ color: '#666' }}>
                    {t('language') === 'zh' ? '自動填入，可編輯' : 'Auto-filled, editable'}
                  </small>
                </div>

                <div className="form-group">
                  <label>{t('language') === 'zh' ? '數量' : 'Quantity'}</label>
                  <input
                    type="number"
                    value={newCoupon.quantity}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, quantity: e.target.value }))}
                    className="form-control"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('language') === 'zh' ? '有效期限（可選）' : 'Expiry Date (Optional)'}</label>
                  <input
                    type="date"
                    value={newCoupon.expiryDate}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="form-control"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <small style={{ color: '#666' }}>
                    {t('language') === 'zh' ? '留空表示永久有效' : 'Leave empty for no expiration'}
                  </small>
                </div>

                {newCoupon.type === 'discount' && (
                  <div className="form-group">
                    <label>{t('language') === 'zh' ? '優惠券圖片（可選）' : 'Coupon Image (Optional)'}</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCouponImageUpload}
                      className="form-control"
                    />
                    {newCoupon.image && (
                      <img
                        src={newCoupon.image}
                        alt="Coupon preview"
                        style={{ marginTop: '10px', maxWidth: '200px', borderRadius: '8px' }}
                      />
                    )}
                    <small style={{ color: '#666' }}>
                      {t('language') === 'zh' ? '折扣券可以上傳自定義圖片' : 'Discount coupons can have custom images'}
                    </small>
                  </div>
                )}

                {newCoupon.type === 'trial' && (
                  <div style={{ padding: '10px', background: '#e7f3ff', borderRadius: '8px', marginBottom: '15px' }}>
                    <small style={{ color: '#004085' }}>
                      ℹ️ {t('language') === 'zh'
                        ? '體驗券將自動使用所選課程的橫幅圖片'
                        : 'Trial coupons will automatically use the selected class banner image'}
                    </small>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={addingCoupon}>
                  {addingCoupon
                    ? (t('language') === 'zh' ? '⏳ 添加中...' : '⏳ Adding...')
                    : (t('language') === 'zh' ? '添加優惠券' : 'Add Coupon')}
                </button>
              </form>
            )}

            {/* Display existing coupons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {selectedMember.coupons && selectedMember.coupons.length > 0 ? (
                selectedMember.coupons.map((coupon, idx) => {
                  const classInfo = coupon.classInfoId ? classInfos.find(c => c._id === coupon.classInfoId) : null;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: 'white',
                        border: '2px solid #667eea',
                        borderRadius: '12px',
                        padding: '20px',
                        position: 'relative'
                      }}
                    >
                      {coupon.image && (
                        <img
                          src={coupon.image}
                          alt={coupon.name}
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
                      </div>
                      <h5 style={{ color: '#667eea', marginBottom: '10px' }}>{coupon.name}</h5>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                        {coupon.description}
                      </p>
                      {coupon.type === 'trial' && classInfo && (
                        <p style={{ fontSize: '13px', color: '#1971c2', marginBottom: '8px' }}>
                          <strong>{t('language') === 'zh' ? '適用課程：' : 'Valid for: '}</strong>
                          {classInfo.name}
                        </p>
                      )}
                      {coupon.type === 'discount' && (
                        <p style={{ fontSize: '13px', color: '#c92a2a', marginBottom: '8px' }}>
                          <strong>{t('language') === 'zh' ? '折扣：' : 'Discount: '}</strong>
                          {coupon.discountPercent}%
                        </p>
                      )}
                      <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                        <strong>{t('language') === 'zh' ? '數量：' : 'Quantity: '}</strong>
                        {coupon.quantity - coupon.usedCount} / {coupon.quantity}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999' }}>
                        {t('language') === 'zh' ? '創建於 ' : 'Created '}{formatDate(coupon.createdAt)}
                      </p>
                      <button
                        onClick={() => handleDeleteCoupon(coupon._id)}
                        className="btn btn-danger"
                        disabled={deletingCouponId === coupon._id}
                        style={{
                          marginTop: '15px',
                          width: '100%',
                          fontSize: '13px',
                          padding: '8px'
                        }}
                      >
                        {deletingCouponId === coupon._id
                          ? (t('language') === 'zh' ? '⏳ 刪除中...' : '⏳ Deleting...')
                          : (t('language') === 'zh' ? '🗑️ 刪除' : '🗑️ Delete')}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#999', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                  {t('language') === 'zh' ? '此會員尚無優惠券' : 'No coupons for this member'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && selectedClassInfo && (
        <div className="card">
          <div className="detail-header">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedClassInfo(null)}
            >
              ← {t('language') === 'zh' ? '返回列表' : 'Back to List'}
            </button>
            <h3>{t('language') === 'zh' ? '編輯課程資訊' : 'Edit Class Information'}</h3>
          </div>

          <form onSubmit={handleUpdateClassInfo} className="add-form">
            <div className="form-group">
              <label>{t('banner')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleClassInfoBannerUpload}
                style={{
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                {t('language') === 'zh'
                  ? '上傳橫幅圖片（建議尺寸 1000x600）'
                  : 'Upload banner image (recommended size 1000x600)'}
              </small>
              {selectedClassInfo.banner && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    {t('language') === 'zh' ? '預覽：' : 'Preview:'}
                  </p>
                  <img
                    src={selectedClassInfo.banner}
                    alt={selectedClassInfo.name}
                    style={{
                      width: '1000px',
                      height: '600px',
                      maxWidth: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedClassInfo({ ...selectedClassInfo, banner: '' })}
                    style={{ marginTop: '10px', display: 'block' }}
                  >
                    {t('language') === 'zh' ? '移除圖片' : 'Remove Image'}
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>{t('name')} *</label>
              <input
                type="text"
                value={selectedClassInfo.name}
                onChange={(e) => setSelectedClassInfo({ ...selectedClassInfo, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('description')} *</label>
              <textarea
                value={selectedClassInfo.description}
                onChange={(e) => setSelectedClassInfo({ ...selectedClassInfo, description: e.target.value })}
                required
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('cost')} (NT$) *</label>
                <input
                  type="number"
                  value={selectedClassInfo.cost}
                  onChange={(e) => setSelectedClassInfo({ ...selectedClassInfo, cost: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('maxParticipants')} *</label>
                <input
                  type="number"
                  value={selectedClassInfo.maxParticipants}
                  onChange={(e) => setSelectedClassInfo({ ...selectedClassInfo, maxParticipants: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">
                {t('language') === 'zh' ? '保存更改' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedClassInfo(null)}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'items' && !selectedItem && !selectedClassInfo && (
        <div className="card">
          <h3>{t('language') === 'zh' ? '課程與活動管理' : 'Classes & Activities Management'}</h3>

          {/* Class Info Section */}
          <div className="items-section" style={{ marginTop: '30px' }}>
            <div className="section-header">
              <h4 style={{ color: '#667eea' }}>
                {t('classInformation')} ({classInfos.length})
              </h4>
              <button
                onClick={() => setShowAddClassInfoForm(!showAddClassInfoForm)}
                className="btn btn-primary"
              >
                {showAddClassInfoForm ? t('cancel') : t('addNew')}
              </button>
            </div>

            {showAddClassInfoForm && (
              <form onSubmit={handleAddClassInfo} className="add-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label>{t('name')} *</label>
                  <input
                    type="text"
                    value={newClassInfo.name}
                    onChange={(e) => setNewClassInfo({ ...newClassInfo, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('description')} *</label>
                  <textarea
                    value={newClassInfo.description}
                    onChange={(e) => setNewClassInfo({ ...newClassInfo, description: e.target.value })}
                    required
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('cost')} (NT$) *</label>
                    <input
                      type="number"
                      value={newClassInfo.cost}
                      onChange={(e) => setNewClassInfo({ ...newClassInfo, cost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('maxParticipants')} *</label>
                    <input
                      type="number"
                      value={newClassInfo.maxParticipants}
                      onChange={(e) => setNewClassInfo({ ...newClassInfo, maxParticipants: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Banner Image Upload */}
                <div className="form-group">
                  <label>{t('language') === 'zh' ? '宣傳圖片 (選填)' : 'Banner Image (Optional)'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewClassInfoBannerUpload}
                    style={{
                      padding: '10px',
                      border: '2px dashed #667eea',
                      borderRadius: '8px',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    {t('language') === 'zh'
                      ? '上傳圖片（建議尺寸：1000x600px）'
                      : 'Upload image (recommended size: 1000x600px)'}
                  </small>
                  {newClassInfo.banner && (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                        {t('language') === 'zh' ? '預覽：' : 'Preview:'}
                      </p>
                      <img
                        src={newClassInfo.banner}
                        alt="Banner preview"
                        style={{
                          width: '1000px',
                          height: '600px',
                          maxWidth: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e0e0e0'
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setNewClassInfo({ ...newClassInfo, banner: '' })}
                        style={{ marginTop: '10px' }}
                      >
                        {t('language') === 'zh' ? '移除圖片' : 'Remove Image'}
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary">
                  {t('addClassInfo')}
                </button>
              </form>
            )}

            {/* Class Info List */}
            <div className="items-list" style={{ marginTop: '20px' }}>
              {classInfos.map(classInfo => (
                <div key={classInfo._id} className="item-summary-card">
                  {classInfo.banner && (
                    <img src={classInfo.banner} alt={classInfo.name} className="item-summary-banner" />
                  )}
                  <div className="item-summary-content">
                    <h5>{classInfo.name}</h5>
                    <p className="item-summary-meta">
                      NT$ {classInfo.cost} | {t('max')} {classInfo.maxParticipants} {t('participants')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => setSelectedClassInfo(classInfo)}
                    >
                      {t('edit')}
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteClassInfo(classInfo._id)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Host Class Section */}
          <div className="items-section" style={{ marginTop: '40px' }}>
            <div className="section-header">
              <h4 style={{ color: '#667eea' }}>
                {t('hostClasses')} ({classes.length})
              </h4>
              <button
                onClick={() => setShowAddClassForm(!showAddClassForm)}
                className="btn btn-primary"
              >
                {showAddClassForm ? t('cancel') : t('addNew')}
              </button>
            </div>

            {showAddClassForm && (
              <form onSubmit={handleAddClass} className="add-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label>{t('classInfo')} *</label>
                  <select
                    value={newClass.classInfoId}
                    onChange={(e) => setNewClass({ ...newClass, classInfoId: e.target.value })}
                    required
                  >
                    <option value="">{t('language') === 'zh' ? '選擇課程' : 'Select Class'}</option>
                    {classInfos.map(classInfo => (
                      <option key={classInfo._id} value={classInfo._id}>
                        {classInfo.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('host')} *</label>
                  <select
                    value={newClass.teacherId || ''}
                    onChange={(e) => {
                      const selectedTeacher = teachers.find(t => t._id === e.target.value);
                      setNewClass({
                        ...newClass,
                        teacherId: e.target.value,
                        teacher: selectedTeacher ? selectedTeacher.name : ''
                      });
                    }}
                    required
                  >
                    <option value="">{t('language') === 'zh' ? '選擇主辦人' : 'Select Host'}</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('classDate')} *</label>
                    <input
                      type="date"
                      value={newClass.date}
                      onChange={(e) => setNewClass({ ...newClass, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('time')} *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="HH"
                        value={newClass.time.split(':')[0] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newClass.time.split(/[:\s-]+/);
                          setNewClass({ ...newClass, time: `${val}:${parts[1] || '00'} - ${parts[2] || '00'}:${parts[3] || '00'}` });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                      <span style={{ fontWeight: 'bold' }}>:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="MM"
                        value={newClass.time.split(/[:\s-]+/)[1] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newClass.time.split(/[:\s-]+/);
                          const newTime = `${parts[0] || '00'}:${val} - ${parts[2] || '00'}:${parts[3] || '00'}`;
                          setNewClass({ ...newClass, time: newTime });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                      <span style={{ fontWeight: 'bold', margin: '0 8px' }}>-</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="HH"
                        value={newClass.time.split(/[:\s-]+/)[2] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newClass.time.split(/[:\s-]+/);
                          const newTime = `${parts[0] || '00'}:${parts[1] || '00'} - ${val}:${parts[3] || '00'}`;
                          setNewClass({ ...newClass, time: newTime });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                      <span style={{ fontWeight: 'bold' }}>:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="MM"
                        value={newClass.time.split(/[:\s-]+/)[3] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newClass.time.split(/[:\s-]+/);
                          const newTime = `${parts[0] || '00'}:${parts[1] || '00'} - ${parts[2] || '00'}:${val}`;
                          setNewClass({ ...newClass, time: newTime });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                    </div>
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      {t('language') === 'zh' ? '開始時間 - 結束時間' : 'Start Time - End Time'}
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('location')}</label>
                  <input
                    type="text"
                    value={newClass.location}
                    onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                    placeholder={t('language') === 'zh' ? '例如：台北市大安區復興南路一段' : 'e.g., No. 1, Section 1, Fuxing S Rd, Da\'an District, Taipei City'}
                  />
                </div>

                <div className="form-group" style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', border: '1px solid #d0e8ff' }}>
                  <p style={{ margin: 0, color: '#1a5490', fontSize: '14px', lineHeight: '1.6' }}>
                    ℹ️ {t('language') === 'zh'
                      ? '會員可以在個人選單中點擊「課程與活動」來查看和報名此課程！'
                      : 'Members can view and enroll in this class by clicking "Classes & Activities" in their profile menu!'}
                  </p>
                </div>

                {newClass.location && (
                  <div className="form-group">
                    <label>{t('mapPreview')}</label>
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(newClass.location)}&output=embed`}
                      width="100%"
                      height="300"
                      style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Location Map"
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary">
                  {t('hostClass')}
                </button>
              </form>
            )}

            {/* Host Class List */}
            <div className="items-list" style={{ marginTop: '20px' }}>
              {classes.map(classItem => (
                <div key={classItem._id} className="item-summary-card">
                  {classItem.classInfoId?.banner && (
                    <img src={classItem.classInfoId.banner} alt={classItem.classInfoId?.name} className="item-summary-banner" />
                  )}
                  <div className="item-summary-content">
                    <h5>{classItem.classInfoId?.name || 'N/A'}</h5>
                    <p className="item-summary-meta">
                      {formatDate(classItem.date)} | {classItem.time} | {t('host')}: {classItem.teacher}
                    </p>
                    {classItem.location && (
                      <p className="item-summary-meta" style={{ fontSize: '0.9em', color: '#666' }}>
                        📍 {classItem.location}
                      </p>
                    )}
                    <p className="item-summary-participants">
                      {classItem.currentParticipants}/{classItem.classInfoId?.maxParticipants || 0} {t('participants')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => setSelectedItem({ ...classItem, type: 'class' })}
                    >
                      {t('language') === 'zh' ? '查看詳情' : 'View Details'}
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteItem('class', classItem._id)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities Section */}
          <div className="items-section" style={{ marginTop: '40px' }}>
            <div className="section-header">
              <h4 style={{ color: '#667eea' }}>
                {t('activities')} ({activities.length})
              </h4>
              <button
                onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                className="btn btn-primary"
              >
                {showAddActivityForm ? t('cancel') : t('addNew')}
              </button>
            </div>

            {showAddActivityForm && (
              <form onSubmit={handleAddActivity} className="add-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label>{t('name')} *</label>
                  <input
                    type="text"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('description')} *</label>
                  <textarea
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    required
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>{t('host')} *</label>
                  <select
                    value={newActivity.teacherId || ''}
                    onChange={(e) => {
                      const selectedTeacher = teachers.find(t => t._id === e.target.value);
                      setNewActivity({
                        ...newActivity,
                        teacherId: e.target.value,
                        teacher: selectedTeacher ? selectedTeacher.name : ''
                      });
                    }}
                    required
                  >
                    <option value="">{t('language') === 'zh' ? '選擇主辦人' : 'Select Host'}</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('language') === 'zh' ? '活動日期' : 'Activity Date'}</label>
                    <input
                      type="date"
                      value={newActivity.date}
                      onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('time')} *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="HH"
                        value={newActivity.time.split(':')[0] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newActivity.time.split(/[:\s-]+/);
                          setNewActivity({ ...newActivity, time: `${val}:${parts[1] || '00'} - ${parts[2] || '00'}:${parts[3] || '00'}` });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                      <span style={{ fontWeight: 'bold' }}>:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="MM"
                        value={newActivity.time.split(/[:\s-]+/)[1] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newActivity.time.split(/[:\s-]+/);
                          const newTime = `${parts[0] || '00'}:${val} - ${parts[2] || '00'}:${parts[3] || '00'}`;
                          setNewActivity({ ...newActivity, time: newTime });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                      <span style={{ fontWeight: 'bold', margin: '0 8px' }}>-</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        placeholder="HH"
                        value={newActivity.time.split(/[:\s-]+/)[2] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newActivity.time.split(/[:\s-]+/);
                          const newTime = `${parts[0] || '00'}:${parts[1] || '00'} - ${val}:${parts[3] || '00'}`;
                          setNewActivity({ ...newActivity, time: newTime });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                      <span style={{ fontWeight: 'bold' }}>:</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="MM"
                        value={newActivity.time.split(/[:\s-]+/)[3] || ''}
                        onChange={(e) => {
                          const val = e.target.value.padStart(2, '0');
                          const parts = newActivity.time.split(/[:\s-]+/);
                          const newTime = `${parts[0] || '00'}:${parts[1] || '00'} - ${parts[2] || '00'}:${val}`;
                          setNewActivity({ ...newActivity, time: newTime });
                        }}
                        style={{ width: '60px', textAlign: 'center' }}
                        required
                      />
                    </div>
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      {t('language') === 'zh' ? '開始時間 - 結束時間' : 'Start Time - End Time'}
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('cost')} (NT$) *</label>
                    <input
                      type="number"
                      value={newActivity.cost}
                      onChange={(e) => setNewActivity({ ...newActivity, cost: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('maxParticipants')} *</label>
                    <input
                      type="number"
                      value={newActivity.maxParticipants}
                      onChange={(e) => setNewActivity({ ...newActivity, maxParticipants: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('location')}</label>
                  <input
                    type="text"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                    placeholder={t('language') === 'zh' ? '例如：台北市大安區復興南路一段' : 'e.g., No. 1, Section 1, Fuxing S Rd, Da\'an District, Taipei City'}
                  />
                </div>

                {newActivity.location && (
                  <div className="form-group">
                    <label>{t('mapPreview')}</label>
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(newActivity.location)}&output=embed`}
                      width="100%"
                      height="300"
                      style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Location Map"
                    />
                  </div>
                )}

                {/* Banner Image Upload */}
                <div className="form-group">
                  <label>{t('language') === 'zh' ? '宣傳圖片 (選填)' : 'Banner Image (Optional)'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleActivityBannerUpload}
                    style={{
                      padding: '10px',
                      border: '2px dashed #667eea',
                      borderRadius: '8px',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  />
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    {t('language') === 'zh'
                      ? '上傳圖片（最大 2MB，尺寸必須：500x300px）'
                      : 'Upload image (max 2MB, dimensions must be: 500x300px)'}
                  </small>
                  {newActivity.banner && (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                        {t('language') === 'zh' ? '預覽：' : 'Preview:'}
                      </p>
                      <img
                        src={newActivity.banner}
                        alt="Banner preview"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e0e0e0'
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setNewActivity({ ...newActivity, banner: '' })}
                        style={{ marginTop: '10px' }}
                      >
                        {t('language') === 'zh' ? '移除圖片' : 'Remove Image'}
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary">
                  {t('language') === 'zh' ? '添加活動' : 'Add Activity'}
                </button>
              </form>
            )}

            {/* Activities List */}
            <div className="items-list" style={{ marginTop: '20px' }}>
              {activities.map(activity => (
                <div key={activity._id} className="item-summary-card">
                  {activity.banner && (
                    <img src={activity.banner} alt={activity.name} className="item-summary-banner" />
                  )}
                  <div className="item-summary-content">
                    <h5>{activity.name}</h5>
                    <p className="item-summary-meta">
                      {activity.time} | {t('host')}: {activity.teacher}
                    </p>
                    {activity.location && (
                      <p className="item-summary-meta" style={{ fontSize: '0.9em', color: '#666' }}>
                        📍 {activity.location}
                      </p>
                    )}
                    <p className="item-summary-participants">
                      {activity.currentParticipants}/{activity.maxParticipants} {t('participants')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => setSelectedItem({ ...activity, type: 'activity' })}
                    >
                      {t('language') === 'zh' ? '查看詳情' : 'View Details'}
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteItem('activity', activity._id)}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && selectedItem && (
        <div className="card">
          <div className="detail-header">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedItem(null)}
            >
              ← {t('language') === 'zh' ? '返回列表' : 'Back to List'}
            </button>
            <h3>
              {selectedItem.type === 'class' ? t('classes') : t('activities')} - {selectedItem.type === 'class' ? selectedItem.classInfoId?.name : selectedItem.name}
            </h3>
            <button
              className="btn btn-danger"
              onClick={() => handleDeleteItem(selectedItem.type, selectedItem._id)}
              style={{ marginLeft: 'auto' }}
            >
              {t('language') === 'zh' ? '刪除' : 'Delete'}
            </button>
          </div>

          {((selectedItem.type === 'class' && selectedItem.classInfoId?.banner) || (selectedItem.type === 'activity' && selectedItem.banner)) && (
            <img
              src={selectedItem.type === 'class' ? selectedItem.classInfoId.banner : selectedItem.banner}
              alt={selectedItem.type === 'class' ? selectedItem.classInfoId?.name : selectedItem.name}
              style={{
                width: '100%',
                maxHeight: '300px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            />
          )}

          <div className="item-detail-grid">
            <div className="detail-section">
              <h4>{t('language') === 'zh' ? '基本資料' : 'Basic Information'}</h4>
              <div className="detail-row">
                <strong>{t('name')}:</strong>
                <span>{selectedItem.type === 'class' ? selectedItem.classInfoId?.name : selectedItem.name}</span>
              </div>
              <div className="detail-row">
                <strong>{t('description')}:</strong>
                <span>{selectedItem.type === 'class' ? selectedItem.classInfoId?.description : selectedItem.description}</span>
              </div>
              {selectedItem.date && selectedItem.type === 'class' && (
                <div className="detail-row">
                  <strong>{t('classDate')}:</strong>
                  <span>{formatDate(selectedItem.date)}</span>
                </div>
              )}
              {selectedItem.date && selectedItem.type === 'activity' && (
                <div className="detail-row">
                  <strong>{t('language') === 'zh' ? '活動日期' : 'Activity Date'}:</strong>
                  <span>{formatDate(selectedItem.date)}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>{t('time')}:</strong>
                <span>{selectedItem.time}</span>
              </div>
              <div className="detail-row">
                <strong>{t('host')}:</strong>
                <span>{selectedItem.teacher}</span>
              </div>
              {selectedItem.location && (
                <div className="detail-row">
                  <strong>{t('location')}:</strong>
                  <span>📍 {selectedItem.location}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>{t('cost')}:</strong>
                <span>NT$ {selectedItem.type === 'class' ? selectedItem.classInfoId?.cost : selectedItem.cost}</span>
              </div>
              <div className="detail-row">
                <strong>{t('participants')}:</strong>
                <span>
                  {selectedItem.currentParticipants} / {selectedItem.type === 'class' ? selectedItem.classInfoId?.maxParticipants : selectedItem.maxParticipants}
                </span>
              </div>
            </div>
          </div>

          {selectedItem.location && (
            <div className="detail-section" style={{ marginTop: '30px' }}>
              <h4>{t('locationMap')}</h4>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedItem.location)}&output=embed`}
                width="100%"
                height="400"
                style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              />
            </div>
          )}

          <div className="detail-section" style={{ marginTop: '30px' }}>
            <h4>{t('language') === 'zh' ? '已報名會員' : 'Enrolled Members'}</h4>
            {selectedItem.participants && selectedItem.participants.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('memberId')}</th>
                      <th>{t('name')}</th>
                      <th>{t('language') === 'zh' ? '報名日期' : 'Enrolled Date'}</th>
                      <th>{t('language') === 'zh' ? '付款狀態' : 'Payment'}</th>
                      <th>{t('language') === 'zh' ? '操作' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.participants.map(participant => (
                      <tr key={participant._id}>
                        <td>
                          {members.find(m => m._id === participant.memberId)?.memberId || 'N/A'}
                        </td>
                        <td>{participant.memberName}</td>
                        <td>{formatDate(participant.enrolledAt)}</td>
                        <td>
                          <span className={`status-badge ${participant.paid ? 'paid' : 'unpaid'}`}>
                            {participant.paid
                              ? (t('language') === 'zh' ? '已付款' : 'Paid')
                              : (t('language') === 'zh' ? '未付款' : 'Unpaid')}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-small"
                            onClick={() =>
                              updatePaymentStatus(
                                selectedItem.type,
                                selectedItem._id,
                                participant._id,
                                !participant.paid
                              )
                            }
                            disabled={loadingStates[`${selectedItem.type}-${selectedItem._id}-${participant._id}`]}
                          >
                            {loadingStates[`${selectedItem.type}-${selectedItem._id}-${participant._id}`]
                              ? t('processing')
                              : participant.paid
                                ? (t('language') === 'zh' ? '標記未付' : 'Mark Unpaid')
                                : (t('language') === 'zh' ? '標記已付' : 'Mark Paid')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                {t('language') === 'zh' ? '目前尚無會員報名' : 'No enrollments yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'teachers' && !selectedTeacher && (
        <div className="card">
          <div className="section-header">
            <h3>{t('language') === 'zh' ? '主辦人管理' : 'Host Management'}</h3>
            <button
              onClick={() => setShowAddTeacherForm(!showAddTeacherForm)}
              className="btn btn-primary"
            >
              {showAddTeacherForm ? t('cancel') : t('addNew')}
            </button>
          </div>

          {showAddTeacherForm && (
            <form onSubmit={handleAddTeacher} className="add-form">
              <div className="form-group">
                <label>{t('language') === 'zh' ? '姓名 *' : 'Name *'}</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('language') === 'zh' ? '簡介' : 'Bio'}</label>
                <textarea
                  value={newTeacher.bio}
                  onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('language') === 'zh' ? '專長' : 'Specialties'}</label>
                  <input
                    type="text"
                    value={newTeacher.specialties}
                    onChange={(e) => setNewTeacher({ ...newTeacher, specialties: e.target.value })}
                    placeholder={t('language') === 'zh' ? '例如：鋼琴、聲樂' : 'e.g., Piano, Vocal'}
                  />
                </div>
                <div className="form-group">
                  <label>{t('language') === 'zh' ? '學歷' : 'Education'}</label>
                  <input
                    type="text"
                    value={newTeacher.education}
                    onChange={(e) => setNewTeacher({ ...newTeacher, education: e.target.value })}
                    placeholder={t('language') === 'zh' ? '例如：台灣大學音樂系' : 'e.g., NTU Music Dept.'}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('language') === 'zh' ? '電話' : 'Phone'}</label>
                  <input
                    type="tel"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>LINE ID</label>
                  <input
                    type="text"
                    value={newTeacher.lineId}
                    onChange={(e) => setNewTeacher({ ...newTeacher, lineId: e.target.value })}
                  />
                </div>
              </div>

              {/* Profile Picture Upload */}
              <div className="form-group">
                <label>{t('language') === 'zh' ? '個人照片' : 'Profile Picture'}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTeacherPhotoUpload}
                  style={{
                    padding: '10px',
                    border: '2px dashed #667eea',
                    borderRadius: '8px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  {t('language') === 'zh'
                    ? '上傳圖片（最大 2MB）'
                    : 'Upload image (max 2MB)'}
                </small>
                {newTeacher.photo && (
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      {t('language') === 'zh' ? '預覽：' : 'Preview:'}
                    </p>
                    <img
                      src={newTeacher.photo}
                      alt="Teacher preview"
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: '2px solid #e0e0e0'
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => setNewTeacher({ ...newTeacher, photo: '' })}
                      style={{ marginTop: '10px', display: 'block' }}
                    >
                      {t('language') === 'zh' ? '移除圖片' : 'Remove Image'}
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary">
                {t('language') === 'zh' ? '添加主辦人' : 'Add Host'}
              </button>
            </form>
          )}

          {/* Teachers List */}
          <div className="table-container" style={{ marginTop: '30px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('language') === 'zh' ? '姓名' : 'Name'}</th>
                  <th>{t('language') === 'zh' ? '專長' : 'Specialties'}</th>
                  <th>{t('language') === 'zh' ? '學歷' : 'Education'}</th>
                  <th>{t('language') === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => (
                  <tr key={teacher._id}>
                    <td>{teacher.name}</td>
                    <td>{teacher.specialties || 'N/A'}</td>
                    <td>{teacher.education || 'N/A'}</td>
                    <td>
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => setSelectedTeacher(teacher)}
                      >
                        {t('language') === 'zh' ? '查看' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'teachers' && selectedTeacher && (
        <div className="card">
          <div className="detail-header">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedTeacher(null)}
            >
              ← {t('language') === 'zh' ? '返回列表' : 'Back to List'}
            </button>
            <h3>{t('language') === 'zh' ? '主辦人詳情' : 'Host Details'}</h3>
            <button
              className="btn btn-danger"
              onClick={() => handleDeleteTeacher(selectedTeacher._id)}
              style={{ marginLeft: 'auto' }}
            >
              {t('language') === 'zh' ? '刪除' : 'Delete'}
            </button>
          </div>

          {selectedTeacher.photo && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img
                src={selectedTeacher.photo}
                alt={selectedTeacher.name}
                style={{
                  width: '150px',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '3px solid #667eea'
                }}
              />
            </div>
          )}

          <div className="member-detail-grid">
            <div className="detail-section">
              <h4>{t('language') === 'zh' ? '基本資料' : 'Basic Information'}</h4>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '姓名' : 'Name'}:</strong>
                <span>{selectedTeacher.name}</span>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '專長' : 'Specialties'}:</strong>
                <span>{selectedTeacher.specialties || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '學歷' : 'Education'}:</strong>
                <span>{selectedTeacher.education || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '簡介' : 'Bio'}:</strong>
                <span>{selectedTeacher.bio || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>{t('language') === 'zh' ? '聯絡資料' : 'Contact Information'}</h4>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '電話' : 'Phone'}:</strong>
                <span>{selectedTeacher.phone || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>LINE ID:</strong>
                <span>{selectedTeacher.lineId || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Management Tab */}
      {activeTab === 'coupons' && (
        <div className="card">
          <div className="section-header">
            <h3>{t('language') === 'zh' ? '優惠券管理' : 'Coupon Management'}</h3>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ marginBottom: '20px', color: '#667eea' }}>
              {t('language') === 'zh' ? '優惠券資訊模板' : 'Coupon Information Profiles'}
            </h4>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              {t('language') === 'zh'
                ? '創建優惠券模板，可在「販售優惠券」和「會員管理」中使用。體驗券將使用此處上傳的圖片，不再自動使用課程橫幅。'
                : 'Create coupon templates to use in "Coupons For Sale" and "Member Management". Trial coupons will use the image uploaded here instead of the class banner.'}
            </p>

            <button
              onClick={() => setShowAddProfileForm(!showAddProfileForm)}
              className="btn btn-primary"
              style={{ marginBottom: '20px' }}
            >
              {showAddProfileForm
                ? (t('language') === 'zh' ? '取消' : 'Cancel')
                : (t('language') === 'zh' ? '+ 新增優惠券模板' : '+ Add Coupon Profile')}
            </button>

            {showAddProfileForm && (
              <div style={{ padding: '20px', background: '#f8f9ff', borderRadius: '8px', marginBottom: '20px', border: '2px solid #667eea' }}>
                <h5 style={{ marginBottom: '15px', color: '#667eea' }}>
                  {t('language') === 'zh' ? '創建優惠券模板' : 'Create Coupon Profile'}
                </h5>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('language') === 'zh' ? '優惠券類型 *' : 'Coupon Type *'}
                  </label>
                  <select
                    value={newProfile.type}
                    onChange={(e) => setNewProfile({...newProfile, type: e.target.value, classInfoId: '', discountPercent: ''})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="trial">{t('language') === 'zh' ? '體驗券' : 'Trial Coupon'}</option>
                    <option value="discount">{t('language') === 'zh' ? '折扣券' : 'Discount Coupon'}</option>
                  </select>
                </div>

                {newProfile.type === 'trial' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      {t('language') === 'zh' ? '選擇課程 *' : 'Select Class *'}
                    </label>
                    <select
                      value={newProfile.classInfoId}
                      onChange={(e) => {
                        const classInfo = classInfos.find(c => c._id === e.target.value);
                        setNewProfile({
                          ...newProfile,
                          classInfoId: e.target.value,
                          name: classInfo ? `${classInfo.name} ${t('language') === 'zh' ? '體驗券' : 'Trial Coupon'}` : '',
                          description: classInfo ? `${t('language') === 'zh' ? '此券可用於體驗' : 'This coupon can be used for a trial'} ${classInfo.name} ${t('language') === 'zh' ? '課程' : 'class'}` : ''
                        });
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                      <option value="">{t('language') === 'zh' ? '請選擇課程' : 'Please select a class'}</option>
                      {classInfos.map(classInfo => (
                        <option key={classInfo._id} value={classInfo._id}>{classInfo.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newProfile.type === 'discount' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      {t('language') === 'zh' ? '折扣百分比 (%) *' : 'Discount Percentage (%) *'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newProfile.discountPercent}
                      onChange={(e) => setNewProfile({
                        ...newProfile,
                        discountPercent: e.target.value,
                        name: `${t('language') === 'zh' ? '折扣券' : 'Discount Coupon'} ${e.target.value}%`,
                        description: `${t('language') === 'zh' ? '此券可用於所有課程，享' : 'This coupon can be used for all classes with'} ${e.target.value}% ${t('language') === 'zh' ? '折扣' : 'discount'}`
                      })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('language') === 'zh' ? '優惠券名稱 *' : 'Coupon Name *'}
                  </label>
                  <input
                    type="text"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('language') === 'zh' ? '優惠券描述' : 'Coupon Description'}
                  </label>
                  <textarea
                    value={newProfile.description}
                    onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '80px' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('language') === 'zh' ? '優惠券圖片 *' : 'Coupon Image *'}
                  </label>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                    {t('language') === 'zh'
                      ? '此圖片將用於所有使用此模板的優惠券（包括體驗券和折扣券）'
                      : 'This image will be used for all coupons created from this profile (including trial and discount coupons)'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewProfile({...newProfile, image: reader.result});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ width: '100%', padding: '10px' }}
                  />
                  {newProfile.image && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={newProfile.image} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px', border: '2px solid #ddd' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={async () => {
                      if (!newProfile.name) {
                        setMessage({ type: 'error', text: t('language') === 'zh' ? '請填寫必填欄位' : 'Please fill required fields' });
                        return;
                      }
                      try {
                        await axios.post('/api/coupon-profiles', newProfile);
                        setMessage({ type: 'success', text: t('language') === 'zh' ? '優惠券模板創建成功！' : 'Coupon profile created!' });
                        setShowAddProfileForm(false);
                        setNewProfile({ type: 'trial', classInfoId: '', discountPercent: '', name: '', description: '', image: '' });
                        fetchData();
                      } catch (error) {
                        setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                      }
                    }}
                    className="btn btn-primary"
                  >
                    {t('language') === 'zh' ? '創建模板' : 'Create Profile'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddProfileForm(false);
                      setNewProfile({ type: 'trial', classInfoId: '', discountPercent: '', name: '', description: '', image: '' });
                    }}
                    className="btn"
                  >
                    {t('language') === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {couponProfiles.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                {t('language') === 'zh' ? '尚無優惠券模板' : 'No coupon profiles yet'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {couponProfiles.map(profile => (
                  <div key={profile._id} style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', background: 'white' }}>
                    {profile.image && (
                      <img src={profile.image} alt={profile.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                    )}
                    <h5 style={{ marginBottom: '5px' }}>{profile.name}</h5>
                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>{profile.description || 'No description'}</p>
                    <p style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                      {profile.type === 'trial'
                        ? `${t('language') === 'zh' ? '體驗券' : 'Trial'}: ${profile.classInfoId?.name || 'N/A'}`
                        : `${t('language') === 'zh' ? '折扣券' : 'Discount'}: ${profile.discountPercent}%`}
                    </p>
                    <button
                      onClick={async () => {
                        if (window.confirm(t('language') === 'zh' ? '確定要刪除此模板嗎？' : 'Delete this profile?')) {
                          try {
                            await axios.delete(`/api/coupon-profiles?profileId=${profile._id}`);
                            setMessage({ type: 'success', text: t('language') === 'zh' ? '模板刪除成功' : 'Profile deleted' });
                            fetchData();
                          } catch (error) {
                            setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                          }
                        }
                      }}
                      className="btn btn-danger"
                      style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                    >
                      🗑️ {t('language') === 'zh' ? '刪除模板' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr style={{ margin: '40px 0', border: 'none', borderTop: '2px solid #e0e0e0' }} />

          <div>
            <h4 style={{ marginBottom: '20px', color: '#667eea' }}>
              {t('language') === 'zh' ? '販售優惠券' : 'Coupons For Sale'}
            </h4>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              {t('language') === 'zh'
                ? '將優惠券模板上架販售，會員可在「我的優惠券」頁面購買'
                : 'List coupon profiles for sale - members can purchase them in the "My Coupons" section'}
            </p>

            <button
              onClick={() => setShowAddForSaleForm(!showAddForSaleForm)}
              className="btn btn-primary"
              style={{ marginBottom: '20px' }}
            >
              {showAddForSaleForm
                ? (t('language') === 'zh' ? '取消' : 'Cancel')
                : (t('language') === 'zh' ? '+ 上架優惠券' : '+ List Coupon For Sale')}
            </button>

            {showAddForSaleForm && (
              <div style={{ padding: '20px', background: '#f8f9ff', borderRadius: '8px', marginBottom: '20px', border: '2px solid #667eea' }}>
                <h5 style={{ marginBottom: '15px', color: '#667eea' }}>
                  {t('language') === 'zh' ? '上架販售優惠券' : 'List Coupon For Sale'}
                </h5>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('language') === 'zh' ? '選擇優惠券模板 *' : 'Select Coupon Profile *'}
                  </label>
                  <select
                    value={newForSale.couponProfileId}
                    onChange={(e) => setNewForSale({...newForSale, couponProfileId: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="">{t('language') === 'zh' ? '請選擇模板' : 'Please select a profile'}</option>
                    {couponProfiles.map(profile => (
                      <option key={profile._id} value={profile._id}>
                        {profile.name} - {profile.type === 'trial' ? profile.classInfoId?.name : `${profile.discountPercent}%`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('language') === 'zh' ? '價格 (NTD) *' : 'Price (NTD) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newForSale.price}
                    onChange={(e) => setNewForSale({...newForSale, price: e.target.value})}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('language') === 'zh' ? '庫存數量' : 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    value={newForSale.stock}
                    onChange={(e) => setNewForSale({...newForSale, stock: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    {t('language') === 'zh' ? '設為 -1 表示無限庫存' : 'Set to -1 for unlimited stock'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={async () => {
                      if (!newForSale.couponProfileId || !newForSale.price) {
                        setMessage({ type: 'error', text: t('language') === 'zh' ? '請填寫必填欄位' : 'Please fill required fields' });
                        return;
                      }
                      try {
                        await axios.post('/api/coupons-for-sale', newForSale);
                        setMessage({ type: 'success', text: t('language') === 'zh' ? '優惠券上架成功！' : 'Coupon listed!' });
                        setShowAddForSaleForm(false);
                        setNewForSale({ couponProfileId: '', price: '', stock: -1 });
                        fetchData();
                      } catch (error) {
                        setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                      }
                    }}
                    className="btn btn-primary"
                  >
                    {t('language') === 'zh' ? '上架販售' : 'List For Sale'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForSaleForm(false);
                      setNewForSale({ couponProfileId: '', price: '', stock: -1 });
                    }}
                    className="btn"
                  >
                    {t('language') === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {couponsForSale.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                {t('language') === 'zh' ? '尚無販售中的優惠券' : 'No coupons for sale yet'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {couponsForSale.map(coupon => (
                  <div key={coupon._id} style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '15px', background: 'white' }}>
                    {coupon.couponProfileId?.image && (
                      <img src={coupon.couponProfileId.image} alt={coupon.couponProfileId.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                    )}
                    <h5 style={{ marginBottom: '5px' }}>{coupon.couponProfileId?.name}</h5>
                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>{coupon.couponProfileId?.description || 'No description'}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#667eea' }}>
                        NT$ {coupon.price}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999' }}>
                        {t('language') === 'zh' ? '庫存' : 'Stock'}: {coupon.stock === -1 ? '∞' : coupon.stock}
                      </p>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: coupon.active ? '#28a745' : '#dc3545' }}>
                      {coupon.active ? `✓ ${t('language') === 'zh' ? '上架中' : 'Active'}` : `✗ ${t('language') === 'zh' ? '已下架' : 'Inactive'}`}
                    </p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={async () => {
                          try {
                            await axios.put(`/api/coupons-for-sale?couponId=${coupon._id}`, { active: !coupon.active });
                            setMessage({ type: 'success', text: t('language') === 'zh' ? '狀態更新成功' : 'Status updated' });
                            fetchData();
                          } catch (error) {
                            setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                          }
                        }}
                        className="btn"
                        style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                      >
                        {coupon.active ? (t('language') === 'zh' ? '下架' : 'Deactivate') : (t('language') === 'zh' ? '上架' : 'Activate')}
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(t('language') === 'zh' ? '確定要刪除此販售優惠券嗎？' : 'Delete this listing?')) {
                            try {
                              await axios.delete(`/api/coupons-for-sale?couponId=${coupon._id}`);
                              setMessage({ type: 'success', text: t('language') === 'zh' ? '販售優惠券刪除成功' : 'Listing deleted' });
                              fetchData();
                            } catch (error) {
                              setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                            }
                          }
                        }}
                        className="btn btn-danger"
                        style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                      >
                        🗑️ {t('language') === 'zh' ? '刪除' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
