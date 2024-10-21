const { ERROR_CODES } = require("../utils/errors");

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = ERROR_CODES.NOT_FOUND;
  }
}

module.exports = NotFoundError;
