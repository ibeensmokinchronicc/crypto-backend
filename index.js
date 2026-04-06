const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const crypto = require("crypto");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// ================= GEMINI =================
async function getGeminiBalances() {
  try {
    const res = await fetch("https://api.gemini.com/v1/balances");
    const data = await res.json();
    return data;
  } catch (err) {
    console.log("Gemini error:", err);
    return [];
  }
}

// ================= COINBASE =================
async function getCoinbaseBalances() {
  try {
    const apiKey = process.env.COINBASE_API_KEY;

    // 🔥 FIXED KEY HANDLING
    let privateKey = process.env.COINBASE_API_SECRET;
    if (!privateKey) throw new Error("Missing private key");

    // convert \\n → real new lines
    privateKey = privateKey.replace(/\\n/g, "\n");

    const timestamp = Math.floor(Date.now() / 1000);
    const method = "GET";
    const path = "/api/v3/brokerage/accounts";

    const message = timestamp + method + path;

    const sign = crypto.createSign("SHA256");
    sign.update(message);
    sign.end();

    const signature = sign.sign(privateKey, "base64");

    const res = await fetch("https://api.coinbase.com" + path, {
      method: "GET",
      headers: {
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return data;

  } catch (err) {
    console.log("Coinbase error:", err);
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
