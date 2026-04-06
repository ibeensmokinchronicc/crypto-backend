import express from "express";
import cors from "cors";
import axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.MY_API_KEY;

/* =========================
   COINBASE
========================= */
async function getCoinbaseAccounts() {
  try {
    const apiKey = process.env.COINBASE_API_KEY;
    let privateKey = process.env.COINBASE_API_SECRET;

    privateKey = privateKey.replace(/\\n/g, "\n");

    const uri = "GET api.coinbase.com/api/v3/brokerage/accounts";

    const token = jwt.sign(
      {
        iss: "cdp",
        sub: apiKey,
        uri: uri,
      },
      privateKey,
      {
        algorithm: "ES256",
        expiresIn: "60s",
        header: {
          kid: apiKey,
          nonce: Math.random().toString(),
        },
      }
    );

    const response = await axios.get(
      "https://api.coinbase.com/api/v3/brokerage/accounts",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.accounts;
  } catch (err) {
    return {
      error: "coinbase failed",
      details: err.response?.data || err.message,
    };
  }
}

/* =========================
   GEMINI
========================= */
async function getGeminiBalances() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const apiSecret = process.env.GEMINI_API_SECRET;

    const payload = {
      request: "/v1/balances",
      nonce: Date.now().toString(),
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    const signature = crypto
      .createHmac("sha384", apiSecret)
      .update(payloadBase64)
      .digest("hex");

    const response = await axios.post(
      "https://api.gemini.com/v1/balances",
      null,
      {
        headers: {
          "X-GEMINI-APIKEY": apiKey,
          "X-GEMINI-PAYLOAD": payloadBase64,
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

/* =========================
   PRICES (CoinGecko)
========================= */
async function getPrices() {
  try {
    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,xrp&vs_currencies=usd"
    );
    return res.data;
  } catch {
    return {};
  }
}

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.send("Crypto backend running");
});

app.get("/sync", async (req, res) => {
  const key = req.headers["x-api-key"];

  if (key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [coinbase, gemini, prices] = await Promise.all([
    getCoinbaseAccounts(),
    getGeminiBalances(),
    getPrices(),
  ]);

  res.json({ coinbase, gemini, prices });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
