import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './AdminDashboard.css';

function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classInfos, setClassInfos] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedClassInfo, setSelectedClassInfo] = useState(null);

  const [showAddClassInfoForm, setShowAddClassInfoForm] = useState(false);
  const [newClassInfo, setNewClassInfo] = useState({
    name: '',
    description: '',
    cost: '',
    maxParticipants: '',
    banner: ''
  });

  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClass, setNewClass] = useState({
    classInfoId: '',
    teacherId: '',
    teacher: '',
    time: '',
    date: '',
    location: '',
    status: 'upcoming'
  });

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
    banner: '',
    status: 'upcoming'
  });

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

  const [showAddCouponForm, setShowAddCouponForm] = useState(false);
  const [addingCoupon, setAddingCoupon] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const [newCoupon, setNewCoupon] = useState({
    type: 'trial',
    profileId: '',
    quantity: 1,
    expiryDate: ''
  });
  const [couponProfiles, setCouponProfiles] = useState([]);
  const [couponsForSale, setCouponsForSale] = useState([]);
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);
  const [showAddForSaleForm, setShowAddForSaleForm] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState(null);
  const [deletingForSaleId, setDeletingForSaleId] = useState(null);
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

  const [associationMeetings, setAssociationMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showAddMeetingForm, setShowAddMeetingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [editMeetingData, setEditMeetingData] = useState(null);
  const [approvingAbsence, setApprovingAbsence] = useState(null);
  const [newMeeting, setNewMeeting] = useState({
    agenda: '',
    date: '',
    time: '',
    meetingType: 'in-person',
    location: '',
    zoomUrl: '',
    memberType: '協會會員',
    mandatory: false,
    sendLineAnnouncement: false,
    status: 'upcoming'
  });

  // Filter states for status
  const [classStatusFilter, setClassStatusFilter] = useState('all');
  const [activityStatusFilter, setActivityStatusFilter] = useState('all');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, classesRes, classInfosRes, activitiesRes, teachersRes, profilesRes, forSaleRes, meetingsRes] = await Promise.all([
        axios.get('/api/admin?resource=members'),
        axios.get('/api/classes'),
        axios.get('/api/class-info'),
        axios.get('/api/activities'),
        axios.get('/api/teachers'),
        axios.get('/api/coupons?resource=profiles'),
        axios.get('/api/coupons?resource=for-sale'),
        axios.get('/api/association-meetings')
      ]);

      setMembers(membersRes.data.members);
      setClasses(classesRes.data.classes);
      setClassInfos(classInfosRes.data.classInfos);
      setActivities(activitiesRes.data.activities);
      setTeachers(teachersRes.data.teachers);
      setCouponProfiles(profilesRes.data.profiles);
      setCouponsForSale(forSaleRes.data.coupons);
      setAssociationMeetings(meetingsRes.data.meetings);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin');
      }
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

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

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

    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片大小不能超過 2MB' : 'Image size must be less than 2MB'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

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

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '時間格式不正確' : 'Invalid time format'
      });
      return;
    }

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

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (endTotalMin <= startTotalMin) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time'
      });
      return;
    }

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

    const formattedTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    try {
      await axios.post('/api/classes', { ...newClass, time: formattedTime }, {
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
        location: '',
        status: 'upcoming'
      });

      const classesRes = await axios.get('/api/classes');
      setClasses(classesRes.data.classes);
    } catch (error) {
      console.error('Error adding class:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();

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

    if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '時間格式不正確' : 'Invalid time format'
      });
      return;
    }

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

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (endTotalMin <= startTotalMin) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '結束時間必須晚於開始時間' : 'End time must be after start time'
      });
      return;
    }

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
        banner: '',
        status: 'upcoming'
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

      setClassInfos(prev => prev.filter(ci => ci._id !== id));
      setSelectedClassInfo(null);

      await axios.delete(`/api/class-info?id=${id}`);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '課程資訊刪除成功' : 'Class info deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting class info:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });

      const classInfosRes = await axios.get('/api/class-info');
      setClassInfos(classInfosRes.data.classInfos);
    }
  };

  const handleTeacherPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '圖片大小不能超過 2MB' : 'Image size must be less than 2MB'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

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

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請上傳圖片檔案' : 'Please upload an image file'
      });
      return;
    }

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

      if (type === 'class') {
        setClasses(prev => prev.filter(c => c._id !== id));
      } else {
        setActivities(prev => prev.filter(a => a._id !== id));
      }
      setSelectedItem(null);

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

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/association-meetings', newMeeting);

      setMessage({
        type: 'success',
        text: response.data.message || (t('language') === 'zh' ? '會議建立成功' : 'Meeting created successfully')
      });

      setShowAddMeetingForm(false);
      setNewMeeting({
        agenda: '',
        date: '',
        time: '',
        meetingType: 'in-person',
        location: '',
        zoomUrl: '',
        memberType: '協會會員',
        mandatory: false,
        sendLineAnnouncement: false,
        status: 'upcoming'
      });
      fetchData();
    } catch (error) {
      console.error('Error adding meeting:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeetingStatus = async (meetingId, status) => {
    // Show confirmation with disclaimer if status is being changed to completed or cancelled
    if ((status === 'completed' || status === 'cancelled') && selectedMeeting && selectedMeeting.absences && selectedMeeting.absences.length > 0) {
      const confirmMessage = t('language') === 'zh'
        ? `⚠️ 警告：將會議狀態更改為「${status === 'completed' ? '已完成' : '已取消'}」將會永久刪除所有請假表格（${selectedMeeting.absences.length} 個）。\n\n此操作無法撤銷。確定要繼續嗎？`
        : `⚠️ Warning: Changing meeting status to "${status === 'completed' ? 'Completed' : 'Cancelled'}" will permanently delete all absence forms (${selectedMeeting.absences.length} forms).\n\nThis action cannot be undone. Are you sure you want to continue?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    try {
      await axios.put(`/api/association-meetings?meetingId=${meetingId}`, { status });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '會議狀態更新成功' : 'Meeting status updated successfully'
      });

      if (selectedMeeting && selectedMeeting._id === meetingId) {
        // If status changed to completed or cancelled, clear absences
        const updatedMeeting = { ...selectedMeeting, status };
        if (status === 'completed' || status === 'cancelled') {
          updatedMeeting.absences = [];
        }
        setSelectedMeeting(updatedMeeting);
      }

      fetchData();
    } catch (error) {
      console.error('Error updating meeting status:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleUpdateItemStatus = async (type, itemId, status) => {
    try {
      const endpoint = type === 'class' ? '/api/classes' : '/api/activities';
      await axios.put(`${endpoint}?id=${itemId}`, { status });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '狀態更新成功' : 'Status updated successfully'
      });

      if (selectedItem && selectedItem._id === itemId) {
        setSelectedItem({ ...selectedItem, status });
      }

      fetchData();
    } catch (error) {
      console.error('Error updating item status:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleUpdateAttendance = async (meetingId, participantId, attended) => {
    try {
      await axios.put('/api/association-meetings?action=attendance', {
        meetingId,
        participantId,
        attended
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '出席狀態更新成功' : 'Attendance updated successfully'
      });

      // Update selectedMeeting if it's the same meeting
      if (selectedMeeting && selectedMeeting._id === meetingId) {
        const updatedParticipants = selectedMeeting.participants.map(p =>
          p._id === participantId ? { ...p, attended } : p
        );
        setSelectedMeeting({ ...selectedMeeting, participants: updatedParticipants });
      }

      fetchData();
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleApproveAbsence = async (meetingId, absenceId) => {
    setApprovingAbsence(absenceId);
    try {
      await axios.post(`/api/association-meetings?action=approve-absence&meetingId=${meetingId}`, {
        absenceId
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '請假申請已核准' : 'Absence request approved successfully'
      });

      // Update selectedMeeting if it's the same meeting
      if (selectedMeeting && selectedMeeting._id === meetingId) {
        const updatedAbsences = selectedMeeting.absences.map(a =>
          a._id === absenceId ? { ...a, approved: true, approvedAt: new Date() } : a
        );
        setSelectedMeeting({ ...selectedMeeting, absences: updatedAbsences });
      }

      fetchData();
    } catch (error) {
      console.error('Error approving absence:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    } finally {
      setApprovingAbsence(null);
    }
  };

  const handleEditMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(`/api/association-meetings?meetingId=${editMeetingData._id}`, {
        agenda: editMeetingData.agenda,
        date: editMeetingData.date,
        time: editMeetingData.time,
        meetingType: editMeetingData.meetingType || 'in-person',
        location: editMeetingData.location,
        zoomUrl: editMeetingData.zoomUrl,
        memberType: editMeetingData.memberType,
        mandatory: editMeetingData.mandatory || false,
        status: editMeetingData.status || 'upcoming'
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '會議更新成功' : 'Meeting updated successfully'
      });

      setEditingMeeting(false);
      setEditMeetingData(null);
      setSelectedMeeting(response.data.meeting);
      fetchData();
    } catch (error) {
      console.error('Error updating meeting:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm(t('language') === 'zh' ? '確定要刪除此會議嗎？' : 'Are you sure you want to delete this meeting?')) {
      return;
    }

    try {
      await axios.delete(`/api/association-meetings?meetingId=${meetingId}`);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '會議已刪除' : 'Meeting deleted successfully'
      });

      setSelectedMeeting(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  // Removed unused function - keeping for potential future use
  // const handleCouponImageUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setNewCoupon(prev => ({ ...prev, image: reader.result }));
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleCouponTypeChange = (type) => {
    setNewCoupon({
      type,
      profileId: '',
      quantity: 1,
      expiryDate: ''
    });
  };

  const handleCouponProfileChange = (profileId) => {
    setNewCoupon(prev => ({
      ...prev,
      profileId
    }));
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();

    if (!newCoupon.profileId) {
      setMessage({
        type: 'error',
        text: t('language') === 'zh' ? '請選擇優惠券模板' : 'Please select a coupon profile'
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

      const selectedProfile = couponProfiles.find(p => p._id === newCoupon.profileId);

      if (!selectedProfile) {
        throw new Error('Profile not found');
      }

      const couponData = {
        type: selectedProfile.type,
        name: selectedProfile.name,
        description: selectedProfile.description,
        image: selectedProfile.image,
        quantity: parseInt(newCoupon.quantity)
      };

      if (selectedProfile.type === 'trial') {
        couponData.classInfoId = selectedProfile.classInfoId;
      } else {
        couponData.discountPercent = selectedProfile.discountPercent;
      }

      if (newCoupon.expiryDate) {
        couponData.expiryDate = new Date(newCoupon.expiryDate);
      }

      await axios.post(`/api/members?memberId=${selectedMember.memberId}&action=add-coupon`, couponData);

      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '優惠券添加成功！' : 'Coupon added successfully!'
      });

      setNewCoupon({
        type: 'trial',
        profileId: '',
        quantity: 1,
        expiryDate: ''
      });
      setShowAddCouponForm(false);

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

      if (selectedItem && selectedItem._id === itemId) {
        setSelectedItem(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p._id === participantId ? { ...p, paid } : p
          )
        }));
        console.log('[Payment Update] Updated selectedItem state');
      }

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

      fetchData();
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
      console.log('[Payment Update] Loading state set to false');
    }
  };

  const updatePaymentMethod = async (type, itemId, participantId, paymentMethod) => {
    const key = `${type}-${itemId}-${participantId}-method`;

    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));

      if (type === 'class') {
        setClasses(prev => prev.map(c =>
          c._id === itemId
            ? {
                ...c,
                participants: c.participants.map(p =>
                  p._id === participantId ? { ...p, paymentMethod } : p
                )
              }
            : c
        ));
      } else {
        setActivities(prev => prev.map(a =>
          a._id === itemId
            ? {
                ...a,
                participants: a.participants.map(p =>
                  p._id === participantId ? { ...p, paymentMethod } : p
                )
              }
            : a
        ));
      }

      if (selectedItem && selectedItem._id === itemId) {
        setSelectedItem(prev => ({
          ...prev,
          participants: prev.participants.map(p =>
            p._id === participantId ? { ...p, paymentMethod } : p
          )
        }));
      }

      const resource = type === 'class' ? 'class-payment-method' : 'activity-payment-method';
      const idParam = type === 'class' ? 'classId' : 'activityId';
      const endpoint = `/api/admin?resource=${resource}&${idParam}=${itemId}&participantId=${participantId}`;

      await axios.put(endpoint, { paymentMethod });
      setMessage({
        type: 'success',
        text: t('language') === 'zh' ? '付款方式已更新' : 'Payment method updated'
      });
    } catch (error) {
      console.error('[Payment Method Update] Error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
      fetchData();
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-TW');
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
        <button className={`tab-button ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          {t('memberManagement')}
        </button>
        <button className={`tab-button ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
          {t('language') === 'zh' ? '課程與活動' : 'Class & Activity'}
        </button>
        <button className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
          {t('language') === 'zh' ? '主辦人管理' : 'Host Management'}
        </button>
        <button className={`tab-button ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
          {t('language') === 'zh' ? '優惠券管理' : 'Coupon Management'}
        </button>
        <button className={`tab-button ${activeTab === 'association' ? 'active' : ''}`} onClick={() => setActiveTab('association')}>
          {t('language') === 'zh' ? '協會管理' : 'Association Management'}
        </button>
      </div>

      {activeTab === 'members' && !selectedMember && (
        <div className="card">
          <h3>{t('memberManagement')}</h3>          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('memberId')}</th>
                  <th>{t('name')}</th>
                  <th>{t('language') === 'zh' ? '會籍狀態' : 'Membership'}</th>
                  <th>{t('language') === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member._id}>
                    <td>{member.memberId}</td>
                    <td>{member.name}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        background: member.membershipStatus === '協會會員' ? '#4dabf7' : '#868e96',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {member.membershipStatus || '會友'}
                      </span>
                    </td>
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
                <span>{selectedMember.referralCode || 'N/A'}</span>
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

            <div className="detail-section">
              <h4>{t('language') === 'zh' ? '會籍狀態' : 'Membership Status'}</h4>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '目前狀態：' : 'Current Status:'}</strong>
                <select
                  value={selectedMember.membershipStatus || '會友'}
                  onChange={async (e) => {
                    try {
                      const response = await axios.put(`/api/admin?resource=membership-status&memberId=${selectedMember._id}`, {
                        membershipStatus: e.target.value
                      });

                      // Update local state with full member object from response
                      const updatedMember = response.data.member;
                      setSelectedMember(updatedMember);
                      setMembers(members.map(m =>
                        m._id === selectedMember._id
                          ? updatedMember
                          : m
                      ));

                      setMessage({
                        type: 'success',
                        text: t('language') === 'zh' ? '會籍狀態已更新' : 'Membership status updated'
                      });
                    } catch (error) {
                      setMessage({
                        type: 'error',
                        text: error.response?.data?.message || t('error')
                      });
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: selectedMember.membershipStatus === '協會會員' ? '#e7f5ff' : '#f8f9fa',
                    color: selectedMember.membershipStatus === '協會會員' ? '#1971c2' : '#495057',
                    cursor: 'pointer'
                  }}
                >
                  <option value="會友">會友</option>
                  <option value="協會會員">協會會員</option>
                </select>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '成為會員日期：' : 'Member Since:'}</strong>
                <span>{formatDate(selectedMember.membershipStartDate || selectedMember.createdAt)}</span>
              </div>
              {selectedMember.membershipUpgradedDate && (
                <div className="detail-row">
                  <strong>{t('language') === 'zh' ? '升級日期：' : 'Upgraded On:'}</strong>
                  <span>{formatDate(selectedMember.membershipUpgradedDate)}</span>
                </div>
              )}
              {selectedMember.membershipPaymentMethod && (
                <div className="detail-row">
                  <strong>{t('language') === 'zh' ? '付款方式：' : 'Payment Method:'}</strong>
                  <span>
                    {selectedMember.membershipPaymentMethod === 'in-person'
                      ? (t('language') === 'zh' ? '現場付款' : 'In Person')
                      : selectedMember.membershipPaymentMethod === 'linepay'
                      ? 'LINE Pay'
                      : (t('language') === 'zh' ? '信用卡' : 'Credit Card')}
                  </span>
                </div>
              )}

              {/* Role Selection */}
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '角色：' : 'Role:'}</strong>
                <select
                  value={selectedMember.role || '一般會員'}
                  onChange={async (e) => {
                    try {
                      const response = await axios.put(`/api/admin?resource=member-role&memberId=${selectedMember._id}`, {
                        role: e.target.value
                      });

                      const updatedMember = response.data.member;
                      setSelectedMember(updatedMember);
                      setMembers(members.map(m =>
                        m._id === selectedMember._id ? updatedMember : m
                      ));

                      setMessage({
                        type: 'success',
                        text: t('language') === 'zh' ? '角色已更新' : 'Role updated'
                      });
                    } catch (error) {
                      setMessage({
                        type: 'error',
                        text: error.response?.data?.message || t('error')
                      });
                    }
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: selectedMember.role === '董事會' ? '#e7f5ff' : '#f8f9fa',
                    color: selectedMember.role === '董事會' ? '#1971c2' : '#495057',
                    cursor: 'pointer'
                  }}
                >
                  <option value="一般會員">{t('language') === 'zh' ? '一般會員' : 'General Member'}</option>
                  <option value="董事會">{t('language') === 'zh' ? '董事會' : 'Board of Directors'}</option>
                </select>
              </div>

              {/* Pending Upgrade Request */}
              {selectedMember.membershipUpgradeRequest && selectedMember.membershipUpgradeRequest.status === 'pending' && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  background: '#fff3cd',
                  border: '2px solid #ffc107',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ color: '#856404', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ {t('language') === 'zh' ? '待處理升級請求' : 'Pending Upgrade Request'}
                  </h4>
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ marginBottom: '8px' }}>
                      <strong>{t('language') === 'zh' ? '請求時間：' : 'Requested At:'}</strong>{' '}
                      {formatDate(selectedMember.membershipUpgradeRequest.requestedAt)}
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                      <strong>{t('language') === 'zh' ? '付款方式：' : 'Payment Method:'}</strong>{' '}
                      {selectedMember.membershipUpgradeRequest.paymentMethod === 'in-person'
                        ? (t('language') === 'zh' ? '現場付款' : 'In Person')
                        : selectedMember.membershipUpgradeRequest.paymentMethod}
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                      <strong>{t('language') === 'zh' ? '升級至：' : 'Upgrade To:'}</strong> 協會會員
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        try {
                          // Approve the upgrade request (this endpoint handles everything)
                          const response = await axios.put(`/api/members?action=approve-upgrade-request&memberId=${selectedMember.memberId}`);

                          const updatedMember = response.data.member;
                          setSelectedMember(updatedMember);
                          setMembers(members.map(m =>
                            m._id === selectedMember._id ? updatedMember : m
                          ));

                          setMessage({
                            type: 'success',
                            text: t('language') === 'zh' ? '升級請求已批准' : 'Upgrade request approved'
                          });
                        } catch (error) {
                          setMessage({
                            type: 'error',
                            text: error.response?.data?.message || t('error')
                          });
                        }
                      }}
                      style={{ background: '#28a745' }}
                    >
                      ✓ {t('language') === 'zh' ? '批准升級' : 'Approve Upgrade'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={async () => {
                        if (!window.confirm(t('language') === 'zh' ? '確定要拒絕此升級請求嗎？' : 'Are you sure you want to reject this upgrade request?')) {
                          return;
                        }
                        try {
                          const response = await axios.put(`/api/members?action=reject-upgrade-request&memberId=${selectedMember.memberId}`);

                          const updatedMember = response.data.member;
                          setSelectedMember(updatedMember);
                          setMembers(members.map(m =>
                            m._id === selectedMember._id ? updatedMember : m
                          ));

                          setMessage({
                            type: 'success',
                            text: t('language') === 'zh' ? '升級請求已拒絕' : 'Upgrade request rejected'
                          });
                        } catch (error) {
                          setMessage({
                            type: 'error',
                            text: error.response?.data?.message || t('error')
                          });
                        }
                      }}
                      style={{ background: '#dc3545' }}
                    >
                      ✗ {t('language') === 'zh' ? '拒絕' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}
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
          )}          <div className="detail-section" style={{ marginTop: '30px' }}>
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
                    <option value="trial">{t('language') === 'zh' ? '體驗券' : 'Trial Coupon'}</option>
                    <option value="discount">{t('language') === 'zh' ? '折扣券' : 'Discount Coupon'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('language') === 'zh' ? '選擇優惠券模板' : 'Select Coupon Profile'}</label>
                  <select
                    value={newCoupon.profileId}
                    onChange={(e) => handleCouponProfileChange(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">{t('language') === 'zh' ? '-- 選擇模板 --' : '-- Select Profile --'}</option>
                    {couponProfiles
                      .filter(profile => profile.type === newCoupon.type)
                      .map(profile => (
                        <option key={profile._id} value={profile._id}>
                          {profile.name}
                          {profile.type === 'trial' && profile.classInfoId?.name && ` (${profile.classInfoId.name})`}
                          {profile.type === 'discount' && ` (${profile.discountPercent}%)`}
                        </option>
                      ))}
                  </select>
                  <small style={{ color: '#666' }}>
                    {t('language') === 'zh'
                      ? '選擇後將自動填入優惠券資訊'
                      : 'Coupon information will be auto-filled based on profile'}
                  </small>
                </div>

                {newCoupon.profileId && (() => {
                  const selectedProfile = couponProfiles.find(p => p._id === newCoupon.profileId);
                  if (!selectedProfile) return null;

                  return (
                    <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '8px', marginBottom: '15px' }}>
                      <h5 style={{ marginTop: 0, marginBottom: '10px', color: '#004085' }}>
                        {t('language') === 'zh' ? '📋 模板預覽' : '📋 Profile Preview'}
                      </h5>
                      {selectedProfile.image && (
                        <img
                          src={selectedProfile.image}
                          alt={selectedProfile.name}
                          style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', marginBottom: '10px' }}
                        />
                      )}
                      <p style={{ margin: '5px 0', color: '#004085' }}>
                        <strong>{t('language') === 'zh' ? '名稱：' : 'Name: '}</strong>
                        {selectedProfile.name}
                      </p>
                      <p style={{ margin: '5px 0', color: '#004085' }}>
                        <strong>{t('language') === 'zh' ? '描述：' : 'Description: '}</strong>
                        {selectedProfile.description}
                      </p>
                      {selectedProfile.type === 'trial' && selectedProfile.classInfoId && (
                        <p style={{ margin: '5px 0', color: '#004085' }}>
                          <strong>{t('language') === 'zh' ? '課程：' : 'Class: '}</strong>
                          {selectedProfile.classInfoId.name}
                        </p>
                      )}
                      {selectedProfile.type === 'discount' && (
                        <p style={{ margin: '5px 0', color: '#004085' }}>
                          <strong>{t('language') === 'zh' ? '折扣：' : 'Discount: '}</strong>
                          {selectedProfile.discountPercent}%
                        </p>
                      )}
                    </div>
                  );
                })()}

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

                <button type="submit" className="btn btn-primary" disabled={addingCoupon}>
                  {addingCoupon
                    ? (t('language') === 'zh' ? '⏳ 添加中...' : '⏳ Adding...')
                    : (t('language') === 'zh' ? '添加優惠券' : 'Add Coupon')}
                </button>
              </form>
            )}            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
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
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(t('language') === 'zh' ? '確定要刪除此課程資訊嗎？' : 'Are you sure you want to delete this class information?')) {
                    handleDeleteClassInfo(selectedClassInfo._id);
                  }
                }}
                style={{ marginLeft: 'auto' }}
              >
                {t('delete')}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'items' && !selectedItem && !selectedClassInfo && (
        <div className="card">
          <h3>{t('language') === 'zh' ? '課程與活動管理' : 'Class & Activity Management'}</h3>          <div className="items-section" style={{ marginTop: '30px' }}>
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
                </div>                <div className="form-group">
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
            )}            <div className="items-list" style={{ marginTop: '20px' }}>
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
                  </div>
                </div>
              ))}
            </div>
          </div>          <div className="items-section" style={{ marginTop: '40px' }}>
            <div className="section-header">
              <h4 style={{ color: '#667eea' }}>
                {t('hostClass')} ({classes.length})
              </h4>
              <button
                onClick={() => setShowAddClassForm(!showAddClassForm)}
                className="btn btn-primary"
              >
                {showAddClassForm ? t('cancel') : t('addNew')}
              </button>
            </div>

            <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px' }}>
              <label>{t('language') === 'zh' ? '篩選狀態' : 'Filter by Status'}</label>
              <select
                value={classStatusFilter}
                onChange={(e) => setClassStatusFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="all">{t('language') === 'zh' ? '全部' : 'All'}</option>
                <option value="upcoming">{t('language') === 'zh' ? '即將到來' : 'Upcoming'}</option>
                <option value="completed">{t('language') === 'zh' ? '已完成' : 'Completed'}</option>
                <option value="cancelled">{t('language') === 'zh' ? '已取消' : 'Cancelled'}</option>
              </select>
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
                      : 'Members can view and enroll in this class by clicking "Class & Activity" in their profile menu!'}
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
            )}            <div className="items-list" style={{ marginTop: '20px' }}>
              {classes
                .filter(classItem => classStatusFilter === 'all' || classItem.status === classStatusFilter)
                .map(classItem => (
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
                  </div>
                </div>
              ))}
            </div>
          </div>          <div className="items-section" style={{ marginTop: '40px' }}>
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

            <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px' }}>
              <label>{t('language') === 'zh' ? '篩選狀態' : 'Filter by Status'}</label>
              <select
                value={activityStatusFilter}
                onChange={(e) => setActivityStatusFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="all">{t('language') === 'zh' ? '全部' : 'All'}</option>
                <option value="upcoming">{t('language') === 'zh' ? '即將到來' : 'Upcoming'}</option>
                <option value="completed">{t('language') === 'zh' ? '已完成' : 'Completed'}</option>
                <option value="cancelled">{t('language') === 'zh' ? '已取消' : 'Cancelled'}</option>
              </select>
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
                )}                <div className="form-group">
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
            )}            <div className="items-list" style={{ marginTop: '20px' }}>
              {activities
                .filter(activity => activityStatusFilter === 'all' || activity.status === activityStatusFilter)
                .map(activity => (
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
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '狀態' : 'Status'}:</strong>
                <select
                  value={selectedItem.status || 'upcoming'}
                  onChange={(e) => handleUpdateItemStatus(selectedItem.type, selectedItem._id, e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: '4px' }}
                >
                  <option value="upcoming">{t('language') === 'zh' ? '即將到來' : 'Upcoming'}</option>
                  <option value="completed">{t('language') === 'zh' ? '已完成' : 'Completed'}</option>
                  <option value="cancelled">{t('language') === 'zh' ? '已取消' : 'Cancelled'}</option>
                </select>
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
                      <th>{t('language') === 'zh' ? '付款方式' : 'Payment Method'}</th>
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
                          <select
                            value={participant.paymentMethod || 'in-person'}
                            onChange={(e) => updatePaymentMethod(
                              selectedItem.type,
                              selectedItem._id,
                              participant._id,
                              e.target.value
                            )}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="in-person">
                              {t('language') === 'zh' ? '現場付款' : 'In Person'}
                            </option>
                            <option value="credit">
                              {t('language') === 'zh' ? '信用卡' : 'Credit Card'}
                            </option>
                            <option value="linepay">
                              {t('language') === 'zh' ? 'LINE Pay' : 'LINE Pay'}
                            </option>
                          </select>
                        </td>
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
              </div>              <div className="form-group">
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
          )}          <div className="table-container" style={{ marginTop: '30px' }}>
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
                        await axios.post('/api/coupons?resource=profiles', newProfile);
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
                          setDeletingProfileId(profile._id);
                          try {
                            await axios.delete(`/api/coupons?resource=profiles&profileId=${profile._id}`);
                            setMessage({ type: 'success', text: t('language') === 'zh' ? '模板刪除成功' : 'Profile deleted' });
                            fetchData();
                          } catch (error) {
                            setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                          } finally {
                            setDeletingProfileId(null);
                          }
                        }
                      }}
                      className="btn btn-danger"
                      disabled={deletingProfileId === profile._id}
                      style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                    >
                      {deletingProfileId === profile._id
                        ? (t('language') === 'zh' ? '⏳ 刪除中...' : '⏳ Deleting...')
                        : `🗑️ ${t('language') === 'zh' ? '刪除模板' : 'Delete'}`}
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
                        await axios.post('/api/coupons?resource=for-sale', newForSale);
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
                            setDeletingForSaleId(coupon._id);
                            try {
                              await axios.delete(`/api/coupons?resource=for-sale&couponId=${coupon._id}`);
                              setMessage({ type: 'success', text: t('language') === 'zh' ? '販售優惠券刪除成功' : 'Listing deleted' });
                              fetchData();
                            } catch (error) {
                              setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                            } finally {
                              setDeletingForSaleId(null);
                            }
                          }
                        }}
                        className="btn btn-danger"
                        disabled={deletingForSaleId === coupon._id}
                        style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                      >
                        {deletingForSaleId === coupon._id
                          ? (t('language') === 'zh' ? '⏳ 刪除中...' : '⏳ Deleting...')
                          : `🗑️ ${t('language') === 'zh' ? '刪除' : 'Delete'}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'association' && !selectedMeeting && (
        <div className="card">
          <div className="section-header">
            <h3>{t('language') === 'zh' ? '協會會議管理' : 'Association Meeting Management'}</h3>
            <button className="btn btn-primary" onClick={() => setShowAddMeetingForm(true)}>
              {t('language') === 'zh' ? '+ 建立會議' : '+ Create Meeting'}
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px' }}>
            <label>{t('language') === 'zh' ? '篩選狀態' : 'Filter by Status'}</label>
            <select
              value={meetingStatusFilter}
              onChange={(e) => setMeetingStatusFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">{t('language') === 'zh' ? '全部' : 'All'}</option>
              <option value="upcoming">{t('language') === 'zh' ? '即將到來' : 'Upcoming'}</option>
              <option value="completed">{t('language') === 'zh' ? '已完成' : 'Completed'}</option>
              <option value="cancelled">{t('language') === 'zh' ? '已取消' : 'Cancelled'}</option>
            </select>
          </div>

          {showAddMeetingForm && (
            <form onSubmit={handleAddMeeting} className="form" style={{ marginTop: '20px', border: '2px solid #667eea', padding: '20px', borderRadius: '8px' }}>
              <h4>{t('language') === 'zh' ? '建立新會議' : 'Create New Meeting'}</h4>

              <div className="form-group">
                <label>{t('language') === 'zh' ? '議程' : 'Agenda'} *</label>
                <input
                  type="text"
                  value={newMeeting.agenda}
                  onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('language') === 'zh' ? '日期' : 'Date'} *</label>
                <input
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('language') === 'zh' ? '時間' : 'Time'} *</label>
                <input
                  type="time"
                  value={newMeeting.time}
                  onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('language') === 'zh' ? '會議類型' : 'Meeting Type'} *</label>
                <select
                  value={newMeeting.meetingType}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingType: e.target.value })}
                  required
                >
                  <option value="in-person">{t('language') === 'zh' ? '實體會議' : 'In Person'}</option>
                  <option value="zoom">{t('language') === 'zh' ? '線上會議 (Zoom)' : 'Online (Zoom)'}</option>
                </select>
              </div>

              {newMeeting.meetingType === 'in-person' ? (
                <div className="form-group">
                  <label>{t('location')}</label>
                  <input
                    type="text"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                    placeholder={t('language') === 'zh' ? '會議地點' : 'Meeting location'}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>{t('language') === 'zh' ? 'Zoom 連結' : 'Zoom URL'}</label>
                  <input
                    type="url"
                    value={newMeeting.zoomUrl}
                    onChange={(e) => setNewMeeting({ ...newMeeting, zoomUrl: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>{t('language') === 'zh' ? '會員類型' : 'Member Type'} *</label>
                <select
                  value={newMeeting.memberType}
                  onChange={(e) => setNewMeeting({ ...newMeeting, memberType: e.target.value })}
                  required
                >
                  <option value="協會會員">{t('language') === 'zh' ? '協會會員' : 'Association Members'}</option>
                  <option value="董事會">{t('language') === 'zh' ? '董事會' : 'Board of Directors'}</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="mandatory"
                  checked={newMeeting.mandatory}
                  onChange={(e) => setNewMeeting({ ...newMeeting, mandatory: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="mandatory" style={{ margin: 0 }}>
                  {t('language') === 'zh' ? '強制參加（會員必須出席或提交請假表）' : 'Mandatory (members must attend or submit absence form)'}
                </label>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="sendLineAnnouncement"
                  checked={newMeeting.sendLineAnnouncement}
                  onChange={(e) => setNewMeeting({ ...newMeeting, sendLineAnnouncement: e.target.checked })}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="sendLineAnnouncement" style={{ margin: 0 }}>
                  {t('language') === 'zh' ? '發送 LINE 公告給所有協會會員' : 'Send LINE announcement to all association members'}
                </label>
              </div>

              {newMeeting.meetingType === 'in-person' && newMeeting.location && (
                <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('language') === 'zh' ? '地圖預覽' : 'Map Preview'}
                  </label>
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(newMeeting.location)}&output=embed`}
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

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (t('language') === 'zh' ? '建立中...' : 'Creating...') : (t('language') === 'zh' ? '建立' : 'Create')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowAddMeetingForm(false);
                  setNewMeeting({ agenda: '', date: '', time: '', meetingType: 'in-person', location: '', zoomUrl: '', memberType: '協會會員', mandatory: false, sendLineAnnouncement: false, status: 'upcoming' });
                }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          )}

          <div className="table-container" style={{ marginTop: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th>{t('language') === 'zh' ? '議程' : 'Agenda'}</th>
                  <th>{t('language') === 'zh' ? '日期' : 'Date'}</th>
                  <th>{t('language') === 'zh' ? '時間' : 'Time'}</th>
                  <th>{t('language') === 'zh' ? '類型' : 'Type'}</th>
                  <th>{t('language') === 'zh' ? '報名人數' : 'Registered'}</th>
                  <th>{t('language') === 'zh' ? '狀態' : 'Status'}</th>
                  <th>{t('language') === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {associationMeetings
                  .filter(meeting => meetingStatusFilter === 'all' || meeting.status === meetingStatusFilter)
                  .map(meeting => (
                  <tr key={meeting._id}>
                    <td>{meeting.agenda}</td>
                    <td>{new Date(meeting.date).toLocaleDateString('zh-TW')}</td>
                    <td>{meeting.time}</td>
                    <td>{meeting.memberType}</td>
                    <td>{meeting.participants.length}</td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        background: meeting.status === 'upcoming' ? '#4dabf7' : meeting.status === 'completed' ? '#2b8a3e' : '#868e96',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {meeting.status === 'upcoming' ? (t('language') === 'zh' ? '即將舉行' : 'Upcoming') :
                         meeting.status === 'completed' ? (t('language') === 'zh' ? '已完成' : 'Completed') :
                         (t('language') === 'zh' ? '已取消' : 'Cancelled')}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => setSelectedMeeting(meeting)}>
                        {t('language') === 'zh' ? '查看詳情' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {associationMeetings.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                {t('language') === 'zh' ? '尚無會議' : 'No meetings yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'association' && selectedMeeting && !editingMeeting && (
        <div className="card">
          <div className="detail-header">
            <h3>{t('language') === 'zh' ? '會議詳情' : 'Meeting Details'}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => {
                setEditMeetingData({
                  ...selectedMeeting,
                  date: new Date(selectedMeeting.date).toISOString().split('T')[0]
                });
                setEditingMeeting(true);
              }}>
                ✏️ {t('language') === 'zh' ? '編輯' : 'Edit'}
              </button>
              <button className="btn btn-secondary" style={{ background: '#dc3545' }} onClick={() => handleDeleteMeeting(selectedMeeting._id)}>
                🗑️ {t('language') === 'zh' ? '刪除' : 'Delete'}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedMeeting(null)}>
                {t('language') === 'zh' ? '← 返回列表' : '← Back to List'}
              </button>
            </div>
          </div>

          <div className="detail-section">
            <h4>{t('language') === 'zh' ? '基本資訊' : 'Basic Information'}</h4>
            <div className="detail-row">
              <strong>{t('language') === 'zh' ? '議程：' : 'Agenda:'}</strong>
              <span>{selectedMeeting.agenda}</span>
            </div>
            <div className="detail-row">
              <strong>{t('language') === 'zh' ? '日期：' : 'Date:'}</strong>
              <span>{new Date(selectedMeeting.date).toLocaleDateString('zh-TW')}</span>
            </div>
            <div className="detail-row">
              <strong>{t('language') === 'zh' ? '時間：' : 'Time:'}</strong>
              <span>{selectedMeeting.time}</span>
            </div>
            {selectedMeeting.location && (
              <div className="detail-row">
                <strong>{t('location')}：</strong>
                <span>📍 {selectedMeeting.location}</span>
              </div>
            )}
            <div className="detail-row">
              <strong>{t('language') === 'zh' ? '會員類型：' : 'Member Type:'}</strong>
              <span>{selectedMeeting.memberType}</span>
            </div>
            <div className="detail-row">
              <strong>{t('language') === 'zh' ? '狀態：' : 'Status:'}</strong>
              <select
                value={selectedMeeting.status}
                onChange={(e) => handleUpdateMeetingStatus(selectedMeeting._id, e.target.value)}
                style={{ padding: '5px 10px', borderRadius: '4px' }}
              >
                <option value="upcoming">{t('language') === 'zh' ? '即將舉行' : 'Upcoming'}</option>
                <option value="completed">{t('language') === 'zh' ? '已完成' : 'Completed'}</option>
                <option value="cancelled">{t('language') === 'zh' ? '已取消' : 'Cancelled'}</option>
              </select>
            </div>
          </div>

          {selectedMeeting.location && (
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h4>{t('language') === 'zh' ? '會議地點' : 'Meeting Location'}</h4>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedMeeting.location)}&output=embed`}
                width="100%"
                height="300"
                style={{ border: '1px solid #ddd', borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Meeting Location Map"
              />
            </div>
          )}

          <div className="detail-section">
            <h4>{t('language') === 'zh' ? '報名成員' : 'Registered Members'} ({selectedMeeting.participants.length})</h4>
            {selectedMeeting.participants.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('language') === 'zh' ? '會員編號' : 'Member ID'}</th>
                      <th>{t('memberName')}</th>
                      <th>{t('language') === 'zh' ? '報名時間' : 'Registration Time'}</th>
                      <th>{t('language') === 'zh' ? '出席狀態' : 'Attendance'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMeeting.participants.map(participant => (
                      <tr key={participant._id}>
                        <td>{participant.memberIdString}</td>
                        <td>{participant.memberName}</td>
                        <td>{new Date(participant.registeredAt).toLocaleDateString('zh-TW')}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={participant.attended}
                            onChange={(e) => handleUpdateAttendance(selectedMeeting._id, participant._id, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ marginLeft: '5px' }}>
                            {participant.attended ? (t('language') === 'zh' ? '已出席' : 'Attended') : (t('language') === 'zh' ? '未出席' : 'Not attended')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                {t('language') === 'zh' ? '尚無成員報名' : 'No members registered yet'}
              </p>
            )}
          </div>

          {/* Absence Requests Section */}
          {selectedMeeting.mandatory && (
            <div className="detail-section">
              <h4>
                {t('language') === 'zh' ? '請假申請' : 'Absence Requests'}
                {selectedMeeting.absences ? ` (${selectedMeeting.absences.length})` : ' (0)'}
              </h4>
              {selectedMeeting.absences && selectedMeeting.absences.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('language') === 'zh' ? '會員編號' : 'Member ID'}</th>
                        <th>{t('memberName')}</th>
                        <th>{t('language') === 'zh' ? '提交時間' : 'Submitted At'}</th>
                        <th>{t('language') === 'zh' ? '請假表' : 'Form'}</th>
                        <th>{t('language') === 'zh' ? '狀態' : 'Status'}</th>
                        <th>{t('language') === 'zh' ? '操作' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMeeting.absences.map((absence, index) => (
                        <tr key={index}>
                          <td>{absence.memberIdString}</td>
                          <td>{absence.memberName}</td>
                          <td>{new Date(absence.requestedAt).toLocaleDateString('zh-TW')}</td>
                          <td>
                            {absence.formImageUrl ? (
                              <a
                                href={absence.formImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary btn-small"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                              >
                                📄 {t('language') === 'zh' ? '查看表格' : 'View Form'}
                              </a>
                            ) : absence.formImage ? (
                              <button
                                onClick={() => {
                                  const newWindow = window.open();
                                  newWindow.document.write(`<img src="${absence.formImage}" style="max-width:100%;height:auto;" />`);
                                }}
                                className="btn btn-primary btn-small"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                              >
                                📄 {t('language') === 'zh' ? '查看表格' : 'View Form'}
                              </button>
                            ) : (
                              <span style={{ color: '#666', fontStyle: 'italic' }}>
                                {t('language') === 'zh' ? '無表格' : 'No form'}
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: absence.approved ? '#d4edda' : '#fff3cd',
                              color: absence.approved ? '#155724' : '#856404',
                              border: `1px solid ${absence.approved ? '#c3e6cb' : '#ffc107'}`
                            }}>
                              {absence.approved
                                ? (t('language') === 'zh' ? '✓ 已核准' : '✓ Approved')
                                : (t('language') === 'zh' ? '⏳ 待審核' : '⏳ Pending')
                              }
                            </span>
                          </td>
                          <td>
                            {!absence.approved && (
                              <button
                                onClick={() => handleApproveAbsence(selectedMeeting._id, absence._id)}
                                className="btn btn-primary btn-small"
                                style={{ padding: '5px 10px', fontSize: '12px', background: '#28a745' }}
                                disabled={approvingAbsence === absence._id}
                              >
                                {approvingAbsence === absence._id
                                  ? (t('language') === 'zh' ? '核准中...' : 'Approving...')
                                  : (t('language') === 'zh' ? '核准' : 'Approve')
                                }
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  {t('language') === 'zh' ? '尚無請假申請' : 'No absence requests yet'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'association' && editingMeeting && editMeetingData && (
        <div className="card">
          <div className="detail-header">
            <h3>{t('language') === 'zh' ? '編輯會議' : 'Edit Meeting'}</h3>
            <button className="btn btn-secondary" onClick={() => {
              setEditingMeeting(false);
              setEditMeetingData(null);
            }}>
              {t('language') === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>

          <form onSubmit={handleEditMeeting} className="form">
            <div className="form-group">
              <label>{t('language') === 'zh' ? '議程' : 'Agenda'} *</label>
              <input
                type="text"
                value={editMeetingData.agenda}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, agenda: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('language') === 'zh' ? '日期' : 'Date'} *</label>
              <input
                type="date"
                value={editMeetingData.date}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('language') === 'zh' ? '時間' : 'Time'} *</label>
              <input
                type="time"
                value={editMeetingData.time}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('language') === 'zh' ? '會議類型' : 'Meeting Type'} *</label>
              <select
                value={editMeetingData.meetingType || 'in-person'}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, meetingType: e.target.value })}
                required
              >
                <option value="in-person">{t('language') === 'zh' ? '實體會議' : 'In Person'}</option>
                <option value="zoom">{t('language') === 'zh' ? '線上會議 (Zoom)' : 'Online (Zoom)'}</option>
              </select>
            </div>

            {(editMeetingData.meetingType || 'in-person') === 'in-person' ? (
              <div className="form-group">
                <label>{t('location')}</label>
                <input
                  type="text"
                  value={editMeetingData.location || ''}
                  onChange={(e) => setEditMeetingData({ ...editMeetingData, location: e.target.value })}
                  placeholder={t('language') === 'zh' ? '會議地點' : 'Meeting location'}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>{t('language') === 'zh' ? 'Zoom 連結' : 'Zoom URL'}</label>
                <input
                  type="url"
                  value={editMeetingData.zoomUrl || ''}
                  onChange={(e) => setEditMeetingData({ ...editMeetingData, zoomUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}

            <div className="form-group">
              <label>{t('language') === 'zh' ? '會員類型' : 'Member Type'} *</label>
              <select
                value={editMeetingData.memberType}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, memberType: e.target.value })}
                required
              >
                <option value="協會會員">{t('language') === 'zh' ? '協會會員' : 'Association Members'}</option>
                <option value="董事會">{t('language') === 'zh' ? '董事會' : 'Board of Directors'}</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="editMandatory"
                checked={editMeetingData.mandatory || false}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, mandatory: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <label htmlFor="editMandatory" style={{ margin: 0 }}>
                {t('language') === 'zh' ? '強制參加（會員必須出席或提交請假表）' : 'Mandatory (members must attend or submit absence form)'}
              </label>
            </div>

            {(editMeetingData.meetingType || 'in-person') === 'in-person' && editMeetingData.location && (
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {t('language') === 'zh' ? '地圖預覽' : 'Map Preview'}
                </label>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(editMeetingData.location)}&output=embed`}
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

            <div className="form-group">
              <label>{t('language') === 'zh' ? '狀態' : 'Status'} *</label>
              <select
                value={editMeetingData.status || 'upcoming'}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, status: e.target.value })}
                required
              >
                <option value="upcoming">{t('language') === 'zh' ? '即將到來' : 'Upcoming'}</option>
                <option value="completed">{t('language') === 'zh' ? '已完成' : 'Completed'}</option>
                <option value="cancelled">{t('language') === 'zh' ? '已取消' : 'Cancelled'}</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (t('language') === 'zh' ? '更新中...' : 'Updating...') : (t('language') === 'zh' ? '更新' : 'Update')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setEditingMeeting(false);
                setEditMeetingData(null);
              }}>
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
