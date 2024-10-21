const { ERROR_CODES } = require("../utils/errors");

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = ERROR_CODES.EMAIL_EXISTS;
  }
}

module.exports = ConflictError;
