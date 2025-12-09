import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

function Profile() {
  const { t } = useLanguage();
  const [memberId, setMemberId] = useState('');
  const [member, setMember] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');

  const fetchMember = async () => {
    if (!memberId) {
      setMessage({ type: 'error', text: t('language') === 'zh' ? '請輸入團員編號' : 'Please enter member ID' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.get(`/api/members/${memberId}`);
      setMember(response.data.member);
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

  const fetchClassesAndActivities = async () => {
    try {
      const [classesRes, activitiesRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/activities')
      ]);
      setClasses(classesRes.data.classes);
      setActivities(activitiesRes.data.activities);
    } catch (error) {
      console.error('Error fetching classes/activities:', error);
    }
  };

  useEffect(() => {
    fetchClassesAndActivities();
  }, []);

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
      const endpoint = type === 'class' ? `/api/classes/${id}/enroll` : `/api/activities/${id}/enroll`;
      const response = await axios.post(endpoint, { memberId: member.memberId });

      setMessage({ type: 'success', text: response.data.message });

      // Refresh member data
      const memberResponse = await axios.get(`/api/members/${member.memberId}`);
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
          </div>

          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

          {activeTab === 'profile' && (
            <div className="card profile-card">
              <div className="profile-header">
                <div className="profile-picture-section">
                  {member.profilePicture ? (
                    <img src={`http://localhost:5000${member.profilePicture}`} alt="Profile" className="profile-picture" />
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
                  <p><strong>{t('memberId')}:</strong> {member.memberId}</p>
                  <p><strong>{t('gender')}:</strong> {member.gender}</p>
                  <p><strong>{t('birthDate')}:</strong> {formatDate(member.birthDate)}</p>
                </div>

                <div className="qr-code-section">
                  <h3>{t('qrCode')}</h3>
                  {member.qrCode && (
                    <img src={member.qrCode} alt="QR Code" className="qr-code" />
                  )}
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
                      <p><strong>{t('name')}:</strong> {fm.name}</p>
                      <p><strong>{t('gender')}:</strong> {fm.gender}</p>
                      <p><strong>{t('birthDate')}:</strong> {formatDate(fm.birthDate)}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setMember(null)}
                className="btn btn-secondary"
              >
                {t('logout')}
              </button>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="courses-activities-section">
              <div className="card">
                <h3>{t('classes')}</h3>

                <h4 className="section-subtitle">{t('registeredClasses')}</h4>
                <div className="enrolled-list">
                  {getEnrolledItems('class').length > 0 ? (
                    getEnrolledItems('class').map((enrollment) => (
                      <div key={enrollment._id} className="enrolled-item">
                        <p><strong>{enrollment.itemName}</strong></p>
                        <span className={`status-badge ${enrollment.paid ? 'paid' : 'unpaid'}`}>
                          {enrollment.paid ? t('paid') : t('unpaid')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">{t('language') === 'zh' ? '尚無報名課程' : 'No enrolled classes'}</p>
                  )}
                </div>

                <h4 className="section-subtitle">{t('availableClasses')}</h4>
                <div className="grid">
                  {classes.map((classItem) => (
                    <div key={classItem._id} className="item-card">
                      {classItem.banner && (
                        <img src={`http://localhost:5000${classItem.banner}`} alt={classItem.name} className="item-banner" />
                      )}
                      <h4>{classItem.name}</h4>
                      <p className="item-description">{classItem.description}</p>
                      <div className="item-details">
                        <p><strong>{t('teacher')}:</strong> {classItem.teacher}</p>
                        <p><strong>{t('time')}:</strong> {classItem.time}</p>
                        <p><strong>{t('cost')}:</strong> NT$ {classItem.cost}</p>
                        <p><strong>{t('participants')}:</strong> {classItem.currentParticipants} / {classItem.maxParticipants}</p>
                      </div>
                      {isEnrolled('class', classItem._id) ? (
                        <button className="btn btn-secondary" disabled>{t('enrolled')}</button>
                      ) : (
                        <button
                          onClick={() => handleEnroll('class', classItem._id, classItem.name)}
                          className="btn btn-primary"
                          disabled={classItem.currentParticipants >= classItem.maxParticipants}
                        >
                          {classItem.currentParticipants >= classItem.maxParticipants ? t('classFull') : t('enroll')}
                        </button>
                      )}
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
                        <img src={`http://localhost:5000${activity.banner}`} alt={activity.name} className="item-banner" />
                      )}
                      <h4>{activity.name}</h4>
                      <p className="item-description">{activity.description}</p>
                      <div className="item-details">
                        <p><strong>{t('teacher')}:</strong> {activity.teacher}</p>
                        <p><strong>{t('time')}:</strong> {activity.time}</p>
                        <p><strong>{t('cost')}:</strong> NT$ {activity.cost}</p>
                        <p><strong>{t('participants')}:</strong> {activity.currentParticipants} / {activity.maxParticipants}</p>
                      </div>
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
        </>
      )}
    </div>
  );
}

export default Profile;
