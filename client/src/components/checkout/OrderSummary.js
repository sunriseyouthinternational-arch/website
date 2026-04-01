import React, { useMemo } from 'react';

function OrderSummary({ itemData, itemType, member, selectedPersons, selectedCoupons, onComplete, loading, error }) {
  const { subtotal, discount, total } = useMemo(() => {
    const cost = itemData.cost || itemData.classInfoId?.cost || 0;
    const count = selectedPersons.length;
    const sub = cost * count;

    let disc = 0;
    selectedPersons.forEach(personId => {
      const couponId = selectedCoupons[personId];
      if (couponId) {
        const coupon = member.coupons?.find(c => c._id === couponId);
        if (coupon && coupon.usedCount < coupon.quantity) {
          if (coupon.type === 'trial') {
            disc += cost;
          } else {
            disc += Math.round(cost * coupon.discountPercent / 100);
          }
        }
      }
    });

    return {
      subtotal: sub,
      discount: disc,
      total: sub - disc
    };
  }, [itemData, selectedPersons, selectedCoupons, member.coupons]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <aside className="lg:col-span-5 lg:sticky lg:top-24">
      <div className="bg-[#201c00] text-white p-10 rounded-xl overflow-hidden relative shadow-[0_32px_60px_-15px_rgba(0,0,0,0.3)]">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#ffe950] rounded-full opacity-10"></div>

        <h3 className="text-4xl font-black tracking-tighter mb-8 italic">SUMMARY</h3>

        <div className="space-y-4 mb-10">
          <div className="flex justify-between items-center text-white/60 font-medium">
            <span>Subtotal ({selectedPersons.length} {selectedPersons.length === 1 ? 'item' : 'items'})</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center text-white/60 font-medium">
              <span>Coupon Discount</span>
              <span className="text-[#dcc830]">-${discount.toFixed(2)}</span>
            </div>
          )}

          <div className="h-px bg-white/20 my-6"></div>

          <div className="flex justify-between items-center text-white text-2xl font-black">
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-8 p-6 rounded-lg bg-white/5 border border-white/10">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase mb-3">Enrollment Details</p>
          <p className="font-extrabold text-lg mb-2">{itemData.name || itemData.classInfoId?.name}</p>
          <div className="space-y-1 text-sm text-white/80">
            {itemData.date && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                <span>{formatDate(itemData.date)}</span>
              </div>
            )}
            {itemData.time && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">schedule</span>
                <span>{itemData.time}</span>
              </div>
            )}
            {itemData.location && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>{itemData.location}</span>
              </div>
            )}
          </div>
        </div>

        {selectedPersons.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase mb-3">Participants</p>
            <div className="space-y-2">
              {selectedPersons.map(personId => {
                const name = personId === 'self'
                  ? `${member.name} (Self)`
                  : `${member.familyMembers[personId]?.name} (Family)`;
                return (
                  <div key={personId} className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-base text-[#dcc830]">check_circle</span>
                    <span>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[#ffdad6] text-[#93000a] text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={onComplete}
            disabled={loading || selectedPersons.length === 0}
            className="w-full bg-[#ffe950] text-[#201c00] py-5 rounded-full font-black text-lg flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'PROCESSING...' : 'COMPLETE ENROLLMENT'}
            {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
          </button>
          <p className="text-center text-[10px] font-medium text-white/40 leading-relaxed px-4">
            By clicking complete, you agree to our <span className="underline">Terms of Service</span> and health waiver requirements.
          </p>
        </div>
      </div>

      <div className="mt-6 p-6 rounded-lg bg-[#fff4c0] flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[#201c00]">help</span>
        </div>
        <div>
          <p className="font-bold text-sm text-[#201c00]">Need help enrolling?</p>
          <p className="text-xs text-[#4b4734]">Our support team is available 9am-5pm.</p>
        </div>
      </div>
    </aside>
  );
}

export default OrderSummary;
