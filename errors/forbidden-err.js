const { ERROR_CODES } = require("../utils/errors");

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = ERROR_CODES.FORBIDDEN;
  }
}

module.exports = ForbiddenError;
