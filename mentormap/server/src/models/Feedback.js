import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    actionItems: [String], // mentor -> student
  },
  { timestamps: true }
);
schema.index({ session: 1, from: 1 }, { unique: true });

export default mongoose.model('Feedback', schema);
