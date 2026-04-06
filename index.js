import express from "express";
import cors from "cors";
import axios from "axios";
import crypto from "crypto";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// ==========================
// ENV VARIABLES
// ==========================
const CB_KEY = process.env.COINBASE_API_KEY;

// 🔥 FIXED LINE (IMPORTANT)
const CB_SECRET = process.env.COINBASE_API_SECRET.replace(/\\n/g, "\n");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SECRET = process.env.GEMINI_API_SECRET;

// ==========================
// COINBASE FUNCTION (FIXED)
// ==========================
async function getCoinbaseBalances() {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const requestPath = "/api/v3/brokerage/accounts";

    const message = timestamp + method + requestPath;

    const sign = crypto
      .createSign("SHA256")
      .update(message)
      .sign(CB_SECRET, "base64");

    const res = await axios.get(
      "https://api.coinbase.com" + requestPath,
      {
        headers: {
          "CB-ACCESS-KEY": CB_KEY,
          "CB-ACCESS-SIGN": sign,
          "CB-ACCESS-TIMESTAMP": timestamp,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.accounts;
  } catch (err) {
    return {
      error: "coinbase failed",
      details: err.response?.data || err.message,
    };
  }
}

// ==========================
// GEMINI FUNCTION
// ==========================
async function getGeminiBalances() {
  try {
    const payload = {
      request: "/v1/balances",
      nonce: Date.now().toString(),
    };

    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");

    const signature = crypto
      .createHmac("sha384", GEMINI_SECRET)
      .update(encoded)
      .digest("hex");

    const res = await axios.post(
      "https://api.gemini.com/v1/balances",
      null,
      {
        headers: {
          "X-GEMINI-APIKEY": GEMINI_KEY,
          "X-GEMINI-PAYLOAD": encoded,
          "X-GEMINI-SIGNATURE": signature,
        },
      }
    );

    return res.data;
  } catch (err) {
    return {
      error: "gemini failed",
      details: err.response?.data || err.message,
    };
  }
}

// ==========================
// ROUTES
// ==========================
app.get("/", (req, res) => {
  res.send("Crypto backend running 🚀");
});

app.get("/sync", async (req, res) => {
  const [coinbase, gemini] = await Promise.all([
    getCoinbaseBalances(),
    getGeminiBalances(),
  ]);

  res.json({ coinbase, gemini });
});

// ==========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
