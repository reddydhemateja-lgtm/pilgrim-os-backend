const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
const uri = "mongodb://dhematejareddy_db_user:30eYKcgEvj80C1Cd@ac-ysgjjhh-shard-00-00.dyhkebq.mongodb.net:27017,ac-ysgjjhh-shard-00-01.dyhkebq.mongodb.net:27017,ac-ysgjjhh-shard-00-02.dyhkebq.mongodb.net:27017/pilgrimosd?ssl=true&replicaSet=atlas-vcov9z-shard-0&authSource=admin&appName=Cluster0";
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.log('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Collections/Models

// 1. Guide Registration
const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  aadhar: { type: String, required: true },
  experience: String,
  speciality: String,
  languages: [String],
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// 2. Notification Subscribers
const subscriberSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  date: String,
  type: String,
  createdAt: { type: Date, default: Date.now },
});

// 3. Hotel Listings
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