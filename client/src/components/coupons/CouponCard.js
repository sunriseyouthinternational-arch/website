import React from 'react';

function CouponCard({ coupon, isForSale, onClick }) {
  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
  const profile = isForSale ? coupon.couponProfileId : coupon.couponProfile;

  const getDiscountText = () => {
    if (profile?.type === 'discount') {
      return `${profile.discountPercent}% OFF`;
    }
    if (profile?.type === 'trial') {
      return 'FREE TRIAL';
    }
    return 'COUPON';
  };

  const getExpiryText = () => {
    if (!coupon.expiresAt) return null;
    const date = new Date(coupon.expiresAt);
    return `Expires ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-surface-container-lowest rounded-xl p-6 shadow-[0_4px_20px_0_rgba(32,28,0,0.06)] cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_8px_30px_0_rgba(32,28,0,0.1)] ${
        isExpired ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-surface-container rounded-lg flex items-center justify-center flex-shrink-0">
          <span
            className="material-symbols-outlined text-3xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {profile?.type === 'trial' ? 'school' : 'confirmation_number'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-on-surface leading-tight">
              {profile?.name || 'Coupon'}
            </h3>
            {isExpired && (
              <span className="px-2 py-1 bg-error-container text-on-error-container rounded text-xs font-bold uppercase">
                Expired
              </span>
            )}
          </div>

          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-bold tracking-wider uppercase">
              {getDiscountText()}
            </span>
          </div>

          {profile?.description && (
            <p className="text-sm text-on-surface-variant mb-2 line-clamp-2">
              {profile.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            {getExpiryText() && (
              <span className="text-on-surface-variant font-medium">
                {getExpiryText()}
              </span>
            )}
            {isForSale && (
              <span className="font-bold text-primary">
                {coupon.price} points
              </span>
            )}
          </div>

          {coupon.quantity > 1 && (
            <div className="mt-2 text-xs font-bold text-on-surface-variant">
              Qty: {coupon.quantity}
            </div>
          )}
        </div>
      </div>

      {!isExpired && (
        <div className="absolute top-4 right-4">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">
            chevron_right
          </span>
        </div>
      )}
    </div>
  );
}

export default CouponCard;
