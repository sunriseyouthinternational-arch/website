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
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [referralLeaderboard, setReferralLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states for adding new items
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'class', // 'class' or 'activity'
    name: '',
    description: '',
    time: '',
    dayOfWeek: '',
    cost: '',
    teacher: '',
    maxParticipants: '',
    banner: ''
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
      const [membersRes, classesRes, activitiesRes, statsRes, leaderboardRes] = await Promise.all([
        axios.get('/api/admin?resource=members'),
        axios.get('/api/classes'),
        axios.get('/api/activities'),
        axios.get('/api/admin?resource=stats'),
        axios.get('/api/admin?resource=referral-leaderboard')
      ]);

      setMembers(membersRes.data.members);
      setClasses(classesRes.data.classes);
      setActivities(activitiesRes.data.activities);
      setStats(statsRes.data);
      setReferralLeaderboard(leaderboardRes.data.leaderboard);
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

  const handleImageUpload = (e) => {
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
      setNewItem({ ...newItem, banner: reader.result });
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

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const endpoint = newItem.type === 'class' ? '/api/classes' : '/api/activities';

      // Prepare data based on type
      const data = {
        name: newItem.name,
        description: newItem.description,
        time: newItem.time,
        cost: newItem.cost,
        teacher: newItem.teacher,
        maxParticipants: newItem.maxParticipants,
        banner: newItem.banner
      };

      // Only add dayOfWeek for classes
      if (newItem.type === 'class') {
        data.dayOfWeek = newItem.dayOfWeek;
      }

      await axios.post(endpoint, data, {
        headers: { 'Content-Type': 'application/json' }
      });

      setMessage({
        type: 'success',
        text: t('language') === 'zh'
          ? `${newItem.type === 'class' ? '課程' : '活動'}添加成功`
          : `${newItem.type === 'class' ? 'Class' : 'Activity'} added successfully`
      });
      setShowAddForm(false);
      setNewItem({
        type: 'class',
        name: '',
        description: '',
        time: '',
        dayOfWeek: '',
        cost: '',
        teacher: '',
        maxParticipants: '',
        banner: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding item:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const updatePaymentStatus = async (type, itemId, participantId, paid) => {
    try {
      const resource = type === 'class' ? 'class-payment' : 'activity-payment';
      const idParam = type === 'class' ? 'classId' : 'activityId';
      const endpoint = `/api/admin?resource=${resource}&${idParam}=${itemId}&participantId=${participantId}`;

      await axios.put(endpoint, { paid });
      setMessage({ type: 'success', text: t('language') === 'zh' ? '付款狀態已更新' : 'Payment status updated' });
      fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
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
        </div>
      )}

      {activeTab === 'items' && !selectedItem && (
        <div className="card">
          <div className="section-header">
            <h3>{t('language') === 'zh' ? '課程與活動管理' : 'Classes & Activities Management'}</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary"
            >
              {showAddForm ? t('cancel') : t('addNew')}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddItem} className="add-form">
              {/* Type Selector */}
              <div className="form-group">
                <label>{t('language') === 'zh' ? '類型 *' : 'Type *'}</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  required
                >
                  <option value="class">{t('language') === 'zh' ? '課程' : 'Class'}</option>
                  <option value="activity">{t('language') === 'zh' ? '活動' : 'Activity'}</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('name')} *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('teacher')} *</label>
                  <input
                    type="text"
                    value={newItem.teacher}
                    onChange={(e) => setNewItem({ ...newItem, teacher: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('description')} *</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  required
                  rows="3"
                />
              </div>

              {/* Day of Week - Only for Classes */}
              {newItem.type === 'class' && (
                <div className="form-group">
                  <label>{t('language') === 'zh' ? '上課日期 *' : 'Day of Week *'}</label>
                  <select
                    value={newItem.dayOfWeek}
                    onChange={(e) => setNewItem({ ...newItem, dayOfWeek: e.target.value })}
                    required
                  >
                    <option value="">{t('language') === 'zh' ? '選擇日期' : 'Select Day'}</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>{t('time')} *</label>
                  <input
                    type="text"
                    value={newItem.time}
                    onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    required
                    placeholder={t('language') === 'zh' ? '例如：每週六 10:00-12:00' : 'e.g., Every Saturday 10:00-12:00'}
                  />
                </div>
                <div className="form-group">
                  <label>{t('cost')} (NT$) *</label>
                  <input
                    type="number"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('maxParticipants')} *</label>
                  <input
                    type="number"
                    value={newItem.maxParticipants}
                    onChange={(e) => setNewItem({ ...newItem, maxParticipants: e.target.value })}
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
                  onChange={handleImageUpload}
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
                    ? '上傳圖片（最大 2MB，建議尺寸：800x400px）'
                    : 'Upload image (max 2MB, recommended size: 800x400px)'}
                </small>
                {newItem.banner && (
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      {t('language') === 'zh' ? '預覽：' : 'Preview:'}
                    </p>
                    <img
                      src={newItem.banner}
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
                      onClick={() => setNewItem({ ...newItem, banner: '' })}
                      style={{ marginTop: '10px' }}
                    >
                      {t('language') === 'zh' ? '移除圖片' : 'Remove Image'}
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary">
                {t('language') === 'zh'
                  ? `添加${newItem.type === 'class' ? '課程' : '活動'}`
                  : `Add ${newItem.type === 'class' ? 'Class' : 'Activity'}`}
              </button>
            </form>
          )}

          {/* Classes Section */}
          <div className="items-section">
            <h4 style={{ color: '#667eea', marginBottom: '20px' }}>
              {t('classes')} ({classes.length})
            </h4>
            <div className="items-list">
              {classes.map(classItem => (
                <div key={classItem._id} className="item-summary-card">
                  {classItem.banner && (
                    <img src={classItem.banner} alt={classItem.name} className="item-summary-banner" />
                  )}
                  <div className="item-summary-content">
                    <h5>{classItem.name}</h5>
                    <p className="item-summary-meta">
                      {classItem.dayOfWeek && `${classItem.dayOfWeek} | `}
                      {classItem.time} | {t('teacher')}: {classItem.teacher}
                    </p>
                    <p className="item-summary-participants">
                      {classItem.currentParticipants}/{classItem.maxParticipants} {t('participants')}
                    </p>
                  </div>
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => setSelectedItem({ ...classItem, type: 'class' })}
                  >
                    {t('language') === 'zh' ? '查看詳情' : 'View Details'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activities Section */}
          <div className="items-section">
            <h4 style={{ color: '#667eea', marginBottom: '20px' }}>
              {t('activities')} ({activities.length})
            </h4>
            <div className="items-list">
              {activities.map(activity => (
                <div key={activity._id} className="item-summary-card">
                  {activity.banner && (
                    <img src={activity.banner} alt={activity.name} className="item-summary-banner" />
                  )}
                  <div className="item-summary-content">
                    <h5>{activity.name}</h5>
                    <p className="item-summary-meta">
                      {activity.time} | {t('teacher')}: {activity.teacher}
                    </p>
                    <p className="item-summary-participants">
                      {activity.currentParticipants}/{activity.maxParticipants} {t('participants')}
                    </p>
                  </div>
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => setSelectedItem({ ...activity, type: 'activity' })}
                  >
                    {t('language') === 'zh' ? '查看詳情' : 'View Details'}
                  </button>
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
              {selectedItem.type === 'class' ? t('classes') : t('activities')} - {selectedItem.name}
            </h3>
          </div>

          {selectedItem.banner && (
            <img
              src={selectedItem.banner}
              alt={selectedItem.name}
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
                <span>{selectedItem.name}</span>
              </div>
              <div className="detail-row">
                <strong>{t('description')}:</strong>
                <span>{selectedItem.description}</span>
              </div>
              {selectedItem.dayOfWeek && (
                <div className="detail-row">
                  <strong>{t('language') === 'zh' ? '上課日期' : 'Day'}:</strong>
                  <span>{selectedItem.dayOfWeek}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>{t('time')}:</strong>
                <span>{selectedItem.time}</span>
              </div>
              <div className="detail-row">
                <strong>{t('teacher')}:</strong>
                <span>{selectedItem.teacher}</span>
              </div>
              <div className="detail-row">
                <strong>{t('cost')}:</strong>
                <span>NT$ {selectedItem.cost}</span>
              </div>
              <div className="detail-row">
                <strong>{t('participants')}:</strong>
                <span>
                  {selectedItem.currentParticipants} / {selectedItem.maxParticipants}
                </span>
              </div>
            </div>
          </div>

          {selectedItem.participants && selectedItem.participants.length > 0 && (
            <div className="detail-section" style={{ marginTop: '30px' }}>
              <h4>{t('language') === 'zh' ? '已報名會員' : 'Enrolled Members'}</h4>
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
                          >
                            {participant.paid
                              ? (t('language') === 'zh' ? '標記未付' : 'Mark Unpaid')
                              : (t('language') === 'zh' ? '標記已付' : 'Mark Paid')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
