const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const TTD_NEWS_URL = 'https://news.tirumala.org/category/darshan/';

async function scrapeDarshan() {
  try {
    console.log('🔍 Fetching TTD news data...');

    const response = await axios.get(TTD_NEWS_URL, {
      timeout: 15000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    const $ = cheerio.load(response.data);
    const articles = [];

    // Read latest darshan news articles
    $('.entry-content, .post-content, article').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 50) {
        articles.push(text);
      }
    });

    // Try to extract key data from articles
    const latestArticle = articles[0] || '';

    // Extract wait time
    let waitTime = 'Check news.tirumala.org';
    const waitMatch = latestArticle.match(/(\d+[-–]\d+|\d+)\s*H(ours?)?/i);
    if (waitMatch) waitTime = waitMatch[0] + ' hours';

    // Extract total pilgrims
    let totalPilgrims = 'N/A';
    const pilgrimsMatch = latestArticle.match(/(\d{2,3},\d{3})/);
    if (pilgrimsMatch) totalPilgrims = pilgrimsMatch[0];

    // Extract queue location
    let queueLocation = 'Check news.tirumala.org';
    if (latestArticle.includes('Silathoranam')) queueLocation = 'Outside Silathoranam';
    if (latestArticle.includes('Vaikuntam')) queueLocation = 'Vaikuntam Queue Complex';

    if (articles.length > 0) {
      console.log(`✅ TTD News fetched — Pilgrims: ${totalPilgrims}, Wait: ${waitTime}`);
      return buildSlots(waitTime, totalPilgrims, queueLocation);
    }

    return getFallbackData();

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return getFallbackData();
  }
}

function buildSlots(waitTime, totalPilgrims, queueLocation) {
  return [
    {
      time: '3:00 AM - 6:00 AM',
      type: 'Sarva Darshan',
      tokens: 'Less crowd — Best time to visit',
      available: true,
      waitTime,
      totalPilgrims,
      queueLocation,
      source: 'TTD News',
    },
    {
      time: '6:00 AM - 9:00 AM',
      type: 'Sarva Darshan',
      tokens: 'Moderate crowd',
      available: true,
      waitTime,
      totalPilgrims,
      queueLocation,
      source: 'TTD News',
    },
    {
      time: '9:00 AM - 12:00 PM',
      type: 'Sarva Darshan',
      tokens: 'Peak hours — Heavy crowd',
      available: true,
      waitTime,
      totalPilgrims,
      queueLocation,
      source: 'TTD News',
    },
    {
      time: '12:00 PM - 3:00 PM',
      type: 'Special Entry ₹300',
      tokens: 'Book at ttdevasthanams.ap.gov.in',
      available: true,
      waitTime: '1-2 hours',
      totalPilgrims,
      queueLocation,
      source: 'TTD News',
    },
    {
      time: '3:00 PM - 6:00 PM',
      type: 'Sarva Darshan',
      tokens: 'Heavy crowd expected',
      available: true,
      waitTime,
      totalPilgrims,
      queueLocation,
      source: 'TTD News',
    },
    {
      time: '6:00 PM - 9:00 PM',
      type: 'Sarva Darshan',
      tokens: 'Evening — Moderate crowd',
      available: true,
      waitTime,
      totalPilgrims,
      queueLocation,
      source: 'TTD News',
    },
  ];
}

function getFallbackData() {
  return buildSlots('Check news.tirumala.org', 'N/A', 'Check news.tirumala.org');
}

module.exports = { scrapeDarshan };