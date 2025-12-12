const { mail } = require("../utils/mail");

// GET - policy/cookie-policy
module.exports.cookiePolicy = (req, res) => {
  res.render("policy/cookiePolicy", {
    title: "cookiePolicy",
    css_page: "cookiePolicy",
  });
};

// GET - policy/tandc
module.exports.tandc = (req, res) => {
  res.render("policy/tandc", {
    captcha: res.recaptcha,
    title: "slapp.longrunner.co.uk Information Page",
    js_page: "tandc",
    css_page: "tandc",
  });
};

// POST - policy/tandc
module.exports.tandcPost = (req, res) => {
  if (!req.recaptcha.error) {
    mail(
      "Contact Form Submitted - slapp.longrunner.co.uk",
      "Hello,\n\n" +
        "Your message to slapp.longrunner.co.uk has been submittted. The details are below" +
        "\n\n" +
        `Name: ${req.body.name}` +
        "\n\n" +
        `Email: ${req.body.email}` +
        "\n\n" +
        `Message: ${req.body.message}`,
      req.body.email,
    );

    mail(
      "Contact Form Submitted - slapp.longrunner.co.uk",
      "Hello,\n\n" +
        "A new message has been submitted" +
        "\n\n" +
        `Name: ${req.body.name}` +
        "\n\n" +
        `Email: ${req.body.email}` +
        "\n\n" +
        `Body: ${req.body.message}`,
    );

    req.flash("success", "Message sent.");
    res.redirect("/policy/tandc");
  } else {
    req.flash("error", "recaptcha failed, please try again");
    res.redirect("/policy/tandc");
  }
};
