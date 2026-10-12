import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    target: String,
    meta: Object,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', schema);
