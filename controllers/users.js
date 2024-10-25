const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const User = require("../models/user");
const { JWT_SECRET } = require("../utils/config");
const { ERROR_MESSAGES } = require("../utils/errors");
const BadRequestError = require("../errors/bad-request-err");
const ConflictError = require("../errors/conflict-err");
const NotFoundError = require("../errors/not-found-err");
const UnauthorizedError = require("../errors/unauthorized-err");

const createUser = async (req, res, next) => {
  const { name, avatar, email, password } = req.body;

  // Check if email or password is missing
  if (!email || !password) {
    return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    return next(new BadRequestError(ERROR_MESSAGES.INVALID_EMAIL));
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with hashed password
    const newUser = await User.create({
      name,
      avatar,
      email,
      password: hashedPassword,
    });

    // Exclude password from the returned user data
    const userWithoutPassword = newUser.toObject();
    delete userWithoutPassword.password;

    return res.status(201).send({ data: userWithoutPassword });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
    }
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return next(new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS));
    }
    return next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email or password is missing
  if (!email || !password) {
    return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    return next(new BadRequestError(ERROR_MESSAGES.INVALID_EMAIL));
  }

  try {
    // Custom method for checking credentials
    const user = await User.findUserByCredentials(email, password);

    // Generate JWT
    const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.send({ token });
  } catch (err) {
    if (err.statusCode) {
      return next(err);
    }
    return next(new UnauthorizedError(ERROR_MESSAGES.UNAUTHORIZED));
  }
};

const getCurrentUser = (req, res, next) => {
  const { _id } = req.user; // Destructure _id from req.user

  // Find the user by ID and exclude the password field
  User.findById(_id)
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
  const { _id } = req.user; // Destructure _id from req.user
  const { name, avatar } = req.body;

  // Prepare the updates object
  const updates = {};
  if (name) updates.name = name;
  if (avatar) updates.avatar = avatar;

  // Update the user and validate the changes
  User.findByIdAndUpdate(_id, updates, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        return next(new NotFoundError(ERROR_MESSAGES.NOT_FOUND));
      }
      return res.status(200).json({ data: user });
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        return next(new BadRequestError(ERROR_MESSAGES.BAD_REQUEST));
      }
      return next(err);
    });
};

module.exports = { createUser, getCurrentUser, login, updateUser };
