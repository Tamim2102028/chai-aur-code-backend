import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { use } from "react";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // for faster search
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudnary url
      require: true,
    },
    coverImage: {
      type: String, // cloudnary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Please provide a password"],
    },
    refreshToken: {
      // for refresh token storage
      type: String,
    },
  },
  { timestamps: true }
);

// Hash the password before saving the user model
// use function keyword rather than arrow function to access "this"
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    // if password is not modified, skip hashing
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  // 10 salt rounds
  next();
});

// method to compare given password with database hash
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// method to generate JWTs
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};
// method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    }
  );
};

export default model("User", userSchema);
