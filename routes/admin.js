const express = require("express");
const router = express.Router();
const { compareHash, generateHash } = require("../services/bcrypt");
const { encodeToken, decodeToken } = require("../services/jwt");
const { transporter } = require("../services/transporter");

const url = "mongodb+srv://satyaprasadbehara:Fdwe6cYnwFMERYMC@cluster0.efor9.mongodb.net/InvoiceApp?retryWrites=true&w=majority";

router.route("/login").get(async (req, res)=>{
    
})


module.exports = router;