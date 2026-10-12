import mongoose from 'mongoose';

const answer = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

// Shared knowledge hub: articles/links and Q&A threads
const schema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['resource', 'question'], default: 'resource' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: String,
    url: String,
    tags: [String],
    answers: [answer],
    flagged: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);
schema.index({ title: 'text', body: 'text', tags: 'text' });

export default mongoose.model('Resource', schema);
