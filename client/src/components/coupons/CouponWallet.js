import React, { useState, useEffect, useCallback } from 'react';
import { membersAPI, couponsAPI } from '../../services/api';
import CouponCard from './CouponCard';
import CouponDetail from './CouponDetail';

function CouponWallet({ memberId }) {
  const [myCoupons, setMyCoupons] = useState([]);
  const [forSaleCoupons, setForSaleCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-coupons');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [couponsRes, forSaleRes] = await Promise.all([
        membersAPI.getCoupons(memberId),
        couponsAPI.getForSale()
      ]);
      setMyCoupons(couponsRes.data.coupons || []);
      setForSaleCoupons(forSaleRes.data.coupons || []);
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurchase = async (couponForSaleId, quantity) => {
    try {
      await membersAPI.purchaseCoupon(memberId, couponForSaleId, quantity, 'points');
      await loadData();
      setSelectedCoupon(null);
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  };

  const handleShare = async (couponId, quantity) => {
    try {
      const response = await membersAPI.shareCoupon(memberId, couponId, quantity);
      return response.data.shareUrl;
    } catch (error) {
      console.error('Share failed:', error);
      throw error;
    }
  };

  const activeCoupons = myCoupons.filter(c => new Date(c.expiresAt) > new Date());
  const memberPoints = myCoupons[0]?.memberPoints || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-highest">
        <div className="text-on-surface text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-highest pb-32">
      <main className="pt-24 pb-32 px-6 max-w-5xl mx-auto">
        <section className="mb-12">
          <div className="flex flex-col gap-2 mb-8">
            <span className="text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase">
              Member Dashboard
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none">
              MY WALLET.
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 flex flex-col items-center justify-center text-center bg-[#201c00] text-white">
              <span className="material-symbols-outlined text-3xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                confirmation_number
              </span>
              <h3 className="text-2xl font-black">{activeCoupons.length.toString().padStart(2, '0')}</h3>
              <p className="text-[10px] font-extrabold uppercase tracking-tighter">Active Vouchers</p>
            </div>

            <div className="rounded-xl p-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest">
              <span className="material-symbols-outlined text-3xl mb-1 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                stars
              </span>
              <h3 className="text-2xl font-black text-on-surface">{memberPoints}</h3>
              <p className="text-[10px] font-extrabold uppercase tracking-tighter text-on-surface">Available Points</p>
            </div>
          </div>
        </section>

        <div className="flex gap-2 mb-6 border-b border-outline-variant">
          <button
            onClick={() => setActiveTab('my-coupons')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'my-coupons'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant'
            }`}
          >
            My Coupons
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all ${
              activeTab === 'store'
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant'
            }`}
          >
            Coupon Store
          </button>
        </div>

        {activeTab === 'my-coupons' && (
          <section>
            {myCoupons.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                  confirmation_number
                </span>
                <p className="font-semibold">No coupons yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCoupons.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    onClick={() => setSelectedCoupon({ ...coupon, isOwned: true })}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'store' && (
          <section>
            {forSaleCoupons.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-30">
                  storefront
                </span>
                <p className="font-semibold">No coupons available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {forSaleCoupons.map((coupon) => (
                  <CouponCard
                    key={coupon._id}
                    coupon={coupon}
                    isForSale
                    onClick={() => setSelectedCoupon({ ...coupon, isOwned: false })}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {selectedCoupon && (
        <CouponDetail
          coupon={selectedCoupon}
          onClose={() => setSelectedCoupon(null)}
          onPurchase={handlePurchase}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

export default CouponWallet;
