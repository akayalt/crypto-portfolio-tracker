const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

// CORS to allow frontend requests
app.use(cors());

// SQLite DB
const db = new sqlite3.Database('./data.db');
db.run(`CREATE TABLE IF NOT EXISTS total_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  total_try REAL
)`);

// Coin holdings
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

// Fetch & store total TRY value
async function fetchAndStoreTotalTry() {
  try {
    const ids = Object.keys(holdings).join(',');
    const priceRes = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
      params: {
        vs_currency: 'usd',
        ids
      }
    });

    const exchangeRes = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: 'usd',
        vs_currencies: 'try'
      }
    });

    const usdToTry = exchangeRes.data.usd.try;
    let totalTry = 0;

    priceRes.data.forEach(coin => {
      const id = coin.id;
      const priceUsd = coin.current_price;
      const valueUsd = holdings[id] * priceUsd;
      totalTry += valueUsd * usdToTry;
    });

    const timestamp = new Date().toISOString();
    db.run(`INSERT INTO total_values (timestamp, total_try) VALUES (?, ?)`, [timestamp, totalTry]);

    console.log(`[${timestamp}] Total TRY: ₺${totalTry.toFixed(2)}`);
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}

// Fetch every 10 seconds
setInterval(fetchAndStoreTotalTry, 10000);
fetchAndStoreTotalTry();

// API to get historical data
app.get('/history', (req, res) => {
  db.all(`SELECT * FROM total_values ORDER BY timestamp ASC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
