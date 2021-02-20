const express = require("express");
const router = express.Router();
const mongodb = require("mongodb"); //MongoDB driver
const bodyParser = require("body-parser");
const { encodeToken, decodeToken, encodeData } = require("../services/jwt");
const { generateHash, compareHash } = require("../services/bcrypt");
const { transporter } = require("../services/transporter");
const mongoClient = mongodb.MongoClient;
const fetch = require("node-fetch");
const e = require("express");

const url =
  "mongodb+srv://bharg:FCTXxw9PNQdw0Sck@cluster0.p94h7.mongodb.net/trackingapp?retryWrites=true&w=majority";
router.use(bodyParser.json());

router.route("/checklogin").post(async (req, res) => {
  const { jwt, email } = req.body;
  try {
    let verify = await decodeToken(jwt);
    if (verify) {
      let tokenemail = verify.email;
      if (email === tokenemail) {
        res.status(202).json({
          type_: "success",
          message: "Login Successful..",
        });
      } else {
        res.status(404).json({
          type_: "warning",
          message: "session expired",
        });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      type_: "warning",
      message: "something went wrong",
    });
  }
});

router.route("/changeCoordinates").post(async (req, res) => {
  const { lat, lon, vehicle } = req.body;
  try {
    let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    let db = client.db("trackingapp"); //db name
    let user = db.collection("users"); //collection name
    user.findOneAndUpdate(
      {
        vehicle: vehicle.toUpperCase(),
      },
      {
        $set: {
          'coordinates.latitude': lat,
          'coordinates.longitude': lon
        },
      },
      (err, result) => {
        if (err) {
          res.status(500).json({
            message: err,
          });
        }
        if (result) {
          res.status(202).json({
            message: "location updated...",
            type_: "success",
          });
        }
      }
    );
  } catch (e) {
    console.log(e);
    res.status(500).json({
      type_: "warning",
      message: "something went wrong",
    });
  }
});

router.route("/vehicle/:jwt").get(async (req, res) => {
  const { jwt } = req.params;
  try {
    if (!jwt) {
      console.log("unauthorized login");
    } else {
      let verify = await decodeToken(jwt);
      if (verify) {
        let number = verify.endpoint;
        console.log(number);
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }); //connect to db
        let db = client.db("trackingapp"); //db name
        let user = db.collection("users"); //collection nam
        await user.findOne(
          {
            vehicle: number,
          },
          (err, result) => {
            if (err) throw err;
            if (result) {
              let lat = result.coordinates.latitude;
              let lon = result.coordinates.longitude;
              console.log(lat, lon);
              res.status(202).json({
                lat: lat,
                lon: lon,
                type_: "success",
              });
            }
          }
        );
      } else {
        res, status(500);
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      type_: "warning",
      message: "something went wrong",
    });
  }
});

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
    try {
      let client = await mongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }); //connect to db
      let db = client.db("trackingapp"); //db name
      let user = db.collection("users"); //collection name
      await user.findOne(
        {
          email: email,
        },
        async (err, User) => {
          if (err) {
            console.log(err);
            res.status(202).json({
              message: err,
              type_: "warning",
            });
          }
          if (User === null) {
            res.status(404).json({
              message: "No registered user found with " + email,
              type_: "warning",
            });
          } else {
            let name = User.fname + " " + User.lname;
            let passwordMatched = await compareHash(password, User.password);
            if (passwordMatched == true) {
              let token = await encodeData(email, User.vehicle);
              console.log(token);
              res.status(202).json({
                jwt: token,
                email: email,
                user: user._id,
                name: name,
                type_: "success",
              });
            } else {
              res.status(404).json({
                message: "Invalid Credentials..", //if the credentials were not matching
                type_: "warning",
              });
            }
          }
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Saomething went wrong", //if the credentials were not matching
        type_: "warning",
      });
    }
  } else {
    res.status(404).json({
      message: errors,
    });
  }
});
//endpoint for account verification
router.route("/auth/:token").get(async (req, res) => {
  const token = req.params.token;
  try {
    let decoded = await decodeToken(token);
    if (decoded) {
      let client = await mongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      let db = client.db("trackingapp"); //db name
      let user = db.collection("users"); //collection name
      user.findOneAndUpdate(
        {
          email: decoded.email,
        },
        {
          $set: {
            verified: true,
          },
        },
        (err, result) => {
          if (err) {
            res.status(500).json({
              message: err,
            });
          }
          if (result) {
            res.status(202).json({
              message: "Account verification successful...",
            });
          }
        }
      );
    } else {
      res.status(404).json({
        message: "unauthorized request",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "something went wrong",
    });
  }
});

//Endpoint for password reset request
router.route("/forgotPassword").get(async (req, res) => {
  const { email } = req.body; //email from client
  let errors = [];
  if (!email) {
    errors.push("email field is required !!");
  }
  if (errors.length === 0) {
    try {
      let client = await mongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }); //connect to db
      let db = client.db("trackingapp"); //db name
      let user = db.collection("users"); //collection name
      user.findOne(
        {
          email: email,
        },
        async (err, users) => {
          if (users == null) {
            res.status(404).json({
              message: "No registered user found with " + email,
            }); //! if not found send this status
          } else {
            //if found
            let emailToken = await encodeToken(email);
            user.findOneAndUpdate(
              {
                email: email,
              },
              {
                $set: {
                  verified: false,
                  confirmed: false,
                },
              }
            );
            let Tokenurl = `https://wetrack-backend.herokuapp.com/passwordauth/${emailToken}`;
            let name = `${email.split("@")[0]}`;
            //email template for sending token
            var mailOptions = {
              from:
                '"Mail from Tracking Application 🤝" <noreply@trackingapp.com>',
              to: `${email}`,
              subject: "Password Reset Link",
              html: `Hello ${name} ,<br> Here's your password reset link: <a style="color:green" href="${Tokenurl}">Click Here To Reset</a> Link expires in 10 minutes...`,
            };

            //Send the mail
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                res.status(500).json({
                  message: error,
                });
              } else {
                res.status(404).json({
                  message:
                    "Check your mail and Confirm Identity for resetting password...",
                }); //* if mail sent send this msg
              }
            });
          }
          if (err) {
            res.status(202).json({
              message: err,
            }); //! if found any error send this status
          }
        }
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "something went wrong..",
      });
    }
  } else {
    res.status(404).json({
      message: errors,
    });
  }
});

//for password reset auth
router.route("/passwordauth/:token").get(async (req, res) => {
  const token = req.params.token;
  let decoded = await decodeToken(token);
  if (decoded) {
    let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    let db = client.db("trackingapp"); //db name
    let user = db.collection("users"); //collection name
    user.findOneAndUpdate(
      {
        email: decoded.email,
      },
      {
        $set: {
          confirmed: true,
          verified: false,
        },
      },
      (err, result) => {
        if (err) {
          res.status(500).json({
            message: err,
          });
        }
        if (result) {
          res.status(202).json({
            message:
              "Your account is authorized to Password Reset, please go to /newPassword endpoint and reset your password..",
          });
        }
      }
    );
  }
  if (err) {
    res.status(404).json({
      message: err,
    }); //if the token expired send this status
  }
});

//Endpoint fot setting new password
router.route("/newPassword").post(async (req, res) => {
  let errors = [];
  const { email, newpassword } = req.body; //email & newpassword from client
  if (!email) {
    errors.push(`email field is required !!`);
  }
  if (!newpassword) {
    errors.push(`newpassword field is required !!`);
  }
  if (errors.length === 0) {
    let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }); //connect to db
    let db = client.db("trackingapp"); //db name
    let user = db.collection("users"); //collection name
    user.findOne(
      {
        email: email,
      },
      async (err, User) => {
        if (User == null) {
          res.status(404).json({
            message: "No User found with " + email + " !!",
          }); //! if not found send this status
        } else {
          let token = User.confirmed; //find if the token exists in the collection
          if (token == true) {
            try {
              let saltRounds = await bcrypt.genSalt(10);
              let hashedPwd = await bcrypt.hash(newpassword, saltRounds);
              user.findOneAndUpdate(
                {
                  email: email,
                },
                {
                  $set: {
                    password: hashedPwd, //and set the new hashed password in the db
                    confirmed: false,
                    verified: true,
                  },
                }
              );
              res.status(202).json({
                message: "Password reset Successful",
              }); //*if done send this status
            } catch (err) {
              res.status(500).json({
                message: err,
              }); //! if any error send this status
            }
          } else {
            res.status(404).json({
              message: "unauthorized request",
            });
          }
        }
      }
    );
  } else {
    res.status(404).json({
      message: errors,
    });
  }
});

module.exports = router;
