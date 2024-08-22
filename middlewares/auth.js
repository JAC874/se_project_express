const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../utils/config");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/errors");

const auth = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res
      .status(ERROR_CODES.AUTHORIZATION_ERROR)
      .send({ message: ERROR_MESSAGES.AUTHORIZATION_ERROR });
  }

  const token = authorization.replace("Bearer ", "");
  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res
      .status(ERROR_CODES.AUTHORIZATION_ERROR)
      .send({ message: ERROR_MESSAGES.AUTHORIZATION_ERROR });
  }

  req.user = payload;

  return next();
};

module.exports = auth;
