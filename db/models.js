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
    paid: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

memberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Class Schema
const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  banner: { type: String },
  time: { type: String, required: true },
  daysOfWeek: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  cost: { type: Number, required: true },
  teacher: { type: String, required: true },
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

classSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.currentParticipants = this.participants.length;
  next();
});

// Activity Schema
const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  banner: { type: String },
  time: { type: String, required: true },
  cost: { type: Number, required: true },
  teacher: { type: String, required: true },
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

// Export models
module.exports = {
  Admin: mongoose.models.Admin || mongoose.model('Admin', adminSchema),
  Member: mongoose.models.Member || mongoose.model('Member', memberSchema),
  Class: mongoose.models.Class || mongoose.model('Class', classSchema),
  Activity: mongoose.models.Activity || mongoose.model('Activity', activitySchema)
};
