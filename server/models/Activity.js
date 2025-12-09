const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  memberName: { type: String, required: true },
  enrolledAt: { type: Date, default: Date.now },
  paid: { type: Boolean, default: false }
});

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  banner: { type: String },
  time: { type: String, required: true },
  cost: { type: Number, required: true },
  teacher: { type: String, required: true },
  maxParticipants: { type: Number, required: true },
  currentParticipants: { type: Number, default: 0 },
  participants: [participantSchema],
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

activitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.currentParticipants = this.participants.length;
  next();
});

module.exports = mongoose.model('Activity', activitySchema);
