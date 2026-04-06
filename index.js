const express = require("express");
const crypto = require("crypto");

const app = express();

app.get("/", (req, res) => {
  res.send("Crypto backend running ✅");
});

app.get("/sync", async (req, res) => {
  try {
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

    const response = await fetch("https://api.gemini.com/v1/balances", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "X-GEMINI-APIKEY": apiKey,
        "X-GEMINI-PAYLOAD": payloadBase64,
        "X-GEMINI-SIGNATURE": signature
      }
    });

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({ error: "sync failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
