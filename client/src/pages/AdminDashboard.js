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

  const [editingTeacherPhoto, setEditingTeacherPhoto] = useState(false);
  const [uploadingTeacherPhoto, setUploadingTeacherPhoto] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(false);
  const [editTeacherData, setEditTeacherData] = useState({});

  const [selectedCouponProfile, setSelectedCouponProfile] = useState(null);
  const [editingCouponProfile, setEditingCouponProfile] = useState(false);
  const [editCouponProfileData, setEditCouponProfileData] = useState({});

  const [showAddClassInfoForm, setShowAddClassInfoForm] = useState(false);
  const [newClassInfo, setNewClassInfo] = useState({
    name: '',
    description: '',
    cost: '',
    maxParticipants: '',
    banner: '',
    ageRange: ''
  });

  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [newClass, setNewClass] = useState({
    classInfoId: '',
    teacherId: [],
    teacher: '',
    time: '',
    date: '',
    location: '',
    status: 'upcoming',
    sendLineAnnouncement: false
  });

  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    cost: '',
    teacherId: [],
    teacher: '',
    maxParticipants: '',
    banner: '',
    status: 'upcoming',
    ageRange: ''
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

  const [editingItem, setEditingItem] = useState(false);
  const [editItemData, setEditItemData] = useState({});

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

  const handleDeleteMember = async (memberIdToDelete) => {
    const confirmMessage = t('language') === 'zh'
      ? `確定要刪除會員 ${memberIdToDelete} 嗎？此操作無法撤銷。`
      : `Are you sure you want to delete member ${memberIdToDelete}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/members?action=delete-member&memberId=${memberIdToDelete}`);

      setMessage({
        type: 'success',
        text: t('member_deleted_successfully')
      });

      // Refresh member list
      await fetchData();

      // Clear selected member if it was the deleted one
      if (selectedMember && selectedMember.memberId === memberIdToDelete) {
        setSelectedMember(null);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || (t('delete_failed'))
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewClassInfoBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('please_upload_an_image_file')
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewClassInfo({ ...newClassInfo, banner: reader.result });
      setMessage({
        type: 'success',
        text: t('image_uploaded_successfully')
      });
    };
    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('failed_to_upload_image')
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
        text: t('image_size_must_be_less_than_2mb')
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('please_upload_an_image_file')
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
          text: t('image_uploaded_successfully')
        });
      };
      img.src = event.target.result;
    };

    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('failed_to_upload_image')
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
        text: t('please_fill_in_complete_time')
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
        text: t('invalid_time_format')
      });
      return;
    }

    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      setMessage({
        type: 'error',
        text: t('hours_must_be_between_0_23')
      });
      return;
    }

    if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
      setMessage({
        type: 'error',
        text: t('minutes_must_be_between_0_59')
      });
      return;
    }

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (endTotalMin <= startTotalMin) {
      setMessage({
        type: 'error',
        text: t('end_time_must_be_after_start_time')
      });
      return;
    }

    const duration = endTotalMin - startTotalMin;
    if (duration < 15) {
      setMessage({
        type: 'error',
        text: t('class_must_be_at_least_15_minutes_long')
      });
      return;
    }

    if (duration > 720) { // 12 hours
      setMessage({
        type: 'error',
        text: t('class_cannot_exceed_12_hours')
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
        text: t('class_hosted_successfully')
      });
      setShowAddClassForm(false);
      setNewClass({
        classInfoId: '',
        teacherId: [],
        teacher: '',
        time: '',
        date: '',
        location: '',
        status: 'upcoming',
        sendLineAnnouncement: false
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
        text: t('please_fill_in_complete_time')
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
        text: t('invalid_time_format')
      });
      return;
    }

    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      setMessage({
        type: 'error',
        text: t('hours_must_be_between_0_23')
      });
      return;
    }

    if (startMin < 0 || startMin > 59 || endMin < 0 || endMin > 59) {
      setMessage({
        type: 'error',
        text: t('minutes_must_be_between_0_59')
      });
      return;
    }

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (endTotalMin <= startTotalMin) {
      setMessage({
        type: 'error',
        text: t('end_time_must_be_after_start_time')
      });
      return;
    }

    const duration = endTotalMin - startTotalMin;
    if (duration < 15) {
      setMessage({
        type: 'error',
        text: t('activity_must_be_at_least_15_minutes_long')
      });
      return;
    }

    if (duration > 720) { // 12 hours
      setMessage({
        type: 'error',
        text: t('activity_cannot_exceed_12_hours')
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
        text: t('activity_added_successfully')
      });
      setShowAddActivityForm(false);
      setNewActivity({
        name: '',
        description: '',
        date: '',
        time: '',
        location: '',
        cost: '',
        teacherId: [],
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
        text: t('class_info_updated_successfully')
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
    if (!window.confirm(t('are_you_sure_you_want_to_delete_this_will_affect_a'))) {
      return;
    }

    try {

      setClassInfos(prev => prev.filter(ci => ci._id !== id));
      setSelectedClassInfo(null);

      await axios.delete(`/api/class-info?id=${id}`);

      setMessage({
        type: 'success',
        text: t('class_info_deleted_successfully')
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
        text: t('image_size_must_be_less_than_2mb')
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({
        type: 'error',
        text: t('please_upload_an_image_file')
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTeacher({ ...newTeacher, photo: reader.result });
      setMessage({
        type: 'success',
        text: t('image_uploaded_successfully')
      });
    };
    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('failed_to_upload_image')
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
        text: t('please_upload_an_image_file')
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedClassInfo({ ...selectedClassInfo, banner: reader.result });
      setMessage({
        type: 'success',
        text: t('image_uploaded_successfully')
      });
    };
    reader.onerror = () => {
      setMessage({
        type: 'error',
        text: t('failed_to_upload_image')
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
        text: t('host_added_successfully')
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
    if (!window.confirm(t('are_you_sure_you_want_to_delete'))) {
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
    if (!window.confirm(t('are_you_sure_you_want_to_delete'))) {
      return;
    }

    try {
      await axios.delete(`/api/teachers?id=${id}`);

      setMessage({
        type: 'success',
        text: t('host_deleted_successfully')
      });
      setSelectedTeacher(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleUpdateTeacherPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('image_size_must_be_less_than_2mb') });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t('please_upload_an_image_file') });
      return;
    }

    setUploadingTeacherPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await axios.put(`/api/teachers?id=${selectedTeacher._id}`, {
          photo: reader.result
        });

        setMessage({ type: 'success', text: t('image_uploaded_successfully') });
        setSelectedTeacher({ ...selectedTeacher, photo: reader.result });
        setEditingTeacherPhoto(false);
        fetchData();
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || t('update_failed') });
      } finally {
        setUploadingTeacherPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateTeacher = async () => {
    try {
      await axios.put(`/api/teachers?id=${selectedTeacher._id}`, editTeacherData);
      setMessage({ type: 'success', text: t('update_successful') });
      setSelectedTeacher({ ...selectedTeacher, ...editTeacherData });
      setEditingTeacher(false);
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('update_failed') });
    }
  };

  const handleUpdateCouponProfile = async () => {
    try {
      await axios.put(`/api/coupons?resource=profiles&profileId=${selectedCouponProfile._id}`, editCouponProfileData);
      setMessage({ type: 'success', text: t('update_successful') });
      setSelectedCouponProfile({ ...selectedCouponProfile, ...editCouponProfileData });
      setEditingCouponProfile(false);
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('update_failed') });
    }
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/association-meetings', newMeeting);

      setMessage({
        type: 'success',
        text: response.data.message || (t('meeting_created_successfully'))
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
        text: t('meeting_status_updated_successfully')
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
      // Check if changing to completed and if there are unpaid participants
      if (status === 'completed' && selectedItem && selectedItem._id === itemId) {
        const hasUnpaid = selectedItem.participants?.some(p => !p.paid);
        if (hasUnpaid) {
          setMessage({
            type: 'error',
            text: t('language') === 'zh'
              ? '無法標記為已完成：仍有未付款的參與者'
              : 'Cannot mark as completed: There are unpaid participants'
          });
          return;
        }
      }

      const endpoint = type === 'class' ? '/api/classes' : '/api/activities';
      await axios.put(`${endpoint}?id=${itemId}`, { status });

      setMessage({
        type: 'success',
        text: t('status_updated_successfully')
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

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const endpoint = selectedItem.type === 'class' ? '/api/classes' : '/api/activities';
      await axios.put(`${endpoint}?id=${selectedItem._id}`, editItemData);

      setMessage({
        type: 'success',
        text: t('update_successful')
      });

      setEditingItem(false);
      fetchData();

      const updatedItem = { ...selectedItem, ...editItemData };
      setSelectedItem(updatedItem);
    } catch (error) {
      console.error('Error updating item:', error);
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
        text: t('attendance_updated_successfully')
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
        text: t('absence_request_approved_successfully')
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
        text: t('meeting_updated_successfully')
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
    if (!window.confirm(t('are_you_sure_you_want_to_delete_this_meeting'))) {
      return;
    }

    try {
      await axios.delete(`/api/association-meetings?meetingId=${meetingId}`);

      setMessage({
        type: 'success',
        text: t('meeting_deleted_successfully')
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
        text: t('please_select_a_coupon_profile')
      });
      return;
    }

    if (!newCoupon.quantity || newCoupon.quantity <= 0) {
      setMessage({
        type: 'error',
        text: t('please_enter_a_valid_quantity')
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
        text: t('coupon_added_successfully')
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
    if (!window.confirm(t('are_you_sure_you_want_to_delete_this_coupon'))) {
      return;
    }

    setDeletingCouponId(couponId);
    try {
      await axios.delete(`/api/members?memberId=${selectedMember.memberId}&action=delete-coupon&couponId=${couponId}`);

      setMessage({
        type: 'success',
        text: t('coupon_deleted_successfully')
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
        text: t('payment_method_updated')
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
        <button className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
          {t('class_management')}
        </button>
        <button className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>
          {t('activity_management')}
        </button>
        <button className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => setActiveTab('teachers')}>
          {t('host_management')}
        </button>
        <button className={`tab-button ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
          {t('coupon_management')}
        </button>
        <button className={`tab-button ${activeTab === 'association' ? 'active' : ''}`} onClick={() => setActiveTab('association')}>
          {t('association_management')}
        </button>
      </div>

      {activeTab === 'members' && !selectedMember && (
        <div className="card">
          <h3>{t('memberManagement')}</h3>          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('member_id')}</th>
                  <th>{t('name')}</th>
                  <th>{t('membership')}</th>
                  <th>{t('actions')}</th>
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
                        onClick={async () => {
                          try {
                            const res = await axios.get(`/api/members?id=${member._id}`);
                            setSelectedMember(res.data.member);
                          } catch (error) {
                            console.error('Error fetching member:', error);
                            setSelectedMember(member);
                          }
                        }}
                      >
                        {t('view_details')}
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedMember(null)}
              >
                ← {t('back_to_list')}
              </button>
              <h3 style={{ margin: 0 }}>{t('member_details')}</h3>
            </div>
            <button
              className="btn btn-danger"
              onClick={() => handleDeleteMember(selectedMember.memberId)}
            >
              {t('delete_member')}
            </button>
          </div>

          <div className="member-detail-grid">
            <div className="detail-section">
              <h4>{t('basic_information')}</h4>
              <div className="detail-row">
                <strong>{t('member_id')}:</strong>
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
              <h4>{t('contact_information')}</h4>
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
              <h4>{t('membership_info')}</h4>
              <div className="detail-row">
                <strong>{t('points')}:</strong>
                <span style={{ fontSize: '1.2em', color: '#667eea', fontWeight: 'bold' }}>
                  {selectedMember.points || 0}
                </span>
              </div>
              <div className="detail-row">
                <strong>{t('yourReferralCode')}:</strong>
                <span>{selectedMember.referralCode || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>{t('enrollments')}:</strong>
                <span>{selectedMember.enrollments?.length || 0}</span>
              </div>
              <div className="detail-row">
                <strong>{t('language') === 'zh' ? '註冊日期' : 'Registered'}:</strong>
                <span>{formatDate(selectedMember.createdAt)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>{t('membership_status')}</h4>
              <div className="detail-row">
                <strong>{t('current_status')}</strong>
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
                        text: t('membership_status_updated')
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
                  <option value="會友">{t('association_friend')}</option>
                  <option value="協會會員">{t('association_member')}</option>
                </select>
              </div>
              <div className="detail-row">
                <strong>{t('member_since')}</strong>
                <span>{formatDate(selectedMember.membershipStartDate || selectedMember.createdAt)}</span>
              </div>
              {selectedMember.membershipUpgradedDate && (
                <div className="detail-row">
                  <strong>{t('upgraded_on')}</strong>
                  <span>{formatDate(selectedMember.membershipUpgradedDate)}</span>
                </div>
              )}
              {selectedMember.membershipPaymentMethod && (
                <div className="detail-row">
                  <strong>{t('payment_method')}</strong>
                  <span>
                    {selectedMember.membershipPaymentMethod === 'in-person'
                      ? (t('in_person'))
                      : selectedMember.membershipPaymentMethod === 'linepay'
                      ? 'LINE Pay'
                      : (t('credit_card'))}
                  </span>
                </div>
              )}

              {/* Role Selection */}
              <div className="detail-row">
                <strong>{t('role')}</strong>
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
                        text: t('role_updated')
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
                  <option value="一般會員">{t('general_member')}</option>
                  <option value="董事會">{t('board_of_directors')}</option>
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
                    ⚠️ {t('pending_upgrade_request')}
                  </h4>
                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ marginBottom: '8px' }}>
                      <strong>{t('requested_at')}</strong>{' '}
                      {formatDate(selectedMember.membershipUpgradeRequest.requestedAt)}
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                      <strong>{t('payment_method')}</strong>{' '}
                      {selectedMember.membershipUpgradeRequest.paymentMethod === 'in-person'
                        ? (t('in_person'))
                        : selectedMember.membershipUpgradeRequest.paymentMethod}
                    </p>
                    <p style={{ marginBottom: '8px' }}>
                      <strong>{t('upgrade_to')}</strong> 協會會員
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
                            text: t('upgrade_request_approved')
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
                      ✓ {t('approve_upgrade')}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={async () => {
                        if (!window.confirm(t('are_you_sure_you_want_to_reject_this_upgrade_reque'))) {
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
                            text: t('upgrade_request_rejected')
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
                      ✗ {t('reject')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedMember.familyMembers && selectedMember.familyMembers.length > 0 && (
              <div className="detail-section">
                <h4>{t('familyMembers')}</h4>
                {selectedMember.familyMembers.map((fm, idx) => (
                  <div key={idx} style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div className="detail-row">
                      <strong>{t('name')}:</strong>
                      <span>{fm.name}</span>
                    </div>
                    {fm.englishAlias && (
                      <div className="detail-row">
                        <strong>{t('englishAlias')}:</strong>
                        <span>{fm.englishAlias}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <strong>{t('gender')}:</strong>
                      <span>{fm.gender}</span>
                    </div>
                    <div className="detail-row">
                      <strong>{t('birthDate')}:</strong>
                      <span>{formatDate(fm.birthDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedMember.enrollments && selectedMember.enrollments.length > 0 && (
            <div className="detail-section" style={{ marginTop: '30px' }}>
              <h4>{t('enrollment_history')}</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('type')}</th>
                      <th>{t('name')}</th>
                      <th>{t('enrolled')}</th>
                      <th>{t('status_')}</th>
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

          <div className="detail-section" style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0 }}>{t('coupon_management')}</h4>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddCouponForm(!showAddCouponForm)}
                style={{ fontSize: '14px', padding: '8px 16px' }}
              >
                {showAddCouponForm
                  ? (t('cancel'))
                  : (t('_add_coupon'))}
              </button>
            </div>

            {showAddCouponForm && (
              <form onSubmit={handleAddCoupon} className="add-form" style={{ marginBottom: '30px', background: '#f8f9ff', padding: '20px', borderRadius: '8px' }}>
                <div className="form-group">
                  <label>{t('coupon_type')}</label>
                  <select
                    value={newCoupon.type}
                    onChange={(e) => handleCouponTypeChange(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="trial">{t('trial_coupon')}</option>
                    <option value="discount">{t('discount_coupon')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('select_coupon_profile')}</label>
                  <select
                    value={newCoupon.profileId}
                    onChange={(e) => handleCouponProfileChange(e.target.value)}
                    className="form-control"
                    required
                  >
                    <option value="">{t('select_profile')}</option>
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
                    {t('coupon_information_will_be_auto_filled_based_on_pr')}
                  </small>
                </div>

                {newCoupon.profileId && (() => {
                  const selectedProfile = couponProfiles.find(p => p._id === newCoupon.profileId);
                  if (!selectedProfile) return null;

                  return (
                    <div style={{ padding: '15px', background: '#e7f3ff', borderRadius: '8px', marginBottom: '15px' }}>
                      <h5 style={{ marginTop: 0, marginBottom: '10px', color: '#004085' }}>
                        {t('profile_preview')}
                      </h5>
                      {selectedProfile.image && (
                        <img
                          src={selectedProfile.image}
                          alt={selectedProfile.name}
                          style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', marginBottom: '10px' }}
                        />
                      )}
                      <p style={{ margin: '5px 0', color: '#004085' }}>
                        <strong>{t('name')}</strong>
                        {selectedProfile.name}
                      </p>
                      <p style={{ margin: '5px 0', color: '#004085' }}>
                        <strong>{t('description')}</strong>
                        {selectedProfile.description}
                      </p>
                      {selectedProfile.type === 'trial' && selectedProfile.classInfoId && (
                        <p style={{ margin: '5px 0', color: '#004085' }}>
                          <strong>{t('class_')}</strong>
                          {selectedProfile.classInfoId.name}
                        </p>
                      )}
                      {selectedProfile.type === 'discount' && (
                        <p style={{ margin: '5px 0', color: '#004085' }}>
                          <strong>{t('discount_')}</strong>
                          {selectedProfile.discountPercent}%
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="form-group">
                  <label>{t('quantity')}</label>
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
                  <label>{t('expiry_date_optional')}</label>
                  <input
                    type="date"
                    value={newCoupon.expiryDate}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="form-control"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <small style={{ color: '#666' }}>
                    {t('leave_empty_for_no_expiration')}
                  </small>
                </div>

                <button type="submit" className="btn btn-primary" disabled={addingCoupon}>
                  {addingCoupon
                    ? (t('adding'))
                    : (t('add_coupon'))}
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
                            ? (t('trial'))
                            : (t('discount'))}
                        </span>
                      </div>
                      <h5 style={{ color: '#667eea', marginBottom: '10px' }}>{coupon.name}</h5>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                        {coupon.description}
                      </p>
                      {coupon.type === 'trial' && classInfo && (
                        <p style={{ fontSize: '13px', color: '#1971c2', marginBottom: '8px' }}>
                          <strong>{t('valid_for')}</strong>
                          {classInfo.name}
                        </p>
                      )}
                      {coupon.type === 'discount' && (
                        <p style={{ fontSize: '13px', color: '#c92a2a', marginBottom: '8px' }}>
                          <strong>{t('discount_')}</strong>
                          {coupon.discountPercent}%
                        </p>
                      )}
                      <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                        <strong>{t('quantity')}</strong>
                        {coupon.quantity - coupon.usedCount} / {coupon.quantity}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999' }}>
                        {t('created')}{formatDate(coupon.createdAt)}
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
                          ? (t('deleting'))
                          : (t('delete'))}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#999', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                  {t('no_coupons_for_this_member')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'classes' && selectedClassInfo && (
        <div className="card">
          <div className="detail-header">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedClassInfo(null)}
            >
              ← {t('back_to_list')}
            </button>
            <h3>{t('edit_class_information')}</h3>
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
                {t('upload_banner_image_recommended_size_1000x600')}
              </small>
              {selectedClassInfo.banner && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                    {t('preview')}
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
                    {t('remove_image')}
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
                {t('save_changes')}
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
                  if (window.confirm(t('are_you_sure_you_want_to_delete_this_class_informa'))) {
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

      {activeTab === 'classes' && !selectedItem && !selectedClassInfo && (
        <div className="card">
          <h3>{t('class_management')}</h3>          <div className="items-section" style={{ marginTop: '30px' }}>
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

                <div className="form-group">
                  <label>{t('language') === 'zh' ? '建議年齡範圍' : 'Recommended Age Range'}</label>
                  <select
                    value={newClassInfo.ageRange}
                    onChange={(e) => setNewClassInfo({ ...newClassInfo, ageRange: e.target.value })}
                  >
                    <option value="">{t('language') === 'zh' ? '選擇年齡範圍' : 'Select Age Range'}</option>
                    <option value="all">{t('language') === 'zh' ? '所有年齡' : 'All Ages'}</option>
                    <option value="children">{t('language') === 'zh' ? '兒童 (6-12歲)' : 'Children (6-12)'}</option>
                    <option value="teen">{t('language') === 'zh' ? '青少年 (13-17歲)' : 'Teen (13-17)'}</option>
                    <option value="adult">{t('language') === 'zh' ? '成人 (18-64歲)' : 'Adult (18-64)'}</option>
                    <option value="elderly">{t('language') === 'zh' ? '長者 (65歲以上)' : 'Elderly (65+)'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('banner_image_optional')}</label>
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
                    {t('upload_image_recommended_size_1000x600px')}
                  </small>
                  {newClassInfo.banner && (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                        {t('preview')}
                      </p>
                      <img
                        src={newClassInfo.banner}
                        alt={t('bannerPreview')}
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
                        {t('remove_image')}
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
              <label>{t('filter_by_status')}</label>
              <select
                value={classStatusFilter}
                onChange={(e) => setClassStatusFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="all">{t('all')}</option>
                <option value="upcoming">{t('upcoming')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
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
                    <option value="">{t('select_class')}</option>
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
                    multiple
                    value={newClass.teacherId}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                      const selectedNames = selectedIds.map(id => teachers.find(t => t._id === id)?.name).filter(Boolean).join(', ');
                      setNewClass({
                        ...newClass,
                        teacherId: selectedIds,
                        teacher: selectedNames
                      });
                    }}
                    required
                    style={{ minHeight: '80px' }}
                  >
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '12px' }}>Hold Ctrl/Cmd to select multiple hosts</small>
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
                      {t('start_time_end_time')}
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('location')}</label>
                  <input
                    type="text"
                    value={newClass.location}
                    onChange={(e) => setNewClass({ ...newClass, location: e.target.value })}
                    placeholder={t('example_address_taipei')}
                  />
                </div>

                <div className="form-group" style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', border: '1px solid #d0e8ff' }}>
                  <p style={{ margin: 0, color: '#1a5490', fontSize: '14px', lineHeight: '1.6' }}>
                    ℹ️ {t('members_can_view_and_enroll_in_this_class_by_clicking_class_and_activity')}
                  </p>
                </div>

                {newClass.location && (
                  <div className="form-group">
                    <label>{t('map_preview')}</label>
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

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    id="sendLineAnnouncementClass"
                    checked={newClass.sendLineAnnouncement}
                    onChange={(e) => setNewClass({ ...newClass, sendLineAnnouncement: e.target.checked })}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="sendLineAnnouncementClass" style={{ margin: 0 }}>
                    {t('send_line_announcement_to_all_line_followers')}
                  </label>
                </div>

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
                      {t('view_details')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activities' && !selectedItem && (
        <div className="card">
          <h3>{t('activity_management')}</h3>
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

            <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px' }}>
              <label>{t('filter_by_status')}</label>
              <select
                value={activityStatusFilter}
                onChange={(e) => setActivityStatusFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="all">{t('all')}</option>
                <option value="upcoming">{t('upcoming')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
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
                    multiple
                    value={newActivity.teacherId}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                      const selectedNames = selectedIds.map(id => teachers.find(t => t._id === id)?.name).filter(Boolean).join(', ');
                      setNewActivity({
                        ...newActivity,
                        teacherId: selectedIds,
                        teacher: selectedNames
                      });
                    }}
                    required
                    style={{ minHeight: '80px' }}
                  >
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '12px' }}>Hold Ctrl/Cmd to select multiple hosts</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('activity_date')}</label>
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
                      {t('start_time_end_time')}
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
                  <label>{t('language') === 'zh' ? '建議年齡範圍' : 'Recommended Age Range'}</label>
                  <select
                    value={newActivity.ageRange}
                    onChange={(e) => setNewActivity({ ...newActivity, ageRange: e.target.value })}
                  >
                    <option value="">{t('language') === 'zh' ? '選擇年齡範圍' : 'Select Age Range'}</option>
                    <option value="all">{t('language') === 'zh' ? '所有年齡' : 'All Ages'}</option>
                    <option value="children">{t('language') === 'zh' ? '兒童 (6-12歲)' : 'Children (6-12)'}</option>
                    <option value="teen">{t('language') === 'zh' ? '青少年 (13-17歲)' : 'Teen (13-17)'}</option>
                    <option value="adult">{t('language') === 'zh' ? '成人 (18-64歲)' : 'Adult (18-64)'}</option>
                    <option value="elderly">{t('language') === 'zh' ? '長者 (65歲以上)' : 'Elderly (65+)'}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t('location')}</label>
                  <input
                    type="text"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                    placeholder={t('example_address_taipei')}
                  />
                </div>

                {newActivity.location && (
                  <div className="form-group">
                    <label>{t('map_preview')}</label>
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
                  <label>{t('banner_image_optional')}</label>
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
                    {t('upload_image_max_2mb_dimensions_must_be_500x300px')}
                  </small>
                  {newActivity.banner && (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                        {t('preview')}
                      </p>
                      <img
                        src={newActivity.banner}
                        alt={t('bannerPreview')}
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
                        {t('remove_image')}
                      </button>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary">
                  {t('add_activity')}
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
                      {t('view_details')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'classes' || activeTab === 'activities') && selectedItem && (
        <div className="card">
          <div className="detail-header">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedItem(null);
                setEditingItem(false);
              }}
            >
              ← {t('back_to_list')}
            </button>
            <h3>
              {selectedItem.type === 'class' ? t('classes') : t('activities')} - {selectedItem.type === 'class' ? selectedItem.classInfoId?.name : selectedItem.name}
            </h3>
            <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingItem(!editingItem);
                  if (!editingItem) {
                    setEditItemData({
                      date: selectedItem.date ? new Date(selectedItem.date).toISOString().split('T')[0] : '',
                      time: selectedItem.time || '',
                      location: selectedItem.location || '',
                      teacher: selectedItem.teacher || '',
                      teacherId: selectedItem.teacherId || []
                    });
                  }
                }}
              >
                {editingItem ? t('cancel') : t('edit')}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteItem(selectedItem.type, selectedItem._id)}
              >
                {t('delete_')}
              </button>
            </div>
          </div>

          {editingItem ? (
            <form onSubmit={handleUpdateItem} className="add-form" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>{selectedItem.type === 'class' ? t('classDate') : t('activity_date')}</label>
                <input
                  type="date"
                  value={editItemData.date}
                  onChange={(e) => setEditItemData({ ...editItemData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('time')}</label>
                <input
                  type="text"
                  value={editItemData.time}
                  onChange={(e) => setEditItemData({ ...editItemData, time: e.target.value })}
                  placeholder="e.g., 10:00 AM - 12:00 PM"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('location')}</label>
                <input
                  type="text"
                  value={editItemData.location}
                  onChange={(e) => setEditItemData({ ...editItemData, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>{t('select_host')}</label>
                <select
                  multiple
                  value={editItemData.teacherId}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
                    const selectedNames = selectedIds.map(id => teachers.find(t => t._id === id)?.name).filter(Boolean).join(', ');
                    setEditItemData({ ...editItemData, teacherId: selectedIds, teacher: selectedNames });
                  }}
                  style={{ minHeight: '80px' }}
                >
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                  ))}
                </select>
                <small style={{ color: '#666', fontSize: '12px' }}>Hold Ctrl/Cmd to select multiple hosts</small>
              </div>
              <button type="submit" className="btn btn-primary">
                {t('save_changes')}
              </button>
            </form>
          ) : (
            <>
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
              <h4>{t('basic_information')}</h4>
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
                  <strong>{t('activity_date')}:</strong>
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
                <strong>{t('status_')}:</strong>
                <select
                  value={selectedItem.status || 'upcoming'}
                  onChange={(e) => handleUpdateItemStatus(selectedItem.type, selectedItem._id, e.target.value)}
                  style={{ padding: '5px 10px', borderRadius: '4px' }}
                >
                  <option value="upcoming">{t('upcoming')}</option>
                  <option value="completed">{t('completed')}</option>
                  <option value="cancelled">{t('cancelled')}</option>
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
            <h4>{t('enrolled_members')}</h4>
            {selectedItem.participants && selectedItem.participants.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('member_id')}</th>
                      <th>{t('name')}</th>
                      <th>{t('enrolled_date')}</th>
                      <th>{t('payment_method')}</th>
                      <th>{t('cost')}</th>
                      <th>{t('payment')}</th>
                      <th>{t('action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.participants.map(participant => {
                      const itemCost = selectedItem.type === 'class'
                        ? selectedItem.classInfoId?.cost || 0
                        : selectedItem.cost || 0;
                      const couponDiscount = participant.couponDiscount || 0;
                      const finalCost = Math.max(0, itemCost - couponDiscount);

                      return (
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
                              {t('in_person')}
                            </option>
                            <option value="credit">
                              {t('credit_card')}
                            </option>
                            <option value="linepay">
                              {t('line_pay')}
                            </option>
                          </select>
                        </td>
                        <td>
                          {couponDiscount > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px' }}>
                                NT$ {itemCost}
                              </span>
                              <span style={{ color: finalCost === 0 ? '#2b8a3e' : '#667eea', fontWeight: 'bold' }}>
                                NT$ {finalCost}
                              </span>
                            </div>
                          ) : (
                            <span>NT$ {itemCost}</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${participant.paid ? 'paid' : 'unpaid'}`}>
                            {participant.paid
                              ? (t('paid'))
                              : (t('unpaid'))}
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
                                ? (t('mark_unpaid'))
                                : (t('mark_paid'))}
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                {t('no_enrollments_yet')}
              </p>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'teachers' && !selectedTeacher && (
        <div className="card">
          <div className="section-header">
            <h3>{t('host_management')}</h3>
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
                <label>{t('name_')}</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('bio')}</label>
                <textarea
                  value={newTeacher.bio}
                  onChange={(e) => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('specialties')}</label>
                  <input
                    type="text"
                    value={newTeacher.specialties}
                    onChange={(e) => setNewTeacher({ ...newTeacher, specialties: e.target.value })}
                    placeholder={t('eg_piano_vocal')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('education')}</label>
                  <input
                    type="text"
                    value={newTeacher.education}
                    onChange={(e) => setNewTeacher({ ...newTeacher, education: e.target.value })}
                    placeholder={t('eg_ntu_music_dept')}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('phone')}</label>
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
                <label>{t('profile_picture')}</label>
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
                  {t('upload_image_max_2mb')}
                </small>
                {newTeacher.photo && (
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      {t('preview')}
                    </p>
                    <img
                      src={newTeacher.photo}
                      alt={t('teacherPreview')}
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
                      {t('remove_image')}
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary">
                {t('add_host')}
              </button>
            </form>
          )}          <div className="table-container" style={{ marginTop: '30px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{t('specialties')}</th>
                  <th>{t('education')}</th>
                  <th>{t('actions')}</th>
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
                        {t('view')}
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
              onClick={() => {
                setSelectedTeacher(null);
                setEditingTeacher(false);
              }}
            >
              ← {t('back_to_list')}
            </button>
            <h3>{t('host_details')}</h3>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              {!editingTeacher ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingTeacher(true);
                    setEditTeacherData({
                      name: selectedTeacher.name,
                      bio: selectedTeacher.bio || '',
                      specialties: selectedTeacher.specialties || '',
                      education: selectedTeacher.education || '',
                      phone: selectedTeacher.phone || '',
                      lineId: selectedTeacher.lineId || ''
                    });
                  }}
                >
                  ✏️ {t('edit')}
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateTeacher}
                  >
                    {t('save')}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditingTeacher(false)}
                  >
                    {t('cancel')}
                  </button>
                </>
              )}
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteTeacher(selectedTeacher._id)}
              >
                {t('delete_')}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            {selectedTeacher.photo && (
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
            )}
            {!editingTeacherPhoto && (
              <button
                onClick={() => setEditingTeacherPhoto(true)}
                className="btn btn-primary"
                style={{ marginTop: '15px', display: 'block', margin: '15px auto 0' }}
              >
                ✏️ {t('change_photo')}
              </button>
            )}
            {editingTeacherPhoto && (
              <div style={{ marginTop: '15px', maxWidth: '400px', margin: '15px auto 0' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpdateTeacherPhoto}
                  disabled={uploadingTeacherPhoto}
                  style={{
                    padding: '10px',
                    border: '2px dashed #667eea',
                    borderRadius: '8px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                />
                <button
                  onClick={() => setEditingTeacherPhoto(false)}
                  disabled={uploadingTeacherPhoto}
                  className="btn btn-secondary"
                  style={{ marginTop: '10px' }}
                >
                  {t('cancel')}
                </button>
              </div>
            )}
          </div>

          <div className="member-detail-grid">
            <div className="detail-section">
              <h4>{t('basic_information')}</h4>
              <div className="detail-row">
                <strong>{t('name')}:</strong>
                {editingTeacher ? (
                  <input
                    type="text"
                    value={editTeacherData.name}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, name: e.target.value })}
                    style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                ) : (
                  <span>{selectedTeacher.name}</span>
                )}
              </div>
              <div className="detail-row">
                <strong>{t('specialties')}:</strong>
                {editingTeacher ? (
                  <input
                    type="text"
                    value={editTeacherData.specialties}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, specialties: e.target.value })}
                    style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                ) : (
                  <span>{selectedTeacher.specialties || 'N/A'}</span>
                )}
              </div>
              <div className="detail-row">
                <strong>{t('education')}:</strong>
                {editingTeacher ? (
                  <input
                    type="text"
                    value={editTeacherData.education}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, education: e.target.value })}
                    style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                ) : (
                  <span>{selectedTeacher.education || 'N/A'}</span>
                )}
              </div>
              <div className="detail-row">
                <strong>{t('bio')}:</strong>
                {editingTeacher ? (
                  <textarea
                    value={editTeacherData.bio}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, bio: e.target.value })}
                    style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', minHeight: '60px' }}
                  />
                ) : (
                  <span>{selectedTeacher.bio || 'N/A'}</span>
                )}
              </div>
            </div>


            <div className="detail-section">
              <h4>{t('contact_information')}</h4>
              <div className="detail-row">
                <strong>{t('phone')}:</strong>
                {editingTeacher ? (
                  <input
                    type="text"
                    value={editTeacherData.phone}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, phone: e.target.value })}
                    style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                ) : (
                  <span>{selectedTeacher.phone || 'N/A'}</span>
                )}
              </div>
              <div className="detail-row">
                <strong>LINE ID:</strong>
                {editingTeacher ? (
                  <input
                    type="text"
                    value={editTeacherData.lineId}
                    onChange={(e) => setEditTeacherData({ ...editTeacherData, lineId: e.target.value })}
                    style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                ) : (
                  <span>{selectedTeacher.lineId || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && !selectedCouponProfile && (
        <div className="card">
          <div className="section-header">
            <h3>{t('coupon_management')}</h3>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ marginBottom: '20px', color: '#667eea' }}>
              {t('coupon_information_profiles')}
            </h4>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              {t('create_coupon_templates_to_use_in_coupons_for_sale_and_member_management')}
            </p>

            <button
              onClick={() => setShowAddProfileForm(!showAddProfileForm)}
              className="btn btn-primary"
              style={{ marginBottom: '20px' }}
            >
              {showAddProfileForm
                ? (t('cancel'))
                : (t('add_coupon_profile'))}
            </button>

            {showAddProfileForm && (
              <div style={{ padding: '20px', background: '#f8f9ff', borderRadius: '8px', marginBottom: '20px', border: '2px solid #667eea' }}>
                <h5 style={{ marginBottom: '15px', color: '#667eea' }}>
                  {t('create_coupon_profile')}
                </h5>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('coupon_type')}
                  </label>
                  <select
                    value={newProfile.type}
                    onChange={(e) => setNewProfile({...newProfile, type: e.target.value, classInfoId: '', discountPercent: ''})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="trial">{t('trial_coupon')}</option>
                    <option value="discount">{t('discount_coupon')}</option>
                  </select>
                </div>

                {newProfile.type === 'trial' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      {t('select_class')}
                    </label>
                    <select
                      value={newProfile.classInfoId}
                      onChange={(e) => {
                        const classInfo = classInfos.find(c => c._id === e.target.value);
                        setNewProfile({
                          ...newProfile,
                          classInfoId: e.target.value,
                          name: classInfo ? `${classInfo.name} ${t('trial_coupon')}` : '',
                          description: classInfo ? `${t('this_coupon_can_be_used_for_a_trial')} ${classInfo.name} ${t('class')}` : ''
                        });
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                      <option value="">{t('please_select_a_class')}</option>
                      {classInfos.map(classInfo => (
                        <option key={classInfo._id} value={classInfo._id}>{classInfo.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newProfile.type === 'discount' && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                      {t('discount_percentage')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newProfile.discountPercent}
                      onChange={(e) => setNewProfile({
                        ...newProfile,
                        discountPercent: e.target.value,
                        name: `${t('discount_coupon')} ${e.target.value}%`,
                        description: `${t('this_coupon_can_be_used_for_all_classes_with')} ${e.target.value}% ${t('discount')}`
                      })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('coupon_name')}
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
                    {t('coupon_description')}
                  </label>
                  <textarea
                    value={newProfile.description}
                    onChange={(e) => setNewProfile({...newProfile, description: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '80px' }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('coupon_image')}
                  </label>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                    {t('this_image_will_be_used_for_all_coupons_created_fr')}
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
                        setMessage({ type: 'error', text: t('please_fill_required_fields') });
                        return;
                      }
                      try {
                        await axios.post('/api/coupons?resource=profiles', newProfile);
                        setMessage({ type: 'success', text: t('coupon_profile_created') });
                        setShowAddProfileForm(false);
                        setNewProfile({ type: 'trial', classInfoId: '', discountPercent: '', name: '', description: '', image: '' });
                        fetchData();
                      } catch (error) {
                        setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                      }
                    }}
                    className="btn btn-primary"
                  >
                    {t('create_profile')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddProfileForm(false);
                      setNewProfile({ type: 'trial', classInfoId: '', discountPercent: '', name: '', description: '', image: '' });
                    }}
                    className="btn"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}

            {couponProfiles.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                {t('no_coupon_profiles_yet')}
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
                        ? `${t('trial')}: ${profile.classInfoId?.name || 'N/A'}`
                        : `${t('discount')}: ${profile.discountPercent}%`}
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setSelectedCouponProfile(profile)}
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                      >
                        👁️ {t('view')}
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(t('delete_this_profile'))) {
                            setDeletingProfileId(profile._id);
                            try {
                              await axios.delete(`/api/coupons?resource=profiles&profileId=${profile._id}`);
                              setMessage({ type: 'success', text: t('profile_deleted') });
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
                        style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                      >
                        {deletingProfileId === profile._id
                          ? (t('deleting'))
                          : `🗑️ ${t('delete')}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr style={{ margin: '40px 0', border: 'none', borderTop: '2px solid #e0e0e0' }} />

          <div>
            <h4 style={{ marginBottom: '20px', color: '#667eea' }}>
              {t('coupons_for_sale')}
            </h4>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              {t('list_coupon_profiles_for_sale_members_can_purchase_in_my_coupons_section')}
            </p>

            <button
              onClick={() => setShowAddForSaleForm(!showAddForSaleForm)}
              className="btn btn-primary"
              style={{ marginBottom: '20px' }}
            >
              {showAddForSaleForm
                ? (t('cancel'))
                : (t('_list_coupon_for_sale'))}
            </button>

            {showAddForSaleForm && (
              <div style={{ padding: '20px', background: '#f8f9ff', borderRadius: '8px', marginBottom: '20px', border: '2px solid #667eea' }}>
                <h5 style={{ marginBottom: '15px', color: '#667eea' }}>
                  {t('list_coupon_for_sale')}
                </h5>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('select_coupon_profile')}
                  </label>
                  <select
                    value={newForSale.couponProfileId}
                    onChange={(e) => setNewForSale({...newForSale, couponProfileId: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="">{t('please_select_a_profile')}</option>
                    {couponProfiles.map(profile => (
                      <option key={profile._id} value={profile._id}>
                        {profile.name} - {profile.type === 'trial' ? profile.classInfoId?.name : `${profile.discountPercent}%`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                    {t('price_ntd')}
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
                    {t('stock_quantity')}
                  </label>
                  <input
                    type="number"
                    value={newForSale.stock}
                    onChange={(e) => setNewForSale({...newForSale, stock: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    {t('set_to_1_for_unlimited_stock')}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={async () => {
                      if (!newForSale.couponProfileId || !newForSale.price) {
                        setMessage({ type: 'error', text: t('please_fill_required_fields') });
                        return;
                      }
                      try {
                        await axios.post('/api/coupons?resource=for-sale', newForSale);
                        setMessage({ type: 'success', text: t('coupon_listed') });
                        setShowAddForSaleForm(false);
                        setNewForSale({ couponProfileId: '', price: '', stock: -1 });
                        fetchData();
                      } catch (error) {
                        setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                      }
                    }}
                    className="btn btn-primary"
                  >
                    {t('list_for_sale')}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForSaleForm(false);
                      setNewForSale({ couponProfileId: '', price: '', stock: -1 });
                    }}
                    className="btn"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}

            {couponsForSale.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                {t('no_coupons_for_sale_yet')}
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
                        {t('stock')}: {coupon.stock === -1 ? '∞' : coupon.stock}
                      </p>
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: coupon.active ? '#28a745' : '#dc3545' }}>
                      {coupon.active ? `✓ ${t('active')}` : `✗ ${t('inactive')}`}
                    </p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={async () => {
                          try {
                            await axios.put(`/api/coupons-for-sale?couponId=${coupon._id}`, { active: !coupon.active });
                            setMessage({ type: 'success', text: t('status_updated') });
                            fetchData();
                          } catch (error) {
                            setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
                          }
                        }}
                        className="btn"
                        style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                      >
                        {coupon.active ? (t('deactivate')) : (t('activate'))}
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(t('delete_this_listing'))) {
                            setDeletingForSaleId(coupon._id);
                            try {
                              await axios.delete(`/api/coupons?resource=for-sale&couponId=${coupon._id}`);
                              setMessage({ type: 'success', text: t('listing_deleted') });
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
                          ? (t('deleting'))
                          : `🗑️ ${t('delete_')}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'coupons' && selectedCouponProfile && (
        <div className="card">
          <div className="detail-header">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedCouponProfile(null);
                setEditingCouponProfile(false);
              }}
            >
              ← {t('back_to_list')}
            </button>
            <h3>{t('coupon_profile_details')}</h3>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              {!editingCouponProfile ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingCouponProfile(true);
                    setEditCouponProfileData({
                      name: selectedCouponProfile.name,
                      description: selectedCouponProfile.description || '',
                      type: selectedCouponProfile.type,
                      classInfoId: selectedCouponProfile.classInfoId?._id || '',
                      discountPercent: selectedCouponProfile.discountPercent || '',
                      image: selectedCouponProfile.image || ''
                    });
                  }}
                >
                  ✏️ {t('edit')}
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpdateCouponProfile}
                  >
                    {t('save')}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setEditingCouponProfile(false)}
                  >
                    {t('cancel')}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            {selectedCouponProfile.image && (
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img
                  src={selectedCouponProfile.image}
                  alt={selectedCouponProfile.name}
                  style={{ maxWidth: '300px', borderRadius: '8px' }}
                />
              </div>
            )}

            <div className="member-detail-grid">
              <div className="detail-section">
                <h4>{t('basic_information')}</h4>
                <div className="detail-row">
                  <strong>{t('name')}:</strong>
                  {editingCouponProfile ? (
                    <input
                      type="text"
                      value={editCouponProfileData.name}
                      onChange={(e) => setEditCouponProfileData({ ...editCouponProfileData, name: e.target.value })}
                      style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                    />
                  ) : (
                    <span>{selectedCouponProfile.name}</span>
                  )}
                </div>
                <div className="detail-row">
                  <strong>{t('description')}:</strong>
                  {editingCouponProfile ? (
                    <textarea
                      value={editCouponProfileData.description}
                      onChange={(e) => setEditCouponProfileData({ ...editCouponProfileData, description: e.target.value })}
                      style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%', minHeight: '60px' }}
                    />
                  ) : (
                    <span>{selectedCouponProfile.description || 'N/A'}</span>
                  )}
                </div>
                <div className="detail-row">
                  <strong>{t('type')}:</strong>
                  <span>{selectedCouponProfile.type === 'trial' ? t('trial') : t('discount')}</span>
                </div>
                {selectedCouponProfile.type === 'trial' && (
                  <div className="detail-row">
                    <strong>{t('class')}:</strong>
                    <span>{selectedCouponProfile.classInfoId?.name || 'N/A'}</span>
                  </div>
                )}
                {selectedCouponProfile.type === 'discount' && (
                  <div className="detail-row">
                    <strong>{t('discount')}:</strong>
                    {editingCouponProfile ? (
                      <input
                        type="number"
                        value={editCouponProfileData.discountPercent}
                        onChange={(e) => setEditCouponProfileData({ ...editCouponProfileData, discountPercent: e.target.value })}
                        style={{ padding: '5px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                      />
                    ) : (
                      <span>{selectedCouponProfile.discountPercent}%</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'association' && !selectedMeeting && (
        <div className="card">
          <div className="section-header">
            <h3>{t('association_meeting_management')}</h3>
            <button className="btn btn-primary" onClick={() => setShowAddMeetingForm(true)}>
              {t('create_meeting')}
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '20px', maxWidth: '300px' }}>
            <label>{t('filter_by_status')}</label>
            <select
              value={meetingStatusFilter}
              onChange={(e) => setMeetingStatusFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">{t('all')}</option>
              <option value="upcoming">{t('upcoming')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
          </div>

          {showAddMeetingForm && (
            <form onSubmit={handleAddMeeting} className="form" style={{ marginTop: '20px', border: '2px solid #667eea', padding: '20px', borderRadius: '8px' }}>
              <h4>{t('create_new_meeting')}</h4>

              <div className="form-group">
                <label>{t('agenda')} *</label>
                <input
                  type="text"
                  value={newMeeting.agenda}
                  onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('date')} *</label>
                <input
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('time')} *</label>
                <input
                  type="time"
                  value={newMeeting.time}
                  onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('meeting_type')} *</label>
                <select
                  value={newMeeting.meetingType}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingType: e.target.value })}
                  required
                >
                  <option value="in-person">{t('in_person')}</option>
                  <option value="zoom">{t('online_zoom')}</option>
                </select>
              </div>

              {newMeeting.meetingType === 'in-person' ? (
                <div className="form-group">
                  <label>{t('location')}</label>
                  <input
                    type="text"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                    placeholder={t('meeting_location')}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>{t('zoom_url')}</label>
                  <input
                    type="url"
                    value={newMeeting.zoomUrl}
                    onChange={(e) => setNewMeeting({ ...newMeeting, zoomUrl: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>{t('member_type')} *</label>
                <select
                  value={newMeeting.memberType}
                  onChange={(e) => setNewMeeting({ ...newMeeting, memberType: e.target.value })}
                  required
                >
                  <option value="協會會員">{t('association_members')}</option>
                  <option value="董事會">{t('board_of_directors')}</option>
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
                  {t('mandatory_members_must_attend_or_submit_absence_fo')}
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
                  {t('send_line_announcement_to_all_association_members')}
                </label>
              </div>

              {newMeeting.meetingType === 'in-person' && newMeeting.location && (
                <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    {t('map_preview')}
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
                  {loading ? (t('creating')) : (t('create'))}
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
                  <th>{t('agenda')}</th>
                  <th>{t('date')}</th>
                  <th>{t('time')}</th>
                  <th>{t('type')}</th>
                  <th>{t('registered')}</th>
                  <th>{t('status_')}</th>
                  <th>{t('actions')}</th>
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
                        {meeting.status === 'upcoming' ? (t('upcoming')) :
                         meeting.status === 'completed' ? (t('completed')) :
                         (t('cancelled'))}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" onClick={() => setSelectedMeeting(meeting)}>
                        {t('view_details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {associationMeetings.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                {t('no_meetings_yet')}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'association' && selectedMeeting && !editingMeeting && (
        <div className="card">
          <div className="detail-header">
            <h3>{t('meeting_details')}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => {
                setEditMeetingData({
                  ...selectedMeeting,
                  date: new Date(selectedMeeting.date).toISOString().split('T')[0]
                });
                setEditingMeeting(true);
              }}>
                ✏️ {t('edit')}
              </button>
              <button className="btn btn-secondary" style={{ background: '#dc3545' }} onClick={() => handleDeleteMeeting(selectedMeeting._id)}>
                🗑️ {t('delete_')}
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedMeeting(null)}>
                {t('back_to_list')}
              </button>
            </div>
          </div>

          <div className="detail-section">
            <h4>{t('basic_information')}</h4>
            <div className="detail-row">
              <strong>{t('agenda')}</strong>
              <span>{selectedMeeting.agenda}</span>
            </div>
            <div className="detail-row">
              <strong>{t('date')}</strong>
              <span>{new Date(selectedMeeting.date).toLocaleDateString('zh-TW')}</span>
            </div>
            <div className="detail-row">
              <strong>{t('time')}</strong>
              <span>{selectedMeeting.time}</span>
            </div>
            {selectedMeeting.location && (
              <div className="detail-row">
                <strong>{t('location')}：</strong>
                <span>📍 {selectedMeeting.location}</span>
              </div>
            )}
            <div className="detail-row">
              <strong>{t('member_type')}</strong>
              <span>{selectedMeeting.memberType}</span>
            </div>
            <div className="detail-row">
              <strong>{t('status')}</strong>
              <select
                value={selectedMeeting.status}
                onChange={(e) => handleUpdateMeetingStatus(selectedMeeting._id, e.target.value)}
                style={{ padding: '5px 10px', borderRadius: '4px' }}
              >
                <option value="upcoming">{t('upcoming')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>
          </div>

          {selectedMeeting.location && (
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h4>{t('meeting_location')}</h4>
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
            <h4>{t('registered_members')} ({selectedMeeting.participants.length})</h4>
            {selectedMeeting.participants.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('member_id')}</th>
                      <th>{t('memberName')}</th>
                      <th>{t('registration_time')}</th>
                      <th>{t('attendance')}</th>
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
                            {participant.attended ? (t('attended')) : (t('not_attended'))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                {t('no_members_registered_yet')}
              </p>
            )}
          </div>

          {/* Absence Requests Section */}
          {selectedMeeting.mandatory && (
            <div className="detail-section">
              <h4>
                {t('absence_requests')}
                {selectedMeeting.absences ? ` (${selectedMeeting.absences.length})` : ' (0)'}
              </h4>
              {selectedMeeting.absences && selectedMeeting.absences.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('member_id')}</th>
                        <th>{t('memberName')}</th>
                        <th>{t('submitted_at')}</th>
                        <th>{t('form')}</th>
                        <th>{t('status_')}</th>
                        <th>{t('actions')}</th>
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
                                📄 {t('view_form')}
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
                                📄 {t('view_form')}
                              </button>
                            ) : (
                              <span style={{ color: '#666', fontStyle: 'italic' }}>
                                {t('no_form')}
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
                                ? (t('approved'))
                                : (t('pending'))
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
                                  ? (t('approving'))
                                  : (t('approve'))
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
                  {t('no_absence_requests_yet')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'association' && editingMeeting && editMeetingData && (
        <div className="card">
          <div className="detail-header">
            <h3>{t('edit_meeting')}</h3>
            <button className="btn btn-secondary" onClick={() => {
              setEditingMeeting(false);
              setEditMeetingData(null);
            }}>
              {t('cancel')}
            </button>
          </div>

          <form onSubmit={handleEditMeeting} className="form">
            <div className="form-group">
              <label>{t('agenda')} *</label>
              <input
                type="text"
                value={editMeetingData.agenda}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, agenda: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('date')} *</label>
              <input
                type="date"
                value={editMeetingData.date}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('time')} *</label>
              <input
                type="time"
                value={editMeetingData.time}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('meeting_type')} *</label>
              <select
                value={editMeetingData.meetingType || 'in-person'}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, meetingType: e.target.value })}
                required
              >
                <option value="in-person">{t('in_person')}</option>
                <option value="zoom">{t('online_zoom')}</option>
              </select>
            </div>

            {(editMeetingData.meetingType || 'in-person') === 'in-person' ? (
              <div className="form-group">
                <label>{t('location')}</label>
                <input
                  type="text"
                  value={editMeetingData.location || ''}
                  onChange={(e) => setEditMeetingData({ ...editMeetingData, location: e.target.value })}
                  placeholder={t('meeting_location')}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>{t('zoom_url')}</label>
                <input
                  type="url"
                  value={editMeetingData.zoomUrl || ''}
                  onChange={(e) => setEditMeetingData({ ...editMeetingData, zoomUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}

            <div className="form-group">
              <label>{t('member_type')} *</label>
              <select
                value={editMeetingData.memberType}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, memberType: e.target.value })}
                required
              >
                <option value="協會會員">{t('association_members')}</option>
                <option value="董事會">{t('board_of_directors')}</option>
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
                {t('mandatory_members_must_attend_or_submit_absence_fo')}
              </label>
            </div>

            {(editMeetingData.meetingType || 'in-person') === 'in-person' && editMeetingData.location && (
              <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {t('map_preview')}
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
              <label>{t('status_')} *</label>
              <select
                value={editMeetingData.status || 'upcoming'}
                onChange={(e) => setEditMeetingData({ ...editMeetingData, status: e.target.value })}
                required
              >
                <option value="upcoming">{t('upcoming')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (t('updating')) : (t('update'))}
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
