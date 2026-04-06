const express = require("express");
const app = express();

app.get("/", (req,res)=>{
  res.send("Backend running ✅");
});

app.get("/sync", (req,res)=>{
  res.json({
    balances: [
      {id:"bitcoin", amount:0.5},
      {id:"ethereum", amount:1.2},
      {id:"solana", amount:3}
    ],
    rewards: [
      {id:"ripple", amount:5}
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Running"));
