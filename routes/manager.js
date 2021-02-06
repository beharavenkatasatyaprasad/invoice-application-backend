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
                      from: '"Invoice Application 🤝" <noreply@crm.com>',
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

module.exports = router;
