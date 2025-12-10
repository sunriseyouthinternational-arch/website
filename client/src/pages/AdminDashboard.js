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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states for adding new items
  const [showClassForm, setShowClassForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '', description: '', time: '', cost: '', teacher: '', maxParticipants: ''
  });
  const [newActivity, setNewActivity] = useState({
    name: '', description: '', time: '', cost: '', teacher: '', maxParticipants: ''
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
      const [membersRes, classesRes, activitiesRes, statsRes] = await Promise.all([
        axios.get('/api/admin?resource=members'),
        axios.get('/api/classes'),
        axios.get('/api/activities'),
        axios.get('/api/admin?resource=stats')
      ]);

      setMembers(membersRes.data.members);
      setClasses(classesRes.data.classes);
      setActivities(activitiesRes.data.activities);
      setStats(statsRes.data);
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

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/classes', newClass, {
        headers: { 'Content-Type': 'application/json' }
      });
      setMessage({ type: 'success', text: t('language') === 'zh' ? '課程添加成功' : 'Class added successfully' });
      setShowClassForm(false);
      setNewClass({ name: '', description: '', time: '', cost: '', teacher: '', maxParticipants: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding class:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || t('error') });
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/activities', newActivity, {
        headers: { 'Content-Type': 'application/json' }
      });
      setMessage({ type: 'success', text: t('language') === 'zh' ? '活動添加成功' : 'Activity added successfully' });
      setShowActivityForm(false);
      setNewActivity({ name: '', description: '', time: '', cost: '', teacher: '', maxParticipants: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding activity:', error);
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
          className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          {t('classManagement')}
        </button>
        <button
          className={`tab-button ${activeTab === 'activities' ? 'active' : ''}`}
          onClick={() => setActiveTab('activities')}
        >
          {t('activityManagement')}
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

      {activeTab === 'members' && (
        <div className="card">
          <h3>{t('memberManagement')}</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('memberId')}</th>
                  <th>{t('name')}</th>
                  <th>{t('gender')}</th>
                  <th>{t('mobile')}</th>
                  <th>{t('language') === 'zh' ? '已報名數' : 'Enrollments'}</th>
                  <th>{t('language') === 'zh' ? '註冊日期' : 'Registered Date'}</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member._id}>
                    <td>{member.memberId}</td>
                    <td>{member.name}</td>
                    <td>{member.gender}</td>
                    <td>{member.contact?.mobile}</td>
                    <td>{member.enrollments?.length || 0}</td>
                    <td>{formatDate(member.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'classes' && (
        <div className="card">
          <div className="section-header">
            <h3>{t('classManagement')}</h3>
            <button
              onClick={() => setShowClassForm(!showClassForm)}
              className="btn btn-primary"
            >
              {showClassForm ? t('cancel') : t('addNew')}
            </button>
          </div>

          {showClassForm && (
            <form onSubmit={handleAddClass} className="add-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('name')} *</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('teacher')} *</label>
                  <input
                    type="text"
                    value={newClass.teacher}
                    onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t('description')} *</label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  required
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{t('time')} *</label>
                  <input
                    type="text"
                    value={newClass.time}
                    onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                    required
                    placeholder={t('language') === 'zh' ? '例如：每週六 10:00-12:00' : 'e.g., Every Saturday 10:00-12:00'}
                  />
                </div>
                <div className="form-group">
                  <label>{t('cost')} (NT$) *</label>
                  <input
                    type="number"
                    value={newClass.cost}
                    onChange={(e) => setNewClass({ ...newClass, cost: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('maxParticipants')} *</label>
                  <input
                    type="number"
                    value={newClass.maxParticipants}
                    onChange={(e) => setNewClass({ ...newClass, maxParticipants: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                {t('language') === 'zh' ? '添加課程' : 'Add Class'}
              </button>
            </form>
          )}

          <div className="items-list">
            {classes.map(classItem => (
              <div key={classItem._id} className="item-detail-card">
                <div className="item-header">
                  <h4>{classItem.name}</h4>
                  <span className={`status-badge ${classItem.status}`}>
                    {t(classItem.status)}
                  </span>
                </div>
                <p className="item-description">{classItem.description}</p>
                <div className="item-meta">
                  <p><strong>{t('teacher')}:</strong> {classItem.teacher}</p>
                  <p><strong>{t('time')}:</strong> {classItem.time}</p>
                  <p><strong>{t('cost')}:</strong> NT$ {classItem.cost}</p>
                  <p><strong>{t('participants')}:</strong> {classItem.currentParticipants} / {classItem.maxParticipants}</p>
                </div>

                {classItem.participants && classItem.participants.length > 0 && (
                  <div className="participants-list">
                    <h5>{t('participants')}</h5>
                    <table className="participants-table">
                      <thead>
                        <tr>
                          <th>{t('name')}</th>
                          <th>{t('language') === 'zh' ? '報名日期' : 'Enrolled Date'}</th>
                          <th>{t('language') === 'zh' ? '付款狀態' : 'Payment Status'}</th>
                          <th>{t('language') === 'zh' ? '操作' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classItem.participants.map(participant => (
                          <tr key={participant._id}>
                            <td>{participant.memberName}</td>
                            <td>{formatDate(participant.enrolledAt)}</td>
                            <td>
                              <span className={`status-badge ${participant.paid ? 'paid' : 'unpaid'}`}>
                                {participant.paid ? t('paid') : t('unpaid')}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => updatePaymentStatus('class', classItem._id, participant._id, !participant.paid)}
                                className={`btn btn-small ${participant.paid ? 'btn-secondary' : 'btn-success'}`}
                              >
                                {participant.paid
                                  ? (t('language') === 'zh' ? '標記未付款' : 'Mark Unpaid')
                                  : (t('language') === 'zh' ? '標記已付款' : 'Mark Paid')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="card">
          <div className="section-header">
            <h3>{t('activityManagement')}</h3>
            <button
              onClick={() => setShowActivityForm(!showActivityForm)}
              className="btn btn-primary"
            >
              {showActivityForm ? t('cancel') : t('addNew')}
            </button>
          </div>

          {showActivityForm && (
            <form onSubmit={handleAddActivity} className="add-form">
              <div className="form-row">
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
                  <label>{t('teacher')} *</label>
                  <input
                    type="text"
                    value={newActivity.teacher}
                    onChange={(e) => setNewActivity({ ...newActivity, teacher: e.target.value })}
                    required
                  />
                </div>
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

              <div className="form-row">
                <div className="form-group">
                  <label>{t('time')} *</label>
                  <input
                    type="text"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                    required
                    placeholder={t('language') === 'zh' ? '例如：2024/1/15 14:00-17:00' : 'e.g., 2024/1/15 14:00-17:00'}
                  />
                </div>
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

              <button type="submit" className="btn btn-primary">
                {t('language') === 'zh' ? '添加活動' : 'Add Activity'}
              </button>
            </form>
          )}

          <div className="items-list">
            {activities.map(activity => (
              <div key={activity._id} className="item-detail-card">
                <div className="item-header">
                  <h4>{activity.name}</h4>
                  <span className={`status-badge ${activity.status}`}>
                    {t(activity.status)}
                  </span>
                </div>
                <p className="item-description">{activity.description}</p>
                <div className="item-meta">
                  <p><strong>{t('teacher')}:</strong> {activity.teacher}</p>
                  <p><strong>{t('time')}:</strong> {activity.time}</p>
                  <p><strong>{t('cost')}:</strong> NT$ {activity.cost}</p>
                  <p><strong>{t('participants')}:</strong> {activity.currentParticipants} / {activity.maxParticipants}</p>
                </div>

                {activity.participants && activity.participants.length > 0 && (
                  <div className="participants-list">
                    <h5>{t('participants')}</h5>
                    <table className="participants-table">
                      <thead>
                        <tr>
                          <th>{t('name')}</th>
                          <th>{t('language') === 'zh' ? '報名日期' : 'Enrolled Date'}</th>
                          <th>{t('language') === 'zh' ? '付款狀態' : 'Payment Status'}</th>
                          <th>{t('language') === 'zh' ? '操作' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.participants.map(participant => (
                          <tr key={participant._id}>
                            <td>{participant.memberName}</td>
                            <td>{formatDate(participant.enrolledAt)}</td>
                            <td>
                              <span className={`status-badge ${participant.paid ? 'paid' : 'unpaid'}`}>
                                {participant.paid ? t('paid') : t('unpaid')}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => updatePaymentStatus('activity', activity._id, participant._id, !participant.paid)}
                                className={`btn btn-small ${participant.paid ? 'btn-secondary' : 'btn-success'}`}
                              >
                                {participant.paid
                                  ? (t('language') === 'zh' ? '標記未付款' : 'Mark Unpaid')
                                  : (t('language') === 'zh' ? '標記已付款' : 'Mark Paid')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
