const express = require("express");
const router = express.Router();
const mongodb = require("mongodb"); //MongoDB driver
const { compareHash, generateHash } = require("../services/bcrypt");
const { encodeToken, decodeToken } = require("../services/jwt");
const { transporter } = require("../services/transporter");
const mongoClient = mongodb.MongoClient;

const url =
  "mongodb+srv://satyaprasadbehara:WdImmEMojyk1SsPa@cluster0.mob6p.mongodb.net/InvoiceApp?retryWrites=true&w=majority";

router.route("/login").post(async (req, res) => {
  const { email, password } = req.body;
  let errors = [];

  if (!email) {
    errors.push("email field is required !!");
  }

  if (!password) {
    errors.push("password field is required !!");
  }

  if (errors.length === 0) {
    let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }); //connect to db

    let db = client.db("InvoiceApp"); //db name
    let user = db.collection("users"); //collection name
    await user.findOne(
      {
        email: email,
      },
      async (err, User) => {
        if (err) {
          console.log(err);
          return res.json({
            error: err,
          });
        }
        if (User === null) {
          return res.json({
            error: `No registered user found with ${email}`,
          });
        } else if (User.userType !== "manager") {
          return res.json({
            error:
              User.userType +
              "  will not have permission to access manager portal",
          });
        } else {
          if (User === null) {
            return res.json({
              message: "No registered user found with " + email,
            });
          } else {
            let usertype = User.userType;
            let name = User.fname + " " + User.lname;
            if (User.verified === true) {
              let passwordMatched = await compareHash(password, User.password);
              if (passwordMatched == true) {
                //if matched
                let token = encodeToken(email);
                res
                  .cookie("jwt", token, {
                    maxAge: 1000000,
                    httpOnly: true,
                    secure: true,
                  })
                  .cookie("userType", usertype, {
                    maxAge: 1000000,
                    httpOnly: true,
                    secure: true,
                  })
                  .cookie("user", User._id, {
                    maxAge: 1000000,
                    httpOnly: true,
                    secure: true,
                  })
                  .json({
                    message:
                      "Hello " + name + " , you are successfully logged in...", //if credentials matched,
                  });
              } else {
                return res.json({
                  error: "Invalid Credentials..", //if the credentials were not matching
                });
              }
            } else {
              return res.json({
                error: "User Identity not verified..",
              });
            }
          }
        }
      }
    );
  } else {
    return res.json({
      error: errors,
    });
  }
});

router.route("/invoices").get(async (req, res) => {
  try {
    let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }); //connect to db
    let db = client.db("InvoiceApp");
    let invoices = await db.collection("invoices").find({}).toArray();
    return res.json({ invoices: invoices });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "something went wrong",
    });
  }
});

router.route("/products").get(async (req, res) => {
  try {
    let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }); //connect to db
    let db = client.db("InvoiceApp");
    let products = await db.collection("products").find({}).toArray();
    return res.json({ products: products });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "something went wrong",
    });
  }
});

router.route("/customers").get(async (req, res) => {
  try {
    let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }); //connect to db
    let db = client.db("InvoiceApp");
    let customers = await db.collection("customers").find({}).toArray();
    return res.json({ customers: customers });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "something went wrong",
    });
  }
});

module.exports = router;
