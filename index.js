import express from "express";
import cors from "cors";
import axios from "axios";
import crypto from "crypto";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// ===== ENV VARIABLES =====
const COINBASE_API_KEY = process.env.COINBASE_API_KEY;

// convert \n → real line breaks
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET
  ? process.env.COINBASE_API_SECRET.replace(/\\n/g, "\n")
  : null;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_SECRET = process.env.GEMINI_API_SECRET;

// ===== COINBASE FUNCTION (FIXED) =====
async function getCoinbaseBalances() {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "GET";
    const requestPath = "/api/v3/brokerage/accounts";

    const message = timestamp + method + requestPath;

    const sign = crypto.createSign("SHA256");
    sign.update(message);
    sign.end();

    const signature = sign.sign(
      {
        key: COINBASE_API_SECRET,
        format: "pem",
      },
      "base64"
    );

    const response = await axios.get(
      "https://api.coinbase.com" + requestPath,
      {
        headers: {
          "CB-ACCESS-KEY": COINBASE_API_KEY,
          "CB-ACCESS-SIGN": signature,
          "CB-ACCESS-TIMESTAMP": timestamp,
          "CB-ACCESS-PASSPHRASE": "", // required
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.accounts || [];
  } catch (err) {
    return {
      error: "coinbase failed",
      details: err.response?.data || err.message,
    };
  }
}

// ===== GEMINI FUNCTION =====
async function getGeminiBalances() {
  try {
    const url = "/v1/balances";

    const payload = {
      request: url,
      nonce: Date.now().toString(),
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      "base64"
    );

    const signature = crypto
      .createHmac("sha384", GEMINI_API_SECRET)
      .update(encodedPayload)
      .digest("hex");

    const response = await axios.post(
      "https://api.gemini.com" + url,
      {},
      {
        headers: {
          "X-GEMINI-APIKEY": GEMINI_API_KEY,
          "X-GEMINI-PAYLOAD": encodedPayload,
          "X-GEMINI-SIGNATURE": signature,
          "Content-Type": "text/plain",
        },
      }
    );

    return response.data;
  } catch (err) {
    return {
      error: "gemini failed",
      details: err.response?.data || err.message,
    };
  }
}

// ===== ROUTE =====
app.get("/sync", async (req, res) => {
  const [coinbase, gemini] = await Promise.all([
    getCoinbaseBalances(),
    getGeminiBalances(),
  ]);

  res.json({
    coinbase,
    gemini,
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
