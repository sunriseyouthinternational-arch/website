import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import ProfileEdit from './ProfileEdit';
import ClassDetail from '../classes/ClassDetail';
import ActivityDetail from '../activities/ActivityDetail';
import Modal from '../shared/Modal';

function ProfileView({ member, setMember }) {
  const { t } = useLanguage();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [upgradePaymentMethod, setUpgradePaymentMethod] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  };

  const handleEditSuccess = (updatedMember) => {
    setIsEditOpen(false);
    if (setMember) setMember(updatedMember);
  };

  const handleUpgradeRequest = async () => {
    if (!upgradePaymentMethod) {
      setUpgradeError(t('choose_payment_method'));
      return;
    }

    setUpgradeLoading(true);
    setUpgradeError('');

    try {
      const { membersAPI } = require('../../services/api');
      await membersAPI.requestUpgrade(member.memberId, upgradePaymentMethod);

      setIsUpgradeModalOpen(false);
      setUpgradePaymentMethod('');
      alert(t('upgrade_request_submitted_successfully') || 'Upgrade request submitted successfully!');
    } catch (error) {
      console.error('Upgrade request failed:', error);
      setUpgradeError(error.response?.data?.message || t('upgrade_failed'));
    } finally {
      setUpgradeLoading(false);
    }
  };

  const isAssociationMember = member.membershipStatus === '協會會員';
  const currentEnrollments = member.enrollments?.filter(e =>
    e.status === 'enrolled' || e.status === 'upcoming'
  ) || [];

  return (
    <>
      <main className="px-6 max-w-4xl mx-auto space-y-8 pt-8">
        {/* Section Header */}
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">{t('member_dashboard')}</span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none uppercase">{t('profile')}.</h1>
        </div>

        {/* Hero Section: Member Summary Card */}
        <section className="relative">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_40px_0_rgba(32,28,0,0.06)] relative z-10 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-surface-container rounded-full opacity-50"></div>

            {/* Header Row: Name and Member ID */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
                  {member.name}
                  {member.englishAlias && (
                    <span className="text-on-surface-variant font-medium text-2xl ml-3">
                      ({member.englishAlias})
                    </span>
                  )}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">{t('member_id')}</span>
                <p className="text-2xl font-black text-on-surface">{member.memberId}</p>
              </div>
            </div>

            {/* Status Badge and Member Since */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="inline-flex items-center px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-widest uppercase w-fit">
                {isAssociationMember ? t('association_member') : t('association_friend')}
              </div>
              <p className="text-on-surface-variant font-medium">{t('member_since_')} {formatDate(member.membershipStartDate)}</p>
            </div>

            {/* Points Display - Left Aligned */}
            <div className="mb-6 pb-6 border-b border-surface-container-low">
              <div className="text-left">
                <span className="text-5xl font-black text-on-surface">{member.points || 0}</span>
                <span className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant mt-2">{t('points')}</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-on-surface text-on-surface rounded-full text-xs font-bold tracking-widest uppercase hover:bg-on-surface hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                {t('edit_profile')}
              </button>
              {isAssociationMember ? (
                <button
                  onClick={() => setIsMembershipModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-full text-xs font-bold tracking-widest uppercase hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">card_membership</span>
                  {t('view_membership')}
                </button>
              ) : (
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors"
                  style={{ backgroundColor: '#fae44b', color: '#000' }}
                >
                  <span className="material-symbols-outlined text-[14px]">upgrade</span>
                  {t('upgrade_membership')}
                </button>
              )}
              {member.qrCode && (
                <img src={member.qrCode} alt="QR Code" className="w-20 h-20 rounded-lg border-2 border-surface-container ml-auto" />
              )}
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Enrollments */}
          <div className="bg-surface-container-lowest rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-extrabold tracking-tight uppercase">{t('current_enrollments')}</h3>
              <span className="material-symbols-outlined text-on-surface-variant">event_available</span>
            </div>
            {currentEnrollments.length > 0 ? (
              <div className="space-y-4">
                {currentEnrollments.map((enrollment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-primary-container">
                          {enrollment.type === 'class' ? 'school' : 'celebration'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">
                          {enrollment.type === 'class'
                            ? enrollment.classId?.classInfoId?.name
                            : enrollment.activityId?.activityInfoId?.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {enrollment.memberName || member.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (enrollment.type === 'class') {
                          setSelectedClass(enrollment.classId);
                        } else {
                          setSelectedActivity(enrollment.activityId);
                        }
                      }}
                      className="px-3 py-1.5 bg-on-surface text-surface rounded-full text-xs font-bold tracking-widest uppercase hover:scale-105 transition-transform"
                    >
                      {t('view_details')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant">{t('no_current_enrollments')}</p>
            )}
          </div>

          {/* Family Group */}
          <div className="bg-surface-container-lowest rounded-xl p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-extrabold tracking-tight uppercase">{t('family_group')}</h3>
              <span className="material-symbols-outlined text-on-surface-variant">groups</span>
            </div>
            {member.familyMembers && member.familyMembers.length > 0 ? (
              <div className="space-y-4">
                {member.familyMembers.map((fm, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-surface-container-low rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface">person</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{fm.name} {fm.englishAlias && `(${fm.englishAlias})`}</p>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{fm.gender}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant">{t('no_family_members')}</p>
            )}
          </div>

          {/* Referral Code */}
          <div className="bg-[#fae44b] rounded-xl p-8 flex flex-col justify-between border-4 border-on-surface/5">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight mb-2 uppercase">{t('your_referral_code')}</h3>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{t('share_with_friends')}</p>
            </div>
            <div className="mt-6">
              <div className="bg-white/40 rounded-lg p-4 text-center">
                <p className="text-4xl font-black tracking-wider">{member.referralCode}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Edit Modal */}
      <ProfileEdit
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        member={member}
        onSuccess={handleEditSuccess}
      />

      {/* Membership Details Modal */}
      {isMembershipModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-2xl w-full p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-extrabold tracking-tight uppercase">{t('membership_details')}</h2>
              <button
                onClick={() => setIsMembershipModalOpen(false)}
                className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-primary-container rounded-xl">
                <p className="text-xs font-bold tracking-widest uppercase text-on-primary-container mb-2">{t('membership_status')}</p>
                <p className="text-2xl font-black text-on-primary-container">{t('association_member')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">{t('member_id')}</p>
                  <p className="text-xl font-black text-on-surface">{member.memberId}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">{t('member_since')}</p>
                  <p className="text-xl font-black text-on-surface">{formatDate(member.membershipStartDate)}</p>
                </div>
              </div>

              {member.membershipExpiryDate && (
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs font-bold tracking-widest uppercase text-on-surface-variant mb-2">{t('expiry_date')}</p>
                  <p className="text-xl font-black text-on-surface">{formatDate(member.membershipExpiryDate)}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMembershipModalOpen(false)}
              className="w-full bg-on-surface text-surface py-4 rounded-full font-black text-lg tracking-wide hover:scale-105 active:scale-95 transition-all"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Membership Modal */}
      {isUpgradeModalOpen && (
        <Modal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)}>
          <div className="space-y-6">
            <h2 className="font-headline font-bold text-3xl text-on-surface">
              {t('upgrade_membership')}
            </h2>

            <div className="bg-primary-container p-6 rounded-xl">
              <p className="text-on-primary-container font-medium mb-2">
                {t('upgrade_to_association_member')}
              </p>
              <p className="text-2xl font-black text-on-primary-container">
                NT$ 3,000
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  {t('choose_payment_method')} *
                </span>
                <select
                  value={upgradePaymentMethod}
                  onChange={(e) => setUpgradePaymentMethod(e.target.value)}
                  className="mt-2 w-full px-4 py-3 bg-surface-container text-on-surface rounded-lg border-2 border-surface-container-high focus:border-primary focus:outline-none"
                >
                  <option value="">{t('select_payment_method')}</option>
                  <option value="cash">{t('cash')}</option>
                  <option value="transfer">{t('bank_transfer')}</option>
                </select>
              </label>

              {upgradeError && (
                <div className="bg-error-container text-on-error-container p-4 rounded-lg">
                  {upgradeError}
                </div>
              )}

              <div className="bg-surface-container p-4 rounded-lg text-sm text-on-surface-variant">
                {t('please_pay_nt_3000_instructions')}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="flex-1 px-6 py-3 bg-surface-container text-on-surface rounded-full font-bold hover:bg-surface-container-high transition-colors"
                disabled={upgradeLoading}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleUpgradeRequest}
                className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={upgradeLoading || !upgradePaymentMethod}
              >
                {upgradeLoading ? t('submitting') : t('submit_request')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Profile Edit Modal */}
      {isEditOpen && (
        <ProfileEdit
          member={member}
          onClose={() => setIsEditOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
