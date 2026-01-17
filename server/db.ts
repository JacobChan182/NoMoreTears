import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-connection-string-here';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Atlas connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

export default connectDB;
