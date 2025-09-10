import mongoose from 'mongoose';

export interface IUser {
  _id?: string;
  email: string;
  name: string;
  image?: string;
  provider: 'google' | 'github';
  providerId: string;
  membershipType: 'FREE' | 'PREMIUM' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: null,
  },
  provider: {
    type: String,
    enum: ['google', 'github'],
    required: true,
  },
  providerId: {
    type: String,
    required: true,
  },
  membershipType: {
    type: String,
    enum: ['FREE', 'PREMIUM', 'ADMIN'],
    default: 'FREE',
  },
}, {
  timestamps: true,
});

// 복합 인덱스: provider + providerId 조합은 유일해야 함
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });

// 이메일 인덱스는 스키마에서 unique: true로 이미 생성됨
// UserSchema.index({ email: 1 }); // 중복 제거

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
