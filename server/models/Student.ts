import mongoose, { Schema } from 'mongoose';
import { IRewindEvent } from './RewindEvent';

export interface ILectureProgress {
  lectureId: string;
  lectureTitle: string;
  courseId: string;
  assignedAt: Date;
  rewindEvents: IRewindEvent[];
  lastAccessedAt?: Date;
}

export interface IStudent {
  userId: string;
  pseudonymId: string;
  courseIds: string[];
  cluster?: string;
  lectures: ILectureProgress[];
  createdAt: Date;
  updatedAt: Date;
}

const LectureProgressSchema = new Schema<ILectureProgress>({
  lectureId: { type: String, required: true },
  courseId: { type: String, required: true },
  lectureTitle: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  rewindEvents: { type: Schema.Types.Mixed, default: [] },
  lastAccessedAt: { type: Date },
});

const StudentSchema = new Schema<IStudent>({
  userId: { type: String, required: true, unique: true },
  pseudonymId: { type: String, required: true, unique: true },
  courseIds: { type: [String], default: [] },
  cluster: { type: String },
  lectures: { type: [LectureProgressSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

StudentSchema.pre('save', function(this: IStudent) {
  this.updatedAt = new Date();
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
