import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/shared/Header';
import BottomNav from '../components/shared/BottomNav';
import ProfileView from '../components/profile/ProfileView';
import ClassExplorer from '../components/classes/ClassExplorer';
import ActivityExplorer from '../components/activities/ActivityExplorer';
import CouponWallet from '../components/coupons/CouponWallet';
import MeetingsView from '../components/meetings/MeetingsView';

function MemberPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get member data from localStorage (set by Login component)
    const cachedMember = localStorage.getItem('memberData');
    if (cachedMember) {
      const memberData = JSON.parse(cachedMember);
      setMember(memberData);
      setLoading(false);
    } else {
      // Redirect to login if no member data
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Update URL when tab changes
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-highest flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-on-surface mx-auto mb-4"></div>
          <p className="text-on-surface">Loading...</p>
        </div>
      </div>
    );
  }

  const showMeetings = member?.membershipStatus === '協會會員';

  return (
    <div className="min-h-screen bg-surface-container-highest pb-32">
      <Header />

      <main className="pt-6">
        {activeTab === 'profile' && <ProfileView member={member} setMember={setMember} />}
        {activeTab === 'classes' && <ClassExplorer memberId={member?.memberId} />}
        {activeTab === 'activities' && <ActivityExplorer memberId={member?.memberId} />}
        {activeTab === 'coupons' && <CouponWallet memberId={member?.memberId} />}
        {activeTab === 'meetings' && showMeetings && <MeetingsView memberId={member?.memberId} />}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showMeetings={showMeetings}
      />
    </div>
  );
}

export default MemberPortal;
