const express = require("express");
const router = express.Router();
const { compareHash, generateHash } = require("../services/bcrypt");


router.route("/").get(async (req, res)=>{
  
})


module.exports = router;