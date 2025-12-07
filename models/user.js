const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const crypto = require("crypto");
const { Buffer } = require("buffer");
const PasswordUtils = require("../utils/passwordUtils");
const { mail } = require("../utils/mail");

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    select: false, // Don't include in queries by default for security
  },
  hash: {
    type: String,
    select: false, // Don't include in queries by default
  },
  salt: {
    type: String,
    select: false, // Don't include in queries by default
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  resetPasswordUsed: Boolean,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

// Helper function to detect passport-local-mongoose format
function isPassportLocalHash(hash, salt) {
  return (
    hash &&
    salt &&
    hash.length === 1024 &&
    salt.length === 64 &&
    /^[0-9a-f]+$/i.test(hash) &&
    /^[0-9a-f]+$/i.test(salt)
  );
}

// Helper function to verify passport-local-mongoose hash
async function verifyPassportHash(password, salt, hash) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 25000, 512, "sha256", (err, derivedKey) => {
      if (err) return reject(err);
      const isValid = crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        derivedKey,
      );
      resolve(isValid);
    });
  });
}

// Helper function to count remaining passport users
async function countRemainingPassportUsers() {
  const UserModel = mongoose.model("User");
  const count = await UserModel.countDocuments({
    hash: { $exists: true },
    salt: { $exists: true },
  });
  return count;
}

// Helper function to send migration progress email
async function sendMigrationProgressEmail(migratedCount, remainingCount) {
  const subject = `Password Migration Progress: ${remainingCount} users remaining`;
  const text =
    `Hello,\n\n` +
    `Password migration progress update:\n\n` +
    `Users migrated to bcrypt: ${migratedCount}\n` +
    `Users remaining (passport format): ${remainingCount}\n\n` +
    `Migration is happening automatically as users log in.\n\n` +
    `When migration is complete, you can clean up the old passport fields.`;

  await mail(subject, text, process.env.EMAIL_USER);
}

// Static method to register a new user
UserSchema.statics.register = async function (user, password) {
  const hashedPassword = await PasswordUtils.hashPassword(password);
  user.password = hashedPassword;
  return await user.save();
};

// Instance method to authenticate a user (supports both formats)
UserSchema.methods.authenticate = async function (password) {
  // Need to explicitly select the fields since they're hidden by default
  const UserModel = mongoose.model("User");
  const userWithFields = await UserModel.findById(this._id).select(
    "+password +hash +salt",
  );

  // Handle edge case where user is deleted during authentication
  if (!userWithFields) {
    return { user: false };
  }

  // Check if it's a passport-local-mongoose hash
  if (
    userWithFields.hash &&
    userWithFields.salt &&
    isPassportLocalHash(userWithFields.hash, userWithFields.salt)
  ) {
    const isValid = await verifyPassportHash(
      password,
      userWithFields.salt,
      userWithFields.hash,
    );

    if (isValid) {
      // Migrate to bcrypt on successful login with transaction to prevent race conditions
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await this.setPassword(password);

        // Remove old passport fields
        const UserModel = mongoose.model("User");
        await UserModel.findByIdAndUpdate(
          this._id,
          {
            $unset: { hash: 1, salt: 1 },
          },
          { session },
        );

        await session.commitTransaction();
        session.endSession();

        // Count remaining users and send progress email (outside transaction)
        const remainingCount = await countRemainingPassportUsers();
        const totalUsers = await UserModel.countDocuments();
        const migratedCount = totalUsers - remainingCount;

        await sendMigrationProgressEmail(migratedCount, remainingCount);

        return { user: this, migrated: true };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }
    return { user: false };
  }

  // Default bcrypt verification
  if (!userWithFields.password) {
    return { user: false };
  }

  const isValid = await PasswordUtils.comparePassword(
    password,
    userWithFields.password,
  );
  return isValid ? { user: this } : { user: false };
};

// Pre-save hook to remove old Passport fields when password is set
UserSchema.pre("save", function () {
  // If password is being set/modified, remove old Passport fields
  if (this.isModified("password")) {
    this.hash = undefined;
    this.salt = undefined;
  }
});

// Instance method to set password
UserSchema.methods.setPassword = async function (password) {
  this.password = await PasswordUtils.hashPassword(password);
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);
