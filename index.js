const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// ================= GEMINI =================
async function getGeminiBalances() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiSecret = process.env.GEMINI_API_SECRET;

    if (!apiKey || !apiSecret) return [];

    const payload = {
      request: "/v1/balances",
      nonce: Date.now().toString()
    };

    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64");

    const signature = crypto
      .createHmac("sha384", apiSecret)
      .update(encodedPayload)
      .digest("hex");

    const res = await fetch("https://api.gemini.com/v1/balances", {
      method: "POST",
      headers: {
        "X-GEMINI-APIKEY": apiKey,
        "X-GEMINI-PAYLOAD": encodedPayload,
        "X-GEMINI-SIGNATURE": signature,
        "Content-Type": "text/plain"
      }
    });

    const data = await res.json();
    return data;

  } catch (err) {
    return { error: "gemini failed", details: err.message };
  }
}

// ================= COINBASE =================
async function getCoinbaseBalances() {
  try {
    const apiKey = process.env.COINBASE_API_KEY;
    let privateKey = process.env.COINBASE_API_SECRET;

    if (!apiKey || !privateKey) {
      throw new Error("Missing Coinbase credentials");
    }

    // fix newline issue
    privateKey = privateKey.replace(/\\n/g, "\n");

    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: apiKey,
      sub: apiKey,
      aud: "cdp_service",
      iat: now,
      exp: now + 120
    };

    const token = jwt.sign(payload, privateKey, {
      algorithm: "ES256",
      header: {
        kid: apiKey,
        nonce: crypto.randomBytes(16).toString("hex")
      }
    });

    const res = await fetch("https://api.coinbase.com/api/v3/brokerage/accounts", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    return data;

  } catch (err) {
    return { error: "coinbase failed", details: err.message };
  }
}

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("Crypto backend running ✅");
});

app.get("/sync", async (req, res) => {
  try {
    const gemini = await getGeminiBalances();
    const coinbase = await getCoinbaseBalances();

    res.json({
      gemini,
      coinbase
    });

  } catch (err) {
    res.json({
      error: "sync failed",
      details: err.message
    });
  }
});

// ================= START =================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
