const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Member Schema
const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    unique: true,
    required: true
  },
  name: { type: String }, // Optional until registration is completed
  englishAlias: { type: String },
  gender: { type: String, enum: ['男', '女'] }, // Optional until registration is completed
  birthDate: { type: Date }, // Optional until registration is completed
  familyMembers: [{
    name: { type: String, required: true },
    englishAlias: { type: String },
    gender: { type: String, enum: ['男', '女'], required: true },
    birthDate: { type: Date, required: true }
  }],
  contact: {
    phone: { type: String },
    mobile: { type: String },
    lineId: { type: String }
  },
  line: {
    userId: { type: String, unique: true, sparse: true },
    displayName: { type: String },
    pictureUrl: { type: String },
    richMenuId: { type: String },
    linkedAt: { type: Date }
  },
  registrationToken: { type: String, unique: true, sparse: true },
  registrationTokenExpires: { type: Date },
  registrationCompleted: { type: Boolean, default: false },
  sessionToken: { type: String, unique: true, sparse: true },
  sessionTokenExpires: { type: Date },
  referralCode: { type: String, unique: true, sparse: true }, // This member's unique referral code
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }, // Member who referred this person
  points: { type: Number, default: 0 }, // Membership points for gift redemption
  profilePicture: { type: String, default: '' },
  qrCode: { type: String },
  enrollments: [{
    type: { type: String, enum: ['class', 'activity'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemName: { type: String, required: true },
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
  }],
  coupons: [{
    type: { type: String, enum: ['trial', 'discount'], required: true },
    classInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInfo' }, // Required for trial coupons
    discountPercent: { type: Number }, // Required for discount coupons
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String }, // Base64 or file path
    quantity: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    expiryDate: { type: Date }, // Optional expiry date
    createdAt: { type: Date, default: Date.now }
  }],
  pendingCouponToken: { type: String }, // Token for coupon to be claimed after registration
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

memberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for faster queries
memberSchema.index({ memberId: 1 });
memberSchema.index({ 'contact.lineId': 1 });
memberSchema.index({ 'line.userId': 1 });
memberSchema.index({ registrationToken: 1 });
memberSchema.index({ sessionToken: 1 });
memberSchema.index({ referralCode: 1 });

// ClassInfo Schema - General information about a class type
const classInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  banner: { type: String },
  cost: { type: Number, required: true },
  maxParticipants: { type: Number, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

classInfoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Class Schema (Host Class) - Actual class instance with teacher and schedule
const classSchema = new mongoose.Schema({
  classInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInfo', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // Reference to Teacher model
  teacher: { type: String, required: true }, // Keep for backward compatibility and display name
  time: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String },
  currentParticipants: { type: Number, default: 0 },
  participants: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    enrolledAt: { type: Date, default: Date.now },
    paid: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

classSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.currentParticipants = this.participants.length;
  next();
});

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  bio: { type: String },
  specialties: { type: String },
  education: { type: String },
  phone: { type: String },
  lineId: { type: String },
  photo: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

teacherSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Activity Schema
const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  banner: { type: String },
  date: { type: Date }, // Activity date
  time: { type: String, required: true },
  location: { type: String },
  cost: { type: Number, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // Reference to Teacher model
  teacher: { type: String, required: true }, // Keep for backward compatibility and display name
  maxParticipants: { type: Number, required: true },
  currentParticipants: { type: Number, default: 0 },
  participants: [{
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    enrolledAt: { type: Date, default: Date.now },
    paid: { type: Boolean, default: false }
  }],
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

activitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.currentParticipants = this.participants.length;
  next();
});

// Coupon Share Token Schema - For shareable coupon links
const couponShareTokenSchema = new mongoose.Schema({
  token: { type: String, unique: true, required: true },
  couponData: {
    type: { type: String, enum: ['trial', 'discount'], required: true },
    classInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInfo' },
    discountPercent: { type: Number },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    expiryDate: { type: Date }
  },
  senderMemberId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderCouponId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to sender's specific coupon
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }, // Link expires after 7 days
  claimedBy: { type: String }, // Member ID who claimed it
  claimedAt: { type: Date },
  status: { type: String, enum: ['pending', 'claimed', 'expired'], default: 'pending' }
});

// Add indexes for faster coupon share token queries
couponShareTokenSchema.index({ token: 1 });
couponShareTokenSchema.index({ senderMemberId: 1 });
couponShareTokenSchema.index({ status: 1 });
couponShareTokenSchema.index({ expiresAt: 1 });

const couponProfileSchema = new mongoose.Schema({
  type: { type: String, enum: ['trial', 'discount'], required: true },
  classInfoId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassInfo' },
  discountPercent: { type: Number },
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

couponProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const couponForSaleSchema = new mongoose.Schema({
  couponProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CouponProfile', required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: -1 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

couponForSaleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = {
  Admin: mongoose.models.Admin || mongoose.model('Admin', adminSchema),
  Member: mongoose.models.Member || mongoose.model('Member', memberSchema),
  ClassInfo: mongoose.models.ClassInfo || mongoose.model('ClassInfo', classInfoSchema),
  Class: mongoose.models.Class || mongoose.model('Class', classSchema),
  Activity: mongoose.models.Activity || mongoose.model('Activity', activitySchema),
  Teacher: mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema),
  CouponShareToken: mongoose.models.CouponShareToken || mongoose.model('CouponShareToken', couponShareTokenSchema),
  CouponProfile: mongoose.models.CouponProfile || mongoose.model('CouponProfile', couponProfileSchema),
  CouponForSale: mongoose.models.CouponForSale || mongoose.model('CouponForSale', couponForSaleSchema)
};
