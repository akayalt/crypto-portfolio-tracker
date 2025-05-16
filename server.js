const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'your-mongodb-uri-here';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Mongoose schema and model
const totalValueSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  total_try: { type: Number, required: true }
});

const TotalValue = mongoose.model('TotalValue', totalValueSchema);

// Your coin holdings (same as before)
const holdings = {
  "algorand": 165.5111,
  "cosmos": 1.5111,
  "audius": 208.4357,
  "bitcoin": 0.03000265,
  "compound-governance-token": 0.03095203,
  "dogecoin": 100.0,
  "polkadot": 0.3309,
  "eos": 2.56,
  "ethereum": 0.31216363,
  "filecoin": 0.1479,
  "hedera-hashgraph": 2415.11,
  "decentraland": 11.6838,
  "neo": 0.247,
  "pepe": 1013000.0,
  "shiba-inu": 2108063.0,
  "ripple": 580.6248,
  "tezos": 1.610784
};

// Fetch and store total TRY value
async function fetchAndStoreTotalTry() {
  try {
    const ids = Object.keys(holdings).join(',');
    const priceRes = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: { vs_currency: 'usd', ids }
    });
    const exchangeRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: 'usd', vs_currencies: 'try' }
    });

    const usdToTry = exchangeRes.data.usd.try;
    let totalTry = 0;

    priceRes.data.forEach(coin => {
      const priceUsd = coin.current_price;
      totalTry += holdings[coin.id] * priceUsd * usdToTry;
    });

    const totalValueEntry = new TotalValue({
      timestamp: new Date(),
      total_try: totalTry
    });

    await totalValueEntry.save();

    console.log(`[${totalValueEntry.timestamp.toISOString()}] Total TRY: ₺${totalTry.toFixed(2)}`);
  } catch (err) {
    console.error('Fetch and store failed:', err.message);
  }
}

// Fetch every 10 seconds
setInterval(fetchAndStoreTotalTry, 10000);
fetchAndStoreTotalTry();

// API endpoint to get historical data
app.get('/history', async (req, res) => {
  try {
    const history = await TotalValue.find({}).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
