import mongoose, { Schema, Document } from 'mongoose';

// The Document interface defines the properties on the document
export interface IUser extends Document {
  companyId: mongoose.Schema.Types.ObjectId;
  email: string;
  hashedPassword?: string;
  name?: string;
  image?: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VENDOR';
}

// The Mongoose Schema defines the structure of the document in the database
const UserSchema: Schema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true // Index on companyId for faster lookups
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  // The password hash should not be returned by default in queries
  hashedPassword: { type: String, required: true, select: false },
  name: { type: String },
  image: { type: String },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'MEMBER', 'VENDOR'],
    required: true
  },
}, {
  timestamps: true,
});

// Create a compound index to ensure that a user's email is unique per company
UserSchema.index({ companyId: 1, email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
