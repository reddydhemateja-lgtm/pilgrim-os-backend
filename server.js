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

    if (!name || name.trim().length < 2)
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
    if (!phone || !/^[6-9]\d{9}$/.test(phone))
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    if (!aadhar || !/^\d{12}$/.test(aadhar))
      return res.status(400).json({ success: false, message: 'Aadhar must be exactly 12 digits.' });

    const existingPhone = await Guide.findOne({ phone });
    if (existingPhone)
      return res.status(400).json({ success: false, message: 'This phone number is already registered.' });

    const existingAadhar = await Guide.findOne({ aadhar });
    if (existingAadhar)
      return res.status(400).json({ success: false, message: 'This Aadhar is already registered.' });

    const guide = new Guide({ name: name.trim(), phone, aadhar, experience, speciality, languages });
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
app.get('/api/hotels', async (req, res) => {
  try {
    const hotels = await Hotel.find().sort({ distance: 1 });
    res.json({ success: true, data: hotels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

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
app.get('/api/admin/guides', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    const guides = await Guide.find().sort({ createdAt: -1 });
    res.json({ success: true, total: guides.length, data: guides });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.patch('/api/admin/guides/:id', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { status } = req.body;
    const guide = await Guide.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: guide });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/admin/subscribers', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorized' });
  try {
    const subscribers = await Subscriber.find().sort({ createdAt: -1 });
    res.json({ success: true, total: subscribers.length, data: subscribers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Seed real Tirupati hotels (run once)
app.post('/api/admin/seed-hotels', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(401).end();
  try {
    await Hotel.insertMany([
      { name: 'TTD Srinivasam Guest House', distance: '0.2', price: '800', rating: '4.5', type: 'Budget', available: true, phone: '0877-2264000', address: 'Alipiri Road, Tirupati' },
      { name: 'Hotel Annamaiah', distance: '0.3', price: '950', rating: '4.1', type: 'Budget', available: true, phone: '0877-2265000', address: 'Govinda Raja Street, Tirupati' },
      { name: 'Hotel Bliss', distance: '0.5', price: '1200', rating: '4.2', type: 'Budget', available: true, phone: '0877-2287777', address: 'Tilak Road, Tirupati' },
      { name: 'Hotel Minerva', distance: '0.8', price: '1800', rating: '4.0', type: 'Mid-range', available: false, phone: '0877-2225566', address: 'TP Area, Tirupati' },
      { name: 'Sindoori Hotel', distance: '1.0', price: '2200', rating: '4.3', type: 'Mid-range', available: true, phone: '0877-2289900', address: 'Leela Mahal Road, Tirupati' },
      { name: 'Marasa Sarovar Premiere', distance: '1.2', price: '4500', rating: '4.8', type: 'Premium', available: true, phone: '0877-6677788', address: 'Leela Mahal Circle, Tirupati' },
    ]);
    res.json({ success: true, message: 'Hotels seeded!' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🛕 PilgrimOS Backend running on http://localhost:${PORT}`);
  console.log(`📡 Scraping TTD data every 10 seconds...`);
});