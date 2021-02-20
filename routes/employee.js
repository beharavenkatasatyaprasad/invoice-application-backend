const express = require("express");
const router = express.Router();
const mongodb = require("mongodb"); //MongoDB driver
const { compareHash, generateHash } = require("../services/bcrypt");
const { encodeToken, decodeToken } = require("../services/jwt");
const { transporter } = require("../services/transporter");
const mongoClient = mongodb.MongoClient;
const bodyParser = require("body-parser");
const ObjectId = require("mongodb").ObjectId;

const url =
  "mongodb+srv://satyaprasadbehara:WdImmEMojyk1SsPa@cluster0.mob6p.mongodb.net/InvoiceApp?retryWrites=true&w=majority";
router.use(bodyParser.json());

// endpoint for new invoice
router.route("/newinvoice").post(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  const { status, billedTo, date } = req.body;
  let errors = [];
  if (!status) {
    errors.push("status field is required !!");
  }
  if (!jwtcookie) {
    errors.push("unauthorized request");
  }
  if (!billedTo) {
    errors.push("billedTo field is required !!");
  }
  if (!date) {
    errors.push("date field is required !!");
  }
  if (errors.length === 0) {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      let id_ = Math.floor(100000 + Math.random() * 900000);
      if (!email) {
        return res.json({
          error: "Login to continue..",
        });
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let users = db.collection("users");
        let invoices = db.collection("invoices");
        let admins = await users
          .find({
            userType: "admin",
          })
          .toArray();
        let managers = await users
          .find({
            userType: "manager",
          })
          .toArray();
        let adminsMails = [];
        let managersMails = [];
        if (admins.length) {
          admins.forEach((admin) => {
            adminsMails.push(admin.email);
          });
        }
        if (managers.length) {
          managers.forEach((manager) => {
            managersMails.push(manager.email);
          });
        }
        let isAdminMailsUndefined = adminsMails || [
          "satyaprasadbehara@gmail.com",
        ];
        let isManagersMailsUndefined = managersMails || [
          "satyaplanet1@gmail.com",
        ];
        let sendto = [...isAdminMailsUndefined, ...isManagersMailsUndefined];
        invoices.insertOne(
          {
            id_: id_,
            createdBy: email,
            billedTo: billedTo,
            status: status,
            createdAt: date,
          },
          (err, result) => {
            if (err) console.log(err);
            if (result) {
              let mailOptions = {
                from: '"Invoicer 📄" <noreply@invoicer.com>',
                to: sendto,
                subject: "New invoice created",
                html:
                  `Hello, ,<br /> New invoice has been created by` +
                  email +
                  " for " +
                  billedTo,
              };
              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log(info);
                  return res.json({
                    message:
                      "invoice for " + billedTo + " successfully created..",
                  }); //* if mail sent send this msg
                }
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  } else {
    return res.json({
      errors: errors,
    });
  }
});

router.route("/newproduct").post(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  const { name, price, tax } = req.body;
  let errors = [];
  if (!name) {
    errors.push("name field is required !!");
  }
  if (!jwtcookie) {
    errors.push("unauthorized request");
  }
  if (!price) {
    errors.push("price field is required !!");
  }
  if (!tax) {
    errors.push("tax field is required !!");
  }
  if (errors.length === 0) {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      let id_ = Math.floor(100000 + Math.random() * 900000);
      if (!email) {
        return res.json({
          error: "Login to continue..",
        });
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let users = db.collection("users");
        let products = db.collection("products");
        let admins = await users
          .find({
            userType: "admin",
          })
          .toArray();
        let managers = await users
          .find({
            userType: "manager",
          })
          .toArray();
        let adminsMails = [];
        let managersMails = [];
        if (admins.length) {
          admins.forEach((admin) => {
            adminsMails.push(admin.email);
          });
        }
        if (managers.length) {
          managers.forEach((manager) => {
            managersMails.push(manager.email);
          });
        }
        let isAdminMailsUndefined = adminsMails || [
          "satyaprasadbehara@gmail.com",
        ];
        let isManagersMailsUndefined = managersMails || [
          "satyaplanet1@gmail.com",
        ];
        let sendto = [...isAdminMailsUndefined, ...isManagersMailsUndefined];
        products.insertOne(
          {
            id_: id_,
            name: name,
            price: price,
            tax: tax,
          },
          (err, result) => {
            if (err) console.log(err);
            if (result) {
              let mailOptions = {
                from: '"Invoicer 📄" <noreply@invoicer.com>',
                to: sendto,
                subject: "New product added",
                html: `Hello, ,<br /> New product has been added by ` + email,
              };
              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log(info);
                  return res.json({
                    message: "product successfully added..",
                  }); //* if mail sent send this msg
                }
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  } else {
    return res.json({
      errors: errors,
    });
  }
});

router.route("/newcustomer").post(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  const { name, address, phone, website, email } = req.body;
  let errors = [];
  if (!name) {
    errors.push("name field is required !!");
  }
  if (!jwtcookie) {
    errors.push("unauthorized request");
  }
  if (!phone) {
    errors.push("phone field is required !!");
  }
  if (!address) {
    errors.push("address field is required !!");
  }
  if (!email) {
    errors.push("email field is required !!");
  }
  if (!website) {
    errors.push("website field is required !!");
  }
  if (errors.length === 0) {
    try {
      let token = await decodeToken(jwtcookie);
      let addedby = token.email;
      let id_ = Math.floor(100000 + Math.random() * 900000);
      if (!email) {
        return res.json({
          error: "Login to continue..",
        });
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let users = db.collection("users");
        let customers = db.collection("customers");
        let admins = await users
          .find({
            userType: "admin",
          })
          .toArray();
        let managers = await users
          .find({
            userType: "manager",
          })
          .toArray();
        let adminsMails = [];
        let managersMails = [];
        if (admins.length) {
          admins.forEach((admin) => {
            adminsMails.push(admin.email);
          });
        }
        if (managers.length) {
          managers.forEach((manager) => {
            managersMails.push(manager.email);
          });
        }
        let isAdminMailsUndefined = adminsMails || [
          "satyaprasadbehara@gmail.com",
        ];
        let isManagersMailsUndefined = managersMails || [
          "satyaplanet1@gmail.com",
        ];
        let sendto = [...isAdminMailsUndefined, ...isManagersMailsUndefined];
        customers.insertOne(
          {
            id_: id_,
            name: name,
            addedBy: addedby,
            phone: phone,
            address: address,
            website: website,
            email: email,
          },
          (err, result) => {
            if (err) console.log(err);
            if (result) {
              let mailOptions = {
                from: '"Invoicer 📄" <noreply@invoicer.com>',
                to: sendto,
                subject: "New customer added",
                html: `Hello, ,<br /> New customer has been added by ` + email,
              };
              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log(info);
                  return res.json({
                    message: "customer successfully added..",
                  }); //* if mail sent send this msg
                }
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  } else {
    return res.json({
      errors: errors,
    });
  }
});

router.route("/updateinvoice").put(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  const { status, id_ } = req.body;
  let errors = [];
  if (!jwtcookie) {
    errors.push("unauthorized request");
  }
  if (!status) {
    errors.push("status field is required !!");
  }
  if (!id_) {
    errors.push("id_ field is required !!");
  }
  if (errors.length === 0) {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      if (!email) {
        return (
          res,
          json({
            error: "login to continue..",
          })
        );
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let o_id = new ObjectId(id_);
        await db.collection("invoices").updateOne(
          {
            id_: o_id,
          },
          {
            $set: {
              status: status,
            },
          },
          (err, result) => {
            if (result) {
              return res.json({
                message: "invoice updated successfully..",
              });
            } else {
              console.log(err);
              return res.json({
                message: "no invoice were found",
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  } else {
    return res.json({
      errors: errors,
    });
  }
});

router.route("/updateproduct").put(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  const { price, tax, id_ } = req.body;
  let errors = [];
  if (!jwtcookie) {
    errors.push("unauthorized request");
  }
  if (!tax) {
    errors.push("tax field is required !!");
  }
  if (!price) {
    errors.push("price field is required !!");
  }
  if (errors.length === 0) {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      if (!email) {
        return (
          res,
          json({
            error: "login to continue..",
          })
        );
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let o_id = new ObjectId(id_);
        await db.collection("products").updateOne(
          {
            id_: o_id,
          },
          {
            $set: {
              price: price,
              tax: tax,
            },
          },
          (err, result) => {
            if (result) {
              return res.json({
                message: "product updated successfully..",
              });
            } else {
              console.log(err);
              return res.json({
                message: "no products were found",
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  } else {
    return res.json({
      errors: errors,
    });
  }
});

router.route("/updatecustomer").put(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  const { address, phone, website, email } = req.body;
  let errors = [];
  if (!jwtcookie) {
    errors.push("unauthorized request");
  }
  if (!address) {
    errors.push("address field is required !!");
  }
  if (!phone) {
    errors.push("phone field is required !!");
  }
  if (!website) {
    errors.push("website field is required !!");
  }
  if (!email) {
    errors.push("email field is required !!");
  }
  if (errors.length === 0) {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      if (!email) {
        return (
          res,
          json({
            error: "login to continue..",
          })
        );
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let o_id = new ObjectId(id_);
        await db.collection("customers").updateOne(
          {
            id_: o_id,
          },
          {
            $set: {
              address: address,
              phone: phone,
              website: website,
              email: email,
            },
          },
          (err, result) => {
            if (result) {
              return res.json({
                message: "customer updated successfully..",
              });
            } else {
              console.log(err);
              return res.json({
                message: "no customers were found",
              });
            }
          }
        );
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  } else {
    return res.json({
      errors: errors,
    });
  }
});

router.route("/getinvoices").get(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  if (!jwtcookie) {
    return res.json({
      message: "Login to continue..",
    });
  } else {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      if (!email) {
        return res.json({
          error: "Login to continue..",
        });
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let invoices = await db
          .collection("invoices")
          .find({
            createdBy: email,
          })
          .toArray();
        let allinvoices = invoices || ["no invoices found.."];
        return res.json({
          invoices: allinvoices,
        });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  }
});

router.route("/getproducts").get(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  if (!jwtcookie) {
    return res.json({
      message: "Login to continue..",
    });
  } else {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      if (!email) {
        return res.json({
          error: "Login to continue..",
        });
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let products = await db
          .collection("products")
          .find({
            createdBy: email,
          })
          .toArray();
        let allproducts = products || ["no products found.."];
        return res.json({
          products: allproducts,
        });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  }
});

router.route("/getcustomers").get(async (req, res) => {
  let jwtcookie = req.cookies.jwt;
  if (!jwtcookie) {
    return res.json({
      message: "Login to continue..",
    });
  } else {
    try {
      let token = await decodeToken(jwtcookie);
      let email = token.email;
      if (!email) {
        return res.json({
          error: "Login to continue..",
        });
      } else {
        let client = await mongoClient.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        let db = client.db("InvoiceApp");
        let customers = await db
          .collection("customers")
          .find({
            createdBy: email,
          })
          .toArray();
        let allcustomers = customers || ["no customers found.."];
        return res.json({
          customers: allcustomers,
        });
      }
    } catch (error) {
      console.log(error);
      return res.json({
        error: "something went wrong",
      });
    }
  }
});

module.exports = router;
