const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      family: 4,
      bufferCommands: false,
    });
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.log('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  aadhar: { type: String, required: true },
  experience: String,
  speciality: String,
  languages: [String],
  verified: { type: Boolean, default: false },
  status: { type: String, default: 'pending' }, // 'pending' | 'verified' | 'rejected'
  createdAt: { type: Date, default: Date.now },
});

const subscriberSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  date: String,
  type: String,
  createdAt: { type: Date, default: Date.now },
});

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  distance: String,
  price: String,
  rating: String,
  type: String,
  available: { type: Boolean, default: true },
  phone: String,
  address: String,
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Guide = mongoose.model('Guide', guideSchema);
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Hotel = mongoose.model('Hotel', hotelSchema);

module.exports = { connectDB, Guide, Subscriber, Hotel };