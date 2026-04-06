const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.get("/sync", async (req,res)=>{

  try{

    // 🔥 DEMO (replace with real API later if needed)
    let balances = [
      {id:"bitcoin", amount:0.5},
      {id:"ethereum", amount:1.2}
    ];

    let rewards = [
      {id:"ripple", amount:5}
    ];

    res.json({balances, rewards});

  }catch(e){
    res.status(500).json({error:"failed"});
  }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Running"));
