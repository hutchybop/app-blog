const nodemailer = require("nodemailer");

module.exports.mail = async (subject, text, to) => {
  const emailUser = process.env.EMAIL_USER;
  const aliasEmail = process.env.ALIAS_EMAIL;

  const smtpTransport = nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: process.env.ZOHOPW,
    },
  });

  const mailOptions = {
    to: to || aliasEmail,
    from: aliasEmail,
    subject: subject,
    text: text,
  };

  await smtpTransport.sendMail(mailOptions, (err) => {
    if (err) {
      console.log(err);
    }
  });
};
