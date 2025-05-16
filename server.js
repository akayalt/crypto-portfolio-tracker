import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/crypto", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const totalValueSchema = new mongoose.Schema({
  total_try: Number,
  timestamp: { type: Date, default: Date.now },
});
const TotalValue = mongoose.model("TotalValue", totalValueSchema);

app.get("/history", async (req, res) => {
  try {
    const history = await TotalValue.find({}).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW endpoint: latest total_try entry
app.get("/latest", async (req, res) => {
  try {
    const latest = await TotalValue.findOne({}).sort({ timestamp: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
