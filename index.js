const express = require("express");

const app = express();

// ✅ Your holdings (edit this anytime)
let portfolio = [
  { id: "bitcoin", amount: 0.5 },
  { id: "ethereum", amount: 1.2 },
  { id: "solana", amount: 3 }
];

// ✅ Home
app.get("/", (req,res)=>{
  res.send("Crypto backend running ✅");
});

// 🔄 Sync with REAL PRICES
app.get("/sync", async (req,res)=>{

  try {

    let balances = [];

    for (let coin of portfolio) {

      const response = await fetch(
        `https://api.coinbase.com/v2/prices/${coin.id.toUpperCase()}-USD/spot`
      );

      const data = await response.json();

      balances.push({
        id: coin.id,
        amount: coin.amount,
        price: parseFloat(data.data.amount)
      });
    }

    res.json({balances, rewards: []});

  } catch(e){
    console.log(e);
    res.status(500).json({error:"sync failed"});
  }

});

// 🚀 Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Running"));
