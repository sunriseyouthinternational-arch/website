import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import ProfileEdit from './ProfileEdit';

function ProfileView({ member, onUpdate }) {
  const { t } = useLanguage();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' });
  };

  const handleEditSuccess = (updatedMember) => {
    setIsEditOpen(false);
    if (onUpdate) onUpdate(updatedMember);
  };

  const completedClasses = member.enrollments?.filter(e => e.type === 'class' && e.status === 'completed').length || 0;
  const completedActivities = member.enrollments?.filter(e => e.type === 'activity' && e.status === 'completed').length || 0;

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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4 w-full md:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="inline-flex items-center px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold tracking-widest uppercase">
                    {member.membershipStatus === '協會會員' ? t('association_member') : t('association_friend')}
                  </div>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-1.5 border-2 border-on-surface text-on-surface rounded-full text-xs font-bold tracking-widest uppercase hover:bg-on-surface hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    {t('edit_profile')}
                  </button>
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">{member.name}</h2>
                <p className="text-on-surface-variant font-medium">{t('member_since_')} {formatDate(member.membershipStartDate)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">{t('member_id')}</span>
                  <p className="text-2xl font-black text-on-surface">{member.memberId}</p>
                </div>
                {member.qrCode && (
                  <img src={member.qrCode} alt="QR Code" className="w-24 h-24 rounded-lg border-2 border-surface-container" />
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-surface-container-low">
              <div className="text-center">
                <span className="text-5xl font-black text-on-surface">{completedClasses}</span>
                <span className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant">{t('classes_attended')}</span>
              </div>
              <div className="text-center">
                <span className="text-5xl font-black text-on-surface">{completedActivities}</span>
                <span className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant">{t('activities_joined')}</span>
              </div>
              <div className="text-center">
                <span className="text-5xl font-black text-on-surface">{member.coupons?.length || 0}</span>
                <span className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant">{t('coupons')}</span>
              </div>
              <div className="text-center">
                <span className="text-5xl font-black text-on-surface">{member.points || 0}</span>
                <span className="block text-xs font-bold tracking-widest uppercase text-on-surface-variant">{t('points')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-surface-container-lowest rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-extrabold tracking-tight uppercase">{t('contact_information')}</h3>
              <span className="material-symbols-outlined text-on-surface-variant">contact_phone</span>
            </div>
            <div className="space-y-4">
              {member.contact?.mobile && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('mobile')}</p>
                  <p className="font-bold text-on-surface">{member.contact.mobile}</p>
                </div>
              )}
              {member.contact?.phone && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t('phone')}</p>
                  <p className="font-bold text-on-surface">{member.contact.phone}</p>
                </div>
              )}
              {member.contact?.lineId && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">LINE ID</p>
                  <p className="font-bold text-on-surface">{member.contact.lineId}</p>
                </div>
              )}
            </div>
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
    </>
  );
}

export default ProfileView;
