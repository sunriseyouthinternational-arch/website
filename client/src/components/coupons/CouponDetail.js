import React, { useState } from 'react';

function CouponDetail({ coupon, onClose, onPurchase, onShare }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);

  const profile = coupon.isOwned ? coupon.couponProfile : coupon.couponProfileId;
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

  const getDiscountText = () => {
    if (profile?.type === 'discount') {
      return `${profile.discountPercent}% OFF`;
    }
    if (profile?.type === 'trial') {
      return 'FREE TRIAL';
    }
    return 'COUPON';
  };

  const handleAction = async () => {
    setLoading(true);
    try {
      if (coupon.isOwned) {
        const url = await onShare(coupon._id, quantity);
        setShareUrl(url);
      } else {
        await onPurchase(coupon._id, quantity);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShare = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-highest w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-container-highest p-6 flex items-center justify-between border-b border-outline-variant">
          <h2 className="text-xl font-bold text-on-surface">Coupon Details</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-all"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-8">
            <div className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-[0_12px_40px_0_rgba(32,28,0,0.06)] relative overflow-hidden flex flex-col items-center">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-surface-container-high rounded-full opacity-20"></div>
              <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-primary rounded-full opacity-5"></div>

              <div className="w-full aspect-square md:w-80 bg-surface-container-low rounded-lg flex items-center justify-center relative mb-8">
                <div className="absolute inset-4 border-4 border-dashed border-outline-variant/30 rounded-lg"></div>
                <span
                  className="material-symbols-outlined text-8xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {profile?.type === 'trial' ? 'school' : 'confirmation_number'}
                </span>
              </div>

              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <span className="inline-block px-4 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-bold tracking-widest uppercase">
                    {getDiscountText()}
                  </span>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface">
                    {profile?.name || 'Coupon'}
                  </h1>
                </div>

                {profile?.description && (
                  <p className="text-lg text-on-surface-variant leading-relaxed">
                    {profile.description}
                  </p>
                )}

                {profile?.classInfoId && (
                  <div className="bg-tertiary-container rounded-lg p-4">
                    <p className="text-sm font-bold text-on-tertiary-container uppercase tracking-wider mb-1">
                      Valid for Class
                    </p>
                    <p className="text-base font-semibold text-on-tertiary-container">
                      {profile.classInfoId.name || 'Class'}
                    </p>
                  </div>
                )}

                {coupon.expiresAt && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-xl">schedule</span>
                    <span className="text-sm font-medium">
                      Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {!coupon.isOwned && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      stars
                    </span>
                    <span className="text-2xl font-black text-on-surface">
                      {coupon.price} points
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {profile?.type && (
            <div className="mb-6 bg-surface-container rounded-lg p-4">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-2">
                Terms & Conditions
              </h3>
              <ul className="text-sm text-on-surface-variant space-y-1 list-disc list-inside">
                <li>Valid for one-time use only</li>
                <li>Cannot be combined with other offers</li>
                <li>Non-transferable and non-refundable</li>
                {coupon.expiresAt && <li>Must be used before expiration date</li>}
              </ul>
            </div>
          )}

          {coupon.isOwned && coupon.quantity > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-on-surface mb-2">
                Quantity to Share
              </label>
              <input
                type="number"
                min="1"
                max={coupon.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(coupon.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-3 rounded-lg bg-surface-container text-on-surface border border-outline-variant focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {shareUrl && (
            <div className="mb-6 bg-primary-container rounded-lg p-4">
              <p className="text-sm font-bold text-on-primary-container mb-2">Share Link Generated!</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded bg-surface-container-lowest text-on-surface text-sm"
                />
                <button
                  onClick={handleCopyShare}
                  className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!isExpired && (
              <button
                onClick={handleAction}
                disabled={loading}
                className="flex-1 bg-primary text-on-primary py-4 rounded-full font-bold text-lg uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : coupon.isOwned ? 'Share Coupon' : 'Purchase'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-4 bg-surface-container text-on-surface rounded-full font-bold text-lg hover:bg-surface-container-high transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CouponDetail;
