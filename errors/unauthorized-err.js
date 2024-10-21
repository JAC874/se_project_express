const { ERROR_CODES } = require("../utils/errors");

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = ERROR_CODES.AUTHORIZATION_ERROR;
  }
}

module.exports = UnauthorizedError;
