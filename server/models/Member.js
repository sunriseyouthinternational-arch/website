const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const familyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, enum: ['男', '女'], required: true },
  birthDate: { type: Date, required: true }
});

const enrollmentSchema = new mongoose.Schema({
  type: { type: String, enum: ['class', 'activity'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemName: { type: String, required: true },
  enrolledAt: { type: Date, default: Date.now },
  paid: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
});

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    unique: true,
    default: () => `SY${Date.now()}${Math.floor(Math.random() * 1000)}`
  },
  name: { type: String, required: true },
  gender: { type: String, enum: ['男', '女'], required: true },
  birthDate: { type: Date, required: true },
  familyMembers: [familyMemberSchema],
  contact: {
    phone: { type: String },
    mobile: { type: String, required: true },
    lineId: { type: String }
  },
  profilePicture: { type: String, default: '' },
  qrCode: { type: String },
  enrollments: [enrollmentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  bufferCommands: false,
  bufferTimeoutMS: 0,
  autoCreate: false,
  autoIndex: false
});

// Update the updatedAt field before saving
memberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Member', memberSchema);
