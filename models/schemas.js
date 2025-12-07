const BaseJoi = require("joi");
const sanitizeHtml = require("sanitize-html");

const extension = (joi) => ({
  type: "string",
  base: joi.string(),
  messages: {
    "string.escapeHTML": "{{#label}} must not include HTML!",
  },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
        if (clean !== value)
          return helpers.error("string.escapeHTML", { value });
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

module.exports.registerSchema = Joi.object({
  username: Joi.string().required().escapeHTML(),
  email: Joi.string().email().required(),
  password: Joi.string().required().escapeHTML(),
  confirm_password: Joi.string().required().escapeHTML(),
  tnc: Joi.string().valid("checked").optional(),
}).required();

module.exports.loginSchema = Joi.object({
  username: Joi.string().required().escapeHTML(),
  password: Joi.string().required().escapeHTML(),
  email: Joi.string().email(),
}).required();

module.exports.forgotSchema = Joi.object({
  email: Joi.string().email().required(),
}).required();

module.exports.detailsSchema = Joi.object({
  username: Joi.string().required().escapeHTML(),
  password: Joi.string().required().escapeHTML(),
  email: Joi.string().email().required(),
}).required();

module.exports.deleteSchema = Joi.object({
  password: Joi.string().required().escapeHTML(),
}).required();

module.exports.resetSchema = Joi.object({
  password: Joi.string().required().escapeHTML(),
  confirm_password: Joi.string().required().escapeHTML(),
}).required();

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    body: Joi.string().required().escapeHTML(),
  }).required(),
});
