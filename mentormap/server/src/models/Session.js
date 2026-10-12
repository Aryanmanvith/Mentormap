import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    mentorship: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentorship', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    agenda: String,
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    meetingLink: String,
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    notes: String,
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);
schema.index({ mentor: 1, start: 1 });
schema.index({ student: 1, start: 1 });

export default mongoose.model('Session', schema);
