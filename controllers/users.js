const jwt = require("jsonwebtoken");
const User = require("../models/user");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../utils/config");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/errors");

const createUser = async (req, res) => {
  const { name, avatar, email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !password) {
    return res
      .status(ERROR_CODES.BAD_REQUEST)
      .send({ message: ERROR_MESSAGES.BAD_REQUEST });
  }

  if (!emailRegex.test(email)) {
    return res
      .status(ERROR_CODES.BAD_REQUEST)
      .send({ message: ERROR_MESSAGES.INVALID_EMAIL });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(ERROR_CODES.EMAIL_EXISTS)
        .send({ message: ERROR_MESSAGES.EMAIL_EXISTS });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with hashed password
    const newUser = await User.create({
      name,
      avatar,
      email,
      password: hashedPassword,
    });

    const { password: pwd, ...userWithoutPassword } = newUser.toObject();

    return res.status(201).send({ data: userWithoutPassword });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return res
        .status(ERROR_CODES.BAD_REQUEST)
        .send({ message: ERROR_MESSAGES.BAD_REQUEST });
    }

    // Handle MongoDB duplicate error
    if (err.code === 11000) {
      return res
        .status(ERROR_CODES.BAD_REQUEST)
        .send({ message: ERROR_MESSAGES.EMAIL_EXISTS });
    }

    return res
      .status(ERROR_CODES.SERVER_ERROR)
      .send({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(ERROR_CODES.BAD_REQUEST)
      .send({ message: ERROR_MESSAGES.BAD_REQUEST });
  }

  if (!validator.isEmail(email)) {
    return res
      .status(ERROR_CODES.BAD_REQUEST)
      .send({ message: ERROR_MESSAGES.INVALID_EMAIL });
  }

  try {
    const user = await User.findUserByCredentials(email, password);
    const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.status(200).send({ token });
  } catch (err) {
    console.log(err);

    if (err.code === 401) {
      return res
        .status(ERROR_CODES.AUTHORIZATION_ERROR)
        .send({ message: ERROR_MESSAGES.AUTHORIZATION_ERROR });
    }

    return res
      .status(ERROR_CODES.SERVER_ERROR)
      .send({ message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

const getCurrentUser = (req, res) => {
  const userId = req.user._id;
  console.log(userId);
  User.findById(userId)
    .select("-password")
    .orFail()
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(ERROR_CODES.BAD_REQUEST)
          .send({ message: ERROR_MESSAGES.BAD_REQUEST });
      }
      if (err.name === "DocumentNotFoundError") {
        return res
          .status(ERROR_CODES.NOT_FOUND)
          .send({ message: ERROR_MESSAGES.NOT_FOUND });
      }
      return res
        .status(ERROR_CODES.SERVER_ERROR)
        .send({ message: ERROR_MESSAGES.SERVER_ERROR });
    });
};

const updateUser = (req, res) => {
  const userId = req.user._id;
  const { name, avatar } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (avatar) updates.avatar = avatar;

  User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        return res.status(ERROR_CODES.NOT_FOUND).json({
          status: "error",
          message: ERROR_MESSAGES.NOT_FOUND,
        });
      }
      return res.status(200).json({
        data: user,
      });
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        return res.status(ERROR_CODES.BAD_REQUEST).json({
          status: "error",
          message: "Validation Error",
          errors: err.errors,
        });
      }
      return res.status(ERROR_CODES.SERVER_ERROR).json({
        status: "error",
        message: ERROR_MESSAGES.SERVER_ERROR,
      });
    });
};

module.exports = { createUser, getCurrentUser, login, updateUser };
