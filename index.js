const express = require("express");
const app = express(); //initialize express
const bodyParser = require("body-parser"); //body parsing middleware
const mongodb = require("mongodb"); //MongoDB driver
const verification = require('./routes/verification');
const admin = require('./routes/admin');
const mongoClient = mongodb.MongoClient;
const cors = require('cors');
require('dotenv').config()
app.use(bodyParser.json());
app.options('*',cors());
app.use(cors());

const url = "mongodb+srv://bharg:FCTXxw9PNQdw0Sck@cluster0.p94h7.mongodb.net/trackingapp?retryWrites=true&w=majority";

mongoClient.connect(
    url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
    (err, db) => {
        if(err) throw err;
        console.log("Database Connected!");
        db.close();
    }
);

app.use('/', verification);
app.use('/admin',verification,admin);

const port = process.env.PORT || 5000;

app.listen(port,()=>{ console.log(`Server running on port ${port} 🔥`)});