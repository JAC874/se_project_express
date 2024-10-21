const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/user");
const { JWT_SECRET } = require("../utils/config");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/errors");
const BadRequestError = require("../errors/bad-request-err");
const ConflictError = require("../errors/conflict-err");
const NotFoundError = require("../errors/not-found-err");
const UnauthorizedError = require("../errors/unauthorized-err");

const createUser = async (req, res, next) => {
  const { name, avatar, email, password } = req.body;

  if (!email || !password) {
    next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
  }

  if (!validator.isEmail(email)) {
    next(new BadRequestError(ERROR_MESSAGES.INVALID_EMAIL));
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS));
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
      return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
    }
    // Handle MongoDB duplicate error
    if (err.code === 11000) {
      return next(new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS));
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
  }

  if (!validator.isEmail(email)) {
    return next(new BadRequestError(ERROR_MESSAGES.INVALID_EMAIL));
  }

  try {
    const user = await User.findUserByCredentials(email, password);

    const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.send({ token });
  } catch (err) {
    if (err.statusCode) {
      return next(err);
    }
    if (err.name === "ValidationError") {
      return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
    }
    return next(err);
  }
};

const getCurrentUser = (req, res, next) => {
  const userId = req.user._id;

  User.findById(userId)
    .select("-password")
    .orFail(() => new NotFoundError(ERROR_MESSAGES.NOT_FOUND))
    .then((user) => res.send(user))
    .catch((err) => {
      if (err.name === "CastError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

const updateUser = (req, res, next) => {
  const userId = req.user._id;
  const { name, avatar } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (avatar) updates.avatar = avatar;

  User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        return next(new NotFoundError(ERROR_MESSAGES.NOT_FOUND));
      }
      return res.status(200).json({ data: user });
    })
    .catch((err) => {
      if (err.message === "Incorrect email or password") {
        return next(new UnauthorizedError("Incorrect email or password!"));
      }
      return next(err);
    });
};

module.exports = { createUser, getCurrentUser, login, updateUser };
