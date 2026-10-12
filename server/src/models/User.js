import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    start: { type: String, required: true }, // "HH:MM"
    end: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'mentor', 'admin'], required: true },
    // Profile (slide 4, step 01: interests, skills, industry, target role, availability)
    headline: String,
    bio: String,
    industry: String,
    interests: [String],
    skills: [String],
    targetRole: String, // students
    currentRole: String, // mentors
    company: String,
    gradYear: Number,
    availability: [availabilitySchema], // mentors
    maxMentees: { type: Number, default: 3 },
    // Institution oversight
    verified: { type: Boolean, default: false }, // mentors need admin verification
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.toSafe = function () {
  const o = this.toObject();
  delete o.passwordHash;
  return o;
};

export default mongoose.model('User', userSchema);
