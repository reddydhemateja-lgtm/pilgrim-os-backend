const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();
const { scrapeDarshan } = require('./scraper');
const { connectDB, Guide, Subscriber, Hotel } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Store scraped data in memory
let darshanData = [];
let lastUpdated = null;

// Scrape TTD every 10 seconds
cron.schedule('*/10 * * * * *', async () => {
  try {
    const data = await scrapeDarshan();
    if (data && data.length > 0) {
      darshanData = data;
      lastUpdated = new Date().toISOString();
      console.log(`✅ Darshan data updated at ${lastUpdated}`);
    }
  } catch (err) {
    console.log('⚠️ Scrape failed, keeping last known data');
  }
});

// ── DARSHAN ROUTES ──
app.get('/', (req, res) => {
  res.json({ status: 'PilgrimOS Backend Running 🛕' });
});

app.get('/api/darshan', (req, res) => {
  if (darshanData.length === 0) {
    return res.json({
      success: false,
      message: 'Fetching live data, please wait...',
      data: [],
      lastUpdated: null,
    });
  }
  res.json({
    success: true,
    data: darshanData,
    lastUpdated,
    source: 'TTD News',
  });
});

// ── GUIDE ROUTES ──
app.post('/api/guides/register', async (req, res) => {
  try {
    const { name, phone, aadhar, experience, speciality, languages } = req.body;
    const guide = new Guide({ name, phone, aadhar, experience, speciality, languages });
    await guide.save();
    console.log(`✅ New guide registered: ${name}`);
    res.json({ success: true, message: 'Application submitted successfully!' });
  } catch (error) {
    console.log('❌ Guide registration error:', error.message);
    res.json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

app.get('/api/guides', async (req, res) => {
  try {
    const guides = await Guide.find({ status: 'verified' });
    res.json({ success: true, data: guides });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/guides/all', async (req, res) => {
  try {
    const guides = await Guide.find().maxTimeMS(20000);
    res.json({ success: true, total: guides.length, data: guides });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ── SUBSCRIBER ROUTES ──
app.post('/api/subscribe', async (req, res) => {
  try {
    const { phone, date, type } = req.body;
    const subscriber = new Subscriber({ phone, date, type });
    await subscriber.save();
    console.log(`✅ New subscriber: ${phone}`);
    res.json({ success: true, message: 'You will be notified when tickets release!' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ── HOTEL ROUTES ──
app.post('/api/hotels/register', async (req, res) => {
  try {
    const { name, distance, price, rating, type, phone, address } = req.body;
    const hotel = new Hotel({ name, distance, price, rating, type, phone, address });
    await hotel.save();
    console.log(`✅ New hotel registered: ${name}`);
    res.json({ success: true, message: 'Hotel listed successfully!' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// ── ADMIN ROUTES ──
// GET all guides (admin only)
app.get('/api/admin/guides', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const guides = await Guide.find().sort({ createdAt: -1 });
    res.json({ success: true, total: guides.length, data: guides });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// PATCH verify / reject / reset a guide
app.patch('/api/admin/guides/:id', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { status } = req.body; // 'verified' | 'rejected' | 'pending'
    const guide = await Guide.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, data: guide });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// GET all subscribers (admin only)
app.get('/api/admin/subscribers', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json({ success: true, total: subscribers.length, data: subscribers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🛕 PilgrimOS Backend running on http://localhost:${PORT}`);
  console.log(`📡 Scraping TTD data every 10 seconds...`);
});