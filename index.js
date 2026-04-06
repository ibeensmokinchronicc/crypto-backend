const express = require("express");

const app = express();

// ✅ Home route
app.get("/", (req,res)=>{
  res.send("Crypto backend running ✅");
});

// 🔄 Sync route (SAFE TEST VERSION)
app.get("/sync", async (req,res)=>{

  try {

    const apiKey = process.env.COINBASE_API_KEY;

    const response = await fetch("https://api.coinbase.com/v2/accounts", {
      headers: {
        "Authorization": `Bearer ${apiKey}`
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

    res.json({balances, rewards: []});

  } catch(e){
    console.log(e);
    res.status(500).json({error:"sync failed"});
  }

});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Running"));
