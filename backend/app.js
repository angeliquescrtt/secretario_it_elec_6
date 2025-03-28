const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const postroutes = require("./routes/posts"); 

const app = express();

const path = require("path");  
app.use("/images", express.static(path.join("backend/images")));  

mongoose
  .connect("mongodb+srv://secretarioanglique:aEisYJyeyMflqUf3@cluster0.grq7b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("Connected to the Database");
  })
  .catch(() => {
    console.log("Connection Failed");
  });


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use((req,res, next)=>{
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");




        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
        next();
})




app.use(cors());

app.use("/api/posts", postroutes); 

module.exports = app;





