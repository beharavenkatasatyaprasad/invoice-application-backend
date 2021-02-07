const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");
const { compareHash } = require("../services/bcrypt");
const { encodeToken } = require("../services/jwt");
const mongoClient = mongodb.MongoClient;

const url = "mongodb+srv://satyaprasadbehara:WdImmEMojyk1SsPa@cluster0.mob6p.mongodb.net/InvoiceApp?retryWrites=true&w=majority";


  

module.exports = router;