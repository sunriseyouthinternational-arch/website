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
  const [memberId, setMemberId] = useState(urlMemberId || '');
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedClass, setSelectedClass] = useState(null);

  // Filters
  const [selectedClassInfo, setSelectedClassInfo] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [dateOffset, setDateOffset] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);

  // Check for tab parameter in URL
  const tabFromUrl = searchParams.get('tab');
  const sessionFromUrl = searchParams.get('session');
  const classIdFromUrl = searchParams.get('classId');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'courses' ? 'courses' :
    tabFromUrl === 'points' ? 'points' :
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

  // Helper function to get image source (handles both base64 and file paths)
  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a base64 data URI, return as is
    if (imagePath.startsWith('data:')) return imagePath;
    // Otherwise, assume it's a file path and prepend API URL
    const apiUrl = process.env.REACT_APP_API_URL || '';
    return `${apiUrl}${imagePath}`;
  };

  const validateAndSaveSession = async (sessionToken, id) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.get(`/api/members?memberId=${id}&sessionToken=${sessionToken}`);
      if (response.data.member) {
        setMember(response.data.member);
        setMemberId(id);

        setMessage({ type: 'success', text: t('language') === 'zh' ? '登入成功' : 'Login successful' });

        // Clean up URL by removing session parameter
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

  const fetchMember = async () => {
    if (!memberId) {
      setMessage({ type: 'error', text: t('language') === 'zh' ? '請輸入團員編號' : 'Please enter member ID' });
      return;
    }

    // Update URL when searching manually
    navigate(`/profile/${memberId}`);
    await fetchMemberById(memberId);
  };

  const fetchClassesAndActivities = async () => {
    try {
      const [classesRes, activitiesRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/activities')
      ]);
      const activeClasses = classesRes.data.classes.filter(c => c.status === 'active');
      const activeActivities = activitiesRes.data.activities.filter(a => a.status === 'active');

      // Sort activities by date, then by time
      activeActivities.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // First sort by date
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }

        // If same date, sort by time
        // Extract start time from format like "10:00 - 12:00"
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

  // Generate date options for filter (current date + next 6 days = 7 days total)
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

  // Filter classes based on selected filters
  const getFilteredClasses = () => {
    let filtered = [...classes];

    // Filter by class info template
    if (selectedClassInfo !== 'all') {
      filtered = filtered.filter(c => c.classInfoId?._id === selectedClassInfo);
    }

    // Filter by date
    if (selectedDate !== 'all') {
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);

      filtered = filtered.filter(c => {
        const classDate = new Date(c.date);
        classDate.setHours(0, 0, 0, 0);
        return classDate.getTime() === selectedDateObj.getTime();
      });
    }

    // Sort by date, then by time
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // First sort by date
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }

      // If same date, sort by time
      // Extract start time from format like "10:00-12:00"
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

  // Get unique class info templates from all classes
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

    // Handle session token from URL
    if (sessionFromUrl && urlMemberId) {
      console.log('Session token found in URL, validating...');
      validateAndSaveSession(sessionFromUrl, urlMemberId);
    } else if (urlMemberId) {
      // If memberId is in URL, automatically fetch member profile
      fetchMemberById(urlMemberId);
    }
  }, [urlMemberId, sessionFromUrl]);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabFromUrl === 'courses') {
      setActiveTab('courses');
    } else if (tabFromUrl === 'points') {
      setActiveTab('points');
    } else if (tabFromUrl === 'profile') {
      setActiveTab('profile');
    }
  }, [tabFromUrl]);

  // Auto-open class detail when classId is in URL
  useEffect(() => {
    if (classIdFromUrl && classes.length > 0) {
      const classToOpen = classes.find(c => c._id === classIdFromUrl);
      if (classToOpen) {
        setSelectedClass(classToOpen);
        setActiveTab('courses'); // Switch to courses tab
      }
    }
  }, [classIdFromUrl, classes]);

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

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await axios.post(`/api/members/${member.memberId}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMember(prev => ({
        ...prev,
        profilePicture: response.data.profilePicture
      }));

      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('error')
      });
    }
  };

  const handleEnroll = async (type, id, name) => {
    if (!member) {
      setMessage({ type: 'error', text: t('loginRequired') });
      return;
    }

    try {
      const endpoint = type === 'class' ? `/api/classes?id=${id}&action=enroll` : `/api/activities?id=${id}&action=enroll`;
      const response = await axios.post(endpoint, { memberId: member.memberId });

      setMessage({ type: 'success', text: response.data.message });

      // Refresh member data
      const memberResponse = await axios.get(`/api/members?memberId=${member.memberId}`);
      setMember(memberResponse.data.member);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('enrollmentFailed')
      });
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
    // Taiwan date format (ROC calendar can be complex, using Western for simplicity)
    return date.toLocaleDateString('zh-TW');
  };

  return (
    <div className="container">
      <div className="page-title">
        <h2>{t('myProfile')}</h2>
      </div>

      {!member ? (
        <div className="card">
          <h3>{t('language') === 'zh' ? '請輸入您的團員編號' : 'Please enter your member ID'}</h3>
          <div className="member-id-input">
            <input
              type="text"
              placeholder={t('memberId')}
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchMember()}
            />
            <button onClick={fetchMember} className="btn btn-primary" disabled={loading}>
              {loading ? t('loading') : t('language') === 'zh' ? '查詢' : 'Search'}
            </button>
          </div>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
        </div>
      ) : (
        <>
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              {t('myProfile')}
            </button>
            <button
              className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              {t('myCoursesActivities')}
            </button>
            <button
              className={`tab-button ${activeTab === 'points' ? 'active' : ''}`}
              onClick={() => setActiveTab('points')}
            >
              {t('language') === 'zh' ? '點數與禮物' : 'Points & Gifts'}
            </button>
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
                      <label className="upload-button">
                        {t('uploadPicture')}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
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

                  {/* Statistics Section */}
                  <div className="statistics-section">
                    <h3>{t('language') === 'zh' ? '會員統計' : 'Member Statistics'}</h3>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon">💎</div>
                        <div className="stat-value">{member.points || 0}</div>
                        <div className="stat-label">{t('language') === 'zh' ? '會員點數' : 'Points'}</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-icon">📚</div>
                        <div className="stat-value">
                          {member.enrollments ? member.enrollments.filter(e => e.type === 'class' && e.status === 'active').length : 0}
                        </div>
                        <div className="stat-label">{t('language') === 'zh' ? '已報名課程' : 'Classes'}</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-icon">🎯</div>
                        <div className="stat-value">
                          {member.enrollments ? member.enrollments.filter(e => e.type === 'activity' && e.status === 'active').length : 0}
                        </div>
                        <div className="stat-label">{t('language') === 'zh' ? '參加活動' : 'Activities'}</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-value">
                          {Math.floor((new Date() - new Date(member.createdAt)) / (1000 * 60 * 60 * 24))}
                        </div>
                        <div className="stat-label">{t('language') === 'zh' ? '會員天數' : 'Days'}</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">{member.referralCount || 0}</div>
                        <div className="stat-label">{t('language') === 'zh' ? '推薦人數' : 'Referrals'}</div>
                      </div>

                      <div className="stat-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-value">
                          {member.enrollments ? member.enrollments.filter(e => e.status === 'active').length : 0}
                        </div>
                        <div className="stat-label">{t('language') === 'zh' ? '總報名數' : 'Total'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="contact-info">
                    <h3>{t('contactInfo')}</h3>
                    <p><strong>{t('mobile')}:</strong> {member.contact?.mobile}</p>
                    {member.contact?.phone && <p><strong>{t('phone')}:</strong> {member.contact.phone}</p>}
                    {member.contact?.lineId && <p><strong>{t('lineId')}:</strong> {member.contact.lineId}</p>}
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
                    <label>{t('lineId')}</label>
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

          {activeTab === 'courses' && selectedClass && (
            <div className="card">
              <button
                onClick={() => setSelectedClass(null)}
                className="btn btn-secondary"
                style={{ marginBottom: '20px' }}
              >
                ← {t('back')}
              </button>

              {selectedClass.classInfoId?.banner && (
                <img
                  src={getImageSrc(selectedClass.classInfoId.banner)}
                  alt={selectedClass.classInfoId?.name}
                  style={{
                    width: '1000px',
                    height: '600px',
                    maxWidth: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}
                />
              )}

              <h2>{selectedClass.classInfoId?.name || 'N/A'}</h2>
              <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '20px', color: '#666' }}>
                {selectedClass.classInfoId?.description || ''}
              </p>

              {/* Two-box layout: Class Details and Teacher Info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: selectedClass.teacherId ? '1.5fr 1fr' : '1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                {/* Class Details Box */}
                <div style={{
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
                </div>

                {/* Teacher Information Box */}
                {selectedClass.teacherId && (
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
              </div>

              {/* Fallback if no teacher ID */}
              {!selectedClass.teacherId && selectedClass.teacher && (
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

          {activeTab === 'courses' && !selectedClass && (
            <div className="courses-activities-section">
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

                <h4 className="section-subtitle">{t('availableClasses')}</h4>

                {/* Class Template Filter */}
                <div style={{ marginBottom: '20px' }}>
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
                </div>

                {/* Date Filter */}
                <div style={{ marginBottom: '20px' }}>
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
                      {classItem.classInfoId?.banner && (
                        <img src={getImageSrc(classItem.classInfoId.banner)} alt={classItem.classInfoId?.name} className="item-banner" />
                      )}
                      <h4>{classItem.classInfoId?.name || 'N/A'}</h4>
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
                      {activity.banner && (
                        <img src={getImageSrc(activity.banner)} alt={activity.name} className="item-banner" />
                      )}
                      <h4>{activity.name}</h4>
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
        </>
      )}
    </div>
  );
}

export default Profile;
