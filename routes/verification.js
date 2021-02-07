const express = require("express");
const router = express.Router();
const mongodb = require("mongodb"); //MongoDB driver
const bodyparser = require("body-parser");
const { encodeToken, decodeToken } = require("../services/jwt");
const { transporter } = require("../services/transporter");
const mongoClient = mongodb.MongoClient;

const url =
  "mongodb+srv://satyaprasadbehara:WdImmEMojyk1SsPa@cluster0.mob6p.mongodb.net/InvoiceApp?retryWrites=true&w=majority";

router.use(bodyparser.json());

router.route("/register").post(async (req, res) => {
  const { fname, lname, userType, email, password } = req.body; //email & password from client
  let errors = [];
  if (!fname) {
    errors.push("fname field is required !!");
  }
  if (!lname) {
    errors.push("lname field is required !!");
  }
  if (!password) {
    errors.push("password field is required !!");
  }
  if (
    userType !== "admin" &&
    userType !== "employee" &&
    userType !== "manager"
  ) {
    !userType
      ? errors.push("userType field is required !!")
      : errors.push(userType + " is not a valid user type !!");
  }
  if (errors.length === 0) {
    try {
      let client = await mongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }); //connect to db
      let db = client.db("InvoiceApp"); //db name
      let user = db.collection("users"); //collection name
      user.findOne(
        {
          email: email,
        },
        async (err, result) => {
          //find if the email is already exist in the collection
          if (err) {
            return res.json({
              error: "something went wrong",
            });
          }
          if (result == null) {
            let hashedPwd = await generateHash(password);
            user.insertOne(
              {
                fname: fname,
                lname: lname,
                email: email,
                password: hashedPwd,
                userType: userType,
                verified: false,
                confirmed: false,
              },
              async (err, result) => {
                if (err) console.log(err);
                if (result) {
                  let emailToken = await encodeToken(email);
                  let Tokenurl = `http://localhost:3000/auth/${emailToken}`;
                  let name = fname + " " + lname;
                  transporter.sendMail(
                    {
                      from: '"Invoice Application 🤝" <noreply@invoiceapp.com>',
                      to: `${email}`,
                      subject: "Account Confirmation Link",
                      html: `Hello ${name} , Here's your Account verification link: <br> <a style="color:green" href="${Tokenurl}">Click Here To Confirm</a> <br> Link expires in an hour...`,
                    },
                    (error, info) => {
                      console.log(info);
                      if (error) {
                        console.log(error);
                      } else {
                        return res.json({
                          message:
                            "Registration successful...A mail sent to " +
                            email +
                            " for user confirmation...",
                        }); //* if mail sent send this msg
                      }
                    }
                  );
                }
              }
            );
          } else {
            return res.json({
              message: "email already exists!!",
            });
          }
        }
      );
    } catch (err) {
      console.log(Error);
    }
  } else {
    return res.json({
      error: errors,
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
                    // httpOnly: true,
                    // secure: true,
                  })
                  .cookie("userType", usertype, {
                    maxAge: 1000000,
                    // httpOnly: true,
                    // secure: true,
                  })
                  .cookie("user", User._id, {
                    maxAge: 1000000,
                    // httpOnly: true,
                    // secure: true,
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
      let db = client.db("InvoiceApp"); //db name
      let user = db.collection("users"); //collection name
      user.findOneAndUpdate(
        {
          email: decoded.email,
        },
        {
          $set: {
            verified: "something went wrong",
          },
        },
        (err, result) => {
          if (err) {
            return res.json({
              error: err,
            });
          }
          if (result) {
            return res.json({
              message: "Account verification successful...",
            });
          }
        }
      );
    } else {
      return res.json({
        error: "unauthorized request",
      });
    }
  } catch (err) {
    console.log(err);
    return res.json({
      error: "something went wrong",
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
      let db = client.db("InvoiceApp"); //db name
      let user = db.collection("users"); //collection name
      user.findOne(
        {
          //find if the email exist in the collection
          email: email,
        },
        (err, users) => {
          if (users == null) {
            return res.json({
              message: "No registered user found with " + email,
            }); //! if not found send this status
          } else {
            //if found
            let emailToken = encodeToken(email);
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
            let Tokenurl = `http://localhost:3000/passwordauth/${emailToken}`;
            let name = `${email.split("@")[0]}`;
            //email template for sending token
            var mailOptions = {
              from: '"Customer Relationship Management 🤝" <noreply@crm.com>',
              to: `${email}`,
              subject: "Password Reset Link",
              html: `Hello ${name} ,<br> Here's your password reset link: <a style="color:green" href="${Tokenurl}">Click Here To Reset</a> Link expires in 10 minutes...`,
            };

            //Send the mail
            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                return res.json({
                  message: error,
                });
              } else {
                return res.json({
                  message:
                    "Check your mail and Confirm Identity for resetting password...",
                }); //* if mail sent send this msg
              }
            });
          }
          if (err) {
            return res.json({
              message: err,
            }); //! if found any error send this status
          }
        }
      );
    } catch (err) {
      console.error(err);
      return res.json({
        error: "something went wrong..",
      });
    }
  } else {
    return res.json({
      error: errors,
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
    let db = client.db("InvoiceApp"); //db name
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
          return res.json({
            message: err,
          });
        }
        if (result) {
          return res.json({
            message:
              "Your account is authorized to Password Reset, please go to /newPassword endpoint and reset your password..",
          });
        }
      }
    );
  }
  if (err) {
    return res.json({
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
    let db = client.db("InvoiceApp"); //db name
    let user = db.collection("users"); //collection name
    user.findOne(
      {
        email: email,
      },
      async (err, User) => {
        if (User == null) {
          return res.json({
            error: "No User found with " + email + " !!",
          }); //! if not found send this status
        } else {
          let token = User.confirmed; //find if the token exists in the collection
          if (token == true) {
            try {
              let saltRounds = await bcrypt.genSalt(10);
              let hashedPwd = await bcrypt.hash(newpassword, saltRounds);
              //hash the new password
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
              return res.json({
                message: "Password reset Successful",
              }); //*if done send this status
            } catch (err) {
              return res.json({
                error: err,
              }); //! if any error send this status
            }
          } else {
            return res.json({
              error: "unauthorized request",
            });
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

module.exports = router;
