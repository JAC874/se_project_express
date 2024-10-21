const { ERROR_CODES } = require("../utils/errors");

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = ERROR_CODES.BAD_REQUEST;
  }
}

module.exports = BadRequestError;
