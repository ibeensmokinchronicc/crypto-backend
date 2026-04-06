const express = require("express");
const crypto = require("crypto");

const app = express();

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/", (req, res) => {
  res.send("Crypto backend running ✅");
});

// ================= GEMINI =================
async function getGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  const apiSecret = process.env.GEMINI_API_SECRET;

  const payload = {
    request: "/v1/balances",
    nonce: Date.now().toString()
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

  const signature = crypto
    .createHmac("sha384", apiSecret)
    .update(payloadBase64)
    .digest("hex");

  const res = await fetch("https://api.gemini.com/v1/balances", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "X-GEMINI-APIKEY": apiKey,
      "X-GEMINI-PAYLOAD": payloadBase64,
      "X-GEMINI-SIGNATURE": signature
    }
  });

  return await res.json();
}

// ================= COINBASE (CDP) =================
function createJWT() {
  const keyName = process.env.COINBASE_API_KEY;
  const privateKey = process.env.COINBASE_PRIVATE_KEY;

  const header = {
    alg: "ES256",
    typ: "JWT",
    kid: keyName
  };

  const payload = {
    iss: "cdp",
    sub: keyName,
    nbf: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
    aud: ["https://api.coinbase.com"]
  };

  function base64url(input) {
    return Buffer.from(JSON.stringify(input))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);

  const data = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("SHA256");
  sign.update(data);
  sign.end();

  const signature = sign.sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

async function getCoinbase() {
  const token = createJWT();

  const res = await fetch("https://api.coinbase.com/api/v3/brokerage/accounts", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return await res.json();
}

// ================= SYNC =================
app.get("/sync", async (req, res) => {
  try {
    const gemini = await getGemini();
    const coinbase = await getCoinbase();

    res.json({
      gemini,
      coinbase
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "sync failed", details: err.message });
  }
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running"));
