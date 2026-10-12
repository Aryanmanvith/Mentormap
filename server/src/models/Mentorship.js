import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['requested', 'active', 'declined', 'completed'], default: 'requested' },
    message: String,
    matchScore: Number,
    matchReasons: [String],
  },
  { timestamps: true }
);
schema.index({ student: 1, mentor: 1 }, { unique: true });

export default mongoose.model('Mentorship', schema);
