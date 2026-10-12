import mongoose from 'mongoose';

const milestone = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  dueDate: Date,
});

const schema = new mongoose.Schema(
  {
    mentorship: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentorship', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    milestones: [milestone],
    status: { type: String, enum: ['active', 'achieved', 'dropped'], default: 'active' },
  },
  { timestamps: true }
);

schema.virtual('progress').get(function () {
  if (!this.milestones.length) return this.status === 'achieved' ? 100 : 0;
  return Math.round((this.milestones.filter((m) => m.done).length / this.milestones.length) * 100);
});
schema.set('toJSON', { virtuals: true });

export default mongoose.model('Goal', schema);
