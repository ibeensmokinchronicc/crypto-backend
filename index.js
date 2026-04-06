const express = require("express");
const crypto = require("crypto");

const app = express();

// ✅ Home route
app.get("/", (req,res)=>{
  res.send("Crypto backend running ✅");
});

// 🔄 Sync route (REAL Coinbase data)
app.get("/sync", async (req,res)=>{

  try {

    const apiKey = process.env.COINBASE_API_KEY;
    const apiSecret = process.env.COINBASE_API_SECRET;

    const timestamp = Math.floor(Date.now() / 1000);
    const method = "GET";
    const requestPath = "/v2/accounts";

    const message = timestamp + method + requestPath;

    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(message)
      .digest("hex");

    const response = await fetch("https://api.coinbase.com/v2/accounts", {
      method: "GET",
      headers: {
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
        "CB-VERSION": "2023-10-16"
      }
    });

    const data = await response.json();

    let balances = [];

    if (data.data) {
      data.data.forEach(acc => {
        if (parseFloat(acc.balance.amount) > 0) {
          balances.push({
            id: acc.currency.toLowerCase(),
            amount: parseFloat(acc.balance.amount)
          });
        }
      });
    }

    let rewards = [];

    res.json({balances, rewards});

  } catch(e){
    console.log(e);
    res.status(500).json({error:"sync failed"});
  }

});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Running"));
