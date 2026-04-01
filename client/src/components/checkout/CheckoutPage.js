import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PersonSelector from './PersonSelector';
import OrderSummary from './OrderSummary';
import { classesAPI, activitiesAPI } from '../../services/api';

function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemType, itemId, itemData } = location.state || {};

  const [member, setMember] = useState(null);
  const [selectedPersons, setSelectedPersons] = useState([]);
  const [selectedCoupons, setSelectedCoupons] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('in-person');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedMember = localStorage.getItem('member');
    if (storedMember) {
      setMember(JSON.parse(storedMember));
    }
  }, []);

  const handleEnroll = async () => {
    if (selectedPersons.length === 0) {
      setError('請至少選擇一位人員 / Please select at least one person');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const enrollData = {
        memberId: member.memberId,
        paymentMethod,
        familyMembers: selectedPersons,
        familyMemberCoupons: selectedCoupons
      };

      const response = itemType === 'class'
        ? await classesAPI.enroll(itemId, enrollData)
        : await activitiesAPI.enroll(itemId, enrollData);

      alert(response.data.message);
      navigate('/classes');
    } catch (err) {
      setError(err.response?.data?.message || '報名失敗 / Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!itemData || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fae44b]">
        <div className="text-[#121212] text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fae44b] font-['Plus_Jakarta_Sans'] pb-32">
      <header className="w-full sticky top-0 bg-[#fae44b] text-[#121212] flex items-center justify-between px-6 py-6 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl cursor-pointer" onClick={() => navigate(-1)}>arrow_back</span>
          <h1 className="font-extrabold tracking-tighter text-2xl">Member Portal</h1>
        </div>
      </header>

      <main className="pt-6 pb-32 px-6 max-w-4xl mx-auto">
        <section className="mb-12">
          <h2 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-[#201c00] mb-4">
            SECURE<br/>YOUR SPOT
          </h2>
          <div className="flex items-center gap-2 text-[#4b4734] font-bold tracking-widest text-sm">
            <span className="material-symbols-outlined text-sm">lock</span>
            ENROLLMENT CHECKOUT
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <PersonSelector
              member={member}
              itemData={itemData}
              selectedPersons={selectedPersons}
              setSelectedPersons={setSelectedPersons}
              selectedCoupons={selectedCoupons}
              setSelectedCoupons={setSelectedCoupons}
            />

            <div className="bg-white p-8 rounded-xl shadow-[0_12px_40px_0_rgba(32,28,0,0.06)]">
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#4b4734] uppercase mb-1">Step 02</p>
              <h3 className="text-3xl font-extrabold tracking-tighter mb-8">PAYMENT METHOD</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod('in-person')}
                  className={`p-6 rounded-lg cursor-pointer border-2 ${
                    paymentMethod === 'in-person'
                      ? 'bg-[#fff4c0] border-[#201c00]'
                      : 'bg-white border-[#cdc7ae]/20 hover:border-[#cdc7ae]'
                  } transition-colors`}
                >
                  <span className="material-symbols-outlined mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  <p className="font-extrabold">Pay In Person</p>
                  <p className="text-xs text-[#4b4734]">At the front desk</p>
                </div>
                <div
                  onClick={() => setPaymentMethod('card')}
                  className={`p-6 rounded-lg cursor-pointer border-2 ${
                    paymentMethod === 'card'
                      ? 'bg-[#fff4c0] border-[#201c00]'
                      : 'bg-white border-[#cdc7ae]/20 hover:border-[#cdc7ae]'
                  } transition-colors`}
                >
                  <span className="material-symbols-outlined mb-2">credit_card</span>
                  <p className="font-extrabold">Credit/Debit Card</p>
                  <p className="text-xs text-[#4b4734]">Instant confirmation</p>
                </div>
              </div>
            </div>
          </div>

          <OrderSummary
            itemData={itemData}
            itemType={itemType}
            member={member}
            selectedPersons={selectedPersons}
            selectedCoupons={selectedCoupons}
            onComplete={handleEnroll}
            loading={loading}
            error={error}
          />
        </div>
      </main>
    </div>
  );
}

export default CheckoutPage;
