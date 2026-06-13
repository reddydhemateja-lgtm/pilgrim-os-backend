const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { scrapeDarshan } = require('./scraper');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

// API Routes
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
    source: 'TTD Official Website',
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    lastUpdated,
    totalSlots: darshanData.length,
  });
});

app.listen(PORT, () => {
  console.log(`🛕 PilgrimOS Backend running on http://localhost:${PORT}`);
  console.log(`📡 Scraping TTD data every 10 seconds...`);
});