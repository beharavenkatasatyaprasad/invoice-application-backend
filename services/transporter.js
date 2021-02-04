const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mockmail4me@gmail.com",
        pass: "dnvoerscnkohtwew",
    },
});

exports.transporter = transporter;