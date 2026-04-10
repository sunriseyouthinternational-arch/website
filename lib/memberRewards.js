const FREE_CLASS_COUPON_NAME = '免費課程券 / Free Class Coupon';
const FREE_CLASS_COUPON_DESCRIPTION = '完成 3 個月內 12 堂課獎勵 / Reward for completing 12 classes within 3 months';
const POINTS_PER_NTD = 1;
const REGISTRATION_POINTS = 50;
const REFERRAL_REGISTRATION_POINTS = 10;
const REFERRAL_CLASS_COMPLETION_POINTS = 90;
const VOLUNTEERING_ACTIVITY_POINTS = 30;
const ATTENDANCE_REWARD_CLASS_COUNT = 12;
const ATTENDANCE_REWARD_WINDOW_DAYS = 90;

function hasReward(member, key) {
  return Boolean(member.rewardHistory?.some((entry) => entry.key === key));
}

function addRewardHistory(member, reward) {
  if (!member.rewardHistory) {
    member.rewardHistory = [];
  }

  member.rewardHistory.push({
    key: reward.key,
    type: reward.type,
    points: reward.points || 0,
    itemId: reward.itemId || undefined,
    relatedMemberId: reward.relatedMemberId || undefined,
    description: reward.description || '',
    createdAt: reward.createdAt || new Date()
  });
}

function awardPoints(member, reward) {
  if (!member || !reward?.key || !reward?.points || reward.points <= 0 || hasReward(member, reward.key)) {
    return false;
  }

  member.points = (member.points || 0) + reward.points;
  addRewardHistory(member, reward);
  return true;
}

function redeemPoints(member, reward) {
  if (!member || !reward?.key || !reward?.points || reward.points <= 0 || hasReward(member, reward.key)) {
    return 0;
  }

  const redeemablePoints = Math.min(member.points || 0, reward.points);
  if (redeemablePoints <= 0) {
    return 0;
  }

  member.points = (member.points || 0) - redeemablePoints;
  addRewardHistory(member, {
    ...reward,
    points: -redeemablePoints
  });

  return redeemablePoints;
}

function upsertEnrollment(member, enrollmentData) {
  const enrollment = member.enrollments.find(
    (entry) => entry.type === enrollmentData.type && entry.itemId.toString() === enrollmentData.itemId.toString()
  );

  if (enrollment) {
    Object.assign(enrollment, enrollmentData);
    return enrollment;
  }

  member.enrollments.push(enrollmentData);
  return member.enrollments[member.enrollments.length - 1];
}

function updateEnrollmentStatus(member, type, itemId, status) {
  const enrollment = member.enrollments.find(
    (entry) => entry.type === type && entry.itemId.toString() === itemId.toString()
  );

  if (!enrollment) {
    return null;
  }

  enrollment.status = status;
  enrollment.completedAt = status === 'completed' ? new Date() : undefined;
  return enrollment;
}

function awardFreeClassCoupon(member, rewardKey) {
  if (!member || hasReward(member, rewardKey)) {
    return false;
  }

  member.coupons.push({
    type: 'discount',
    discountPercent: 100,
    name: FREE_CLASS_COUPON_NAME,
    description: FREE_CLASS_COUPON_DESCRIPTION,
    quantity: 1,
    usedCount: 0
  });

  addRewardHistory(member, {
    key: rewardKey,
    type: 'attendance_coupon_reward',
    points: 0,
    description: FREE_CLASS_COUPON_DESCRIPTION
  });

  return true;
}

function maybeAwardAttendanceCoupon(member) {
  if (!member) {
    return false;
  }

  const cutoff = new Date(Date.now() - ATTENDANCE_REWARD_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const completedClassEnrollments = (member.enrollments || [])
    .filter((entry) => entry.type === 'class' && entry.status === 'completed' && entry.completedAt && new Date(entry.completedAt) >= cutoff)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  const existingRewards = (member.rewardHistory || []).filter(
    (entry) => entry.type === 'attendance_coupon_reward' && entry.createdAt && new Date(entry.createdAt) >= cutoff
  ).length;

  const eligibleRewards = Math.floor(completedClassEnrollments.length / ATTENDANCE_REWARD_CLASS_COUNT);

  if (eligibleRewards <= existingRewards) {
    return false;
  }

  const milestoneEnrollment = completedClassEnrollments[(eligibleRewards * ATTENDANCE_REWARD_CLASS_COUNT) - 1];
  if (!milestoneEnrollment) {
    return false;
  }

  return awardFreeClassCoupon(member, `attendance-coupon:${milestoneEnrollment.itemId.toString()}:${eligibleRewards}`);
}

module.exports = {
  ATTENDANCE_REWARD_CLASS_COUNT,
  ATTENDANCE_REWARD_WINDOW_DAYS,
  FREE_CLASS_COUPON_DESCRIPTION,
  FREE_CLASS_COUPON_NAME,
  POINTS_PER_NTD,
  REFERRAL_CLASS_COMPLETION_POINTS,
  REFERRAL_REGISTRATION_POINTS,
  REGISTRATION_POINTS,
  VOLUNTEERING_ACTIVITY_POINTS,
  awardPoints,
  hasReward,
  maybeAwardAttendanceCoupon,
  redeemPoints,
  updateEnrollmentStatus,
  upsertEnrollment
};
