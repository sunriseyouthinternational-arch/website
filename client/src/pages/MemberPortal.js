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
    const fetchMemberData = async () => {
      const cachedMember = localStorage.getItem('memberData');
      if (!cachedMember) {
        navigate('/profile');
        return;
      }

      const memberData = JSON.parse(cachedMember);

      try {
        // Fetch fresh data from server
        const response = await fetch(`/api/members?memberId=${memberData.memberId}`);
        if (response.ok) {
          const freshData = await response.json();
          // Update localStorage with fresh data
          localStorage.setItem('memberData', JSON.stringify(freshData.member));
          setMember(freshData.member);
        } else {
          // Fallback to cached data if fetch fails
          setMember(memberData);
        }
      } catch (error) {
        console.error('Failed to fetch fresh member data:', error);
        // Fallback to cached data
        setMember(memberData);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, [navigate]);

  // Refresh data when tab becomes visible
  useEffect(() => {
    const fetchFreshData = async () => {
      const cachedMember = localStorage.getItem('memberData');
      if (!cachedMember) return;

      const memberData = JSON.parse(cachedMember);

      try {
        const response = await fetch(`/api/members?memberId=${memberData.memberId}`);
        if (response.ok) {
          const freshData = await response.json();
          localStorage.setItem('memberData', JSON.stringify(freshData.member));
          setMember(freshData.member);
        }
      } catch (error) {
        console.error('Failed to refresh member data:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
    <div className="min-h-screen bg-surface-container-highest pb-20">
      <Header />

      <main>
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
