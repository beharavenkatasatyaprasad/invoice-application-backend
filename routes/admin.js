const express = require("express");
const router = express.Router();
const mongodb = require("mongodb"); //MongoDB driver
const bodyParser = require("body-parser");
const randtoken = require("rand-token");
const { encodeToken } = require("../services/jwt");
const { compareHash, generateHash } = require("../services/bcrypt");
const { transporter } = require("../services/transporter");
const mongoClient = mongodb.MongoClient;

const url =
  "mongodb+srv://bharg:FCTXxw9PNQdw0Sck@cluster0.p94h7.mongodb.net/trackingapp?retryWrites=true&w=majority";

router.use(bodyParser.json());

router.route("/register").post(async (req, res) => {
  const { fname, lname, email, endpoint,vehicle,vtype, registeredby } = req.body;
  const userType = "customer";
  let errors = [];
  if (!fname) {
    errors.push("fname field is required !!");
  }
  if (!endpoint) {
    errors.push("endpoint field is required !!");
  }
  if (!vtype) {
    errors.push("vtype field is required !!");
  }
  if (!lname) {
    errors.push("lname field is required !!");
  }
  if (!vehicle) {
    errors.push("vehicle number field is required !!");
  }
  if (!registeredby) {
    errors.push("registeredby field is required !!");
  }
  if (!userType) {
    errors.push("userType field is required !!");
  }
  const password = await randtoken.generate(12);
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
        async (err, result) => {
          //find if the email is already exist in the collection
          if (err) {
            res.status(500).json({
              message: "something went wrong",
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
                registeredby: registeredby,
                vehicle: vehicle,
                endpoint: endpoint,
                vtype:vtype,
                userType: userType,
                coordinates:{
                  latitude:28.7041,
                  longitude:77.1025
                }
              },
              async (err, result) => {
                if (err) console.log(err);
                if (result) {
                  let name = fname + " " + lname;
                  transporter.sendMail(
                    {
                      from:
                        '"Mail from Tracking Application 🤝" <noreply@trackingapp.com>',
                      to: `${email}`,
                      subject: "Account Credentials",
                      html: `Hello ${name} , Here's your Account credentials : <br>  email : ${email} <br> password : ${password}`,
                    },
                    (error, info) => {
                      console.log(info);
                      if (error) {
                        console.log(error);
                      } else {
                        res.status(202).json({
                          message:
                            "Registration successful...A mail sent to " +
                            email +
                            " containing credentials...",
                            type_: "success"
                        }); //* if mail sent send this msg
                      }
                    }
                  );
                }
              }
            );
          } else {
            res.status(404).json({
              message: "email already exists!!",
              type_: "warning"
            });
          }
        }
      );
    } catch (err) {
      console.log(err);
      res.status(404).json({
        message: "someting went wrong !",
        type_: "warning"
      });
    }
  } else {
    res.status(404).json({
      message: errors,
      type_: "earning"
    });
  }
});

router.route("/adminlogin").post(async (req, res) => {
  const { otp } = req.body;
  let errors = [];
  if (!otp) {
    errors.push("otp field is required !!");
  }
  const email = "bhargavtoleti@gmail.com";
  if (errors.length === 0) {
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
          });
        }
        if (User) {
          let passwordMatched = await compareHash(otp+'', User.password);
          if (passwordMatched) {
            let name = User.fname + " " + User.lname;
            let token = await encodeToken(email);
            res.status(202).json({
              jwt: token,
              id: User._id,
              email: email,
              name:name,
              "message":'Login successful',
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
  } else {
    res.status(404).json({
      message: errors,
      type_: "warning"
    });
  }
});

router.route("/requestLogin").get(async (req, res) => {
  const email = "bhargavtoleti@gmail.com";
  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log(otp);
  try {
      let client = await mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }); //connect to db
    let db = client.db("trackingapp"); //db name
    let user = db.collection("users"); //collection name
    let hashedPwd = await generateHash(otp+''+'');
    user.findOneAndUpdate(
      {
        email: email,
      },
      {
        $set: {
          password: hashedPwd, //and set the new hashed password in the db
        },
      },
      (err, result) => {
        if (err) throw err;
        if (result) {
          transporter.sendMail(
            {
              from:
                '"Mail from Tracking Application 🤝" <noreply@trackingapp.com>',
              to: `${email}`,
              subject: "Login Confirmation otp+''",
              html: `Hello ${
                email.split("@")[0]
              } , Here's your otp+'' to login : <br> ${otp+''} `,
            },
            (error, info) => {
              console.log(info);
              if (error) {
                console.log(error);
              } else {
                res.status(202).json({
                  message: "check your mail for otp+''",
                  type_: "success",
                }); //* if mail sent send this msg
              }
            }
          );
        }
      }
    );
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "something went wrong",
      type_: "warning",
    });
  }
});

module.exports = router;
